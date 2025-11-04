/**
 * 📅 RUTAS DE CITAS MEJORADAS - POSTGRESQL
 * Sistema de gestión de citas con validaciones avanzadas
 *
 * MEJORAS IMPLEMENTADAS:
 * ✅ Validación de disponibilidad de horarios
 * ✅ Prevención de citas en horarios pasados
 * ✅ Prevención de citas duplicadas
 * ✅ Rate limiting / Anti-spam
 * ✅ Email verification
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/database');
const verificationService = require('../services/verificationService');

// =====================================================
// RATE LIMITING - Prevenir spam
// =====================================================
const citaAttempts = new Map();

function checkRateLimit(ip, email) {
    const key = `${ip}-${email}`;
    const now = Date.now();

    if (!citaAttempts.has(key)) {
        citaAttempts.set(key, []);
    }

    const attempts = citaAttempts.get(key);

    // Limpiar intentos antiguos (mayor a 1 hora)
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentAttempts = attempts.filter(t => t > oneHourAgo);
    citaAttempts.set(key, recentAttempts);

    // Max 5 citas por hora por email
    if (recentAttempts.length >= 5) {
        return {
            allowed: false,
            message: 'Demasiados intentos. Por favor intenta más tarde.'
        };
    }

    recentAttempts.push(now);
    return { allowed: true };
}

// =====================================================
// VALIDACIONES PERSONALIZADAS
// =====================================================

/**
 * Validar que la fecha/hora no esté en el pasado
 */
function validateFutureDateTime(dateString, timeString) {
    const now = new Date();
    const appointmentDate = new Date(`${dateString}T${timeString}:00`);

    if (appointmentDate <= now) {
        return {
            valid: false,
            message: 'No puedes agendar citas en el pasado'
        };
    }

    // También validar que no sea más de 6 meses en el futuro
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    if (appointmentDate > sixMonthsFromNow) {
        return {
            valid: false,
            message: 'No puedes agendar citas con más de 6 meses de anticipación'
        };
    }

    return { valid: true };
}

/**
 * Validar disponibilidad de horario
 */
async function checkTimeSlotAvailability(fecha_solicitada, hora_solicitada, department) {
    const query = `
        SELECT COUNT(*) as count
        FROM citas
        WHERE
            fecha_solicitada = $1
            AND hora_solicitada = $2
            AND estado NOT IN ('rechazada', 'cancelada')
            AND confirmada = true
    `;

    const result = await db.executeQuery(query, [fecha_solicitada, hora_solicitada]);
    const occupiedSlots = parseInt(result[0].count);

    // Máximo 3 citas por horario
    if (occupiedSlots >= 3) {
        return {
            available: false,
            message: 'Este horario no está disponible. Por favor selecciona otro.',
            occupiedSlots
        };
    }

    return {
        available: true,
        availableSlots: 3 - occupiedSlots
    };
}

/**
 * Validar que no haya cita duplicada del mismo usuario
 */
async function checkDuplicateCita(email, fecha_solicitada, hora_solicitada) {
    const query = `
        SELECT id FROM citas
        WHERE
            email = $1
            AND fecha_solicitada = $2
            AND hora_solicitada = $3
            AND estado NOT IN ('rechazada', 'cancelada')
    `;

    const result = await db.executeQuery(query, [email, fecha_solicitada, hora_solicitada]);

    if (result.length > 0) {
        return {
            exists: true,
            message: 'Ya tienes una cita programada para este día y hora'
        };
    }

    return { exists: false };
}

/**
 * Validar límite máximo de citas por usuario en 24h
 */
async function checkCitasLimitPerDay(email) {
    const query = `
        SELECT COUNT(*) as count
        FROM citas
        WHERE
            email = $1
            AND fecha_solicitada = CURRENT_DATE
            AND estado NOT IN ('rechazada', 'cancelada')
    `;

    const result = await db.executeQuery(query, [email]);
    const citasHoy = parseInt(result[0].count);

    // Máximo 3 citas por día
    if (citasHoy >= 3) {
        return {
            limited: true,
            message: 'Ya tienes el máximo de citas para hoy (3). Intenta otro día.',
            citasHoy
        };
    }

    return { limited: false, citasHoy };
}

// =====================================================
// 🆔 Generar ID único para cita
// =====================================================
function generateCitaId(lastId) {
    const newId = lastId + 1;
    return `CITA-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

// =====================================================
// 🔑 Generar token de confirmación
// =====================================================
function generateConfirmationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// =====================================================
// 📋 GET /api/citas - Root endpoint (redirect to list)
// =====================================================
router.get('/', async (req, res) => {
    try {
        // Simplemente redireccionar a /list cuando se accede a la raíz
        // O retornar un estado general del sistema de citas
        const query = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'aprobada' THEN 1 ELSE 0 END) as aprobadas,
                SUM(CASE WHEN estado = 'rechazada' THEN 1 ELSE 0 END) as rechazadas
            FROM citas
        `;

        const result = await db.executeQuery(query);

        res.json({
            success: true,
            status: 'Sistema de Citas Operacional',
            stats: {
                total: parseInt(result[0].total || 0),
                pendientes: parseInt(result[0].pendientes || 0),
                aprobadas: parseInt(result[0].aprobadas || 0),
                rechazadas: parseInt(result[0].rechazadas || 0)
            },
            message: 'Use /list para obtener listado completo de citas'
        });
    } catch (error) {
        console.error('Error fetching citas stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de citas',
            error: error.message
        });
    }
});

// =====================================================
// ➕ POST /api/citas/create - CON VALIDACIONES MEJORADAS
// =====================================================
router.post('/create', [
    body('nombre_completo').trim().notEmpty().withMessage('Nombre completo requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').optional().trim(),
    body('tipo_persona').isIn(['estudiante', 'padre', 'madre', 'tutor', 'docente', 'administrativo', 'externo']),
    body('motivo').trim().notEmpty().withMessage('Motivo requerido'),
    body('descripcion').optional().trim(),
    body('fecha_solicitada').isDate().withMessage('Fecha inválida'),
    body('hora_solicitada').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora inválida'),
    body('departamento').trim().notEmpty().withMessage('Departamento requerido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const {
            nombre_completo,
            email,
            telefono,
            tipo_persona,
            motivo,
            descripcion,
            fecha_solicitada,
            hora_solicitada,
            departamento
        } = req.body;

        const ip_address = req.ip || req.connection.remoteAddress;

        // =====================================================
        // VALIDACIÓN 1: Rate Limiting / Anti-Spam
        // =====================================================
        const rateLimitCheck = checkRateLimit(ip_address, email);
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: rateLimitCheck.message,
                retryAfter: 3600
            });
        }

        // =====================================================
        // VALIDACIÓN 2: Fecha/Hora en el futuro
        // =====================================================
        const dateValidation = validateFutureDateTime(fecha_solicitada, hora_solicitada);
        if (!dateValidation.valid) {
            return res.status(400).json({
                success: false,
                message: dateValidation.message
            });
        }

        // =====================================================
        // VALIDACIÓN 3: Disponibilidad de horario
        // =====================================================
        const availabilityCheck = await checkTimeSlotAvailability(
            fecha_solicitada,
            hora_solicitada,
            departamento
        );
        if (!availabilityCheck.available) {
            return res.status(409).json({
                success: false,
                message: availabilityCheck.message,
                occupiedSlots: availabilityCheck.occupiedSlots
            });
        }

        // =====================================================
        // VALIDACIÓN 4: No hay cita duplicada
        // =====================================================
        const duplicateCheck = await checkDuplicateCita(
            email,
            fecha_solicitada,
            hora_solicitada
        );
        if (duplicateCheck.exists) {
            return res.status(409).json({
                success: false,
                message: duplicateCheck.message
            });
        }

        // =====================================================
        // VALIDACIÓN 5: Límite de citas por día
        // =====================================================
        const dayLimitCheck = await checkCitasLimitPerDay(email);
        if (dayLimitCheck.limited) {
            return res.status(429).json({
                success: false,
                message: dayLimitCheck.message,
                citasHoy: dayLimitCheck.citasHoy
            });
        }

        // =====================================================
        // TODAS LAS VALIDACIONES PASADAS - Crear cita
        // =====================================================

        // Obtener último ID
        const lastIdQuery = `SELECT cita_id FROM citas ORDER BY id DESC LIMIT 1`;
        const lastIdResult = await db.executeQuery(lastIdQuery);

        let lastNumber = 0;
        if (lastIdResult.length > 0) {
            const lastId = lastIdResult[0].cita_id;
            const match = lastId.match(/-(\d+)$/);
            if (match) lastNumber = parseInt(match[1]);
        }

        const newCitaId = generateCitaId(lastNumber);
        const confirmationToken = generateConfirmationToken();

        // Insertar nueva cita
        const insertQuery = `
            INSERT INTO citas (
                cita_id, nombre_completo, email, telefono, tipo_persona,
                motivo, descripcion, fecha_solicitada, hora_solicitada,
                token_confirmacion, estado, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            RETURNING *
        `;

        const result = await db.executeQuery(insertQuery, [
            newCitaId,
            nombre_completo,
            email,
            telefono || null,
            tipo_persona,
            motivo,
            descripcion || null,
            fecha_solicitada,
            hora_solicitada,
            confirmationToken,
            'pendiente'
        ]);

        console.log(`✅ Nueva cita creada: ${newCitaId} - ${nombre_completo}`);

        // =====================================================
        // Enviar email de confirmación
        // =====================================================
        try {
            const confirmationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/citas/confirm/${confirmationToken}`;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '✅ Solicitud de Cita Recibida',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #667eea;">📅 Solicitud de Cita Recibida</h2>
                    <p>Hola <strong>${nombre_completo}</strong>,</p>
                    <p>Hemos recibido tu solicitud de cita con los siguientes detalles:</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>ID de Cita:</strong> ${newCitaId}</p>
                        <p><strong>Departamento:</strong> ${departamento}</p>
                        <p><strong>Motivo:</strong> ${motivo}</p>
                        <p><strong>Fecha solicitada:</strong> ${new Date(fecha_solicitada).toLocaleDateString('es-MX')}</p>
                        <p><strong>Hora solicitada:</strong> ${hora_solicitada}</p>
                    </div>
                    <p style="color: #666; margin: 15px 0;">Tu solicitud está <strong>pendiente de confirmación por email</strong>. Por favor confirma tu cita haciendo clic en el botón de abajo.</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${confirmationLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            ✅ Confirmar mi Cita
                        </a>
                    </div>
                    <p style="color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">
                        Una vez confirmes tu cita, será revisada por el administrador y recibirás notificación cuando sea aprobada.
                        <br><br>
                        Si no solicitaste esta cita, puedes ignorar este mensaje.
                    </p>
                </div>
                `
            });

            console.log(`📧 Email de confirmación enviado a ${email}`);
        } catch (emailError) {
            console.error('⚠️ Error enviando email:', emailError);
        }

        res.json({
            success: true,
            message: 'Solicitud de cita creada exitosamente. Por favor confirma tu email.',
            cita: {
                id: newCitaId,
                estado: 'pendiente',
                fecha: fecha_solicitada,
                hora: hora_solicitada,
                emailSent: true
            }
        });

    } catch (error) {
        console.error('❌ Error creando cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear solicitud de cita',
            error: error.message
        });
    }
});

// =====================================================
// 📅 GET /api/citas/available-slots
// Obtener horarios disponibles para una fecha
// =====================================================
router.get('/available-slots', async (req, res) => {
    try {
        const { fecha, departamento } = req.query;

        if (!fecha || !departamento) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros requeridos: fecha, departamento'
            });
        }

        // Validar que la fecha sea futura
        const dateValidation = validateFutureDateTime(fecha, '00:00');
        if (!dateValidation.valid) {
            return res.status(400).json({
                success: false,
                message: dateValidation.message
            });
        }

        const query = `
            SELECT
                hora_solicitada,
                COUNT(*) FILTER (WHERE estado NOT IN ('rechazada', 'cancelada') AND confirmada = true) as ocupados,
                3 - COUNT(*) FILTER (WHERE estado NOT IN ('rechazada', 'cancelada') AND confirmada = true) as disponibles
            FROM citas
            WHERE fecha_solicitada = $1
            GROUP BY hora_solicitada
            ORDER BY hora_solicitada
        `;

        const result = await db.executeQuery(query, [fecha]);

        // Generar lista de horarios disponibles (cada hora de 8 AM a 4 PM)
        const horarios = [];
        for (let hour = 8; hour < 17; hour++) {
            const hora = `${String(hour).padStart(2, '0')}:00`;
            const existente = result.find(r => r.hora_solicitada === hora);

            horarios.push({
                hora,
                disponibles: existente ? parseInt(existente.disponibles) : 3,
                ocupados: existente ? parseInt(existente.ocupados) : 0
            });
        }

        res.json({
            success: true,
            fecha,
            departamento,
            horarios: horarios.filter(h => h.disponibles > 0)
        });

    } catch (error) {
        console.error('Error obteniendo horarios disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horarios disponibles'
        });
    }
});

// =====================================================
// ✅ GET /api/citas/confirm/:token
// Confirmar cita por email
// =====================================================
router.get('/confirm/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const updateQuery = `
            UPDATE citas
            SET confirmada = true, updated_at = NOW()
            WHERE token_confirmacion = $1 AND confirmada = false
            RETURNING *
        `;

        const result = await db.executeQuery(updateQuery, [token]);

        if (result.length === 0) {
            return res.send(`
                <html>
                <head>
                    <title>Error en Confirmación</title>
                    <style>
                        body { font-family: Arial; padding: 50px; text-align: center; background: #f5f5f5; }
                        .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
                        h1 { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ Token inválido o ya confirmado</h1>
                        <p>La cita no se encontró o ya fue confirmada anteriormente.</p>
                        <p><a href="/">Volver al inicio</a></p>
                    </div>
                </body>
                </html>
            `);
        }

        const cita = result[0];
        console.log(`✅ Cita confirmada por usuario: ${cita.cita_id}`);

        res.send(`
            <html>
            <head>
                <title>Cita Confirmada</title>
                <style>
                    body { font-family: Arial; padding: 50px; text-align: center; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
                    h1 { color: #28a745; }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">✅</div>
                    <h1>¡Cita Confirmada!</h1>
                    <p>Gracias <strong>${cita.nombre_completo}</strong>,</p>
                    <p>Tu cita ha sido confirmada exitosamente.</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>ID:</strong> ${cita.cita_id}</p>
                        <p><strong>Fecha:</strong> ${new Date(cita.fecha_solicitada).toLocaleDateString('es-MX')}</p>
                        <p><strong>Hora:</strong> ${cita.hora_solicitada}</p>
                    </div>
                    <p style="color: #666;">Pronto recibirás un email cuando tu cita sea aprobada por el administrador.</p>
                    <p style="margin-top: 30px;"><a href="/" style="color: #667eea; text-decoration: none;">← Volver al sitio</a></p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error confirmando cita:', error);
        res.status(500).send('Error al confirmar cita');
    }
});

// =====================================================
// 📋 GET /api/citas/list
// Listar todas las citas (Admin)
// =====================================================
router.get('/list', async (req, res) => {
    try {
        const { estado, tipo_persona, fecha_desde, fecha_hasta } = req.query;

        let query = `
            SELECT
                id, cita_id, nombre_completo, email, telefono,
                tipo_persona, motivo, descripcion,
                fecha_solicitada, hora_solicitada,
                estado, confirmada, notas_admin,
                created_at, updated_at
            FROM citas
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (estado) {
            query += ` AND estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }

        if (tipo_persona) {
            query += ` AND tipo_persona = $${paramIndex}`;
            params.push(tipo_persona);
            paramIndex++;
        }

        if (fecha_desde) {
            query += ` AND fecha_solicitada >= $${paramIndex}`;
            params.push(fecha_desde);
            paramIndex++;
        }

        if (fecha_hasta) {
            query += ` AND fecha_solicitada <= $${paramIndex}`;
            params.push(fecha_hasta);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT 100`;

        const result = await db.executeQuery(query, params);

        res.json({
            success: true,
            data: result,
            total: result.length
        });

    } catch (error) {
        console.error('Error listando citas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener citas'
        });
    }
});

// =====================================================
// 📊 GET /api/citas/stats
// Obtener estadísticas de citas
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes,
                COUNT(*) FILTER (WHERE estado = 'aprobada') AS aprobadas,
                COUNT(*) FILTER (WHERE estado = 'rechazada') AS rechazadas,
                COUNT(*) FILTER (WHERE estado = 'completada') AS completadas,
                COUNT(*) FILTER (WHERE confirmada = false) AS no_confirmadas,
                COUNT(*) AS total
            FROM citas
        `;

        const result = await db.executeQuery(query);
        const stats = result[0];

        res.json({
            success: true,
            statistics: {
                pendientes: parseInt(stats.pendientes),
                aprobadas: parseInt(stats.aprobadas),
                rechazadas: parseInt(stats.rechazadas),
                completadas: parseInt(stats.completadas),
                noConfirmadas: parseInt(stats.no_confirmadas),
                total: parseInt(stats.total)
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

module.exports = router;

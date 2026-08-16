"use strict";
/**
 * 📅 RUTAS DE CITAS MEJORADAS - TypeScript
 * Sistema de gestión de citas con validaciones avanzadas
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const crypto_1 = __importDefault(require("crypto"));
// @ts-ignore
const debug_logger_1 = require('../utils/debug-logger.js');
// @ts-ignore
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
// @ts-ignore
const database_1 = __importDefault(require('../config/database.js'));
// @ts-ignore
const verificationService_1 = __importDefault(require('../services/verificationService.js'));
const router = express_1.default.Router();
// ============================================
// RATE LIMITING
// ============================================
const citaAttempts = new Map();
function checkRateLimit(ip, email) {
    const key = `${ip}-${email}`;
    const now = Date.now();
    if (!citaAttempts.has(key))
        citaAttempts.set(key, []);
    const attempts = citaAttempts.get(key);
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentAttempts = attempts.filter(t => t > oneHourAgo);
    citaAttempts.set(key, recentAttempts);
    if (recentAttempts.length >= 5) {
        return { allowed: false, message: 'Demasiados intentos. Por favor intenta más tarde.' };
    }
    recentAttempts.push(now);
    return { allowed: true };
}
// ============================================
// VALIDATION FUNCTIONS
// ============================================
function validateFutureDateTime(dateString, timeString) {
    const now = new Date();
    const appointmentDate = new Date(`${dateString}T${timeString}:00`);
    if (appointmentDate <= now)
        return { valid: false, message: 'No puedes agendar citas en el pasado' };
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (appointmentDate > sixMonthsFromNow)
        return { valid: false, message: 'No puedes agendar citas con más de 6 meses de anticipación' };
    return { valid: true };
}
async function checkTimeSlotAvailability(fecha, hora, department) {
    const result = await database_1.default.executeQuery(`SELECT COUNT(*) as count FROM citas WHERE fecha_solicitada = $1 AND hora_solicitada = $2 AND estado NOT IN ('rechazada', 'cancelada') AND confirmada = true`, [fecha, hora]);
    const occupied = parseInt(result[0].count);
    if (occupied >= 3)
        return { available: false, message: 'Este horario no está disponible. Por favor selecciona otro.', occupiedSlots: occupied };
    return { available: true, availableSlots: 3 - occupied };
}
async function checkDuplicateCita(email, fecha, hora) {
    const result = await database_1.default.executeQuery(`SELECT id FROM citas WHERE email = $1 AND fecha_solicitada = $2 AND hora_solicitada = $3 AND estado NOT IN ('rechazada', 'cancelada')`, [email, fecha, hora]);
    if (result.length > 0)
        return { exists: true, message: 'Ya tienes una cita programada para este día y hora' };
    return { exists: false };
}
async function checkCitasLimitPerDay(email) {
    const result = await database_1.default.executeQuery(`SELECT COUNT(*) as count FROM citas WHERE email = $1 AND fecha_solicitada = CURRENT_DATE AND estado NOT IN ('rechazada', 'cancelada')`, [email]);
    const citasHoy = parseInt(result[0].count);
    if (citasHoy >= 3)
        return { limited: true, message: 'Ya tienes el máximo de citas para hoy (3). Intenta otro día.', citasHoy };
    return { limited: false, citasHoy };
}
function generateCitaId(lastId) {
    return `CITA-${new Date().getFullYear()}-${String(lastId + 1).padStart(4, '0')}`;
}
function generateConfirmationToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
// ============================================
// ROUTES
// ============================================
/**
 * POST /api/citas-improved/create
 */
router.post('/create', [
    (0, express_validator_1.body)('nombre_completo').trim().notEmpty().withMessage('Nombre completo requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('telefono').optional().trim(),
    (0, express_validator_1.body)('tipo_persona').isIn(['estudiante', 'padre', 'madre', 'tutor', 'docente', 'administrativo', 'externo']),
    (0, express_validator_1.body)('motivo').trim().notEmpty().withMessage('Motivo requerido'),
    (0, express_validator_1.body)('descripcion').optional().trim(),
    (0, express_validator_1.body)('fecha_solicitada').isDate().withMessage('Fecha inválida'),
    (0, express_validator_1.body)('hora_solicitada').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora inválida'),
    (0, express_validator_1.body)('departamento').trim().notEmpty().withMessage('Departamento requerido')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    try {
        const { nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, departamento } = req.body;
        const ip_address = req.ip || req.connection.remoteAddress;
        // Validations
        const rateLimitCheck = checkRateLimit(ip_address, email);
        if (!rateLimitCheck.allowed) {
            res.status(429).json({ success: false, message: rateLimitCheck.message, retryAfter: 3600 });
            return;
        }
        const dateValidation = validateFutureDateTime(fecha_solicitada, hora_solicitada);
        if (!dateValidation.valid) {
            res.status(400).json({ success: false, message: dateValidation.message });
            return;
        }
        const availabilityCheck = await checkTimeSlotAvailability(fecha_solicitada, hora_solicitada, departamento);
        if (!availabilityCheck.available) {
            res.status(409).json({ success: false, message: availabilityCheck.message, occupiedSlots: availabilityCheck.occupiedSlots });
            return;
        }
        const duplicateCheck = await checkDuplicateCita(email, fecha_solicitada, hora_solicitada);
        if (duplicateCheck.exists) {
            res.status(409).json({ success: false, message: duplicateCheck.message });
            return;
        }
        const dayLimitCheck = await checkCitasLimitPerDay(email);
        if (dayLimitCheck.limited) {
            res.status(429).json({ success: false, message: dayLimitCheck.message, citasHoy: dayLimitCheck.citasHoy });
            return;
        }
        // Create appointment
        const lastIdResult = await database_1.default.executeQuery(`SELECT cita_id FROM citas ORDER BY id DESC LIMIT 1`);
        let lastNumber = 0;
        if (lastIdResult.length > 0) {
            const match = lastIdResult[0].cita_id.match(/-(\d+)$/);
            if (match)
                lastNumber = parseInt(match[1]);
        }
        const newCitaId = generateCitaId(lastNumber);
        const confirmationToken = generateConfirmationToken();
        const result = await database_1.default.executeQuery(`INSERT INTO citas (cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, token_confirmacion, estado, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`, [newCitaId, nombre_completo, email, telefono || null, tipo_persona, motivo, descripcion || null, fecha_solicitada, hora_solicitada, confirmationToken, 'pendiente']);
        debug_logger_1.debugLog.log('CITAS_IMPROVED', `✅ Nueva cita creada: ${newCitaId} - ${nombre_completo}`);
        // Send confirmation email
        try {
            const confirmationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/citas/confirm/${confirmationToken}`;
            await verificationService_1.default.transporter.sendMail({
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
            debug_logger_1.debugLog.log('CITAS_IMPROVED', `📧 Email de confirmación enviado a ${email}`);
        }
        catch (emailError) {
            debug_logger_1.debugLog.error('CITAS_IMPROVED', '⚠️ Error enviando email:', emailError);
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS_IMPROVED', '❌ Error creando cita:', (0, sanitized_errors_1.sanitizeError)(error, 'citas-improved'));
        res.status(500).json({
            success: false,
            message: 'Error al crear solicitud de cita',
            error: error.message
        });
    }
});
router.get('/available-slots', async (req, res) => {
    try {
        const fecha = req.query.fecha || req.query.date;
        const departamento = req.query.departamento || req.query.motivo || 'direccion';
        if (!fecha) {
            res.status(400).json({ success: false, message: 'Parámetros requeridos: fecha, departamento' });
            return;
        }

        let result = [];
        try {
            result = await database_1.default.executeQuery(`
                SELECT hora_solicitada, COUNT(*) as ocupados
                FROM citas 
                WHERE fecha_solicitada = $1 
                AND estado NOT IN ('rechazada', 'cancelada')
                AND confirmada = true
                GROUP BY hora_solicitada
            `, [fecha]);
        } catch (e) {
            result = [];
        }

        const horarios = [];
        for (let hour = 8; hour <= 13; hour++) {
            const minutes = (hour === 13) ? [0] : [0, 30];
            for (const min of minutes) {
                const hora = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                const existente = result && Array.isArray(result) ? result.find(r => r.hora_solicitada && r.hora_solicitada.startsWith(hora)) : null;
                const ocupados = existente ? parseInt(existente.ocupados) : 0;
                const capacidad = 3;

                horarios.push({
                    hora,
                    disponibles: Math.max(0, capacidad - ocupados),
                    ocupados
                });
            }
        }

        res.json({
            success: true,
            fecha,
            departamento,
            slots: horarios
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al consultar horarios disponibles' });
    }
});

/**
 * GET /api/citas-improved/month-availability
 * Retorna booking counts por día para un mes dado
 */
router.get('/month-availability', async (req, res) => {
    try {
        const { year, month, departamento } = req.query;

        if (!year || !month) {
            res.status(400).json({ success: false, message: 'Año y mes requeridos' });
            return;
        }

        // Construir rango de fechas
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        // Obtener último día del mes
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        const result = await database_1.default.executeQuery(`
            SELECT fecha_solicitada, COUNT(*) as total_citas
            FROM citas 
            WHERE fecha_solicitada >= $1 AND fecha_solicitada <= $2
            AND estado NOT IN ('rechazada', 'cancelada')
            AND confirmada = true
            GROUP BY fecha_solicitada
        `, [startDate, endDate]);

        // Mapear a objeto simple { "2024-10-15": 5, ... }
        const availability = {};
        result.forEach(row => {
            const dateKey = new Date(row.fecha_solicitada).toISOString().split('T')[0];
            availability[dateKey] = parseInt(row.total_citas);
        });

        res.json({ success: true, availability });

    } catch (error) {
        debug_logger_1.debugLog.error('CITAS_IMPROVED', 'Error comprobando disponibilidad mensual:', (0, sanitized_errors_1.sanitizeError)(error, 'citas-improved'));
        res.status(500).json({ success: false, message: 'Error al obtener disponibilidad' });
    }
});
/**
 * GET /api/citas-improved/confirm/:token
 */
router.get('/confirm/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const result = await database_1.default.executeQuery(`UPDATE citas SET confirmada = true, updated_at = NOW() WHERE token_confirmacion = $1 AND confirmada = false RETURNING *`, [token]);
        if (result.length === 0) {
            res.send(`
                <html>
                <head><title>Error en Confirmación</title></head>
                <body><h1>❌ Token inválido o ya confirmado</h1></body>
                </html>
            `);
            return;
        }
        const cita = result[0];
        debug_logger_1.debugLog.log('CITAS_IMPROVED', `✅ Cita confirmada por usuario: ${cita.cita_id}`);
        res.send(`
            <html>
            <head><title>Cita Confirmada</title></head>
            <body><h1>¡Cita Confirmada! ID: ${cita.cita_id}</h1></body>
            </html>
        `);
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS_IMPROVED', 'Error confirmando cita:', (0, sanitized_errors_1.sanitizeError)(error, 'citas-improved'));
        res.status(500).send('Error al confirmar cita');
    }
});
/**
 * GET /api/citas-improved/list
 */
router.get('/list', async (req, res) => {
    try {
        const { estado, tipo_persona, fecha_desde, fecha_hasta } = req.query;
        let query = `SELECT id, cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, estado, confirmada, notas_admin, created_at, updated_at FROM citas WHERE 1=1`;
        const params = [];
        let paramIndex = 1;
        if (estado) {
            query += ` AND estado = $${paramIndex++}`;
            params.push(estado);
        }
        if (tipo_persona) {
            query += ` AND tipo_persona = $${paramIndex++}`;
            params.push(tipo_persona);
        }
        if (fecha_desde) {
            query += ` AND fecha_solicitada >= $${paramIndex++}`;
            params.push(fecha_desde);
        }
        if (fecha_hasta) {
            query += ` AND fecha_solicitada <= $${paramIndex++}`;
            params.push(fecha_hasta);
        }
        query += ` ORDER BY created_at DESC LIMIT 100`;
        const result = await database_1.default.executeQuery(query, params);
        res.json({ success: true, citas: result, total: result.length });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS_IMPROVED', 'Error listando citas:', (0, sanitized_errors_1.sanitizeError)(error, 'citas-improved'));
        res.status(500).json({ success: false, message: 'Error al obtener citas' });
    }
});
/**
 * GET /api/citas-improved/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const result = await database_1.default.executeQuery(`
            SELECT
                COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes,
                COUNT(*) FILTER (WHERE estado = 'aprobada') AS aprobadas,
                COUNT(*) FILTER (WHERE estado = 'rechazada') AS rechazadas,
                COUNT(*) FILTER (WHERE estado = 'completada') AS completadas,
                COUNT(*) FILTER (WHERE confirmada = false) AS no_confirmadas,
                COUNT(*) AS total
            FROM citas
        `);
        res.json({
            success: true,
            statistics: {
                pendientes: parseInt(String(result[0].pendientes)),
                aprobadas: parseInt(String(result[0].aprobadas)),
                rechazadas: parseInt(String(result[0].rechazadas)),
                completadas: parseInt(String(result[0].completadas)),
                noConfirmadas: parseInt(String(result[0].no_confirmadas)),
                total: parseInt(String(result[0].total))
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS_IMPROVED', 'Error obteniendo estadísticas:', (0, sanitized_errors_1.sanitizeError)(error, 'citas-improved'));
        res.json({
            success: true,
            statistics: {
                pendientes: 0,
                aprobadas: 0,
                rechazadas: 0,
                completadas: 0,
                noConfirmadas: 0,
                total: 0
            }
        });
    }
});
module.exports = router;
//# sourceMappingURL=citas-improved.js.map
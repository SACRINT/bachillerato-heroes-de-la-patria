/**
 * 📅 RUTAS DE CITAS - POSTGRESQL
 * Sistema de gestión de citas usando PostgreSQL
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/database');
const verificationService = require('../services/verificationService');

/**
 * 🆔 Generar ID único para cita
 */
function generateCitaId(lastId) {
    const newId = lastId + 1;
    return `CITA-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

/**
 * 🔑 Generar token de confirmación
 */
function generateConfirmationToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * ➕ POST /api/citas/create
 * Crear nueva solicitud de cita
 */
router.post('/create', [
    body('nombre_completo').trim().notEmpty().withMessage('Nombre completo requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').optional().trim(),
    body('tipo_persona').isIn(['estudiante', 'padre', 'madre', 'tutor', 'docente', 'administrativo', 'externo']),
    body('motivo').trim().notEmpty().withMessage('Motivo requerido'),
    body('descripcion').optional().trim(),
    body('fecha_solicitada').isDate().withMessage('Fecha inválida'),
    body('hora_solicitada').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora inválida')
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
            hora_solicitada
        } = req.body;

        // Obtener último ID
        const lastIdQuery = `
            SELECT cita_id FROM citas ORDER BY id DESC LIMIT 1
        `;
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
                token_confirmacion, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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

        // Enviar email de confirmación
        try {
            const confirmationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/citas/confirm/${confirmationToken}`;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Confirmación de Solicitud de Cita',
                html: `
                <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #667eea;">📅 Solicitud de Cita Recibida</h2>
                    <p>Hola <strong>${nombre_completo}</strong>,</p>
                    <p>Hemos recibido tu solicitud de cita con los siguientes detalles:</p>
                    <ul>
                        <li><strong>ID:</strong> ${newCitaId}</li>
                        <li><strong>Motivo:</strong> ${motivo}</li>
                        <li><strong>Fecha solicitada:</strong> ${fecha_solicitada}</li>
                        <li><strong>Hora solicitada:</strong> ${hora_solicitada}</li>
                    </ul>
                    <p>Tu solicitud está <strong>pendiente de aprobación</strong>. Te notificaremos por email cuando sea aprobada.</p>
                    <p><a href="${confirmationLink}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Confirmar Cita</a></p>
                    <p style="color: #666; font-size: 12px;">Si no solicitaste esta cita, puedes ignorar este mensaje.</p>
                </div>
                `
            });
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
            // No fallar la solicitud si el email falla
        }

        res.json({
            success: true,
            message: 'Solicitud de cita creada exitosamente',
            cita: {
                id: newCitaId,
                estado: 'pendiente',
                fecha: fecha_solicitada,
                hora: hora_solicitada
            }
        });

    } catch (error) {
        console.error('Error creando cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear solicitud de cita',
            error: error.message
        });
    }
});

/**
 * 📋 GET /api/citas/list
 * Listar todas las citas (Admin)
 */
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

        query += ` ORDER BY created_at DESC`;

        const result = await db.executeQuery(query, params);

        res.json({
            success: true,
            citas: result,
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

/**
 * 📊 GET /api/citas/stats
 * Obtener estadísticas de citas
 */
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes,
                COUNT(*) FILTER (WHERE estado = 'aprobada') AS aprobadas,
                COUNT(*) FILTER (WHERE estado = 'rechazada') AS rechazadas,
                COUNT(*) FILTER (WHERE estado = 'completada') AS completadas,
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

/**
 * ✅ PUT /api/citas/:id/approve
 * Aprobar cita (Admin)
 */
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        const updateQuery = `
            UPDATE citas
            SET estado = 'aprobada', fecha_aprobada = CURRENT_TIMESTAMP
            WHERE cita_id = $1
            RETURNING *
        `;

        const result = await db.executeQuery(updateQuery, [id]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        const cita = result[0];

        // Enviar email de aprobación
        try {
            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: cita.email,
                subject: '✅ Cita Aprobada',
                html: `
                <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #28a745;">✅ Tu Cita ha sido Aprobada</h2>
                    <p>Hola <strong>${cita.nombre_completo}</strong>,</p>
                    <p>Tu solicitud de cita ha sido <strong>aprobada</strong>.</p>
                    <ul>
                        <li><strong>ID:</strong> ${cita.cita_id}</li>
                        <li><strong>Motivo:</strong> ${cita.motivo}</li>
                        <li><strong>Fecha:</strong> ${cita.fecha_solicitada}</li>
                        <li><strong>Hora:</strong> ${cita.hora_solicitada}</li>
                    </ul>
                    <p>Por favor, llega 10 minutos antes de tu cita.</p>
                    <p>¡Te esperamos!</p>
                </div>
                `
            });
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
        }

        console.log(`✅ Cita aprobada: ${id}`);

        res.json({
            success: true,
            message: 'Cita aprobada exitosamente',
            cita: result[0]
        });

    } catch (error) {
        console.error('Error aprobando cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aprobar cita',
            error: error.message
        });
    }
});

/**
 * ❌ PUT /api/citas/:id/reject
 * Rechazar cita (Admin)
 */
router.put('/:id/reject', [
    body('motivo_rechazo').trim().notEmpty().withMessage('Motivo de rechazo requerido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { id } = req.params;
        const { motivo_rechazo } = req.body;

        const updateQuery = `
            UPDATE citas
            SET estado = 'rechazada',
                fecha_rechazada = CURRENT_TIMESTAMP,
                motivo_rechazo = $2
            WHERE cita_id = $1
            RETURNING *
        `;

        const result = await db.executeQuery(updateQuery, [id, motivo_rechazo]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        const cita = result[0];

        // Enviar email de rechazo
        try {
            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: cita.email,
                subject: '❌ Cita No Aprobada',
                html: `
                <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc3545;">❌ Solicitud de Cita No Aprobada</h2>
                    <p>Hola <strong>${cita.nombre_completo}</strong>,</p>
                    <p>Lamentamos informarte que tu solicitud de cita no pudo ser aprobada.</p>
                    <p><strong>Motivo:</strong> ${motivo_rechazo}</p>
                    <p>Puedes solicitar una nueva cita en otro horario.</p>
                    <p>Disculpa las molestias.</p>
                </div>
                `
            });
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
        }

        console.log(`❌ Cita rechazada: ${id}`);

        res.json({
            success: true,
            message: 'Cita rechazada',
            cita: result[0]
        });

    } catch (error) {
        console.error('Error rechazando cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar cita',
            error: error.message
        });
    }
});

/**
 * 🗑️ DELETE /api/citas/:id
 * Eliminar cita (Admin)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deleteQuery = `
            DELETE FROM citas WHERE cita_id = $1 RETURNING *
        `;

        const result = await db.executeQuery(deleteQuery, [id]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        console.log(`🗑️ Cita eliminada: ${id}`);

        res.json({
            success: true,
            message: 'Cita eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cita',
            error: error.message
        });
    }
});

/**
 * ✅ GET /api/citas/confirm/:token
 * Confirmar cita por token
 */
router.get('/confirm/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const updateQuery = `
            UPDATE citas
            SET confirmada = true
            WHERE token_confirmacion = $1 AND confirmada = false
            RETURNING *
        `;

        const result = await db.executeQuery(updateQuery, [token]);

        if (result.length === 0) {
            return res.send(`
                <html>
                <head><title>Confirmación de Cita</title></head>
                <body style="font-family: Arial; padding: 50px; text-align: center;">
                    <h1>❌ Token inválido o ya confirmado</h1>
                    <p>La cita no se encontró o ya fue confirmada anteriormente.</p>
                </body>
                </html>
            `);
        }

        const cita = result[0];

        res.send(`
            <html>
            <head><title>Cita Confirmada</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1>✅ Cita Confirmada</h1>
                <p>Tu cita para <strong>${cita.fecha_solicitada}</strong> a las <strong>${cita.hora_solicitada}</strong> ha sido confirmada.</p>
                <p><strong>Motivo:</strong> ${cita.motivo}</p>
                <p>Recibirás un email cuando tu cita sea aprobada por el administrador.</p>
                <p style="margin-top: 30px;"><a href="/">Volver al inicio</a></p>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error confirmando cita:', error);
        res.status(500).send('Error al confirmar cita');
    }
});

module.exports = router;

/**
 * 🎓 RUTAS DE EGRESADOS CON POSTGRESQL (v2 - ROBUSTO CON BD)
 * Sistema completo de gestión de perfiles profesionales con confirmación por email.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const devLog = require('../utils/devLogger'); // 🔐 Logging seguro (GDPR compliant)

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * POST /api/egresados/create
 * Crea una solicitud, la guarda en `egresados_pending_confirmation` y envía email.
 */
router.post('/create', async (req, res) => {
    const client = await pool.connect();
    try {
        devLog.log('[EGRESADOS CREATE v2] Recibido formulario de egresado');
        const { nombre_completo, email, ...otherData } = req.body;

        if (!nombre_completo || !email) {
            return res.status(400).json({ success: false, message: '⚠️ Nombre y Email son obligatorios.' });
        }

        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const datosJSON = { nombre_completo, email, ...otherData };

        const insertQuery = `
            INSERT INTO egresados_pending_confirmation (email_usuario, datos_json, confirmation_token)
            VALUES ($1, $2, $3)
            ON CONFLICT (email_usuario) DO UPDATE SET
                datos_json = EXCLUDED.datos_json,
                confirmation_token = EXCLUDED.confirmation_token,
                token_expires_at = (now() + '24 hours'::interval),
                fecha_actualizacion = now()
            RETURNING confirmation_token;
        `;
        const result = await client.query(insertQuery, [email, JSON.stringify(datosJSON), confirmationToken]);
        const finalToken = result.rows[0].confirmation_token;

        devLog.log('[EGRESADOS CREATE v2] Solicitud guardada en tabla temporal');

        const confirmLink = `${process.env.BASE_URL || 'http://localhost:3000'}/egresados.html?token=${finalToken}#confirm-email`;
        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '📧 Confirma tu dirección de email - BGE Héroes de la Patria',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #27ae60; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                        .button:hover { background: #229954; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📧 Confirmación de Email Requerida</h1>
                        </div>
                        <div class="content">
                            <p>Hola <strong>${nombre_completo}</strong>,</p>
                            <p>Hemos recibido tu solicitud. Para continuar, por favor confirma tu email haciendo clic en el botón de abajo.</p>
                            <div style="text-align: center;">
                                <a href="${confirmLink}" class="button">✅ Confirmar mi Email</a>
                            </div>
                            <p style="font-size: 12px; color: #666;">Este enlace expira en 24 horas.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        devLog.log('[EGRESADOS CREATE v2] Email de confirmación enviado exitosamente');

        res.status(201).json({ success: true, message: `✅ REGISTRO EXITOSO: Se ha enviado un email de confirmación a ${email}.` });

    } catch (error) {
        devLog.error('[EGRESADOS CREATE v2] Error al procesar solicitud', error);
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud.', error: error.message });
    } finally {
        client.release();
    }
});

/**
 * POST /api/egresados/confirm/:token
 * Confirma el email, mueve los datos a `pendientes_aprobacion`.
 */
router.post('/confirm/:token', async (req, res) => {
    const { token } = req.params;
    const client = await pool.connect();

    try {
        const selectQuery = `SELECT * FROM egresados_pending_confirmation WHERE confirmation_token = $1;`;
        const pendingResult = await client.query(selectQuery, [token]);

        if (pendingResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Token inválido o expirado.' });
        }

        const pendingData = pendingResult.rows[0];
        if (new Date() > new Date(pendingData.token_expires_at)) {
            await client.query('DELETE FROM egresados_pending_confirmation WHERE id = $1', [pendingData.id]);
            return res.status(404).json({ success: false, error: 'Token expirado.' });
        }

        const datosJSON = pendingData.datos_json;
        const email = pendingData.email_usuario;

        await client.query('BEGIN');
        try {
            const existingApproval = await client.query('SELECT id FROM pendientes_aprobacion WHERE email_usuario = $1 AND tipo_solicitud = $2', [email, 'egresados']);

            if (existingApproval.rows.length > 0) {
                const existingId = existingApproval.rows[0].id;
                const updateQuery = `UPDATE pendientes_aprobacion SET datos_json = $1, fecha_solicitud = NOW(), email_confirmado = $2, estado = $3 WHERE id = $4;`;
                await client.query(updateQuery, [JSON.stringify(datosJSON), true, 'pendiente', existingId]);
            } else {
                const insertFinalQuery = `INSERT INTO pendientes_aprobacion (tipo_solicitud, email_usuario, datos_json, estado, email_confirmado, fecha_solicitud) VALUES ($1, $2, $3, $4, $5, NOW());`;
                await client.query(insertFinalQuery, ['egresados', email, JSON.stringify(datosJSON), 'pendiente', true]);
            }

            await client.query('DELETE FROM egresados_pending_confirmation WHERE id = $1', [pendingData.id]);
            await client.query('COMMIT');

            res.json({ success: true, message: `✅ ¡Email confirmado exitosamente, ${datosJSON.nombre_completo}!` });

        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        }

    } catch (error) {
        devLog.error('[EGRESADOS CONFIRM v2] Error al confirmar email', error);
        res.status(500).json({ success: false, error: 'Error al confirmar email.', detail: error.message });
    } finally {
        client.release();
    }
});

/**
 * GET /api/egresados
 * Obtiene lista de egresados aprobados
 */
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT * FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'egresados' AND estado = 'aprobado'
            ORDER BY fecha_solicitud DESC
            LIMIT $1 OFFSET $2
        `;

        const result = await pool.query(query, [limit, offset]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        devLog.error('[EGRESADOS GET] Error al obtener egresados', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener egresados'
        });
    }
});

/**
 * GET /api/egresados/stats
 * Obtiene estadísticas de egresados
 */
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
            FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'egresados'
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            stats: result.rows[0] || {
                total: 0,
                aprobados: 0,
                pendientes: 0
            }
        });
    } catch (error) {
        devLog.error('[EGRESADOS STATS] Error al obtener estadísticas', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

/**
 * GET /api/egresados/stats/general
 * Alias para obtener estadísticas generales (compatible con frontend)
 */
router.get('/stats/general', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
            FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'egresados'
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows[0] || {
                total: 0,
                aprobados: 0,
                pendientes: 0
            }
        });
    } catch (error) {
        devLog.error('[EGRESADOS STATS GENERAL] Error al obtener estadísticas', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

/**
 * GET /api/egresados/list
 * Alias para obtener lista de egresados (compatible con frontend)
 */
router.get('/list', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT * FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'egresados' AND estado = 'aprobado'
            ORDER BY fecha_solicitud DESC
            LIMIT $1 OFFSET $2
        `;

        const result = await pool.query(query, [limit, offset]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        devLog.error('[EGRESADOS LIST] Error al obtener egresados', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener egresados'
        });
    }
});

module.exports = router;
/**
 * 🎓 RUTAS DE EGRESADOS CON POSTGRESQL (v2 - ROBUSTO CON BD)
 * Sistema completo de gestión de perfiles profesionales con confirmación por email.
 */

const express = require('express');
const router = express.Router();
// ✅ FASE 3: Using DAO layer instead of direct pool access
const EgresadosDAO = require('../data/egresados.dao');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');

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
    try {
        debugLog.log('EGRESADOS', '[EGRESADOS CREATE v2] Recibido formulario de egresado');
        const { nombre_completo, email, ...otherData } = req.body;

        if (!nombre_completo || !email) {
            return res.status(400).json({ success: false, message: '⚠️ Nombre y Email son obligatorios.' });
        }

        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const datosJSON = { nombre_completo, email, ...otherData };

        // ✅ FASE 3: Using EgresadosDAO
        const finalToken = await EgresadosDAO.createPendingConfirmation(email, datosJSON, confirmationToken);
        debugLog.log('EGRESADOS', '[EGRESADOS CREATE v2] Solicitud guardada en tabla temporal');

        const confirmLink = `${process.env.BASE_URL || 'http://localhost:3000'}/egresados.html?token=${finalToken}#confirm-email`;
        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '📧 Confirma tu dirección de email - BGE Héroes de la Patria',
            html: `
                <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #27ae60; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                </style></head><body>
                    <div class="container"><div class="header"><h1>📧 Confirmación de Email Requerida</h1></div>
                    <div class="content"><p>Hola <strong>${nombre_completo}</strong>,</p>
                    <p>Hemos recibido tu solicitud. Para continuar, por favor confirma tu email haciendo clic en el botón de abajo.</p>
                    <div style="text-align: center;"><a href="${confirmLink}" class="button">✅ Confirmar mi Email</a></div>
                    <p style="font-size: 12px; color: #666;">Este enlace expira en 24 horas.</p></div></div>
                </body></html>
            `
        };

        await transporter.sendMail(mailOptions);
        debugLog.log('EGRESADOS', `[EGRESADOS CREATE v2] Email de confirmación enviado a ${maskEmail(email)}`);

        res.status(201).json({ success: true, message: `✅ REGISTRO EXITOSO: Se ha enviado un email de confirmación a ${email}.` });

    } catch (error) {
        debugLog.error('EGRESADOS', '[EGRESADOS CREATE v2] Error al procesar solicitud', sanitizeError(error, 'egresados'));
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud.', error: error.message });
    }
});

/**
 * POST /api/egresados/confirm/:token
 * Confirma el email, mueve los datos a `pendientes_aprobacion`.
 */
router.post('/confirm/:token', async (req, res) => {
    const { token } = req.params;
    try {
        // ✅ FASE 3: Using EgresadosDAO
        const result = await EgresadosDAO.confirmEmail(token);

        if (!result.success) {
            return res.status(404).json({ success: false, error: result.error });
        }

        res.json({ success: true, message: `✅ ¡Email confirmado exitosamente, ${result.datos.nombre_completo}!` });

    } catch (error) {
        debugLog.error('EGRESADOS', '[EGRESADOS CONFIRM v2] Error al confirmar email', sanitizeError(error, 'egresados'));
        res.status(500).json({ success: false, error: 'Error al confirmar email.', detail: error.message });
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

        // ✅ FASE 3: Using EgresadosDAO
        const data = await EgresadosDAO.getAprobados(limit, offset);

        res.json({ success: true, count: data.length, data });
    } catch (error) {
        debugLog.error('EGRESADOS', '[EGRESADOS GET] Error al obtener egresados', sanitizeError(error, 'egresados'));
        res.status(500).json({ success: false, error: 'Error al obtener egresados' });
    }
});

/**
 * GET /api/egresados/stats
 * Obtiene estadísticas de egresados
 */
router.get('/stats', async (req, res) => {
    try {
        // ✅ FASE 3: Using EgresadosDAO
        const stats = await EgresadosDAO.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        debugLog.error('EGRESADOS', '[EGRESADOS STATS] Error al obtener estadísticas', sanitizeError(error, 'egresados'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/egresados/stats/general
 * Alias para obtener estadísticas generales (compatible con frontend)
 */
router.get('/stats/general', async (req, res) => {
    try {
        // ✅ FASE 3: Using EgresadosDAO
        const data = await EgresadosDAO.getStats();
        res.json({ success: true, data });
    } catch (error) {
        debugLog.error('EGRESADOS', '[EGRESADOS STATS GENERAL] Error al obtener estadísticas', sanitizeError(error, 'egresados'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
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

        // ✅ FASE 3: Using EgresadosDAO
        const data = await EgresadosDAO.getAprobados(limit, offset);

        res.json({ success: true, count: data.length, data });
    } catch (error) {
        debugLog.error('EGRESADOS', '[EGRESADOS LIST] Error al obtener egresados', sanitizeError(error, 'egresados'));
        res.status(500).json({ success: false, error: 'Error al obtener egresados' });
    }
});

module.exports = router;
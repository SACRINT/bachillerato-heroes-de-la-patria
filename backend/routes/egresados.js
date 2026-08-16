"use strict";
/**
 * 🎓 RUTAS DE EGRESADOS - TypeScript
 * Sistema de gestión de perfiles profesionales
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
// ✅ FASE 3: Using DAO layer
const egresados_dao_1 = __importDefault(require('../data/egresados.dao.js'));
// GDPR Logging
const debug_logger_1 = require('../utils/debug-logger.js');
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
const router = express_1.default.Router();
// ============================================
// EMAIL CONFIGURATION
// ============================================
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// ============================================
// ROUTES
// ============================================
/**
 * POST /api/egresados/create
 * Crea solicitud y envía email de confirmación
 */
router.post('/create', async (req, res) => {
    try {
        debug_logger_1.debugLog.log('EGRESADOS', '[EGRESADOS CREATE v2] Recibido formulario de egresado');
        const { nombre_completo, email, ...otherData } = req.body;
        if (!nombre_completo || !email) {
            res.status(400).json({ success: false, message: '⚠️ Nombre y Email son obligatorios.' });
            return;
        }
        const confirmationToken = crypto_1.default.randomBytes(32).toString('hex');
        const datosJSON = { nombre_completo, email, ...otherData };
        const finalToken = await egresados_dao_1.default.createPendingConfirmation(email, datosJSON, confirmationToken);
        debug_logger_1.debugLog.log('EGRESADOS', '[EGRESADOS CREATE v2] Solicitud guardada en tabla temporal');
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
        debug_logger_1.debugLog.log('EGRESADOS', `[EGRESADOS CREATE v2] Email de confirmación enviado a ${(0, sanitized_errors_1.maskEmail)(email)}`);
        res.status(201).json({ success: true, message: `✅ REGISTRO EXITOSO: Se ha enviado un email de confirmación a ${email}.` });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EGRESADOS', '[EGRESADOS CREATE v2] Error al procesar solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'egresados'));
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud.', error: error.message });
    }
});
/**
 * POST /api/egresados/confirm/:token
 * Confirma email y mueve a pendientes_aprobacion
 */
router.post('/confirm/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const result = await egresados_dao_1.default.confirmEmail(token);
        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }
        res.json({ success: true, message: `✅ ¡Email confirmado exitosamente, ${result.datos.nombre_completo}!` });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EGRESADOS', '[EGRESADOS CONFIRM v2] Error al confirmar email', (0, sanitized_errors_1.sanitizeError)(error, 'egresados'));
        res.status(500).json({ success: false, error: 'Error al confirmar email.', detail: error.message });
    }
});
/**
 * GET /api/egresados
 * Lista de egresados aprobados
 */
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
        const offset = parseInt(req.query.offset) || 0;
        const data = await egresados_dao_1.default.getAprobados(limit, offset);
        res.json({ success: true, count: data ? data.length : 0, data: data || [] });
    }
    catch (error) {
        res.json({ success: true, count: 0, data: [] });
    }
});
/**
 * GET /api/egresados/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await egresados_dao_1.default.getStats();
        res.json({ success: true, stats: stats || { total: 0, titulados: 0, estudiando: 0, trabajando: 0 } });
    }
    catch (error) {
        res.json({ success: true, stats: { total: 0, titulados: 0, estudiando: 0, trabajando: 0 } });
    }
});
/**
 * GET /api/egresados/stats/general
 */
router.get('/stats/general', async (req, res) => {
    try {
        const data = await egresados_dao_1.default.getStats();
        res.json({ success: true, data: data || { total: 0, titulados: 0, estudiando: 0, trabajando: 0 } });
    }
    catch (error) {
        res.json({ success: true, data: { total: 0, titulados: 0, estudiando: 0, trabajando: 0 } });
    }
});
/**
 * GET /api/egresados/list
 */
router.get('/list', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
        const offset = parseInt(req.query.offset) || 0;
        const data = await egresados_dao_1.default.getAprobados(limit, offset);
        res.json({ success: true, count: data ? data.length : 0, data: data || [] });
    }
    catch (error) {
        res.json({ success: true, count: 0, data: [] });
    }
});
exports.default = router;
module.exports = router;
//# sourceMappingURL=egresados.js.map
"use strict";
/**
 * 💼 API CRUD PARA BOLSA DE TRABAJO - TypeScript
 * Gestión completa de CVs y candidatos
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const express_validator_1 = require("express-validator");
const bolsa_trabajo_dao_1 = __importDefault(require("../data/bolsa-trabajo.dao"));
const database_1 = require("../config/database");
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const router = express_1.default.Router();
// ============================================
// CONFIGURACIÓN EMAIL
// ============================================
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// ============================================
// MULTER CONFIG
// ============================================
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path_1.default.join(__dirname, '../../public/uploads/cvs');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cv-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
    }
});
// ============================================
// ROUTES
// ============================================
/**
 * POST /api/bolsa-trabajo/cv - Crear perfil de CV
 */
router.post('/cv', upload.single('additionalDocument'), [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Nombre es requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('phone').trim().notEmpty().withMessage('Teléfono es requerido'),
    (0, express_validator_1.body)('graduationYear').notEmpty().withMessage('Año de egreso es requerido'),
    (0, express_validator_1.body)('subject').trim().notEmpty().withMessage('Área de interés es requerida'),
    (0, express_validator_1.body)('message').optional().trim()
], async (req, res) => {
    // Validar datos
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        if (req.file) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    const { name, email, phone, graduationYear, subject, skills } = req.body;
    const message = req.body.message && req.body.message.trim() ? req.body.message.trim() : `Perfil profesional de egresado en área de ${subject}`;
    const cvFile = req.file ? `/uploads/cvs/${req.file.filename}` : null;
    try {
        debug_logger_1.debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Recibiendo CV');
        const confirmationToken = crypto_1.default.randomBytes(32).toString('hex');
        const formData = { name, email, phone, graduationYear, subject, message, skills, cvPath: cvFile };
        // 3. Guardar temporalmente
        const result = await bolsa_trabajo_dao_1.default.createPendingConfirmation(email, formData, confirmationToken);
        const finalToken = result.confirmation_token;
        debug_logger_1.debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Datos guardados en BD temporal');
        // 4. Enviar email
        const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bolsa-trabajo.html#confirm-email`;
        const confirmLink = `${confirmationUrl}?token=${finalToken}`;
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirma tu Email - Bolsa de Trabajo</title>
            </head>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1976D2;">¡Bienvenido a la Bolsa de Trabajo!</h1>
                    </div>
                    <p>Hola <strong>${name}</strong>,</p>
                    <p>Para completar tu registro, debes confirmar tu dirección de email.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmLink}" style="display: inline-block; padding: 12px 30px; background-color: #1976D2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmar mi Email</a>
                    </div>
                    <p style="color: #999; font-size: 12px;">Enlace expira en 24 horas.</p>
                </div>
            </body>
            </html>
        `;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '✅ Confirma tu Email - Bolsa de Trabajo BGE',
            html: htmlContent
        });
        debug_logger_1.debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Email de confirmación enviado');
        // 5. Respuesta
        res.status(201).json({
            success: true,
            message: '📧 ¡Solicitud recibida! Hemos enviado un email de confirmación.',
            data: { email, nombre: name, estado: 'esperando_confirmacion' }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Error al procesar solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error al procesar tu perfil.', detalle: error.message });
    }
});
/**
 * POST /api/bolsa-trabajo/confirm-email/:token
 */
router.post('/confirm-email/:token', async (req, res) => {
    const { token } = req.params;
    const client = await database_1.pool.connect();
    if (!token) {
        res.status(400).json({ success: false, error: 'Token requerido' });
        return;
    }
    try {
        debug_logger_1.debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CONFIRM] Confirmando email');
        // 1. Buscar datos
        const pendingResult = await client.query(`SELECT id, email_usuario, datos_json, token_expires_at FROM bolsa_trabajo_pending_confirmation WHERE confirmation_token = $1`, [token]);
        if (pendingResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Token inválido o no encontrado' });
            return;
        }
        const pendingData = pendingResult.rows[0];
        // 2. Verificar expiración
        if (new Date() > new Date(pendingData.token_expires_at)) {
            await client.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [pendingData.id]);
            res.status(404).json({ success: false, error: 'Token expirado' });
            return;
        }
        // 3. Transaction
        await client.query('BEGIN');
        const { email_usuario: email, datos_json: formData } = pendingData;
        try {
            const existingApproval = await client.query(`SELECT id FROM pendientes_aprobacion WHERE email_usuario = $1 AND tipo_solicitud = $2`, [email, 'bolsa_trabajo']);
            let savedRecord;
            if (existingApproval.rows.length > 0) {
                // Update existing
                const updateRes = await client.query(`UPDATE pendientes_aprobacion SET datos_json = $1, fecha_solicitud = NOW(), email_confirmado = $2, estado = $3 WHERE id = $4 RETURNING id, uuid, email_usuario, estado`, [JSON.stringify(formData), true, 'pendiente', existingApproval.rows[0].id]);
                savedRecord = updateRes.rows[0];
            }
            else {
                // Insert new
                const insertRes = await client.query(`INSERT INTO pendientes_aprobacion (email_usuario, tipo_solicitud, datos_json, estado, email_confirmado, fecha_solicitud) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, uuid, email_usuario, estado`, [email, 'bolsa_trabajo', JSON.stringify(formData), 'pendiente', true]);
                savedRecord = insertRes.rows[0];
            }
            await client.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [pendingData.id]);
            await client.query('COMMIT');
            res.status(200).json({
                success: true,
                message: '✅ Email confirmado exitosamente',
                data: { uuid: savedRecord.uuid, status: savedRecord.estado }
            });
        }
        catch (innerErr) {
            await client.query('ROLLBACK');
            throw innerErr;
        }
    }
    catch (error) {
        debug_logger_1.debugLog.error('BOLSA_TRABAJO', 'Error confirmando email', (0, sanitized_errors_1.sanitizeError)(error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error al confirmar email' });
    }
    finally {
        client.release();
    }
});
/**
 * GET /api/bolsa-trabajo/cv (Alias /api/bolsa-trabajo)
 */
const getCvsHandler = async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;
    try {
        // En .js original se llamaba getAll o getCvs dependiendo de la ruta, ambos parecen mapear a DAO methods.
        // Aquí unificamos.
        const { data, total } = await bolsa_trabajo_dao_1.default.getCvs({ status, limit: parseInt(limit), offset: parseInt(offset) });
        res.json({ success: true, data, total, limit: parseInt(limit), offset: parseInt(offset) });
    }
    catch (error) {
        debug_logger_1.debugLog.error('BOLSA_TRABAJO', 'Error obteniendo CVs', (0, sanitized_errors_1.sanitizeError)(error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error obteniendo datos' });
    }
};
router.get('/cv', getCvsHandler);
router.get('/', getCvsHandler); // Alias
/**
 * GET /api/bolsa-trabajo/cv/stats
 */
router.get('/cv/stats', async (req, res) => {
    try {
        const stats = await bolsa_trabajo_dao_1.default.getCvStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
    }
});
router.get('/stats/general', async (req, res) => {
    try {
        const stats = await bolsa_trabajo_dao_1.default.getGeneralStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
    }
});
/**
 * GET /api/bolsa-trabajo/cv/:id
 */
router.get('/cv/:id', async (req, res) => {
    try {
        const cv = await bolsa_trabajo_dao_1.default.getCvById(req.params.id);
        if (!cv) {
            res.status(404).json({ success: false, error: 'CV no encontrado' });
            return;
        }
        res.json({ success: true, data: cv });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo CV' });
    }
});
/**
 * PUT /api/bolsa-trabajo/cv/:id
 */
router.put('/cv/:id', async (req, res) => {
    try {
        const updated = await bolsa_trabajo_dao_1.default.updateCv(req.params.id, req.body);
        if (!updated) {
            res.status(404).json({ success: false, error: 'CV no encontrado' });
            return;
        }
        res.json({ success: true, message: 'CV actualizado', data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando CV' });
    }
});
/**
 * DELETE /api/bolsa-trabajo/cv/:id
 */
router.delete('/cv/:id', async (req, res) => {
    try {
        const deleted = await bolsa_trabajo_dao_1.default.deleteCv(req.params.id);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'CV no encontrado' });
            return;
        }
        res.json({ success: true, message: 'CV eliminado' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error eliminando CV' });
    }
});
/**
 * GET /api/bolsa-trabajo/pending-approvals
 */
router.get('/pending-approvals', async (req, res) => {
    const { status = 'pendiente', limit = 50, offset = 0, email_confirmado = 'true' } = req.query;
    try {
        const { data, total } = await bolsa_trabajo_dao_1.default.getPendingApprovals({ status, email_confirmado: email_confirmado === 'true', limit: parseInt(limit), offset: parseInt(offset) });
        res.json({ success: true, data, total, limit, offset });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo solicitudes' });
    }
});
/**
 * POST /api/bolsa-trabajo/approve-solicitud/:id
 */
router.post('/approve-solicitud/:id', [
    (0, express_validator_1.body)('action').isIn(['approve', 'reject']).withMessage('Acción inválida'),
    (0, express_validator_1.body)('adminNotes').optional().trim()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    const { id } = req.params;
    const { action, adminNotes } = req.body;
    try {
        const solicitud = await bolsa_trabajo_dao_1.default.getSolicitudById(String(id)); // DAO expects string/number? assuming string or int
        if (!solicitud) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }
        const estado = action === 'approve' ? 'aprobada' : 'rechazada';
        const updateResult = await bolsa_trabajo_dao_1.default.updateSolicitudStatus(String(id), estado, adminNotes, req.user?.id);
        if (!updateResult) {
            res.status(500).json({ success: false, error: 'No se pudo actualizar solicitud' });
            return;
        }
        let boletinResult;
        if (action === 'approve') {
            const formData = JSON.parse(solicitud.datos_json);
            boletinResult = await bolsa_trabajo_dao_1.default.insertCvFromApproval(formData);
        }
        res.json({
            success: true,
            message: action === 'approve' ? '✅ Solicitud aprobada' : '❌ Solicitud rechazada',
            data: {
                solicitud_id: id,
                estado,
                bolsa_trabajo_id: boletinResult?.id
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('BOLSA_TRABAJO', 'Error procesando solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error procesando solicitud' });
    }
});
exports.default = router;
//# sourceMappingURL=bolsa-trabajo.js.map
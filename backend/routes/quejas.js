"use strict";
/**
 * 📝 API CRUD PARA QUEJAS Y SUGERENCIAS - TypeScript
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
// ✅ FASE 3: DAO Layer
const quejas_dao_1 = __importDefault(require("../data/quejas.dao"));
const emailService_1 = __importDefault(require("../services/emailService"));
const router = express_1.default.Router();
// ============================================
// ROUTES
// ============================================
/**
 * POST /api/quejas
 */
router.post('/', [
    (0, express_validator_1.body)('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('subject').isIn(['queja', 'sugerencia', 'felicitacion', 'otro']).withMessage('Tipo inválido'),
    (0, express_validator_1.body)('message').trim().notEmpty().withMessage('Mensaje es requerido')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    const { nombre, email, subject, message, form_type } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');
    try {
        const queja = await quejas_dao_1.default.create({ nombre, email, subject, message, form_type, ip_address, user_agent });
        debug_logger_1.debugLog.log('QUEJAS', '✅ Queja/sugerencia guardada:', queja.id);
        try {
            if (email) {
                await emailService_1.default.sendEmail({
                    to: email,
                    subject: 'Hemos recibido tu mensaje - Bachillerato Héroes de la Patria',
                    template: 'contact-confirmation',
                    data: { nombre: nombre || 'Usuario', subject, fecha: new Date() }
                });
            }
        }
        catch (emailError) {
            console.error('[Quejas] Error al enviar correo:', emailError);
        }
        res.status(201).json({ success: true, message: 'Tu mensaje ha sido recibido.', data: { id: queja.id, fecha: queja.fecha_creacion } });
    }
    catch (error) {
        debug_logger_1.debugLog.error('QUEJAS', '❌ Error al guardar queja:', (0, sanitized_errors_1.sanitizeError)(error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al procesar tu mensaje.' });
    }
});
/**
 * GET /api/quejas
 */
router.get('/', async (req, res) => {
    const { status, limit = '50', offset = '0' } = req.query;
    try {
        const data = await quejas_dao_1.default.getAll({ status, limit, offset });
        res.json({ success: true, data, total: data.length });
    }
    catch (error) {
        debug_logger_1.debugLog.error('QUEJAS', '❌ Error al obtener quejas:', (0, sanitized_errors_1.sanitizeError)(error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al obtener los datos' });
    }
});
/**
 * GET /api/quejas/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await quejas_dao_1.default.getStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        debug_logger_1.debugLog.error('QUEJAS', '❌ Error al obtener estadísticas:', (0, sanitized_errors_1.sanitizeError)(error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});
/**
 * GET /api/quejas/:id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const queja = await quejas_dao_1.default.getById(id);
        if (!queja) {
            res.status(404).json({ success: false, error: 'Queja no encontrada' });
            return;
        }
        res.json({ success: true, data: queja });
    }
    catch (error) {
        debug_logger_1.debugLog.error('QUEJAS', '❌ Error al obtener queja:', (0, sanitized_errors_1.sanitizeError)(error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al obtener la queja' });
    }
});
/**
 * PUT /api/quejas/:id
 */
router.put('/:id', [
    (0, express_validator_1.body)('status').optional().isIn(['pendiente', 'en_revision', 'respondida', 'cerrada']),
    (0, express_validator_1.body)('respuesta').optional().trim(),
    (0, express_validator_1.body)('respondido_por').optional().trim()
], async (req, res) => {
    const { id } = req.params;
    const { status, respuesta, respondido_por } = req.body;
    try {
        const result = await quejas_dao_1.default.update(id, { status, respuesta, respondido_por });
        if (!result) {
            res.status(404).json({ success: false, error: 'Queja no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Queja actualizada correctamente', data: result });
    }
    catch (error) {
        debug_logger_1.debugLog.error('QUEJAS', '❌ Error al actualizar queja:', (0, sanitized_errors_1.sanitizeError)(error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al actualizar la queja' });
    }
});
/**
 * DELETE /api/quejas/:id
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await quejas_dao_1.default.delete(id);
        if (!result) {
            res.status(404).json({ success: false, error: 'Queja no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Queja eliminada correctamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('QUEJAS', '❌ Error al eliminar queja:', (0, sanitized_errors_1.sanitizeError)(error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al eliminar la queja' });
    }
});
exports.default = router;
//# sourceMappingURL=quejas.js.map
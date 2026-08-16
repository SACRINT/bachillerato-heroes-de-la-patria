"use strict";
/**
 * 📝 API CRUD PARA INSCRIPCIONES - TypeScript
 * Gestión de solicitudes de inscripción a actividades extracurriculares
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// GDPR Logging
const debug_logger_1 = require('../utils/debug-logger.js');
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
// ✅ FASE 3: DAO Layer
const inscriptions_dao_1 = __importDefault(require('../data/inscriptions.dao.js'));
const router = express_1.default.Router();
// ============================================
// ROUTES
// ============================================
/**
 * POST /api/inscriptions/register
 */
router.post('/register', [
    (0, express_validator_1.body)('activityId').trim().notEmpty().withMessage('ID de actividad requerido'),
    (0, express_validator_1.body)('activityName').trim().notEmpty().withMessage('Nombre de actividad requerido'),
    (0, express_validator_1.body)('studentName').trim().notEmpty().withMessage('Nombre del estudiante requerido'),
    (0, express_validator_1.body)('studentEmail').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('studentId').optional().trim(),
    (0, express_validator_1.body)('studentGroup').optional().trim(),
    (0, express_validator_1.body)('emergencyContact').optional().trim(),
    (0, express_validator_1.body)('additionalInfo').optional().trim()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    const { activityId, activityName, studentId, studentName, studentEmail, studentGroup, emergencyContact, additionalInfo } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');
    try {
        const existing = await inscriptions_dao_1.default.checkExisting(studentEmail, activityId);
        if (existing) {
            if (existing.status === 'pending') {
                res.json({ success: true, message: 'Ya tienes una solicitud pendiente.', data: { id: existing.id, already_pending: true } });
                return;
            }
            if (existing.status === 'approved') {
                res.json({ success: true, message: 'Ya estás inscrito.', data: { id: existing.id, already_approved: true } });
                return;
            }
            if (existing.status === 'rejected' || existing.status === 'cancelled') {
                const result = await inscriptions_dao_1.default.updateResubmit(existing.id, { studentName, studentId, studentGroup, emergencyContact, additionalInfo, ip_address, user_agent });
                debug_logger_1.debugLog.log('INSCRIPTIONS', '✅ Inscripción actualizada (reintento):', result.id);
                res.json({ success: true, message: 'Tu nueva solicitud ha sido enviada.', data: { id: result.id, resubmitted: true } });
                return;
            }
        }
        const result = await inscriptions_dao_1.default.create({ activityId, activityName, studentId, studentName, studentEmail, studentGroup, emergencyContact, additionalInfo, ip_address, user_agent });
        debug_logger_1.debugLog.log('INSCRIPTIONS', '✅ Nueva inscripción creada:', result.id);
        res.status(201).json({ success: true, message: '¡Solicitud enviada exitosamente!', data: { id: result.id, activityName: result.activity_name, fecha: result.fecha_solicitud } });
    }
    catch (error) {
        debug_logger_1.debugLog.error('INSCRIPTIONS', '❌ Error al crear inscripción:', (0, sanitized_errors_1.sanitizeError)(error, 'inscriptions'));
        const err = error;
        if (err.code === '23505') {
            res.status(400).json({ success: false, error: 'Ya existe una solicitud para esta actividad con este email' });
            return;
        }
        res.status(201).json({
            success: true,
            message: '¡Solicitud registrada exitosamente!',
            data: {
                id: Date.now(),
                activityName: activityName || 'Inscripción BGE',
                fecha: new Date().toISOString()
            }
        });
    }
});
/**
 * GET /api/inscriptions
 */
router.get('/', async (req, res) => {
    const { status, activity_id, student_email, limit = '50', offset = '0' } = req.query;
    try {
        const { data, total } = await inscriptions_dao_1.default.getAll({ status, activity_id, student_email, limit, offset });
        res.json({ success: true, data, total, limit: parseInt(limit), offset: parseInt(offset) });
    }
    catch (error) {
        debug_logger_1.debugLog.error('INSCRIPTIONS', '❌ Error al obtener inscripciones:', (0, sanitized_errors_1.sanitizeError)(error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al obtener los datos' });
    }
});
/**
 * GET /api/inscriptions/list
 */
router.get('/list', async (req, res) => {
    try {
        const inscripciones = await inscriptions_dao_1.default.list();
        res.json({ success: true, inscripciones, total: inscripciones.length });
    }
    catch (error) {
        debug_logger_1.debugLog.error('INSCRIPTIONS', '❌ Error al listar inscripciones:', (0, sanitized_errors_1.sanitizeError)(error, 'inscriptions'));
        res.json({ success: true, inscripciones: [], total: 0, message: 'Error al obtener inscripciones' });
    }
});
/**
 * GET /api/inscriptions/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await inscriptions_dao_1.default.getStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        debug_logger_1.debugLog.error('INSCRIPTIONS', '❌ Error al obtener estadísticas:', (0, sanitized_errors_1.sanitizeError)(error, 'inscriptions'));
        res.json({
            success: true,
            data: {
                total: 0,
                pendientes: 0,
                aprobadas: 0,
                rechazadas: 0,
                canceladas: 0,
                hoy: 0,
                esta_semana: 0,
                byActivity: []
            }
        });
    }
});
/**
 * GET /api/inscriptions/:id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const inscripcion = await inscriptions_dao_1.default.getById(id);
        if (!inscripcion) {
            res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
            return;
        }
        res.json({ success: true, data: inscripcion });
    }
    catch (error) {
        debug_logger_1.debugLog.error('INSCRIPTIONS', '❌ Error al obtener inscripción:', (0, sanitized_errors_1.sanitizeError)(error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al obtener la inscripción' });
    }
});
/**
 * PUT /api/inscriptions/:id
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes, processed_by } = req.body;
    try {
        const result = await inscriptions_dao_1.default.update(id, { status, admin_notes, processed_by });
        if (!result) {
            res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
            return;
        }
        debug_logger_1.debugLog.log('INSCRIPTIONS', `✅ Inscripción ${id} actualizada: ${status}`);
        res.json({ success: true, message: 'Inscripción actualizada correctamente', data: result });
    }
    catch (error) {
        debug_logger_1.debugLog.error('INSCRIPTIONS', '❌ Error al actualizar inscripción:', (0, sanitized_errors_1.sanitizeError)(error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al actualizar la inscripción' });
    }
});
/**
 * DELETE /api/inscriptions/:id
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await inscriptions_dao_1.default.cancel(id);
        if (!result) {
            res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Inscripción cancelada correctamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('INSCRIPTIONS', '❌ Error al cancelar inscripción:', (0, sanitized_errors_1.sanitizeError)(error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al cancelar la inscripción' });
    }
});
exports.default = router;
//# sourceMappingURL=inscriptions.js.map
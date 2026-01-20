"use strict";
/**
 * Enrollment Routes
 * API para sistema de inscripciones
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const { authenticateToken, requireRole } = require('../middleware/auth');
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const enrollment_service_1 = __importDefault(require("../services/enrollment.service"));
const payment_service_1 = __importDefault(require("../services/payment.service"));
const router = (0, express_1.Router)();
// Crear solicitud (público)
router.post('/apply', [
    (0, express_validator_1.body)('nombres').notEmpty(),
    (0, express_validator_1.body)('apellido_paterno').notEmpty(),
    (0, express_validator_1.body)('fecha_nacimiento').isISO8601(),
    (0, express_validator_1.body)('curp').notEmpty().isLength({ min: 18, max: 18 }),
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('telefono').notEmpty()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const application = await enrollment_service_1.default.createApplication(req.body);
        res.status(201).json({
            success: true,
            message: 'Solicitud creada exitosamente',
            data: application
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error creando solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al crear solicitud' });
    }
});
// Actualizar solicitud
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await enrollment_service_1.default.updateApplication(parseInt(id), req.body);
        res.json({ success: true, data: updated });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error actualizando solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al actualizar solicitud' });
    }
});
// Enviar para revisión
router.post('/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const submitted = await enrollment_service_1.default.submitApplication(parseInt(id));
        res.json({
            success: true,
            message: 'Solicitud enviada para revisión',
            data: submitted
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error enviando solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: error.message });
    }
});
// Subir documento
router.post('/:id/documents', async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_documento, url, nombre_archivo, mime_type, tamano_bytes } = req.body;
        const doc = await enrollment_service_1.default.uploadDocument({
            solicitud_id: parseInt(id),
            tipo_documento,
            nombre_archivo,
            url,
            mime_type,
            tamano_bytes
        });
        res.json({ success: true, data: doc });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error subiendo documento', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al subir documento' });
    }
});
// Listar solicitudes (admin)
router.get('/list', authenticateToken, requireRole(['admin', 'coordinador']), async (req, res) => {
    try {
        const { status, ciclo_escolar, tipo_inscripcion } = req.query;
        const filters = {};
        if (status)
            filters.status = status;
        if (ciclo_escolar)
            filters.ciclo_escolar = ciclo_escolar;
        if (tipo_inscripcion)
            filters.tipo_inscripcion = tipo_inscripcion;
        const applications = await enrollment_service_1.default.getApplications(filters);
        res.json({ success: true, data: applications });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error listando solicitudes', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al listar solicitudes' });
    }
});
// Aprobar solicitud (admin)
router.post('/:id/approve', authenticateToken, requireRole(['admin', 'coordinador']), async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        const approved = await enrollment_service_1.default.approveApplication(parseInt(id), authReq.user.id);
        res.json({
            success: true,
            message: 'Solicitud aprobada',
            data: approved
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error aprobando solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al aprobar solicitud' });
    }
});
// Rechazar solicitud (admin)
router.post('/:id/reject', authenticateToken, requireRole(['admin', 'coordinador']), [
    (0, express_validator_1.body)('motivo').notEmpty()
], async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        const { motivo } = req.body;
        const rejected = await enrollment_service_1.default.rejectApplication(parseInt(id), motivo, authReq.user.id);
        res.json({
            success: true,
            message: 'Solicitud rechazada',
            data: rejected
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error rechazando solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al rechazar solicitud' });
    }
});
// Crear pago con tarjeta
router.post('/:id/payment/card', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;
        const payment = await payment_service_1.default.createPaymentIntent({
            amount,
            currency: 'MXN',
            description: description || 'Pago de inscripción',
            metadata: {
                solicitud_id: parseInt(id),
                tipo_pago: 'inscripcion'
            }
        });
        res.json({
            success: true,
            data: payment
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error creando pago', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al crear pago' });
    }
});
// Crear pago OXXO
router.post('/:id/payment/oxxo', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;
        const payment = await payment_service_1.default.createOxxoPayment({
            amount,
            currency: 'MXN',
            description: description || 'Pago de inscripción',
            metadata: {
                solicitud_id: parseInt(id),
                tipo_pago: 'inscripcion'
            }
        });
        res.json({
            success: true,
            data: payment
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error creando pago OXXO', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al crear pago OXXO' });
    }
});
// Webhook de Stripe
router.post('/webhook/stripe', async (req, res) => {
    try {
        const { type, data } = req.body;
        if (type === 'payment_intent.succeeded') {
            await payment_service_1.default.confirmPayment(data.object.id);
        }
        res.json({ received: true });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error en webhook', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false });
    }
});
// Estadísticas (admin)
router.get('/stats', authenticateToken, requireRole(['admin', 'coordinador']), async (req, res) => {
    try {
        const stats = await enrollment_service_1.default.getStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ENROLLMENT', 'Error obteniendo estadísticas', (0, sanitized_errors_1.sanitizeError)(error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});
exports.default = router;

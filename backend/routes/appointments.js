"use strict";
/**
 * 📅 RUTAS DE CITAS (APPOINTMENTS) - TypeScript
 * API RESTful para gestión de citas
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require('../middleware/auth.js');
const appointment_service_1 = __importDefault(require('../services/appointment.service.js'));
const router = express_1.default.Router();
// ============================================
// MIDDLEWARE
// ============================================
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    next();
};
// ============================================
// ROUTES
// ============================================
/**
 * GET /api/appointments - Listar citas (Admin/Staff)
 */
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'director', 'coordinador', 'docente']), async (req, res, next) => {
    try {
        const filters = {
            limit: parseInt(req.query.limit) || 50,
            fecha: req.query.fecha,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin,
            estado: req.query.estado,
            email: req.query.email
        };
        const appointments = await appointment_service_1.default.listAppointments(filters);
        res.json({ success: true, data: appointments });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/appointments/availability - Verificar disponibilidad
 */
router.get('/availability', [
    (0, express_validator_1.query)('fecha').isDate(),
    (0, express_validator_1.query)('hora').matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
], validate, async (req, res, next) => {
    try {
        const { fecha, hora } = req.query;
        const isAvailable = await appointment_service_1.default.checkAvailability(fecha, hora);
        res.json({
            success: true,
            available: isAvailable,
            message: isAvailable ? 'Horario disponible' : 'Horario ocupado'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/appointments/confirm/:token - Confirmar vía token (Público)
 */
router.get('/confirm/:token', async (req, res, next) => {
    try {
        const appointment = await appointment_service_1.default.confirmAppointment(req.params.token, true);
        res.json({ success: true, message: 'Cita confirmada exitosamente', data: appointment });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/appointments/:id - Obtener detalles
 */
router.get('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const appointment = await appointment_service_1.default.getAppointment(req.params.id);
        res.json({ success: true, data: appointment });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/appointments - Crear nueva cita
 */
router.post('/', [
    (0, express_validator_1.body)('nombre_completo').trim().notEmpty().withMessage('Nombre requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('fecha_solicitada').isDate().withMessage('Fecha inválida (YYYY-MM-DD)'),
    (0, express_validator_1.body)('hora_solicitada').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora inválida (HH:MM)'),
    (0, express_validator_1.body)('motivo').trim().notEmpty().withMessage('Motivo requerido'),
    (0, express_validator_1.body)('tipo_persona').isIn(['estudiante', 'padre', 'madre', 'tutor', 'docente', 'administrativo', 'externo']),
    (0, express_validator_1.body)('departamento').optional().trim()
], validate, async (req, res, next) => {
    try {
        const appointment = await appointment_service_1.default.createAppointment(req.body);
        res.status(201).json({
            success: true,
            message: 'Cita solicitada exitosamente',
            data: appointment
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/appointments/:id/confirm - Confirmar cita (Admin)
 */
router.put('/:id/confirm', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'director', 'coordinador']), async (req, res, next) => {
    try {
        const appointment = await appointment_service_1.default.confirmAppointment(req.params.id);
        res.json({ success: true, message: 'Cita confirmada', data: appointment });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/appointments/:id - Cancelar cita
 */
router.delete('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { motivo } = req.body;
        await appointment_service_1.default.cancelAppointment(req.params.id, motivo || 'Cancelada por usuario');
        res.json({ success: true, message: 'Cita cancelada' });
    }
    catch (error) {
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=appointments.js.map
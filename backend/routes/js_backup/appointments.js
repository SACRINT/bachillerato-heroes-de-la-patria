/**
 * 📅 RUTAS DE CITAS (APPOINTMENTS)
 * API RESTful para gestión de citas
 * Utiliza AppointmentService y AppointmentDAO
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireRole } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const AppointmentService = require('../services/appointment.service');
const { ServiceError } = require('../services/appointment.service');

// Middleware de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/appointments
 * Listar citas (Admin/Staff)
 */
router.get('/',
    authenticateToken,
    requireRole(['admin', 'director', 'coordinador', 'docente']),
    async (req, res, next) => {
        try {
            const filters = {
                limit: parseInt(req.query.limit) || 50,
                fecha: req.query.fecha,
                fecha_inicio: req.query.fecha_inicio,
                fecha_fin: req.query.fecha_fin,
                estado: req.query.estado,
                email: req.query.email
            };

            const appointments = await AppointmentService.listAppointments(filters);
            res.json({ success: true, data: appointments });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/appointments/:id
 * Obtener detalles de una cita
 */
router.get('/:id',
    authenticateToken,
    async (req, res, next) => {
        try {
            const appointment = await AppointmentService.getAppointment(req.params.id);
            // TODO: Validar que el usuario sea dueño de la cita o admin
            res.json({ success: true, data: appointment });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/appointments
 * Crear nueva cita (Público o Autenticado)
 */
router.post('/',
    [
        body('nombre_completo').trim().notEmpty().withMessage('Nombre requerido'),
        body('email').isEmail().withMessage('Email inválido'),
        body('fecha_solicitada').isDate().withMessage('Fecha inválida (YYYY-MM-DD)'),
        body('hora_solicitada').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora inválida (HH:MM)'),
        body('motivo').trim().notEmpty().withMessage('Motivo requerido'),
        body('tipo_persona').isIn(['estudiante', 'padre', 'madre', 'tutor', 'docente', 'administrativo', 'externo']),
        body('departamento').optional().trim()
    ],
    validate,
    async (req, res, next) => {
        try {
            const appointment = await AppointmentService.createAppointment(req.body);
            res.status(201).json({
                success: true,
                message: 'Cita solicitada exitosamente',
                data: appointment
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PUT /api/appointments/:id/confirm
 * Confirmar cita (Admin o Token)
 */
router.put('/:id/confirm',
    authenticateToken,
    requireRole(['admin', 'director', 'coordinador']),
    async (req, res, next) => {
        try {
            const appointment = await AppointmentService.confirmAppointment(req.params.id);
            res.json({ success: true, message: 'Cita confirmada', data: appointment });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/appointments/confirm/:token
 * Confirmar cita vía token (Público)
 */
router.get('/confirm/:token', async (req, res, next) => {
    try {
        const appointment = await AppointmentService.confirmAppointment(req.params.token, true);
        res.json({ success: true, message: 'Cita confirmada exitosamente', data: appointment });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/appointments/:id
 * Cancelar cita
 */
router.delete('/:id',
    authenticateToken,
    async (req, res, next) => {
        try {
            const { motivo } = req.body;
            await AppointmentService.cancelAppointment(req.params.id, motivo || 'Cancelada por usuario');
            res.json({ success: true, message: 'Cita cancelada' });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/appointments/availability
 * Verificar disponibilidad
 */
router.get('/availability',
    [
        query('fecha').isDate(),
        query('hora').matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    ],
    validate,
    async (req, res, next) => {
        try {
            const { fecha, hora } = req.query;
            const isAvailable = await AppointmentService.checkAvailability(fecha, hora);
            res.json({
                success: true,
                available: isAvailable,
                message: isAvailable ? 'Horario disponible' : 'Horario ocupado'
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;

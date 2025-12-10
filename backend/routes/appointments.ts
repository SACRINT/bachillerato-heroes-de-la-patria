/**
 * 📅 RUTAS DE CITAS (APPOINTMENTS) - TypeScript
 * API RESTful para gestión de citas
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';
import { body, query, validationResult, ValidationChain } from 'express-validator';
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth';
import AppointmentService, { ServiceError } from '../services/appointment.service';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Appointment {
    id: number;
    nombre_completo: string;
    email: string;
    telefono?: string;
    fecha_solicitada: string;
    hora_solicitada: string;
    motivo: string;
    tipo_persona: 'estudiante' | 'padre' | 'madre' | 'tutor' | 'docente' | 'administrativo' | 'externo';
    departamento?: string;
    estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
    token?: string;
    created_at: string;
    updated_at: string;
}

interface AppointmentFilters {
    limit: number;
    fecha?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    estado?: string;
    email?: string;
}

// ============================================
// MIDDLEWARE
// ============================================

const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
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
router.get('/',
    authenticateToken,
    requireRole(['admin', 'director', 'coordinador', 'docente']),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const filters: AppointmentFilters = {
                limit: parseInt(req.query.limit as string) || 50,
                fecha: req.query.fecha as string,
                fecha_inicio: req.query.fecha_inicio as string,
                fecha_fin: req.query.fecha_fin as string,
                estado: req.query.estado as string,
                email: req.query.email as string
            };

            const appointments = await AppointmentService.listAppointments(filters);
            res.json({ success: true, data: appointments });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/appointments/availability - Verificar disponibilidad
 */
router.get('/availability',
    [
        query('fecha').isDate(),
        query('hora').matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    ] as ValidationChain[],
    validate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { fecha, hora } = req.query as { fecha: string; hora: string };
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

/**
 * GET /api/appointments/confirm/:token - Confirmar vía token (Público)
 */
router.get('/confirm/:token', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appointment = await AppointmentService.confirmAppointment(req.params.token, true);
        res.json({ success: true, message: 'Cita confirmada exitosamente', data: appointment });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/appointments/:id - Obtener detalles
 */
router.get('/:id',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const appointment = await AppointmentService.getAppointment(req.params.id);
            res.json({ success: true, data: appointment });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/appointments - Crear nueva cita
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
    ] as ValidationChain[],
    validate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
 * PUT /api/appointments/:id/confirm - Confirmar cita (Admin)
 */
router.put('/:id/confirm',
    authenticateToken,
    requireRole(['admin', 'director', 'coordinador']),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const appointment = await AppointmentService.confirmAppointment(req.params.id);
            res.json({ success: true, message: 'Cita confirmada', data: appointment });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/appointments/:id - Cancelar cita
 */
router.delete('/:id',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { motivo } = req.body as { motivo?: string };
            await AppointmentService.cancelAppointment(req.params.id, motivo || 'Cancelada por usuario');
            res.json({ success: true, message: 'Cita cancelada' });
        } catch (error) {
            next(error);
        }
    }
);

// @ts-ignore
export = router;

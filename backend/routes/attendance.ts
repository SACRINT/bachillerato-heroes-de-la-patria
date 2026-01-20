/**
 * 📊 RUTAS DE ASISTENCIA (ATTENDANCE) - TypeScript
 * Sistema de gestión de asistencia escolar
 * Migrado: 19 Enero 2026
 */

import express, { Request, Response, Router } from 'express';
import { body, query, validationResult, ValidationChain } from 'express-validator';

// ✅ TypeScript compatible imports
const { authenticateToken, requireRole } = require('../middleware/auth');
const AttendanceService = require('../services/attendance.service');
const debugLog = require('../utils/debug-logger');
const { sanitizeError } = require('../middleware/errorHandler');

const router: Router = express.Router();

// Interfaces
interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        role: string;
        email: string;
    };
}

// ============================================
// ENDPOINTS DE ASISTENCIA
// ============================================

/**
 * GET /api/attendance
 * Listar asistencias con filtros
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const {
            estudiante_id,
            materia_id,
            fecha_inicio,
            fecha_fin,
            page = '1',
            limit = '20'
        } = req.query;

        const filters: any = {};

        if (estudiante_id) filters.estudiante_id = parseInt(estudiante_id as string);
        if (materia_id) filters.materia_id = parseInt(materia_id as string);
        if (fecha_inicio) filters.fecha_inicio = fecha_inicio;
        if (fecha_fin) filters.fecha_fin = fecha_fin;

        filters.page = parseInt(page as string);
        filters.limit = parseInt(limit as string);

        const attendances = await AttendanceService.listAttendances(filters);

        res.json({
            success: true,
            data: attendances,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: attendances.length
            }
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error listando asistencias', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencias',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

/**
 * GET /api/attendance/student/:studentId
 * Obtener asistencias de un estudiante
 */
router.get('/student/:studentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { fecha_inicio, fecha_fin, materia_id } = req.query;

        const filters: any = {};
        if (fecha_inicio) filters.fecha_inicio = fecha_inicio;
        if (fecha_fin) filters.fecha_fin = fecha_fin;
        if (materia_id) filters.materia_id = parseInt(materia_id as string);

        const attendances = await AttendanceService.getStudentAttendances(
            parseInt(studentId),
            filters
        );

        res.json({
            success: true,
            data: attendances
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error obteniendo asistencias de estudiante', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencias del estudiante'
        });
    }
});

/**
 * GET /api/attendance/class/:classId
 * Obtener asistencia de una clase en una fecha específica
 */
router.get('/class/:classId', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;
        const { fecha } = req.query;

        const date = fecha ? new Date(fecha as string) : new Date();

        const result = await AttendanceService.getClassAttendance(
            parseInt(classId),
            date
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error obteniendo asistencia de clase', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencia de la clase'
        });
    }
});

/**
 * GET /api/attendance/report/:studentId
 * Generar reporte de asistencia de un estudiante
 */
router.get('/report/:studentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { fecha_inicio, fecha_fin } = req.query;

        // Default: último mes
        const endDate = fecha_fin ? new Date(fecha_fin as string) : new Date();
        const startDate = fecha_inicio ?
            new Date(fecha_inicio as string) :
            new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const report = await AttendanceService.generateAttendanceReport(
            parseInt(studentId),
            startDate,
            endDate
        );

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error generando reporte de asistencia', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de asistencia'
        });
    }
});

/**
 * POST /api/attendance
 * Registrar asistencia individual
 */
router.post('/', authenticateToken, requireRole(['docente', 'admin']), [
    body('estudiante_id').isInt({ min: 1 }).withMessage('ID de estudiante requerido'),
    body('materia_id').isInt({ min: 1 }).withMessage('ID de materia requerido'),
    body('fecha').isISO8601().withMessage('Fecha válida requerida'),
    body('presente').isBoolean().withMessage('Estado de asistencia requerido')
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const { estudiante_id, materia_id, fecha, presente, justificada, motivo, comentarios } = req.body;

        const attendance = await AttendanceService.markAttendance({
            estudiante_id,
            materia_id,
            fecha,
            presente,
            justificada: justificada || false,
            motivo: motivo || null,
            comentarios: comentarios || null,
            registrado_por: authReq.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Asistencia registrada exitosamente',
            data: attendance
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error registrando asistencia', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencia'
        });
    }
});

/**
 * POST /api/attendance/bulk
 * Registrar asistencia masiva (lista de clase)
 */
router.post('/bulk', authenticateToken, requireRole(['docente', 'admin']), [
    body('attendances').isArray({ min: 1 }).withMessage('Lista de asistencias requerida'),
    body('attendances.*.estudiante_id').isInt({ min: 1 }),
    body('attendances.*.materia_id').isInt({ min: 1 }),
    body('attendances.*.presente').isBoolean()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const { attendances } = req.body;

        const result = await AttendanceService.markBulkAttendance(
            attendances,
            authReq.user.id
        );

        res.status(201).json({
            success: true,
            message: `${result.stats.total} asistencias registradas`,
            data: result
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error registrando asistencias masivas', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencias'
        });
    }
});

/**
 * PUT /api/attendance/:id
 * Actualizar registro de asistencia
 */
router.put('/:id', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { id } = req.params;
        const { presente, justificada, motivo, comentarios } = req.body;

        const attendance = await AttendanceService.updateAttendance(
            parseInt(id),
            { presente, justificada, motivo, comentarios },
            authReq.user.id
        );

        res.json({
            success: true,
            message: 'Asistencia actualizada',
            data: attendance
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error actualizando asistencia', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al actualizar asistencia'
        });
    }
});

/**
 * POST /api/attendance/:id/justify
 * Justificar una falta
 */
router.post('/:id/justify', authenticateToken, requireRole(['docente', 'admin', 'padre']), [
    body('motivo').notEmpty().withMessage('Motivo de justificación requerido')
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const { id } = req.params;
        const { motivo } = req.body;

        const attendance = await AttendanceService.justifyAbsence(
            parseInt(id),
            motivo,
            authReq.user.id
        );

        res.json({
            success: true,
            message: 'Falta justificada exitosamente',
            data: attendance
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error justificando falta', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al justificar falta'
        });
    }
});

/**
 * GET /api/attendance/pattern/:studentId
 * Verificar patrón de ausentismo
 */
router.get('/pattern/:studentId', authenticateToken, requireRole(['docente', 'admin', 'orientador']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;

        const pattern = await AttendanceService.checkAbsenteeismPattern(parseInt(studentId));

        res.json({
            success: true,
            data: pattern
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error verificando patrón de ausentismo', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al verificar patrón de ausentismo'
        });
    }
});

/**
 * DELETE /api/attendance/:id
 * Eliminar registro de asistencia
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { id } = req.params;

        await AttendanceService.deleteAttendance(parseInt(id), authReq.user.id);

        res.json({
            success: true,
            message: 'Registro de asistencia eliminado'
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error eliminando asistencia', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al eliminar registro de asistencia'
        });
    }
});

/**
 * GET /api/attendance/today
 * Obtener asistencia del día actual (para dashboard)
 */
router.get('/today', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const today = new Date().toISOString().split('T')[0];

        const filters = {
            fecha_inicio: today,
            fecha_fin: today,
            docente_id: authReq.user.role === 'docente' ? authReq.user.id : undefined
        };

        const attendances = await AttendanceService.listAttendances(filters);

        // Calculate stats
        const total = attendances.length;
        const present = attendances.filter((a: any) => a.presente).length;
        const absent = total - present;
        const rate = total > 0 ? (present / total * 100).toFixed(1) : '0';

        res.json({
            success: true,
            data: {
                date: today,
                attendances,
                stats: {
                    total,
                    present,
                    absent,
                    attendanceRate: rate
                }
            }
        });
    } catch (error) {
        debugLog.error('ATTENDANCE', 'Error obteniendo asistencia del día', sanitizeError(error as Error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencia del día'
        });
    }
});

export default router;

/**
 * Grades Validation Routes
 * API para validación y aprobación de calificaciones
 */

import { Router, Request, Response } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import GradesValidationService from '../services/grades-validation.service';
const { authenticateToken, requireRole } = require('../middleware/auth');
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        email: string;
        role: string;
    };
}

const router = Router();

// ============================================
// VALIDACIÓN DE CALIFICACIONES
// ============================================

/**
 * GET /api/grades-validation/pending
 * Obtener calificaciones pendientes de validación
 */
router.get('/pending', authenticateToken, requireRole(['coordinador', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const pendingGrades = await GradesValidationService.getPendingValidations(authReq.user.id);

        res.json({
            success: true,
            data: pendingGrades,
            total: pendingGrades.length
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error obteniendo calificaciones pendientes', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al obtener calificaciones pendientes' });
    }
});

/**
 * POST /api/grades-validation/validate
 * Validar (aprobar o rechazar) una calificación
 */
router.post('/validate', authenticateToken, requireRole(['coordinador', 'admin']), [
    body('calificacion_id').isInt({ min: 1 }),
    body('estado').isIn(['aprobado', 'rechazado']),
    body('comentarios').optional().isString()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const { calificacion_id, estado, comentarios } = req.body;

        await GradesValidationService.validateGrade({
            calificacion_id,
            validador_id: authReq.user.id,
            estado,
            comentarios
        });

        res.json({
            success: true,
            message: `Calificación ${estado === 'aprobado' ? 'aprobada' : 'rechazada'} exitosamente`
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error validando calificación', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al validar calificación' });
    }
});

/**
 * POST /api/grades-validation/bulk-validate
 * Validar múltiples calificaciones en lote
 */
router.post('/bulk-validate', authenticateToken, requireRole(['coordinador', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { calificaciones, estado, comentarios } = req.body;

        if (!calificaciones || !Array.isArray(calificaciones)) {
            res.status(400).json({ success: false, message: 'Lista de calificaciones requerida' });
            return;
        }

        let validated = 0;
        let errors = 0;

        for (const id of calificaciones) {
            try {
                await GradesValidationService.validateGrade({
                    calificacion_id: id,
                    validador_id: authReq.user.id,
                    estado,
                    comentarios
                });
                validated++;
            } catch (e) {
                errors++;
                debugLog.warn('GRADES-VALIDATION', `Error validando calificación ${id}`);
            }
        }

        res.json({
            success: true,
            message: `${validated} calificaciones validadas exitosamente`,
            data: {
                validated,
                errors,
                total: calificaciones.length
            }
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error en validación masiva', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error en validación masiva' });
    }
});

/**
 * GET /api/grades-validation/audit/:calificacion_id
 * Obtener historial de auditoría de una calificación
 */
router.get('/audit/:calificacion_id', authenticateToken, requireRole(['docente', 'coordinador', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { calificacion_id } = req.params;
        const history = await GradesValidationService.getAuditHistory(parseInt(calificacion_id));

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error obteniendo auditoría', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al obtener historial de auditoría' });
    }
});

// ============================================
// PROMEDIOS Y ESTADÍSTICAS
// ============================================

/**
 * GET /api/grades-validation/average/student/:student_id
 * Calcular promedio de un estudiante
 */
router.get('/average/student/:student_id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { student_id } = req.params;
        const { periodo } = req.query;

        const promedio = await GradesValidationService.calculateStudentAverage(
            parseInt(student_id),
            periodo as string
        );

        res.json({
            success: true,
            data: {
                estudiante_id: parseInt(student_id),
                periodo: periodo || 'general',
                promedio: parseFloat(promedio.toFixed(2))
            }
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error calculando promedio', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al calcular promedio' });
    }
});

/**
 * GET /api/grades-validation/report/:periodo
 * Generar reporte de calificaciones por periodo
 */
router.get('/report/:periodo', authenticateToken, requireRole(['coordinador', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { periodo } = req.params;
        const { grupo_id } = req.query;

        const report = await GradesValidationService.generatePeriodReport(
            periodo,
            grupo_id ? parseInt(grupo_id as string) : undefined
        );

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error generando reporte', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al generar reporte de calificaciones' });
    }
});

// ============================================
// ALERTAS DE ESTUDIANTES EN RIESGO
// ============================================

/**
 * GET /api/grades-validation/alerts
 * Obtener alertas activas de estudiantes en riesgo
 */
router.get('/alerts', authenticateToken, requireRole(['docente', 'coordinador', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { estudiante_id, severidad } = req.query;

        const filters: any = {};
        if (estudiante_id) filters.estudiante_id = parseInt(estudiante_id as string);
        if (severidad) filters.severidad = severidad as string;

        const alerts = await GradesValidationService.getActiveAlerts(filters);

        res.json({
            success: true,
            data: alerts,
            total: alerts.length
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error obteniendo alertas', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al obtener alertas' });
    }
});

/**
 * POST /api/grades-validation/alerts/check/:student_id
 * Verificar y generar alertas para un estudiante específico
 */
router.post('/alerts/check/:student_id', authenticateToken, requireRole(['coordinador', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { student_id } = req.params;

        await GradesValidationService.checkAndCreateRiskAlerts(parseInt(student_id));

        res.json({
            success: true,
            message: 'Alertas verificadas y actualizadas'
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error verificando alertas', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al verificar alertas' });
    }
});

/**
 * POST /api/grades-validation/alerts/dismiss/:alert_id
 * Descartar/cerrar una alerta
 */
router.post('/alerts/dismiss/:alert_id', authenticateToken, requireRole(['coordinador', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { alert_id } = req.params;
        const { motivo } = req.body;

        const { executeQuery } = require('../config/database');

        await executeQuery(`
            UPDATE alertas_estudiantes
            SET estado = 'cerrada', motivo_cierre = $1, fecha_cierre = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [motivo || 'Desestimada por coordinador', parseInt(alert_id)]);

        res.json({
            success: true,
            message: 'Alerta cerrada exitosamente'
        });
    } catch (error) {
        debugLog.error('GRADES-VALIDATION', 'Error cerrando alerta', sanitizeError(error as Error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al cerrar alerta' });
    }
});

export default router;

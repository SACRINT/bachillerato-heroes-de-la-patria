/**
 * Teacher Portal Extended Routes
 * Rutas adicionales para planeación, tareas, comunicación y reportes
 */

import { Router, Request, Response } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
const { authenticateToken, requireRole } = require('../middleware/auth');
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

import LessonPlanningService from '../services/lesson-planning.service';
import AssignmentService from '../services/assignment.service';
import MassCommunicationService from '../services/mass-communication.service';
import AutomatedReportsService from '../services/automated-reports.service';

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        email: string;
        role: string;
    };
}

const router = Router();

// ============================================
// PLANEACIÓN DE CLASES
// ============================================

/**
 * POST /api/teachers-portal-ext/lessons/plan
 * Crear nueva planeación de clase
 */
router.post('/lessons/plan', authenticateToken, requireRole(['docente', 'admin']), [
    body('materia_id').isInt({ min: 1 }),
    body('fecha').isISO8601(),
    body('unidad').notEmpty(),
    body('tema').notEmpty(),
    body('objetivos').isArray({ min: 1 }),
    body('contenido').notEmpty()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        // Resolve Docente ID
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]) as any[];
        const docenteId = docenteRes[0]?.id || 0;

        const lessonPlan = await LessonPlanningService.createLessonPlan({
            ...req.body,
            docente_id: docenteId
        });

        res.status(201).json({
            success: true,
            message: 'Planeación creada exitosamente',
            data: lessonPlan
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error creando planeación', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al crear planeación' });
    }
});

/**
 * GET /api/teachers-portal-ext/lessons/plans
 * Obtener planeaciones del docente
 */
router.get('/lessons/plans', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { materia_id, fecha_inicio, fecha_fin, status } = req.query;

        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]) as any[];
        const docenteId = docenteRes[0]?.id || 0;

        const filters: any = {};
        if (materia_id) filters.materia_id = parseInt(materia_id as string);
        if (fecha_inicio) filters.fecha_inicio = new Date(fecha_inicio as string);
        if (fecha_fin) filters.fecha_fin = new Date(fecha_fin as string);
        if (status) filters.status = status as string;

        const plans = await LessonPlanningService.getTeacherLessonPlans(docenteId, filters);

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo planeaciones', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener planeaciones' });
    }
});

/**
 * GET /api/teachers-portal-ext/lessons/weekly
 * Obtener planeaciones de la semana
 */
router.get('/lessons/weekly', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]) as any[];
        const docenteId = docenteRes[0]?.id || 0;

        const plans = await LessonPlanningService.getWeeklyPlans(docenteId);

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo planeaciones semanales', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener planeaciones de la semana' });
    }
});

/**
 * PUT /api/teachers-portal-ext/lessons/plan/:id
 * Actualizar planeación
 */
router.put('/lessons/plan/:id', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updated = await LessonPlanningService.updateLessonPlan(parseInt(id), req.body);

        res.json({
            success: true,
            message: 'Planeación actualizada',
            data: updated
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error actualizando planeación', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al actualizar planeación' });
    }
});

/**
 * POST /api/teachers-portal-ext/lessons/duplicate/:id
 * Duplicar planeación
 */
router.post('/lessons/duplicate/:id', authenticateToken, requireRole(['docente', 'admin']), [
    body('nueva_fecha').isISO8601()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nueva_fecha } = req.body;

        const duplicated = await LessonPlanningService.duplicateLessonPlan(
            parseInt(id),
            new Date(nueva_fecha)
        );

        res.json({
            success: true,
            message: 'Planeación duplicada',
            data: duplicated
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error duplicando planeación', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al duplicar planeación' });
    }
});

// ============================================
// ASIGNACIÓN DE TAREAS
// ============================================

/**
 * POST /api/teachers-portal-ext/assignments
 * Crear nueva tarea
 */
router.post('/assignments', authenticateToken, requireRole(['docente', 'admin']), [
    body('materia_id').isInt({ min: 1 }),
    body('titulo').notEmpty(),
    body('descripcion').notEmpty(),
    body('tipo').isIn(['tarea', 'proyecto', 'investigacion', 'practica', 'examen']),
    body('fecha_entrega').isISO8601(),
    body('puntaje_maximo').isFloat({ min: 0 })
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]) as any[];
        const docenteId = docenteRes[0]?.id || 0;

        const assignment = await AssignmentService.createAssignment({
            ...req.body,
            docente_id: docenteId
        });

        res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            data: assignment
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error creando tarea', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al crear tarea' });
    }
});

/**
 * GET /api/teachers-portal-ext/assignments
 * Obtener tareas del docente
 */
router.get('/assignments', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { materia_id, tipo, status } = req.query;

        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]) as any[];
        const docenteId = docenteRes[0]?.id || 0;

        const filters: any = {};
        if (materia_id) filters.materia_id = parseInt(materia_id as string);
        if (tipo) filters.tipo = tipo as string;
        if (status) filters.status = status as string;

        const assignments = await AssignmentService.getTeacherAssignments(docenteId, filters);

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo tareas', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener tareas' });
    }
});

/**
 * GET /api/teachers-portal-ext/assignments/:id/submissions
 * Obtener entregas de una tarea
 */
router.get('/assignments/:id/submissions', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const submissions = await AssignmentService.getAssignmentSubmissions(parseInt(id));

        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo entregas', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener entregas' });
    }
});

/**
 * POST /api/teachers-portal-ext/assignments/submissions/:id/grade
 * Calificar entrega
 */
router.post('/assignments/submissions/:id/grade', authenticateToken, requireRole(['docente', 'admin']), [
    body('calificacion').isFloat({ min: 0 }),
    body('retroalimentacion').optional()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { calificacion, retroalimentacion } = req.body;

        const graded = await AssignmentService.gradeSubmission(
            parseInt(id),
            calificacion,
            retroalimentacion
        );

        res.json({
            success: true,
            message: 'Entrega calificada',
            data: graded
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error calificando entrega', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al calificar entrega' });
    }
});

/**
 * POST /api/teachers-portal-ext/assignments/:id/publish
 * Publicar tarea
 */
router.post('/assignments/:id/publish', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const published = await AssignmentService.publishAssignment(parseInt(id));

        res.json({
            success: true,
            message: 'Tarea publicada',
            data: published
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error publicando tarea', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al publicar tarea' });
    }
});

/**
 * POST /api/teachers-portal-ext/assignments/:id/remind
 * Enviar recordatorio
 */
router.post('/assignments/:id/remind', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const sent = await AssignmentService.sendReminders(parseInt(id));

        res.json({
            success: true,
            message: `${sent} recordatorios enviados`
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error enviando recordatorios', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al enviar recordatorios' });
    }
});

// ============================================
// COMUNICACIÓN MASIVA
// ============================================

/**
 * POST /api/teachers-portal-ext/communication/mass-message
 * Crear mensaje masivo
 */
router.post('/communication/mass-message', authenticateToken, requireRole(['docente', 'admin']), [
    body('destinatarios_tipo').isIn(['padres', 'estudiantes', 'ambos', 'grupo_especifico']),
    body('asunto').notEmpty(),
    body('mensaje').notEmpty(),
    body('tipo').isIn(['aviso', 'urgente', 'recordatorio', 'felicitacion', 'citatorio']),
    body('canales').isArray({ min: 1 })
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]) as any[];
        const docenteId = docenteRes[0]?.id || 0;

        const message = await MassCommunicationService.createMassMessage({
            ...req.body,
            docente_id: docenteId
        });

        res.status(201).json({
            success: true,
            message: 'Mensaje masivo creado',
            data: message
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error creando mensaje', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al crear mensaje masivo' });
    }
});

/**
 * POST /api/teachers-portal-ext/communication/:id/send
 * Enviar mensaje masivo
 */
router.post('/communication/:id/send', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await MassCommunicationService.sendMassMessage(parseInt(id));

        res.json({
            success: true,
            message: 'Mensaje enviado',
            data: result
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error enviando mensaje', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al enviar mensaje masivo' });
    }
});

/**
 * GET /api/teachers-portal-ext/communication/messages
 * Obtener mensajes masivos
 */
router.get('/communication/messages', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { materia_id, status } = req.query;

        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]) as any[];
        const docenteId = docenteRes[0]?.id || 0;

        const filters: any = {};
        if (materia_id) filters.materia_id = parseInt(materia_id as string);
        if (status) filters.status = status as string;

        const messages = await MassCommunicationService.getTeacherMessages(docenteId, filters);

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo mensajes', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener mensajes' });
    }
});

/**
 * GET /api/teachers-portal-ext/communication/:id/stats
 * Obtener estadísticas de entrega
 */
router.get('/communication/:id/stats', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const stats = await MassCommunicationService.getMessageStats(parseInt(id));

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo estadísticas', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});

// ============================================
// REPORTES AUTOMÁTICOS
// ============================================

/**
 * GET /api/teachers-portal-ext/reports/grades/:materia_id/:periodo
 * Generar reporte de calificaciones
 */
router.get('/reports/grades/:materia_id/:periodo', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { materia_id, periodo } = req.params;

        const pdf = await AutomatedReportsService.generateGradesReport(
            authReq.user.id,
            parseInt(materia_id),
            periodo
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=calificaciones_${materia_id}_${periodo}.pdf`);
        res.send(pdf);
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error generando reporte', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al generar reporte de calificaciones' });
    }
});

/**
 * GET /api/teachers-portal-ext/reports/performance/:materia_id
 * Generar reporte de rendimiento
 */
router.get('/reports/performance/:materia_id', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { materia_id } = req.params;

        const report = await AutomatedReportsService.generatePerformanceReport(
            authReq.user.id,
            parseInt(materia_id)
        );

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error generando reporte', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al generar reporte de rendimiento' });
    }
});

/**
 * POST /api/teachers-portal-ext/reports/configure
 * Configurar reporte automático
 */
router.post('/reports/configure', authenticateToken, requireRole(['docente', 'admin']), [
    body('tipo_reporte').isIn(['calificaciones', 'asistencia', 'rendimiento', 'completo']),
    body('periodo').notEmpty(),
    body('frecuencia').isIn(['semanal', 'quincenal', 'mensual']),
    body('destinatarios').isArray({ min: 1 }),
    body('formato').isIn(['pdf', 'excel', 'ambos'])
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const config = await AutomatedReportsService.configureAutomaticReport({
            ...req.body,
            docente_id: authReq.user.id
        });

        res.json({
            success: true,
            message: 'Reporte automático configurado',
            data: config
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error configurando reporte', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al configurar reporte automático' });
    }
});

/**
 * GET /api/teachers-portal-ext/reports/configs
 * Obtener configuraciones de reportes
 */
router.get('/reports/configs', authenticateToken, requireRole(['docente', 'admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const configs = await AutomatedReportsService.getTeacherReportConfigs(authReq.user.id);

        res.json({
            success: true,
            data: configs
        });
    } catch (error) {
        debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo configuraciones', sanitizeError(error as Error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener configuraciones de reportes' });
    }
});

export default router;

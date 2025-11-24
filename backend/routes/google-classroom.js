/**
 * GOOGLE CLASSROOM API ROUTES - Backend para integración con Google Classroom
 *
 * Este módulo maneja las rutas de API para la integración con Google Classroom,
 * incluyendo sincronización de datos, autenticación y almacenamiento.
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const { body, validationResult } = require('express-validator');
const { getGoogleClassroomService } = require('../services/googleClassroomService');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Obtener instancia del servicio
const googleClassroomService = getGoogleClassroomService();

/**
 * POST /api/google-classroom/sync
 * Sincronizar datos de Google Classroom con el sistema BGE
 */
router.post('/sync',
    authenticateToken,
    [
        body('user').notEmpty().withMessage('User data is required'),
        body('courses').isArray().withMessage('Courses must be an array'),
        body('timestamp').isISO8601().withMessage('Valid timestamp required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { user, courses, timestamp } = req.body;

            debugLog.log('GOOGLE_CLASSROOM', '🔄 [GOOGLE-CLASSROOM-API] Sincronizando datos para usuario:', user.email);

            // Sincronizar datos con el servicio
            const result = await googleClassroomService.syncUserData(user, courses, timestamp);

            res.json({
                success: true,
                message: 'Sincronización completada exitosamente',
                data: result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error en sincronización:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error durante la sincronización',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/google-classroom/courses/:userId
 * Obtener cursos sincronizados de un usuario
 */
router.get('/courses/:userId',
    authenticateToken,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { role, active } = req.query;

            debugLog.log('GOOGLE_CLASSROOM', '📚 [GOOGLE-CLASSROOM-API] Obteniendo cursos para usuario:', userId);

            const courses = await googleClassroomService.getUserCourses(userId, { role, active });

            res.json({
                success: true,
                data: courses,
                count: courses.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error obteniendo cursos:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error obteniendo cursos',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/google-classroom/assignments/:courseId
 * Obtener tareas de un curso específico
 */
router.get('/assignments/:courseId',
    authenticateToken,
    async (req, res) => {
        try {
            const { courseId } = req.params;
            const { status, limit = 50 } = req.query;

            debugLog.log('GOOGLE_CLASSROOM', '📝 [GOOGLE-CLASSROOM-API] Obteniendo tareas del curso:', courseId);

            const assignments = await googleClassroomService.getCourseAssignments(courseId, {
                status,
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: assignments,
                count: assignments.length,
                courseId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error obteniendo tareas:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error obteniendo tareas',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * POST /api/google-classroom/assignments
 * Crear nueva tarea en Google Classroom
 */
router.post('/assignments',
    authenticateToken,
    [
        body('courseId').notEmpty().withMessage('Course ID is required'),
        body('title').isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
        body('description').optional().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
        body('dueDate').optional().isISO8601().withMessage('Valid due date required'),
        body('maxPoints').optional().isInt({ min: 0, max: 1000 }).withMessage('Max points must be 0-1000')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const assignmentData = req.body;

            debugLog.log('GOOGLE_CLASSROOM', '📝 [GOOGLE-CLASSROOM-API] Creando nueva tarea:', assignmentData.title);

            const assignment = await googleClassroomService.createAssignment(assignmentData);

            res.status(201).json({
                success: true,
                message: 'Tarea creada exitosamente',
                data: assignment,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error creando tarea:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error creando tarea',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/google-classroom/grades/:courseId/:assignmentId
 * Obtener calificaciones de una tarea específica
 */
router.get('/grades/:courseId/:assignmentId',
    authenticateToken,
    async (req, res) => {
        try {
            const { courseId, assignmentId } = req.params;

            debugLog.log('GOOGLE_CLASSROOM', '📊 [GOOGLE-CLASSROOM-API] Obteniendo calificaciones:', { courseId, assignmentId });

            const grades = await googleClassroomService.getAssignmentGrades(courseId, assignmentId);

            res.json({
                success: true,
                data: grades,
                count: grades.length,
                courseId,
                assignmentId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error obteniendo calificaciones:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error obteniendo calificaciones',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * PUT /api/google-classroom/grades
 * Actualizar calificación de un estudiante
 */
router.put('/grades',
    authenticateToken,
    [
        body('courseId').notEmpty().withMessage('Course ID is required'),
        body('assignmentId').notEmpty().withMessage('Assignment ID is required'),
        body('studentId').notEmpty().withMessage('Student ID is required'),
        body('grade').isFloat({ min: 0, max: 100 }).withMessage('Grade must be 0-100')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { courseId, assignmentId, studentId, grade, feedback } = req.body;

            debugLog.log('GOOGLE_CLASSROOM', '📊 [GOOGLE-CLASSROOM-API] Actualizando calificación:', {
                courseId, assignmentId, studentId, grade
            });

            const result = await googleClassroomService.updateGrade(
                courseId,
                assignmentId,
                studentId,
                grade,
                feedback
            );

            res.json({
                success: true,
                message: 'Calificación actualizada exitosamente',
                data: result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error actualizando calificación:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error actualizando calificación',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/google-classroom/stats/:userId
 * Obtener estadísticas del usuario de Google Classroom
 */
router.get('/stats/:userId',
    authenticateToken,
    async (req, res) => {
        try {
            const { userId } = req.params;

            debugLog.log('GOOGLE_CLASSROOM', '📊 [GOOGLE-CLASSROOM-API] Obteniendo estadísticas para usuario:', userId);

            const stats = await googleClassroomService.getUserStats(userId);

            res.json({
                success: true,
                data: stats,
                userId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error obteniendo estadísticas:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * POST /api/google-classroom/webhook
 * Webhook para notificaciones de Google Classroom
 */
router.post('/webhook',
    [
        body('eventType').notEmpty().withMessage('Event type is required'),
        body('data').notEmpty().withMessage('Event data is required')
    ],
    async (req, res) => {
        try {
            const { eventType, data, timestamp } = req.body;

            debugLog.log('GOOGLE_CLASSROOM', '🔔 [GOOGLE-CLASSROOM-API] Webhook recibido:', eventType);

            // Procesar evento del webhook
            const result = await googleClassroomService.processWebhookEvent(eventType, data, timestamp);

            res.json({
                success: true,
                message: 'Webhook procesado exitosamente',
                eventType,
                processedAt: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error procesando webhook:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error procesando webhook',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * DELETE /api/google-classroom/sync/:userId
 * Eliminar datos sincronizados de un usuario
 */
router.delete('/sync/:userId',
    authenticateToken,
    async (req, res) => {
        try {
            const { userId } = req.params;

            debugLog.log('GOOGLE_CLASSROOM', '🗑️ [GOOGLE-CLASSROOM-API] Eliminando datos sincronizados para usuario:', userId);

            const result = await googleClassroomService.deleteSyncedData(userId);

            res.json({
                success: true,
                message: 'Datos eliminados exitosamente',
                userId,
                deletedRecords: result.deletedCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error eliminando datos:', sanitizeError(error, 'google-classroom'));

            res.status(500).json({
                success: false,
                message: 'Error eliminando datos',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/google-classroom/health
 * Verificar estado de la integración de Google Classroom
 */
router.get('/health', async (req, res) => {
    try {
        const healthCheck = await googleClassroomService.healthCheck();

        res.json({
            success: true,
            status: 'healthy',
            data: healthCheck,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        debugLog.error('GOOGLE_CLASSROOM', '❌ [GOOGLE-CLASSROOM-API] Error en health check:', sanitizeError(error, 'google-classroom'));

        res.status(503).json({
            success: false,
            status: 'unhealthy',
            message: 'Service unavailable',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
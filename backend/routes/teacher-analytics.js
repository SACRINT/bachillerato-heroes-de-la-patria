/**
 * 📊 TEACHER ANALYTICS ROUTES
 * API de analíticas avanzadas para docentes
 * FASE 2 - Semana 9-10
 */

const express = require('express');
const router = express.Router();
const { query, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const TeacherAnalyticsService = require('../services/TeacherAnalyticsService');

// Middleware de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: errors.array()
        });
    }
    next();
};

// Middleware para verificar rol de docente
const requireTeacher = (req, res, next) => {
    if (!['docente', 'admin', 'administrativo'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso solo para docentes'
        });
    }
    next();
};

// =====================================
// RESUMEN DE CLASE
// =====================================

/**
 * GET /api/teacher-analytics/overview
 * Obtiene resumen general de la clase
 */
router.get('/overview',
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        try {
            const overview = await TeacherAnalyticsService.getClassOverview(
                req.user.id,
                req.query.courseId ? parseInt(req.query.courseId) : null
            );

            res.json({
                success: true,
                data: overview
            });
        } catch (error) {
            console.error('[TEACHER-ANALYTICS] Error obteniendo overview:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener resumen'
            });
        }
    }
);

// =====================================
// ESTUDIANTES
// =====================================

/**
 * GET /api/teacher-analytics/students
 * Obtiene lista de estudiantes con métricas
 */
router.get('/students',
    authenticateToken,
    requireTeacher,
    [
        query('courseId').optional().isInt(),
        query('sortBy').optional().isIn(['name', 'level', 'xp', 'challenges', 'streak']),
        query('sortOrder').optional().isIn(['ASC', 'DESC']),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    async (req, res) => {
        try {
            const students = await TeacherAnalyticsService.getStudentsWithMetrics(
                req.user.id,
                {
                    courseId: req.query.courseId ? parseInt(req.query.courseId) : null,
                    sortBy: req.query.sortBy || 'name',
                    sortOrder: req.query.sortOrder || 'ASC',
                    limit: parseInt(req.query.limit) || 50,
                    offset: parseInt(req.query.offset) || 0
                }
            );

            res.json({
                success: true,
                data: students,
                pagination: {
                    limit: parseInt(req.query.limit) || 50,
                    offset: parseInt(req.query.offset) || 0,
                    count: students.length
                }
            });
        } catch (error) {
            console.error('[TEACHER-ANALYTICS] Error obteniendo estudiantes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estudiantes'
            });
        }
    }
);

/**
 * GET /api/teacher-analytics/students/:id
 * Obtiene detalles de un estudiante específico
 */
router.get('/students/:id',
    authenticateToken,
    requireTeacher,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const student = await TeacherAnalyticsService.getStudentDetails(
                req.user.id,
                parseInt(req.params.id)
            );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante no encontrado'
                });
            }

            res.json({
                success: true,
                data: student
            });
        } catch (error) {
            console.error('[TEACHER-ANALYTICS] Error obteniendo detalles:', error);

            if (error.message.includes('No tienes acceso')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener detalles del estudiante'
            });
        }
    }
);

// =====================================
// REPORTES
// =====================================

/**
 * GET /api/teacher-analytics/reports/progress
 * Genera reporte de progreso de la clase
 */
router.get('/reports/progress',
    authenticateToken,
    requireTeacher,
    [
        query('courseId').optional().isInt(),
        query('dateRange').optional().matches(/^\d+d$/)
    ],
    validate,
    async (req, res) => {
        try {
            const report = await TeacherAnalyticsService.generateClassProgressReport(
                req.user.id,
                req.query.courseId ? parseInt(req.query.courseId) : null,
                req.query.dateRange || '30d'
            );

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('[TEACHER-ANALYTICS] Error generando reporte:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte'
            });
        }
    }
);

/**
 * GET /api/teacher-analytics/reports/trends
 * Obtiene tendencias de la clase
 */
router.get('/reports/trends',
    authenticateToken,
    requireTeacher,
    [
        query('courseId').optional().isInt(),
        query('weeks').optional().isInt({ min: 1, max: 12 })
    ],
    validate,
    async (req, res) => {
        try {
            const trends = await TeacherAnalyticsService.getClassTrends(
                req.user.id,
                req.query.courseId ? parseInt(req.query.courseId) : null,
                parseInt(req.query.weeks) || 4
            );

            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            console.error('[TEACHER-ANALYTICS] Error obteniendo tendencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tendencias'
            });
        }
    }
);

// =====================================
// ALERTAS
// =====================================

/**
 * GET /api/teacher-analytics/alerts
 * Obtiene alertas sobre estudiantes
 */
router.get('/alerts',
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        try {
            const alerts = await TeacherAnalyticsService.getStudentAlerts(
                req.user.id,
                req.query.courseId ? parseInt(req.query.courseId) : null
            );

            res.json({
                success: true,
                data: alerts,
                summary: {
                    total: alerts.length,
                    byType: {
                        inactive: alerts.filter(a => a.type === 'inactive').length,
                        streak_broken: alerts.filter(a => a.type === 'streak_broken').length,
                        high_performer: alerts.filter(a => a.type === 'high_performer').length
                    }
                }
            });
        } catch (error) {
            console.error('[TEACHER-ANALYTICS] Error obteniendo alertas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener alertas'
            });
        }
    }
);

// =====================================
// COMPARATIVAS
// =====================================

/**
 * GET /api/teacher-analytics/compare/courses
 * Compara rendimiento entre cursos
 */
router.get('/compare/courses',
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        try {
            const comparison = await TeacherAnalyticsService.compareCourses(req.user.id);

            res.json({
                success: true,
                data: comparison
            });
        } catch (error) {
            console.error('[TEACHER-ANALYTICS] Error comparando cursos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al comparar cursos'
            });
        }
    }
);

// =====================================
// EXPORTACIÓN
// =====================================

/**
 * GET /api/teacher-analytics/export/students
 * Exporta datos de estudiantes (CSV format)
 */
router.get('/export/students',
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        try {
            const students = await TeacherAnalyticsService.getStudentsWithMetrics(
                req.user.id,
                {
                    courseId: req.query.courseId ? parseInt(req.query.courseId) : null,
                    limit: 1000
                }
            );

            // Convertir a CSV
            const headers = ['Nombre', 'Email', 'Nivel', 'XP', 'IACoins', 'Retos', 'Racha'];
            const rows = students.map(s => [
                `${s.nombre} ${s.apellido_paterno}`,
                s.email,
                s.level,
                s.xp,
                s.iacoins,
                s.challenges_completed,
                s.current_streak
            ]);

            const csv = [headers, ...rows]
                .map(row => row.join(','))
                .join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=estudiantes.csv');
            res.send(csv);
        } catch (error) {
            console.error('[TEACHER-ANALYTICS] Error exportando:', error);
            res.status(500).json({
                success: false,
                message: 'Error al exportar datos'
            });
        }
    }
);

module.exports = router;

/**
 * 📊 RUTAS DE ANÁLISIS DE CALIFICACIONES - Sistema Avanzado
 * Endpoints para análisis estadísticos y reportes académicos
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');
const { logger } = require('../middleware/logger');
const router = express.Router();

// Obtener servicio de análisis de calificaciones
function getGradesAnalyticsService() {
    try {
        const { getGradesAnalyticsService } = require('../services/gradesAnalyticsService');
        return getGradesAnalyticsService();
    } catch (error) {
        console.error('❌ Error obteniendo servicio de análisis:', error.message);
        return null;
    }
}

// ============================================
// ANÁLISIS INDIVIDUAL DE ESTUDIANTES
// ============================================

/**
 * @swagger
 * /api/grades-analytics/student/{studentId}:
 *   get:
 *     summary: Obtener análisis completo de un estudiante
 *     tags: [Análisis de Calificaciones]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estudiante
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Período académico a analizar
 *     responses:
 *       200:
 *         description: Análisis de estudiante obtenido exitosamente
 *       404:
 *         description: Estudiante no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/student/:studentId', [
    query('period').optional().isString().withMessage('El período debe ser una cadena válida')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { studentId } = req.params;
        const { period } = req.query;

        const analyticsService = getGradesAnalyticsService();
        if (!analyticsService) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de análisis no disponible'
            });
        }

        const filters = {};
        if (period) filters.period = period;

        const analytics = await analyticsService.getStudentAnalytics(studentId, filters);

        res.json({
            success: true,
            message: 'Análisis de estudiante obtenido exitosamente',
            data: analytics
        });

    } catch (error) {
        console.error('❌ Error obteniendo análisis de estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo análisis de estudiante',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/grades-analytics/student/{studentId}/progress:
 *   get:
 *     summary: Obtener datos de progreso para gráficas
 *     tags: [Análisis de Calificaciones]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estudiante
 *     responses:
 *       200:
 *         description: Datos de progreso obtenidos exitosamente
 */
router.get('/student/:studentId/progress', async (req, res, next) => {
    try {
        const { studentId } = req.params;

        const analyticsService = getGradesAnalyticsService();
        if (!analyticsService) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de análisis no disponible'
            });
        }

        const analytics = await analyticsService.getStudentAnalytics(studentId);

        res.json({
            success: true,
            message: 'Datos de progreso obtenidos exitosamente',
            data: {
                progress_chart_data: analytics.progress_chart_data,
                performance_trend: analytics.performance_trend,
                overall_average: analytics.overall_average
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo datos de progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo datos de progreso',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ANÁLISIS GRUPALES Y REPORTES
// ============================================

/**
 * @swagger
 * /api/grades-analytics/group:
 *   get:
 *     summary: Obtener análisis grupal de calificaciones
 *     tags: [Análisis de Calificaciones]
 *     parameters:
 *       - in: query
 *         name: grupo
 *         schema:
 *           type: string
 *         description: Grupo a analizar (ej. 5A, 5B)
 *       - in: query
 *         name: semestre
 *         schema:
 *           type: integer
 *         description: Semestre a analizar
 *       - in: query
 *         name: materia
 *         schema:
 *           type: string
 *         description: Materia específica a analizar
 *     responses:
 *       200:
 *         description: Análisis grupal obtenido exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/group', [
    query('grupo').optional().isString().withMessage('El grupo debe ser una cadena válida'),
    query('semestre').optional().isInt({ min: 1, max: 6 }).withMessage('El semestre debe ser un número entre 1 y 6'),
    query('materia').optional().isString().withMessage('La materia debe ser una cadena válida')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { grupo, semestre, materia } = req.query;

        const analyticsService = getGradesAnalyticsService();
        if (!analyticsService) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de análisis no disponible'
            });
        }

        const filters = {};
        if (grupo) filters.grupo = grupo;
        if (semestre) filters.semestre = parseInt(semestre);
        if (materia) filters.materia = materia;

        const analytics = await analyticsService.getGroupAnalytics(filters);

        res.json({
            success: true,
            message: 'Análisis grupal obtenido exitosamente',
            data: analytics,
            filters_applied: filters
        });

    } catch (error) {
        console.error('❌ Error obteniendo análisis grupal:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo análisis grupal',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/grades-analytics/performance-distribution:
 *   get:
 *     summary: Obtener distribución de rendimiento
 *     tags: [Análisis de Calificaciones]
 *     parameters:
 *       - in: query
 *         name: grupo
 *         schema:
 *           type: string
 *         description: Grupo a analizar
 *     responses:
 *       200:
 *         description: Distribución de rendimiento obtenida exitosamente
 */
router.get('/performance-distribution', [
    query('grupo').optional().isString().withMessage('El grupo debe ser una cadena válida')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { grupo } = req.query;

        const analyticsService = getGradesAnalyticsService();
        if (!analyticsService) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de análisis no disponible'
            });
        }

        const filters = {};
        if (grupo) filters.grupo = grupo;

        const analytics = await analyticsService.getGroupAnalytics(filters);

        res.json({
            success: true,
            message: 'Distribución de rendimiento obtenida exitosamente',
            data: {
                performance_distribution: analytics.performance_distribution,
                group_statistics: analytics.group_statistics,
                total_students: analytics.total_students
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo distribución de rendimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo distribución de rendimiento',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/grades-analytics/subject-rankings:
 *   get:
 *     summary: Obtener ranking de materias por rendimiento
 *     tags: [Análisis de Calificaciones]
 *     responses:
 *       200:
 *         description: Ranking de materias obtenido exitosamente
 */
router.get('/subject-rankings', async (req, res, next) => {
    try {
        const analyticsService = getGradesAnalyticsService();
        if (!analyticsService) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de análisis no disponible'
            });
        }

        const analytics = await analyticsService.getGroupAnalytics({});

        res.json({
            success: true,
            message: 'Ranking de materias obtenido exitosamente',
            data: {
                subject_rankings: analytics.subject_rankings,
                subjects_analyzed: analytics.subjects_analyzed
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo ranking de materias:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo ranking de materias',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// REPORTES ESPECIALES
// ============================================

/**
 * @swagger
 * /api/grades-analytics/top-performers:
 *   get:
 *     summary: Obtener lista de mejores estudiantes
 *     tags: [Análisis de Calificaciones]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *         description: Número de estudiantes a mostrar
 *       - in: query
 *         name: grupo
 *         schema:
 *           type: string
 *         description: Filtrar por grupo específico
 *     responses:
 *       200:
 *         description: Lista de mejores estudiantes obtenida exitosamente
 */
router.get('/top-performers', [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('El límite debe ser un número entre 1 y 20'),
    query('grupo').optional().isString().withMessage('El grupo debe ser una cadena válida')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { limit = 10, grupo } = req.query;

        const analyticsService = getGradesAnalyticsService();
        if (!analyticsService) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de análisis no disponible'
            });
        }

        const filters = {};
        if (grupo) filters.grupo = grupo;

        const analytics = await analyticsService.getGroupAnalytics(filters);

        res.json({
            success: true,
            message: 'Lista de mejores estudiantes obtenida exitosamente',
            data: {
                top_performers: analytics.top_performers.slice(0, parseInt(limit)),
                total_analyzed: analytics.total_students
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo mejores estudiantes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo mejores estudiantes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/grades-analytics/struggling-students:
 *   get:
 *     summary: Obtener lista de estudiantes en riesgo académico
 *     tags: [Análisis de Calificaciones]
 *     parameters:
 *       - in: query
 *         name: grupo
 *         schema:
 *           type: string
 *         description: Filtrar por grupo específico
 *     responses:
 *       200:
 *         description: Lista de estudiantes en riesgo obtenida exitosamente
 */
router.get('/struggling-students', [
    query('grupo').optional().isString().withMessage('El grupo debe ser una cadena válida')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { grupo } = req.query;

        const analyticsService = getGradesAnalyticsService();
        if (!analyticsService) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de análisis no disponible'
            });
        }

        const filters = {};
        if (grupo) filters.grupo = grupo;

        const analytics = await analyticsService.getGroupAnalytics(filters);

        res.json({
            success: true,
            message: 'Lista de estudiantes en riesgo obtenida exitosamente',
            data: {
                struggling_students: analytics.struggling_students,
                total_at_risk: analytics.struggling_students.length,
                recommendations: analytics.recommendations
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estudiantes en riesgo:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estudiantes en riesgo',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// REPORTES PARA ADMINISTRACIÓN
// ============================================

/**
 * @swagger
 * /api/grades-analytics/institutional-report:
 *   get:
 *     summary: Obtener reporte institucional completo
 *     tags: [Análisis de Calificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reporte institucional obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 */
router.get('/institutional-report', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const analyticsService = getGradesAnalyticsService();
        if (!analyticsService) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de análisis no disponible'
            });
        }

        // Obtener análisis de todos los grupos
        const [generalAnalytics, grupo5A, grupo5B] = await Promise.all([
            analyticsService.getGroupAnalytics({}),
            analyticsService.getGroupAnalytics({ grupo: '5A' }),
            analyticsService.getGroupAnalytics({ grupo: '5B' })
        ]);

        const institutionalReport = {
            general_statistics: generalAnalytics,
            group_comparisons: {
                "5A": grupo5A,
                "5B": grupo5B
            },
            institutional_recommendations: generalAnalytics.recommendations,
            report_generated_at: new Date().toISOString(),
            academic_period: "2024-2025A"
        };

        res.json({
            success: true,
            message: 'Reporte institucional generado exitosamente',
            data: institutionalReport
        });

    } catch (error) {
        console.error('❌ Error generando reporte institucional:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando reporte institucional',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// MANEJO DE ERRORES
// ============================================

router.use((error, req, res, next) => {
    console.error('❌ Error en rutas de análisis de calificaciones:', error);

    res.status(500).json({
        success: false,
        message: 'Error interno en el análisis de calificaciones',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
});

module.exports = router;
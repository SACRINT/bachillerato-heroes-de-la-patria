/**
 * 🤖🗄️ RUTAS API INTEGRACIÓN AI-DATABASE BGE
 * Endpoints para conectar sistemas AI con datos reales de la base de datos
 *
 * Versión: 3.0 - Fase 3 IA Avanzada
 * Fecha: 26 Septiembre 2025
 */

const express = require('express');
const router = express.Router();
const { getAIDatabaseIntegration } = require('../services/aiDatabaseIntegration');
const { authenticateToken } = require('../middleware/auth');

// Obtener instancia del servicio
const aiDbIntegration = getAIDatabaseIntegration();

// ============================================
// ENDPOINTS DE DATOS CON ANÁLISIS AI
// ============================================

/**
 * GET /api/ai-database/health
 * Health check del servicio de integración AI-Database
 */
router.get('/health', async (req, res) => {
    try {
        const stats = aiDbIntegration.getStats();

        res.json({
            status: 'operational',
            service: 'AI-Database Integration',
            timestamp: new Date().toISOString(),
            version: '3.0',
            stats: stats,
            features: [
                'Student Data with AI Analysis',
                'Academic Performance Insights',
                'Teacher Effectiveness Analytics',
                'Predictive Performance Analysis',
                'Real-time Database Integration'
            ]
        });

    } catch (error) {
        console.error('❌ Error en health check AI-Database:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

/**
 * GET /api/ai-database/students
 * Obtener datos de estudiantes con análisis AI
 */
router.get('/students/:studentId?', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;

        console.log(`🎓 Obteniendo datos de estudiantes con AI: ${studentId || 'todos'}`);

        const studentData = await aiDbIntegration.getStudentData(
            studentId ? parseInt(studentId) : null
        );

        res.json({
            success: true,
            message: studentId ?
                `Datos del estudiante ${studentId} con análisis AI` :
                'Datos de estudiantes con análisis AI',
            data: studentData,
            count: Array.isArray(studentData) ? studentData.length : 1,
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error) {
        console.error('❌ Error obteniendo datos de estudiantes:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo datos de estudiantes',
            message: error.message
        });
    }
});

/**
 * GET /api/ai-database/academic
 * Obtener datos académicos con análisis AI
 */
router.get('/academic', authenticateToken, async (req, res) => {
    try {
        const { materia, grado } = req.query;

        console.log(`📚 Obteniendo datos académicos con AI: materia=${materia}, grado=${grado}`);

        const academicData = await aiDbIntegration.getAcademicData(materia, grado);

        res.json({
            success: true,
            message: 'Datos académicos con análisis AI',
            data: academicData,
            filters: { materia, grado },
            count: academicData.length,
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error) {
        console.error('❌ Error obteniendo datos académicos:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo datos académicos',
            message: error.message
        });
    }
});

/**
 * GET /api/ai-database/teachers
 * Obtener datos de docentes con análisis AI
 */
router.get('/teachers/:teacherId?', authenticateToken, async (req, res) => {
    try {
        const { teacherId } = req.params;

        console.log(`👨‍🏫 Obteniendo datos de docentes con AI: ${teacherId || 'todos'}`);

        const teacherData = await aiDbIntegration.getTeacherData(
            teacherId ? parseInt(teacherId) : null
        );

        res.json({
            success: true,
            message: teacherId ?
                `Datos del docente ${teacherId} con análisis AI` :
                'Datos de docentes con análisis AI',
            data: teacherData,
            count: Array.isArray(teacherData) ? teacherData.length : 1,
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error) {
        console.error('❌ Error obteniendo datos de docentes:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo datos de docentes',
            message: error.message
        });
    }
});

/**
 * POST /api/ai-database/performance-analysis
 * Análisis avanzado de rendimiento con IA
 */
router.post('/performance-analysis', authenticateToken, async (req, res) => {
    try {
        const filters = req.body || {};

        console.log(`📊 Ejecutando análisis de rendimiento con AI:`, filters);

        const performanceData = await aiDbIntegration.getPerformanceData(filters);

        res.json({
            success: true,
            message: 'Análisis de rendimiento con IA completado',
            data: performanceData,
            filters: filters,
            metadata: {
                hasAIAnalysis: !!performanceData.analysis,
                confidence: performanceData.analysis?.confidence,
                analysisTimestamp: performanceData.analysis?.timestamp
            },
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error) {
        console.error('❌ Error en análisis de rendimiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error en análisis de rendimiento',
            message: error.message
        });
    }
});

/**
 * GET /api/ai-database/recommendations/:studentId
 * Obtener recomendaciones personalizadas para estudiante
 */
router.get('/recommendations/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { includePerformance = true, includePredictive = true } = req.query;

        console.log(`💡 Generando recomendaciones AI para estudiante ${studentId}`);

        // Obtener datos del estudiante
        const studentData = await aiDbIntegration.getStudentData(parseInt(studentId));

        let performanceData = null;
        if (includePerformance === 'true') {
            performanceData = await aiDbIntegration.getPerformanceData({
                estudiante_id: studentId,
                limit: 10
            });
        }

        // Generar recomendaciones combinadas
        const recommendations = {
            student: studentData[0] || null,
            performance: performanceData,
            personalizedRecommendations: [],
            aiInsights: null
        };

        if (studentData[0]?.aiInsights) {
            recommendations.personalizedRecommendations = studentData[0].aiInsights.recommendations;
            recommendations.aiInsights = studentData[0].aiInsights;
        }

        if (performanceData?.analysis) {
            recommendations.performanceInsights = performanceData.analysis;
        }

        res.json({
            success: true,
            message: `Recomendaciones personalizadas para estudiante ${studentId}`,
            data: recommendations,
            options: { includePerformance, includePredictive },
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error) {
        console.error('❌ Error generando recomendaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error generando recomendaciones',
            message: error.message
        });
    }
});

/**
 * POST /api/ai-database/batch-analysis
 * Análisis en lote de múltiples estudiantes
 */
router.post('/batch-analysis', authenticateToken, async (req, res) => {
    try {
        const { studentIds, analysisType = 'full' } = req.body;

        if (!studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere array de studentIds',
                message: 'Proporciona una lista de IDs de estudiantes para análisis'
            });
        }

        console.log(`📊 Análisis en lote de ${studentIds.length} estudiantes`);

        const batchResults = [];

        for (const studentId of studentIds) {
            try {
                const studentData = await aiDbIntegration.getStudentData(parseInt(studentId));

                if (analysisType === 'full') {
                    const performanceData = await aiDbIntegration.getPerformanceData({
                        estudiante_id: studentId
                    });

                    batchResults.push({
                        studentId: studentId,
                        student: studentData[0] || null,
                        performance: performanceData,
                        status: 'success'
                    });
                } else {
                    batchResults.push({
                        studentId: studentId,
                        student: studentData[0] || null,
                        status: 'success'
                    });
                }

            } catch (error) {
                batchResults.push({
                    studentId: studentId,
                    error: error.message,
                    status: 'error'
                });
            }
        }

        const successCount = batchResults.filter(r => r.status === 'success').length;
        const errorCount = batchResults.filter(r => r.status === 'error').length;

        res.json({
            success: true,
            message: `Análisis en lote completado: ${successCount} exitosos, ${errorCount} errores`,
            data: batchResults,
            summary: {
                total: studentIds.length,
                successful: successCount,
                errors: errorCount,
                analysisType: analysisType
            },
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error) {
        console.error('❌ Error en análisis en lote:', error);
        res.status(500).json({
            success: false,
            error: 'Error en análisis en lote',
            message: error.message
        });
    }
});

/**
 * GET /api/ai-database/stats
 * Estadísticas del servicio de integración
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = aiDbIntegration.getStats();

        res.json({
            success: true,
            message: 'Estadísticas del servicio AI-Database',
            data: stats,
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas',
            message: error.message
        });
    }
});

/**
 * POST /api/ai-database/clear-cache
 * Limpiar cache del servicio (solo admin)
 */
router.post('/clear-cache', authenticateToken, async (req, res) => {
    try {
        // Verificar permisos de admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Solo administradores pueden limpiar el cache'
            });
        }

        aiDbIntegration.clearCache();

        res.json({
            success: true,
            message: 'Cache del servicio AI-Database limpiado exitosamente',
            timestamp: new Date().toISOString(),
            user: req.user.email
        });

    } catch (error) {
        console.error('❌ Error limpiando cache:', error);
        res.status(500).json({
            success: false,
            error: 'Error limpiando cache',
            message: error.message
        });
    }
});

/**
 * GET /api/ai-database/subjects/analysis
 * Análisis AI de rendimiento por materias
 */
router.get('/subjects/analysis', authenticateToken, async (req, res) => {
    try {
        const { grado } = req.query;

        console.log(`📚 Análisis AI de materias: grado=${grado}`);

        const academicData = await aiDbIntegration.getAcademicData(null, grado);

        // Agrupar por materia para análisis comparativo
        const subjectAnalysis = {};

        academicData.forEach(item => {
            if (!subjectAnalysis[item.materia]) {
                subjectAnalysis[item.materia] = {
                    materia: item.materia,
                    items: [],
                    totalEstudiantes: 0,
                    promedioGeneral: 0
                };
            }
            subjectAnalysis[item.materia].items.push(item);
            subjectAnalysis[item.materia].totalEstudiantes += item.total_estudiantes || 0;
        });

        // Calcular promedios y análisis comparativo
        Object.keys(subjectAnalysis).forEach(materia => {
            const subject = subjectAnalysis[materia];
            const promedios = subject.items
                .map(item => item.promedio_materia)
                .filter(p => p && !isNaN(p));

            subject.promedioGeneral = promedios.length > 0 ?
                promedios.reduce((a, b) => a + b, 0) / promedios.length : 0;
        });

        res.json({
            success: true,
            message: 'Análisis AI de materias completado',
            data: Object.values(subjectAnalysis),
            filters: { grado },
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error) {
        console.error('❌ Error en análisis de materias:', error);
        res.status(500).json({
            success: false,
            error: 'Error en análisis de materias',
            message: error.message
        });
    }
});

module.exports = router;
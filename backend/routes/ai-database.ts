/**
 * 🤖🗄️ RUTAS API INTEGRACIÓN AI-DATABASE BGE - TypeScript
 * Endpoints para conectar sistemas AI con datos reales de la base de datos
 * Migrado: 08 Diciembre 2025
 *
 * Versión: 3.0 - Fase 3 IA Avanzada
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';
// @ts-ignore
import { getAIDatabaseIntegration } from '../services/aiDatabaseIntegration';
// @ts-ignore
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Obtener instancia del servicio
const aiDbIntegration = getAIDatabaseIntegration();

// ============================================
// ENDPOINTS DE DATOS CON ANÁLISIS AI
// ============================================

/**
 * GET /api/ai-database/health
 * Health check del servicio de integración AI-Database
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
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

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error en health check AI-Database:', sanitizeError(error, 'ai-database'));
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
router.get('/students/:studentId?', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;

        debugLog.log('AI_DATABASE', `🎓 Obteniendo datos de estudiantes con AI: ${studentId || 'todos'}`);

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

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error obteniendo datos de estudiantes:', sanitizeError(error, 'ai-database'));
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
router.get('/academic', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { materia, grado } = req.query;

        debugLog.log('AI_DATABASE', `📚 Obteniendo datos académicos con AI: materia=${materia}, grado=${grado}`);

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

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error obteniendo datos académicos:', sanitizeError(error, 'ai-database'));
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
router.get('/teachers/:teacherId?', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { teacherId } = req.params;

        debugLog.log('AI_DATABASE', `👨‍🏫 Obteniendo datos de docentes con AI: ${teacherId || 'todos'}`);

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

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error obteniendo datos de docentes:', sanitizeError(error, 'ai-database'));
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
router.post('/performance-analysis', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const filters = req.body || {};

        debugLog.log('AI_DATABASE', `📊 Ejecutando análisis de rendimiento con AI:`, filters);

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

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error en análisis de rendimiento:', sanitizeError(error, 'ai-database'));
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
router.get('/recommendations/:studentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { includePerformance = 'true', includePredictive = 'true' } = req.query;

        debugLog.log('AI_DATABASE', `💡 Generando recomendaciones AI para estudiante ${studentId}`);

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
        const recommendations: any = {
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

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error generando recomendaciones:', sanitizeError(error, 'ai-database'));
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
router.post('/batch-analysis', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentIds, analysisType = 'full' } = req.body;

        if (!studentIds || !Array.isArray(studentIds)) {
            res.status(400).json({
                success: false,
                error: 'Se requiere array de studentIds',
                message: 'Proporciona una lista de IDs de estudiantes para análisis'
            });
            return;
        }

        debugLog.log('AI_DATABASE', `📊 Análisis en lote de ${studentIds.length} estudiantes`);

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

            } catch (error: any) {
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

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error en análisis en lote:', sanitizeError(error, 'ai-database'));
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
router.get('/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = aiDbIntegration.getStats();

        res.json({
            success: true,
            message: 'Estadísticas del servicio AI-Database',
            data: stats,
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error obteniendo estadísticas:', sanitizeError(error, 'ai-database'));
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
router.post('/clear-cache', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        // Verificar permisos de admin
        if ((req as any).user.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Solo administradores pueden limpiar el cache'
            });
            return;
        }

        aiDbIntegration.clearCache();

        res.json({
            success: true,
            message: 'Cache del servicio AI-Database limpiado exitosamente',
            timestamp: new Date().toISOString(),
            user: (req as any).user.email
        });

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error limpiando cache:', sanitizeError(error, 'ai-database'));
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
router.get('/subjects/analysis', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { grado } = req.query;

        debugLog.log('AI_DATABASE', `📚 Análisis AI de materias: grado=${grado}`);

        const academicData = await aiDbIntegration.getAcademicData(null, grado);

        // Agrupar por materia para análisis comparativo
        const subjectAnalysis: any = {};

        academicData.forEach((item: any) => {
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
                .map((item: any) => item.promedio_materia)
                .filter((p: any) => p && !isNaN(p));

            subject.promedioGeneral = promedios.length > 0 ?
                promedios.reduce((a: any, b: any) => a + b, 0) / promedios.length : 0;
        });

        res.json({
            success: true,
            message: 'Análisis AI de materias completado',
            data: Object.values(subjectAnalysis),
            filters: { grado },
            timestamp: new Date().toISOString(),
            source: 'ai-database-integration'
        });

    } catch (error: any) {
        debugLog.error('AI_DATABASE', '❌ Error en análisis de materias:', sanitizeError(error, 'ai-database'));
        res.status(500).json({
            success: false,
            error: 'Error en análisis de materias',
            message: error.message
        });
    }
});

// @ts-ignore
export = router;

/**
 * 📊 DESCRIPTIVE ANALYTICS API ROUTES - Semana 9
 * 
 * Endpoints para Analítica Descriptiva Inteligente:
 * - Dashboard ejecutivo
 * - Resúmenes automáticos (NLG)
 * - Detección de anomalías
 * - Clustering de estudiantes
 * - Exportación de reportes (datos para PDF)
 * - Insights automáticos
 * - Alertas del sistema
 * 
 * @author AI Architect Agent
 * @date Diciembre 2025
 */

const express = require('express');
const router = express.Router();
const devLogger = require('../../utils/devLogger');
const descriptiveAnalytics = require('./descriptive_analytics_service');

// Middleware de logging para todas las rutas
router.use((req, res, next) => {
    devLogger.log('ANALYTICS_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/analytics/dashboard
 * Obtiene datos del dashboard ejecutivo completo
 */
router.get('/dashboard', async (req, res) => {
    try {
        const dashboard = await descriptiveAnalytics.getExecutiveDashboard();
        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /dashboard:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo dashboard ejecutivo'
        });
    }
});

/**
 * GET /api/ai/analytics/realtime
 * Métricas en tiempo real para widgets del dashboard
 */
router.get('/realtime', async (req, res) => {
    try {
        const realtime = await descriptiveAnalytics.getRealTimeDashboardData();
        res.json({
            success: true,
            data: realtime
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /realtime:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo datos en tiempo real'
        });
    }
});

/**
 * GET /api/ai/analytics/metrics
 * Métricas consolidadas por timeframe
 * Query params: ?timeframe=7d|14d|30d|90d
 */
router.get('/metrics', async (req, res) => {
    try {
        const { timeframe = '30d' } = req.query;
        const validTimeframes = ['7d', '14d', '30d', '90d'];

        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({
                success: false,
                error: 'Timeframe inválido. Use: 7d, 14d, 30d, 90d'
            });
        }

        const metrics = await descriptiveAnalytics.getConsolidatedMetrics(timeframe);
        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /metrics:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo métricas consolidadas'
        });
    }
});

/**
 * GET /api/ai/analytics/summary
 * Genera resumen semanal en lenguaje natural (NLG)
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = await descriptiveAnalytics.generateWeeklySummary();
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /summary:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error generando resumen semanal'
        });
    }
});

/**
 * GET /api/ai/analytics/anomalies
 * Detecta anomalías en los datos
 * Query params: ?category=all|attendance|grades|enrollment
 */
router.get('/anomalies', async (req, res) => {
    try {
        const { category = 'all' } = req.query;
        const validCategories = ['all', 'attendance', 'grades', 'enrollment'];

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Categoría inválida. Use: all, attendance, grades, enrollment'
            });
        }

        const anomalies = await descriptiveAnalytics.detectAnomalies(category);
        res.json({
            success: true,
            data: anomalies
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /anomalies:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error detectando anomalías'
        });
    }
});

/**
 * GET /api/ai/analytics/clusters
 * Obtiene clustering de estudiantes (anónimo)
 * Para visualizaciones de distribución por rendimiento
 */
router.get('/clusters', async (req, res) => {
    try {
        const clusters = await descriptiveAnalytics.getStudentClusters();
        res.json({
            success: true,
            data: clusters
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /clusters:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo clustering de estudiantes'
        });
    }
});

/**
 * GET /api/ai/analytics/report/pdf-data
 * Genera datos estructurados para exportación a PDF
 * Query params: ?type=weekly|monthly
 */
router.get('/report/pdf-data', async (req, res) => {
    try {
        const { type = 'weekly' } = req.query;
        const validTypes = ['weekly', 'monthly'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo inválido. Use: weekly, monthly'
            });
        }

        const reportData = await descriptiveAnalytics.generatePDFReportData(type);
        res.json({
            success: true,
            data: reportData
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /report/pdf-data:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error generando datos para PDF'
        });
    }
});

/**
 * GET /api/ai/analytics/insights
 * Genera insights automáticos basados en análisis de datos
 */
router.get('/insights', async (req, res) => {
    try {
        const insights = await descriptiveAnalytics.generateAutoInsights();
        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /insights:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error generando insights automáticos'
        });
    }
});

/**
 * GET /api/ai/analytics/alerts
 * Obtiene alertas activas del sistema
 */
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await descriptiveAnalytics.checkMetricAlerts();
        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /alerts:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error verificando alertas'
        });
    }
});

/**
 * POST /api/ai/analytics/cache/clear
 * Limpia la caché del servicio de analítica
 * Requiere autenticación de admin
 */
router.post('/cache/clear', async (req, res) => {
    try {
        descriptiveAnalytics.clearCache();
        res.json({
            success: true,
            message: 'Caché limpiado correctamente'
        });
    } catch (error) {
        devLogger.error('ANALYTICS_API', 'Error en /cache/clear:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error limpiando caché'
        });
    }
});

/**
 * GET /api/ai/analytics/health
 * Health check del servicio de analítica
 */
router.get('/health', async (req, res) => {
    try {
        const startTime = Date.now();

        // Verificar conexión a BD
        const dashboard = await descriptiveAnalytics.getRealTimeDashboardData();
        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            status: 'healthy',
            service: 'Descriptive Analytics Service',
            version: '1.0.0',
            responseTimeMs: responseTime,
            cacheActive: true,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;

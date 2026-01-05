/**
 * 🚨 DROPOUT PREDICTION API ROUTES - Semana 13
 * 
 * Endpoints para el Sistema de Alerta Temprana de Deserción Escolar:
 * - Predicciones individuales y por lote
 * - Explicabilidad de predicciones
 * - Intervenciones sugeridas
 * - Dashboard de alertas
 * - Configuración y monitoreo
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const dropoutService = require('./dropout_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('DROPOUT_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/dropout/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await dropoutService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/dropout/eda
 * Ejecutar Análisis Exploratorio de Datos
 */
router.get('/eda', async (req, res) => {
    try {
        const eda = await dropoutService.performEDA();
        res.json({ success: true, data: eda });
    } catch (error) {
        devLogger.error('DROPOUT_API', 'Error en EDA:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/dropout/predict/:studentId
 * Predecir riesgo de deserción para un estudiante
 */
router.get('/predict/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const prediction = await dropoutService.predictDropoutRisk(parseInt(studentId));
        res.json({ success: true, data: prediction });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/dropout/predict/batch
 * Predecir riesgo para múltiples estudiantes
 */
router.post('/predict/batch', async (req, res) => {
    try {
        const { studentIds } = req.body;
        if (!studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un array de studentIds'
            });
        }
        const predictions = await dropoutService.predictBatch(studentIds);
        res.json({ success: true, data: predictions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/dropout/explain/:studentId
 * Obtener explicación detallada de la predicción
 */
router.get('/explain/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const explanation = await dropoutService.explainPrediction(parseInt(studentId));
        res.json({ success: true, data: explanation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/dropout/features/:studentId
 * Obtener características extraídas del estudiante
 */
router.get('/features/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const features = await dropoutService.extractFeatures(parseInt(studentId));
        res.json({ success: true, data: features });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/dropout/interventions/:studentId
 * Obtener intervenciones sugeridas para un estudiante
 */
router.get('/interventions/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const interventions = await dropoutService.suggestInterventions(parseInt(studentId));
        res.json({ success: true, data: interventions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/dropout/dashboard/:teacherId
 * Obtener dashboard de alertas para docentes
 */
router.get('/dashboard/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        const dashboard = await dropoutService.getTeacherDashboardAlerts(parseInt(teacherId));
        res.json({ success: true, data: dashboard });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/dropout/monitoring
 * Obtener reporte de monitoreo del modelo
 */
router.get('/monitoring', async (req, res) => {
    try {
        const report = await dropoutService.getMonitoringReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/dropout/shadow-mode
 * Activar/desactivar modo sombra
 */
router.post('/shadow-mode', (req, res) => {
    try {
        const { enabled } = req.body;
        dropoutService.setShadowMode(enabled !== false);
        res.json({
            success: true,
            data: { shadowMode: dropoutService.shadowMode }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/dropout/thresholds
 * Obtener umbrales de decisión actuales
 */
router.get('/thresholds', (req, res) => {
    res.json({
        success: true,
        data: dropoutService.getThresholds()
    });
});

/**
 * POST /api/ai/dropout/thresholds
 * Actualizar umbrales de decisión
 */
router.post('/thresholds', (req, res) => {
    try {
        const newThresholds = req.body;
        dropoutService.setThresholds(newThresholds);
        res.json({
            success: true,
            data: dropoutService.getThresholds()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

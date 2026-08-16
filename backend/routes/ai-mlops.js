const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth.js');
const mlopsService = require('../services/mlops.service.js');
const devLogger = require('../utils/devLogger.js');

// ==========================================
// MLOPS ROUTES (Semana 11)
// ==========================================

/**
 * GET /api/ai/mlops/dashboard
 * Dashboard de estado de modelos
 */
router.get('/dashboard', authenticateToken, requireRole(['admin', 'directivo']), async (req, res, next) => {
    try {
        const dashboard = await mlopsService.getModelDashboard();
        res.json({ success: true, data: dashboard });
    } catch (error) {
        devLogger.error('[MLOps] Error fetching dashboard', error);
        next(error);
    }
});

/**
 * POST /api/ai/mlops/register
 * Registrar o actualizar definición de modelo
 */
router.post('/register', authenticateToken, requireRole(['admin']), async (req, res, next) => {
    try {
        const { name, description, framework } = req.body;
        const result = await mlopsService.registerModel(name, description, framework);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ai/mlops/version
 * Publicar nueva versión (desde script de CI/CD)
 */
router.post('/version', authenticateToken, requireRole(['admin']), async (req, res, next) => {
    try {
        const { modelName, version, config, metrics } = req.body;
        const userId = req.user.id;
        const result = await mlopsService.createVersion(modelName, version, config, metrics, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ai/mlops/metrics
 * Reportar métricas de producción (drift, latency) desde workers
 */
router.post('/metrics', authenticateToken, requireRole(['admin']), async (req, res, next) => {
    try {
        const { modelName, metrics } = req.body;
        const result = await mlopsService.logProductionMetrics(modelName, metrics);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// A/B TESTING & EXPERIMENTS ROUTES
// ==========================================

// Obtener experimentos activos
router.get('/experiments', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { executeQuery } = require('../config/database.js');
        const experiments = await executeQuery(`
            SELECT e.*, 
                   (SELECT COUNT(*) FROM ai_experiment_variants v WHERE v.experiment_id = e.id) as variants_count,
                   (SELECT COUNT(*) FROM ai_experiment_allocations a WHERE a.experiment_id = e.id) as participants
            FROM ai_experiments e
            ORDER BY e.created_at DESC
        `);
        res.json({ success: true, data: experiments });
    } catch (error) {
        console.error('Error fetching experiments:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de Simulación de Inferencia con Routing A/B
// Este endpoint demuestra cómo el sistema decide qué modelo usar para un usuario
router.post('/inference/predict', authenticateToken, async (req, res) => {
    try {
        const { modelName, inputData } = req.body;
        const userId = req.user.id;

        const experimentService = require('../services/experiment.service.js');

        // 1. Verificar Asignación Experimental
        const variant = await experimentService.getVariantForUser(modelName, userId);

        // Simulación de Inferencia
        let usedModelVersion = 'LATEST_PROD'; // Default
        let experimentInfo = null;

        if (variant) {
            usedModelVersion = variant.model_version;
            experimentInfo = {
                experiment: variant.experimentName,
                variant: variant.name,
                isShadowMode: variant.is_shadow_mode
            };
        } else {
            // Fallback a modelo de producción por defecto (Lógica normal)
            // const prodModel = await mlopsService.getProductionModel(modelName);
            usedModelVersion = '1.0.0 (Prod Default)';
        }

        // Simular resultado
        const prediction = Math.random() > 0.5 ? 'High Risk' : 'Low Risk';
        const confidence = 0.85 + (Math.random() * 0.1);

        res.json({
            success: true,
            prediction: {
                result: prediction,
                confidence: confidence.toFixed(4)
            },
            meta: {
                modelName,
                versionUsed: usedModelVersion,
                experiment: experimentInfo
            }
        });

    } catch (error) {
        console.error('Inference Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

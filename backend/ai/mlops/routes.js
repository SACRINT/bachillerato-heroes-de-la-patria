/**
 * 🔄 MLOPS API ROUTES - Semana 11
 * 
 * Endpoints para MLOps Básico y Automatización:
 * - Tracking de experimentos
 * - Gestión de drift
 * - Backups y auditorías
 * - Versionado de modelos
 * 
 * @author AI Architect Agent
 * @date Diciembre 2025
 */

const express = require('express');
const router = express.Router();
const devLogger = require('../../utils/devLogger');
const mlopsService = require('./mlops_service');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('MLOPS_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/mlops/health
 * Health check del servicio MLOps
 */
router.get('/health', async (req, res) => {
    try {
        const health = await mlopsService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops/experiments
 * Registrar un nuevo experimento
 */
router.post('/experiments', async (req, res) => {
    try {
        const experimentData = req.body;
        const experiment = await mlopsService.logExperiment(experimentData);
        res.json({ success: true, data: experiment });
    } catch (error) {
        devLogger.error('MLOPS_API', 'Error en /experiments:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops/experiments
 * Listar experimentos
 */
router.get('/experiments', async (req, res) => {
    try {
        const { name, status, limit } = req.query;
        const experiments = await mlopsService.getExperiments({
            name,
            status,
            limit: limit ? parseInt(limit) : 50
        });
        res.json({ success: true, data: experiments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/ai/mlops/experiments/:id
 * Actualizar experimento
 */
router.patch('/experiments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const experiment = await mlopsService.updateExperiment(id, req.body);
        if (!experiment) {
            return res.status(404).json({ success: false, error: 'Experimento no encontrado' });
        }
        res.json({ success: true, data: experiment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops/drift/detect
 * Detectar drift en un modelo
 */
router.post('/drift/detect', async (req, res) => {
    try {
        const { modelName, metrics } = req.body;
        if (!modelName || !metrics) {
            return res.status(400).json({ success: false, error: 'modelName y metrics son requeridos' });
        }
        const analysis = await mlopsService.detectDrift(modelName, metrics);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops/baseline/:modelName
 * Actualizar baseline de métricas
 */
router.post('/baseline/:modelName', async (req, res) => {
    try {
        const { modelName } = req.params;
        await mlopsService.updateBaseline(modelName, req.body);
        res.json({ success: true, message: `Baseline actualizado para ${modelName}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops/reindex
 * Trigger manual de re-indexado
 */
router.post('/reindex', async (req, res) => {
    try {
        const result = await mlopsService.triggerReindex();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops/schedule/reindex
 * Ver programación de re-indexado
 */
router.get('/schedule/reindex', async (req, res) => {
    try {
        const schedule = await mlopsService.scheduleReindexing();
        res.json({ success: true, data: schedule });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops/version
 * Obtener versión actual de prompts/modelos
 */
router.get('/version', (req, res) => {
    res.json({
        success: true,
        data: {
            version: mlopsService.getPromptVersion(),
            details: mlopsService.version
        }
    });
});

/**
 * POST /api/ai/mlops/version/increment
 * Incrementar versión
 */
router.post('/version/increment', (req, res) => {
    try {
        const { type } = req.body; // major, minor, patch
        const newVersion = mlopsService.incrementVersion(type || 'patch');
        res.json({ success: true, data: { version: newVersion } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops/tests/nlp
 * Ejecutar tests de NLP
 */
router.get('/tests/nlp', async (req, res) => {
    try {
        const results = await mlopsService.runNLPTests();
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops/backup/vector-db
 * Ejecutar backup de base vectorial
 */
router.post('/backup/vector-db', async (req, res) => {
    try {
        const result = await mlopsService.backupVectorDB();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops/audit/credentials
 * Auditar credenciales
 */
router.get('/audit/credentials', async (req, res) => {
    try {
        const result = await mlopsService.auditCredentials();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops/audit/full
 * Auditoría completa de MLOps
 */
router.get('/audit/full', async (req, res) => {
    try {
        const result = await mlopsService.runFullAudit();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops/alerts
 * Ver alertas activas
 */
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await mlopsService.getActiveAlerts();
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops/alerts
 * Crear alerta manual
 */
router.post('/alerts', async (req, res) => {
    try {
        const alert = await mlopsService.sendAlert(req.body);
        res.json({ success: true, data: alert });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

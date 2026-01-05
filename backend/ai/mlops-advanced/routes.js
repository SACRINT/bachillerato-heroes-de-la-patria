/**
 * 🚀 ADVANCED MLOPS API ROUTES - Semana 21
 * 
 * Endpoints para MLOps Avanzado:
 * - Feature Store
 * - Model Registry
 * - Canary Deployments
 * - Drift Detection
 * - Observabilidad
 * - Gobierno de Modelos
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const mlopsService = require('./mlops_advanced_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('MLOPS_ADVANCED_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/mlops-advanced/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await mlopsService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Feature Store ============

/**
 * GET /api/ai/mlops-advanced/features/:entityType/:entityId
 * Obtener features de una entidad
 */
router.get('/features/:entityType/:entityId', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const featureNames = req.query.features?.split(',') || null;
        const features = await mlopsService.getFeatures(entityType, entityId, featureNames);
        res.json({ success: true, data: features });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops-advanced/features/register
 * Registrar nueva feature
 */
router.post('/features/register', async (req, res) => {
    try {
        const { entityType, feature } = req.body;
        const result = await mlopsService.registerFeature(entityType, feature);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Model Registry ============

/**
 * GET /api/ai/mlops-advanced/models
 * Listar modelos registrados
 */
router.get('/models', async (req, res) => {
    try {
        const { stage } = req.query;
        const models = await mlopsService.listModels(stage);
        res.json({ success: true, data: models });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops-advanced/models/register
 * Registrar nuevo modelo
 */
router.post('/models/register', async (req, res) => {
    try {
        const modelDef = req.body;
        const result = await mlopsService.registerModel(modelDef);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops-advanced/models/:modelId/promote
 * Promover modelo a otra etapa
 */
router.post('/models/:modelId/promote', async (req, res) => {
    try {
        const { modelId } = req.params;
        const { targetStage, approvers } = req.body;
        const result = await mlopsService.promoteModel(modelId, targetStage, approvers);
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Drift & Retraining ============

/**
 * GET /api/ai/mlops-advanced/drift/:modelId
 * Verificar drift de datos
 */
router.get('/drift/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const drift = await mlopsService.checkDataDrift(modelId);
        res.json({ success: true, data: drift });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops-advanced/retrain/:modelId
 * Disparar reentrenamiento
 */
router.post('/retrain/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const { reason } = req.body;
        const result = await mlopsService.triggerRetraining(modelId, reason || 'manual');
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Canary Deployments ============

/**
 * POST /api/ai/mlops-advanced/canary/create
 * Crear canary deployment
 */
router.post('/canary/create', async (req, res) => {
    try {
        const { modelId, newVersion } = req.body;
        const deployment = await mlopsService.createCanaryDeployment(modelId, newVersion);
        res.json({ success: true, data: deployment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops-advanced/canary/:deploymentId/evaluate
 * Evaluar canary deployment
 */
router.get('/canary/:deploymentId/evaluate', async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const evaluation = await mlopsService.evaluateCanary(deploymentId);
        res.json({ success: true, data: evaluation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops-advanced/canary/:deploymentId/promote
 * Promover canary a producción
 */
router.post('/canary/:deploymentId/promote', async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const result = await mlopsService.promoteCanary(deploymentId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops-advanced/canary/:deploymentId/rollback
 * Rollback de canary
 */
router.post('/canary/:deploymentId/rollback', async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const { reason } = req.body;
        const result = await mlopsService.rollbackCanary(deploymentId, reason);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Observability ============

/**
 * GET /api/ai/mlops-advanced/metrics/:modelId
 * Obtener métricas del modelo
 */
router.get('/metrics/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const metrics = await mlopsService.getModelMetrics(modelId);
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/mlops-advanced/alerts/:modelId
 * Obtener alertas del modelo
 */
router.get('/alerts/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const alerts = await mlopsService.getModelAlerts(modelId);
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Governance ============

/**
 * POST /api/ai/mlops-advanced/governance/request-approval
 * Solicitar aprobación de deployment
 */
router.post('/governance/request-approval', async (req, res) => {
    try {
        const { modelId, requestedBy } = req.body;
        const result = await mlopsService.requestDeploymentApproval(modelId, requestedBy);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops-advanced/governance/approve
 * Aprobar deployment
 */
router.post('/governance/approve', async (req, res) => {
    try {
        const { requestId, approver, role } = req.body;
        const result = await mlopsService.approveDeployment(requestId, approver, role);
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Testing & Security ============

/**
 * POST /api/ai/mlops-advanced/regression-tests/:modelId
 * Ejecutar pruebas de regresión
 */
router.post('/regression-tests/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const results = await mlopsService.runRegressionTests(modelId);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/mlops-advanced/security-scan
 * Escanear vulnerabilidades de seguridad
 */
router.post('/security-scan', async (req, res) => {
    try {
        const { imageTag } = req.body;
        const scan = await mlopsService.scanSecurityVulnerabilities(imageTag);
        res.json({ success: true, data: scan });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

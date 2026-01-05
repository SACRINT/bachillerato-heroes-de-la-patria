/**
 * 🧪 AI QA TESTING API ROUTES - Semana 22
 * 
 * Endpoints para Testing y QA de IA:
 * - Pruebas probabilísticas
 * - Golden Datasets
 * - Behavioral Testing
 * - Bias Testing
 * - Robustness Testing
 * - Fairness Metrics
 * - Stress Testing
 * - E2E Tests
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const qaService = require('./qa_testing_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('AI_QA_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/qa-testing/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await qaService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/qa-testing/probabilistic/:modelId
 * Ejecutar tests probabilísticos
 */
router.post('/probabilistic/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const config = req.body;
        const results = await qaService.runProbabilisticTests(modelId, config);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/qa-testing/golden-dataset/:modelId
 * Ejecutar tests con Golden Dataset
 */
router.post('/golden-dataset/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const results = await qaService.runGoldenDatasetTests(modelId);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/ai/qa-testing/golden-dataset/:modelId
 * Actualizar Golden Dataset
 */
router.put('/golden-dataset/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const { samples } = req.body;
        const result = await qaService.updateGoldenDataset(modelId, samples || []);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/qa-testing/behavioral/:modelId
 * Ejecutar Behavioral Tests (CheckList)
 */
router.post('/behavioral/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const { testType } = req.body;
        const results = await qaService.runBehavioralTests(modelId, testType);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/qa-testing/bias/:modelId
 * Ejecutar Bias Tests
 */
router.post('/bias/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const results = await qaService.runBiasTests(modelId);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/qa-testing/robustness/:modelId
 * Ejecutar Robustness Tests
 */
router.post('/robustness/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const results = await qaService.runRobustnessTests(modelId);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/qa-testing/fairness/:modelId
 * Calcular Fairness Metrics
 */
router.get('/fairness/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const metrics = await qaService.calculateFairnessMetrics(modelId);
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/qa-testing/stress/:modelId
 * Ejecutar Stress Tests
 */
router.post('/stress/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const config = req.body;
        const results = await qaService.runStressTests(modelId, config);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/qa-testing/e2e
 * Ejecutar E2E Integration Tests
 */
router.post('/e2e', async (req, res) => {
    try {
        const results = await qaService.runE2ETests();
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/qa-testing/quality-gates/:modelId
 * Evaluar Quality Gates
 */
router.post('/quality-gates/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const metrics = req.body;
        const results = await qaService.evaluateQualityGates(modelId, metrics);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/qa-testing/report/:modelId
 * Generar reporte completo de tests
 */
router.get('/report/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const report = await qaService.generateTestReport(modelId);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

/**
 * 🔧 OPTIMIZATION API ROUTES - Semana 20
 * 
 * Endpoints para Optimización y Evaluación:
 * - Performance global
 * - Hiperparámetros
 * - Tamaño de modelos
 * - Costos
 * - Auditoría
 * - Tests
 * - Escalabilidad
 * - Deuda técnica
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const optimizationService = require('./optimization_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('OPTIMIZATION_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/optimization/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await optimizationService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/performance
 * Revisión de performance global
 */
router.get('/performance', async (req, res) => {
    try {
        const performance = await optimizationService.reviewGlobalPerformance();
        res.json({ success: true, data: performance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/optimization/hyperparameters/:modelId
 * Optimizar hiperparámetros de un modelo
 */
router.post('/hyperparameters/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const result = await optimizationService.optimizeHyperparameters(modelId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/model-size/:modelId
 * Analizar tamaño de modelo
 */
router.get('/model-size/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const analysis = await optimizationService.analyzeModelSize(modelId);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/costs
 * Analizar costos de infraestructura
 */
router.get('/costs', async (req, res) => {
    try {
        const costs = await optimizationService.analyzeCosts();
        res.json({ success: true, data: costs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/audit
 * Ejecutar auditoría de código
 */
router.get('/audit', async (req, res) => {
    try {
        const audit = await optimizationService.runCodeAudit();
        res.json({ success: true, data: audit });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/test-coverage
 * Obtener cobertura de tests
 */
router.get('/test-coverage', async (req, res) => {
    try {
        const coverage = await optimizationService.getTestCoverage();
        res.json({ success: true, data: coverage });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/scalability
 * Validar escalabilidad
 */
router.get('/scalability', async (req, res) => {
    try {
        const scalability = await optimizationService.validateScalability();
        res.json({ success: true, data: scalability });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/errors
 * Analizar errores y edge cases
 */
router.get('/errors', async (req, res) => {
    try {
        const errors = await optimizationService.analyzeErrors();
        res.json({ success: true, data: errors });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/technical-debt
 * Evaluar deuda técnica
 */
router.get('/technical-debt', async (req, res) => {
    try {
        const debt = await optimizationService.evaluateTechnicalDebt();
        res.json({ success: true, data: debt });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/demo
 * Generar demo integrada
 */
router.get('/demo', async (req, res) => {
    try {
        const demo = await optimizationService.generateIntegratedDemo();
        res.json({ success: true, data: demo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/optimization/phase3-summary
 * Resumen de cierre de Fase 3
 */
router.get('/phase3-summary', async (req, res) => {
    try {
        const summary = await optimizationService.generatePhase3Summary();
        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

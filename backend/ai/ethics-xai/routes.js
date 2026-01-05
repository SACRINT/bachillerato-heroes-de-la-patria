/**
 * 🔍 ETHICS AND XAI ROUTES - Semana 29
 * 
 * Endpoints para Auditoría Ética y Explicabilidad:
 * - Explicaciones XAI
 * - Auditorías de decisiones
 * - Comité de ética
 * - Análisis de sesgos
 * - Apelaciones
 * - Model Cards
 * - Métricas de equidad
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const ethicsService = require('./ethics_xai_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('ETHICS_XAI_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/ethics/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await ethicsService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Explicabilidad XAI ============

/**
 * POST /api/ai/ethics/explain
 * Explicar una predicción
 */
router.post('/explain', async (req, res) => {
    try {
        const { modelId, predictionId, method } = req.body;
        if (!modelId || !predictionId) {
            return res.status(400).json({ success: false, error: 'Se requiere modelId y predictionId' });
        }
        const explanation = await ethicsService.explainPrediction(modelId, predictionId, method);
        res.json({ success: true, data: explanation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/ethics/feature-importance/:modelId
 * Obtener importancia de features de un modelo
 */
router.get('/feature-importance/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const importance = await ethicsService.getFeatureImportance(modelId);
        res.json({ success: true, data: importance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Auditoría ============

/**
 * POST /api/ai/ethics/audit
 * Auditar una decisión de IA
 */
router.post('/audit', async (req, res) => {
    try {
        const { decisionId, modelId } = req.body;
        if (!decisionId || !modelId) {
            return res.status(400).json({ success: false, error: 'Se requiere decisionId y modelId' });
        }
        const audit = await ethicsService.auditDecision(decisionId, modelId);
        res.json({ success: true, data: audit });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/ethics/audit-history/:modelId
 * Historial de auditorías de un modelo
 */
router.get('/audit-history/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const history = await ethicsService.getAuditHistory(modelId, limit);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Comité de Ética ============

/**
 * GET /api/ai/ethics/committee
 * Información del comité de ética
 */
router.get('/committee', async (req, res) => {
    try {
        const committee = await ethicsService.getEthicsCommittee();
        res.json({ success: true, data: committee });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/ethics/committee/case
 * Enviar caso al comité de ética
 */
router.post('/committee/case', async (req, res) => {
    try {
        const caseResult = await ethicsService.submitEthicsCase(req.body);
        res.json({ success: true, data: caseResult });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Sesgos ============

/**
 * POST /api/ai/ethics/bias/analyze
 * Analizar sesgos en dataset
 */
router.post('/bias/analyze', async (req, res) => {
    try {
        const { datasetId } = req.body;
        if (!datasetId) {
            return res.status(400).json({ success: false, error: 'Se requiere datasetId' });
        }
        const analysis = await ethicsService.analyzeDatasetBias(datasetId);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Apelaciones ============

/**
 * POST /api/ai/ethics/appeal
 * Enviar apelación de decisión algorítmica
 */
router.post('/appeal', async (req, res) => {
    try {
        const appeal = await ethicsService.submitAppeal(req.body);
        res.json({ success: true, data: appeal });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/ethics/appeal/:appealId
 * Estado de apelación
 */
router.get('/appeal/:appealId', async (req, res) => {
    try {
        const { appealId } = req.params;
        const status = await ethicsService.getAppealStatus(appealId);
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Model Cards ============

/**
 * GET /api/ai/ethics/model-cards
 * Listar Model Cards
 */
router.get('/model-cards', async (req, res) => {
    try {
        const cards = await ethicsService.listModelCards();
        res.json({ success: true, data: cards });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/ethics/model-card/:modelId
 * Obtener Model Card específico
 */
router.get('/model-card/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const card = await ethicsService.getModelCard(modelId);
        res.json({ success: true, data: card });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Impacto Psicosocial ============

/**
 * GET /api/ai/ethics/psychosocial-impact
 * Evaluación de impacto psicosocial
 */
router.get('/psychosocial-impact', async (req, res) => {
    try {
        const impact = await ethicsService.evaluatePsychosocialImpact();
        res.json({ success: true, data: impact });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Métricas de Equidad ============

/**
 * GET /api/ai/ethics/fairness/:modelId
 * Métricas de equidad de un modelo
 */
router.get('/fairness/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const metrics = await ethicsService.calculateFairnessMetrics(modelId);
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Principios Éticos ============

/**
 * GET /api/ai/ethics/principles
 * Principios éticos de la institución
 */
router.get('/principles', async (req, res) => {
    try {
        const principles = await ethicsService.getEthicalPrinciples();
        res.json({ success: true, data: principles });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Reporte de Transparencia ============

/**
 * GET /api/ai/ethics/transparency-report
 * Generar reporte de transparencia algorítmica
 */
router.get('/transparency-report', async (req, res) => {
    try {
        const report = await ethicsService.generateTransparencyReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

/**
 * 📊 SEMESTER EVALUATION ROUTES - Semana 28
 * 
 * Endpoints para Evaluación Semestral:
 * - KPIs
 * - ROI
 * - Satisfaction surveys
 * - Team evaluation
 * - Technology review
 * - Feature usage
 * - Planning
 * - Maintenance
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const evaluationService = require('./semester_evaluation_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('SEMESTER_EVAL_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/semester-evaluation/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await evaluationService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/kpis
 * Análisis de KPIs
 */
router.get('/kpis', async (req, res) => {
    try {
        const kpis = await evaluationService.analyzeKPIs();
        res.json({ success: true, data: kpis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/roi
 * Cálculo de ROI
 */
router.get('/roi', async (req, res) => {
    try {
        const roi = await evaluationService.calculateROI();
        res.json({ success: true, data: roi });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/satisfaction
 * Resultados de encuestas de satisfacción
 */
router.get('/satisfaction', async (req, res) => {
    try {
        const results = await evaluationService.getSatisfactionSurveyResults();
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/team
 * Evaluación del equipo
 */
router.get('/team', async (req, res) => {
    try {
        const evaluation = await evaluationService.evaluateTeamPerformance();
        res.json({ success: true, data: evaluation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/technology
 * Revisión tecnológica
 */
router.get('/technology', async (req, res) => {
    try {
        const review = await evaluationService.getTechnologyReview();
        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/features
 * Análisis de uso de features
 */
router.get('/features', async (req, res) => {
    try {
        const analysis = await evaluationService.analyzeFeatureUsage();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/plan
 * Plan del próximo semestre
 */
router.get('/plan', async (req, res) => {
    try {
        const plan = await evaluationService.generateNextSemesterPlan();
        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/semester-evaluation/maintenance
 * Ejecutar mantenimiento de BD
 */
router.post('/maintenance', async (req, res) => {
    try {
        const result = await evaluationService.performDatabaseMaintenance();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/lessons
 * Lecciones aprendidas
 */
router.get('/lessons', async (req, res) => {
    try {
        const lessons = await evaluationService.documentLessonsLearned();
        res.json({ success: true, data: lessons });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/success-story
 * Generar caso de éxito
 */
router.get('/success-story', async (req, res) => {
    try {
        const story = await evaluationService.generateSuccessStory();
        res.json({ success: true, data: story });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/semester-evaluation/executive-report
 * Reporte ejecutivo completo
 */
router.get('/executive-report', async (req, res) => {
    try {
        const report = await evaluationService.generateExecutiveReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

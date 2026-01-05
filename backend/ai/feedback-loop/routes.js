/**
 * 💬 FEEDBACK LOOP ROUTES - Semana 34
 * 
 * Endpoints para Feedback Docente/Administrativo:
 * - Mesas redondas
 * - Historias de éxito
 * - Sugerencias
 * - Capacitación
 * - Reportes
 * - Co-diseño
 * - Curva de aprendizaje
 * - Fricciones
 * - QoL features
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const feedbackService = require('./feedback_loop_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('FEEDBACK_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/feedback/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await feedbackService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/feedback/round-table
 * Programar mesa redonda
 */
router.post('/round-table', async (req, res) => {
    try {
        const config = req.body;
        const roundTable = await feedbackService.scheduleRoundTable(config);
        res.json({ success: true, data: roundTable });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/round-table/:id/summary
 * Resumen de mesa redonda
 */
router.get('/round-table/:id/summary', async (req, res) => {
    try {
        const { id } = req.params;
        const summary = await feedbackService.getRoundTableSummary(id);
        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/stories
 * Historias de éxito y fracaso
 */
router.get('/stories', async (req, res) => {
    try {
        const stories = await feedbackService.collectSuccessStories();
        res.json({ success: true, data: stories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/feedback/stories
 * Enviar nueva historia
 */
router.post('/stories', async (req, res) => {
    try {
        const storyData = req.body;
        const story = await feedbackService.submitStory(storyData);
        res.json({ success: true, data: story });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/suggestions
 * Análisis de sugerencias
 */
router.get('/suggestions', async (req, res) => {
    try {
        const analysis = await feedbackService.analyzeSuggestions();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/feedback/suggestions
 * Enviar sugerencia
 */
router.post('/suggestions', async (req, res) => {
    try {
        const suggestion = req.body;
        const result = await feedbackService.submitSuggestion(suggestion);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/training-needs
 * Necesidades de capacitación
 */
router.get('/training-needs', async (req, res) => {
    try {
        const needs = await feedbackService.identifyTrainingNeeds();
        res.json({ success: true, data: needs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/report-validation
 * Validación de utilidad de reportes
 */
router.get('/report-validation', async (req, res) => {
    try {
        const validation = await feedbackService.validateReportUtility();
        res.json({ success: true, data: validation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/feedback/co-design
 * Facilitar sesión de co-diseño
 */
router.post('/co-design', async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ success: false, error: 'Se requiere topic' });
        }
        const session = await feedbackService.facilitateCoDesign(topic);
        res.json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/learning-curve
 * Curva de aprendizaje
 */
router.get('/learning-curve', async (req, res) => {
    try {
        const analysis = await feedbackService.analyzeLearningCurve();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/workflow-frictions
 * Fricciones de workflow
 */
router.get('/workflow-frictions', async (req, res) => {
    try {
        const frictions = await feedbackService.identifyWorkflowFrictions();
        res.json({ success: true, data: frictions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/qol-features
 * QoL features priorizadas
 */
router.get('/qol-features', async (req, res) => {
    try {
        const features = await feedbackService.prioritizeQoLFeatures();
        res.json({ success: true, data: features });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/feedback/report
 * Reporte consolidado de feedback
 */
router.get('/report', async (req, res) => {
    try {
        const report = await feedbackService.generateFeedbackReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

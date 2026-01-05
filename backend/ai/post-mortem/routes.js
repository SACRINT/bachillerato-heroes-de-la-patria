/**
 * 📊 POST-MORTEM ROUTES - Semana 38
 * 
 * Endpoints para Análisis Post-Mortem:
 * - Incidentes
 * - Downtime
 * - Modelos
 * - Ahorro
 * - Arquitectura
 * - Seguridad
 * - Proveedores
 * - SLAs
 * - Lecciones
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const pmService = require('./post_mortem_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('POST_MORTEM_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/post-mortem/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await pmService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/incidents
 * Revisión de incidentes anuales
 */
router.get('/incidents', async (req, res) => {
    try {
        const incidents = await pmService.reviewAnnualIncidents();
        res.json({ success: true, data: incidents });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/downtime
 * Análisis de downtime
 */
router.get('/downtime', async (req, res) => {
    try {
        const downtime = await pmService.analyzeDowntime();
        res.json({ success: true, data: downtime });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/models
 * Precisión de modelos
 */
router.get('/models', async (req, res) => {
    try {
        const models = await pmService.evaluateModelAccuracy();
        res.json({ success: true, data: models });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/savings
 * Ahorro por automatización
 */
router.get('/savings', async (req, res) => {
    try {
        const savings = await pmService.calculateAutomationSavings();
        res.json({ success: true, data: savings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/architecture-errors
 * Errores de arquitectura
 */
router.get('/architecture-errors', async (req, res) => {
    try {
        const errors = await pmService.identifyArchitectureErrors();
        res.json({ success: true, data: errors });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/security
 * Análisis de seguridad
 */
router.get('/security', async (req, res) => {
    try {
        const security = await pmService.analyzeSecurityPosture();
        res.json({ success: true, data: security });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/vendors
 * Evaluación de proveedores
 */
router.get('/vendors', async (req, res) => {
    try {
        const vendors = await pmService.evaluateVendors();
        res.json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/sla-compliance
 * Cumplimiento de SLAs
 */
router.get('/sla-compliance', async (req, res) => {
    try {
        const slas = await pmService.reviewSLACompliance();
        res.json({ success: true, data: slas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/lessons-learned
 * Lecciones aprendidas
 */
router.get('/lessons-learned', async (req, res) => {
    try {
        const lessons = await pmService.documentLessonsLearned();
        res.json({ success: true, data: lessons });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/scalability
 * Análisis de escalabilidad
 */
router.get('/scalability', async (req, res) => {
    try {
        const scalability = await pmService.analyzeScalabilityPerformance();
        res.json({ success: true, data: scalability });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/team-satisfaction
 * Satisfacción del equipo
 */
router.get('/team-satisfaction', async (req, res) => {
    try {
        const satisfaction = await pmService.evaluateTeamSatisfaction();
        res.json({ success: true, data: satisfaction });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/deprecations
 * Deprecaciones identificadas
 */
router.get('/deprecations', async (req, res) => {
    try {
        const deprecations = await pmService.identifyDeprecations();
        res.json({ success: true, data: deprecations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/post-mortem/report
 * Reporte técnico anual completo
 */
router.get('/report', async (req, res) => {
    try {
        const report = await pmService.generateAnnualTechnicalReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

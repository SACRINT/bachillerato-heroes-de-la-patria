/**
 * 🔒 CODE FREEZE ROUTES - Semana 36
 * 
 * Endpoints para Congelamiento y Estabilidad:
 * - Code freeze
 * - Bug tracking
 * - Monitoreo
 * - Optimización
 * - Consistencia
 * - Pico de carga
 * - Alertas
 * - Seguridad
 * - Feature flags
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const freezeService = require('./code_freeze_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('CODE_FREEZE_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/stability/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await freezeService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/stability/code-freeze/activate
 * Activar code freeze
 */
router.post('/code-freeze/activate', async (req, res) => {
    try {
        const config = req.body;
        const freeze = await freezeService.activateCodeFreeze(config);
        res.json({ success: true, data: freeze });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/code-freeze/status
 * Estado del code freeze
 */
router.get('/code-freeze/status', async (req, res) => {
    try {
        const status = await freezeService.getCodeFreezeStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/stability/code-freeze/exception
 * Solicitar excepción
 */
router.post('/code-freeze/exception', async (req, res) => {
    try {
        const request = req.body;
        const exception = await freezeService.requestFreezeException(request);
        res.json({ success: true, data: exception });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/bugs
 * Estado de bugs
 */
router.get('/bugs', async (req, res) => {
    try {
        const bugs = await freezeService.getBugStatus();
        res.json({ success: true, data: bugs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/stability/bugs/fix
 * Registrar bug fix
 */
router.post('/bugs/fix', async (req, res) => {
    try {
        const bugFix = req.body;
        const fix = await freezeService.logBugFix(bugFix);
        res.json({ success: true, data: fix });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/monitoring
 * Monitoreo intensivo
 */
router.get('/monitoring', async (req, res) => {
    try {
        const monitoring = await freezeService.getIntensiveMonitoring();
        res.json({ success: true, data: monitoring });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/queries
 * Análisis de queries
 */
router.get('/queries', async (req, res) => {
    try {
        const analysis = await freezeService.analyzeQueryPerformance();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/consistency
 * Validación de consistencia
 */
router.get('/consistency', async (req, res) => {
    try {
        const validation = await freezeService.validateDataConsistency();
        res.json({ success: true, data: validation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/peak-load
 * Preparación pico de carga
 */
router.get('/peak-load', async (req, res) => {
    try {
        const prep = await freezeService.preparePeakLoad();
        res.json({ success: true, data: prep });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/alerts
 * Revisar umbrales de alertas
 */
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await freezeService.reviewAlertThresholds();
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/security-audit
 * Auditoría de seguridad final
 */
router.get('/security-audit', async (req, res) => {
    try {
        const audit = await freezeService.performFinalSecurityAudit();
        res.json({ success: true, data: audit });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/response-times
 * Tiempos de respuesta
 */
router.get('/response-times', async (req, res) => {
    try {
        const times = await freezeService.validateResponseTimes();
        res.json({ success: true, data: times });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/support-tickets
 * Estado de tickets de soporte
 */
router.get('/support-tickets', async (req, res) => {
    try {
        const tickets = await freezeService.getSupportTicketStatus();
        res.json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/uptime
 * Estado de uptime
 */
router.get('/uptime', async (req, res) => {
    try {
        const uptime = await freezeService.getUptimeStatus();
        res.json({ success: true, data: uptime });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/stability/communication
 * Enviar comunicación
 */
router.post('/communication', async (req, res) => {
    try {
        const { message } = req.body;
        const comm = await freezeService.sendStatusCommunication(message);
        res.json({ success: true, data: comm });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/contingency
 * Plan de contingencia
 */
router.get('/contingency', async (req, res) => {
    try {
        const plan = await freezeService.getContingencyPlan();
        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/feature-flags
 * Feature flags
 */
router.get('/feature-flags', async (req, res) => {
    try {
        const flags = await freezeService.getFeatureFlags();
        res.json({ success: true, data: flags });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/ai/stability/feature-flags/:name
 * Toggle feature flag
 */
router.put('/feature-flags/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { enabled } = req.body;
        const result = await freezeService.toggleFeatureFlag(name, enabled);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/stability/report
 * Reporte final de estabilidad
 */
router.get('/report', async (req, res) => {
    try {
        const report = await freezeService.generateStabilityReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

/**
 * 🔧 TECH DEBT ROUTES - Semana 31
 * 
 * Endpoints para Mantenimiento y Deuda Técnica:
 * - Calidad de código
 * - Dependencias
 * - Cobertura de tests
 * - TODOs/FIXMEs
 * - Docker
 * - Logs
 * - Health checks
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const techDebtService = require('./tech_debt_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('TECH_DEBT_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/tech-debt/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await techDebtService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/tech-debt/code-quality
 * Análisis de calidad de código
 */
router.get('/code-quality', async (req, res) => {
    try {
        const analysis = await techDebtService.analyzeCodeQuality();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/tech-debt/dependencies
 * Análisis de dependencias
 */
router.get('/dependencies', async (req, res) => {
    try {
        const analysis = await techDebtService.analyzeDependencies();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/tech-debt/test-coverage
 * Cobertura de tests
 */
router.get('/test-coverage', async (req, res) => {
    try {
        const coverage = await techDebtService.analyzeTestCoverage();
        res.json({ success: true, data: coverage });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/tech-debt/todos
 * TODOs y FIXMEs
 */
router.get('/todos', async (req, res) => {
    try {
        const todos = await techDebtService.scanTodosAndFixmes();
        res.json({ success: true, data: todos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/tech-debt/todos/:itemId/resolve
 * Resolver un TODO/FIXME
 */
router.post('/todos/:itemId/resolve', async (req, res) => {
    try {
        const { itemId } = req.params;
        const result = await techDebtService.resolveTodoItem(itemId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/tech-debt/docker
 * Análisis de imágenes Docker
 */
router.get('/docker', async (req, res) => {
    try {
        const analysis = await techDebtService.analyzeDockerImages();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/tech-debt/logs
 * Análisis de logs
 */
router.get('/logs', async (req, res) => {
    try {
        const period = req.query.period || '7d';
        const analysis = await techDebtService.analyzeLogs(period);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/tech-debt/system-health
 * Health check del sistema
 */
router.get('/system-health', async (req, res) => {
    try {
        const health = await techDebtService.performSystemHealthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/tech-debt/report
 * Reporte consolidado de deuda técnica
 */
router.get('/report', async (req, res) => {
    try {
        const report = await techDebtService.generateTechDebtReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

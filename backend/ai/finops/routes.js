/**
 * 💰 FINOPS ROUTES - Semana 30
 * 
 * Endpoints para Optimización de Costos:
 * - Análisis de costos
 * - Recursos subutilizados
 * - Oportunidades de caching
 * - Evaluación de modelos
 * - Presupuestos
 * - ROI
 * - Reportes
 * - Forecast
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const finOpsService = require('./finops_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('FINOPS_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/finops/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await finOpsService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/costs
 * Análisis de costos
 */
router.get('/costs', async (req, res) => {
    try {
        const period = req.query.period || 'monthly';
        const breakdown = await finOpsService.analyzeCostBreakdown(period);
        res.json({ success: true, data: breakdown });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/unused-resources
 * Recursos subutilizados
 */
router.get('/unused-resources', async (req, res) => {
    try {
        const resources = await finOpsService.identifyUnusedResources();
        res.json({ success: true, data: resources });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/caching
 * Oportunidades de caching
 */
router.get('/caching', async (req, res) => {
    try {
        const opportunities = await finOpsService.analyzeCachingOpportunities();
        res.json({ success: true, data: opportunities });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/model-costs
 * Evaluación de costos de modelos
 */
router.get('/model-costs', async (req, res) => {
    try {
        const costs = await finOpsService.evaluateModelCosts();
        res.json({ success: true, data: costs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/budgets
 * Presupuestos por departamento
 */
router.get('/budgets', async (req, res) => {
    try {
        const budgets = await finOpsService.getDepartmentBudgets();
        res.json({ success: true, data: budgets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/finops/budgets/alert
 * Configurar alerta de presupuesto
 */
router.post('/budgets/alert', async (req, res) => {
    try {
        const { department, threshold, alertType } = req.body;
        if (!department || !threshold) {
            return res.status(400).json({ success: false, error: 'Se requiere department y threshold' });
        }
        const alert = await finOpsService.setBudgetAlert(department, threshold, alertType);
        res.json({ success: true, data: alert });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/feature-roi
 * ROI por funcionalidad
 */
router.get('/feature-roi', async (req, res) => {
    try {
        const roi = await finOpsService.calculateFeatureROI();
        res.json({ success: true, data: roi });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/weekly-report
 * Reporte semanal de costos
 */
router.get('/weekly-report', async (req, res) => {
    try {
        const report = await finOpsService.generateWeeklyCostReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/savings
 * Validar ahorros logrados
 */
router.get('/savings', async (req, res) => {
    try {
        const period = req.query.period || 'monthly';
        const savings = await finOpsService.validateSavings(period);
        res.json({ success: true, data: savings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/finops/forecast
 * Proyección de costos
 */
router.get('/forecast', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 3;
        const forecast = await finOpsService.getCostForecast(months);
        res.json({ success: true, data: forecast });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

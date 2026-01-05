/**
 * 📋 STRATEGIC PLANNING ROUTES - Semana 39
 * 
 * Endpoints para Planificación Estratégica:
 * - Objetivos
 * - Necesidades
 * - Roadmap
 * - Presupuesto
 * - Infraestructura
 * - Contrataciones
 * - KPIs IA
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const planningService = require('./strategic_planning_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('STRATEGIC_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/planning/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await planningService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/objectives
 * Objetivos de alto nivel
 */
router.get('/objectives', async (req, res) => {
    try {
        const objectives = await planningService.defineHighLevelObjectives();
        res.json({ success: true, data: objectives });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/business-needs
 * Evaluación de necesidades
 */
router.get('/business-needs', async (req, res) => {
    try {
        const needs = await planningService.evaluateBusinessNeeds();
        res.json({ success: true, data: needs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/roadmap
 * Roadmap Year 2
 */
router.get('/roadmap', async (req, res) => {
    try {
        const roadmap = await planningService.createYearTwoRoadmap();
        res.json({ success: true, data: roadmap });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/budget
 * Plan de presupuesto
 */
router.get('/budget', async (req, res) => {
    try {
        const budget = await planningService.createBudgetPlan();
        res.json({ success: true, data: budget });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/infrastructure
 * Expansión de infraestructura
 */
router.get('/infrastructure', async (req, res) => {
    try {
        const infra = await planningService.planInfrastructureExpansion();
        res.json({ success: true, data: infra });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/hiring
 * Plan de contrataciones
 */
router.get('/hiring', async (req, res) => {
    try {
        const hiring = await planningService.planHiring();
        res.json({ success: true, data: hiring });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/ai-kpis
 * KPIs de IA
 */
router.get('/ai-kpis', async (req, res) => {
    try {
        const kpis = await planningService.defineAIKPIs();
        res.json({ success: true, data: kpis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/data-strategy
 * Estrategia de datos
 */
router.get('/data-strategy', async (req, res) => {
    try {
        const strategy = await planningService.defineDataStrategy();
        res.json({ success: true, data: strategy });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/tech-upgrades
 * Actualizaciones tecnológicas
 */
router.get('/tech-upgrades', async (req, res) => {
    try {
        const upgrades = await planningService.planTechnologyUpgrades();
        res.json({ success: true, data: upgrades });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/innovation
 * Proyectos de innovación
 */
router.get('/innovation', async (req, res) => {
    try {
        const projects = await planningService.identifyInnovationProjects();
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/planning/validate
 * Validar con stakeholders
 */
router.post('/validate', async (req, res) => {
    try {
        const { planId } = req.body;
        const validation = await planningService.validateWithStakeholders(planId);
        res.json({ success: true, data: validation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/schedule
 * Cronograma macro
 */
router.get('/schedule', async (req, res) => {
    try {
        const schedule = await planningService.createMacroSchedule();
        res.json({ success: true, data: schedule });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/planning/budget-approval
 * Solicitar aprobación de presupuesto
 */
router.post('/budget-approval', async (req, res) => {
    try {
        const approval = await planningService.requestBudgetApproval();
        res.json({ success: true, data: approval });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/planning/strategic-plan
 * Plan estratégico completo
 */
router.get('/strategic-plan', async (req, res) => {
    try {
        const plan = await planningService.generateStrategicPlan();
        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

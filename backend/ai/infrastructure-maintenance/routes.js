/**
 * 🔧 INFRASTRUCTURE MAINTENANCE ROUTES - Semana 40
 * 
 * Endpoints para Mantenimiento Mayor:
 * - BD upgrades
 * - Migraciones
 * - Re-arquitectura
 * - Limpieza DW
 * - Rotación claves
 * - DRP tests
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const maintService = require('./infrastructure_maintenance_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('INFRA_MAINT_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/infrastructure/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await maintService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/database/upgrade
 * Actualizar versiones de BD
 */
router.post('/database/upgrade', async (req, res) => {
    try {
        const upgrade = await maintService.upgradeDatabaseVersions();
        res.json({ success: true, data: upgrade });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/systems/migrate
 * Migrar sistemas/clusters
 */
router.post('/systems/migrate', async (req, res) => {
    try {
        const migration = await maintService.migrateSystemsOrClusters();
        res.json({ success: true, data: migration });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/rearchitect
 * Re-arquitectura de componentes
 */
router.post('/rearchitect', async (req, res) => {
    try {
        const rearch = await maintService.rearchitectComponents();
        res.json({ success: true, data: rearch });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/datawarehouse/cleanup
 * Limpieza de Data Warehouse
 */
router.post('/datawarehouse/cleanup', async (req, res) => {
    try {
        const cleanup = await maintService.cleanupDataWarehouse();
        res.json({ success: true, data: cleanup });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/keys/rotate
 * Rotación de claves
 */
router.post('/keys/rotate', async (req, res) => {
    try {
        const rotation = await maintService.rotateCryptographicKeys();
        res.json({ success: true, data: rotation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/drp/test
 * Pruebas DRP
 */
router.post('/drp/test', async (req, res) => {
    try {
        const drp = await maintService.performDRPTests();
        res.json({ success: true, data: drp });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/models/retrain
 * Re-entrenar modelos base
 */
router.post('/models/retrain', async (req, res) => {
    try {
        const retrain = await maintService.retrainBaseModels();
        res.json({ success: true, data: retrain });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/network/optimize
 * Optimizar red
 */
router.post('/network/optimize', async (req, res) => {
    try {
        const network = await maintService.optimizeNetworkTopology();
        res.json({ success: true, data: network });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/ai-frameworks/update
 * Actualizar frameworks IA
 */
router.post('/ai-frameworks/update', async (req, res) => {
    try {
        const update = await maintService.updateAIFrameworks();
        res.json({ success: true, data: update });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/infrastructure/physical
 * Mantenimiento físico
 */
router.get('/physical', async (req, res) => {
    try {
        const physical = await maintService.performPhysicalMaintenance();
        res.json({ success: true, data: physical });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/vectors/reindex
 * Re-indexar bases vectoriales
 */
router.post('/vectors/reindex', async (req, res) => {
    try {
        const reindex = await maintService.reindexVectorDatabases();
        res.json({ success: true, data: reindex });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/infrastructure/security/validate
 * Validar seguridad post-mantenimiento
 */
router.get('/security/validate', async (req, res) => {
    try {
        const validation = await maintService.validateSecurityPostMaintenance();
        res.json({ success: true, data: validation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/regression/run
 * Ejecutar tests de regresión
 */
router.post('/regression/run', async (req, res) => {
    try {
        const tests = await maintService.runRegressionTests();
        res.json({ success: true, data: tests });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/infrastructure/restore
 * Restaurar servicios
 */
router.post('/restore', async (req, res) => {
    try {
        const restore = await maintService.restoreServices();
        res.json({ success: true, data: restore });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/infrastructure/report
 * Obtener reporte completo de mantenimiento
 */
router.get('/report', async (req, res) => {
    try {
        const report = await maintService.generateMaintenanceReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

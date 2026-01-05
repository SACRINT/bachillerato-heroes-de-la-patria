/**
 * ⚡ YEAR 2 OPTIMIZATION ROUTES - Semana 45
 */
const express = require('express');
const router = express.Router();
const service = require('./year2_optimization_service');

router.get('/health', async (req, res) => {
    try { res.json({ success: true, data: await service.healthCheck() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/ai-models', async (req, res) => {
    try { res.json({ success: true, data: await service.optimizeAIModels() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/database', async (req, res) => {
    try { res.json({ success: true, data: await service.optimizeDatabase() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/infrastructure', async (req, res) => {
    try { res.json({ success: true, data: await service.optimizeInfrastructure() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/api', async (req, res) => {
    try { res.json({ success: true, data: await service.optimizeAPIPerformance() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/summary', async (req, res) => {
    try { res.json({ success: true, data: await service.getOptimizationSummary() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;

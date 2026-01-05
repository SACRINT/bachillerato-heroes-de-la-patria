/**
 * 🔗 YEAR 2 INTEGRATION ROUTES - Semana 47
 */
const express = require('express');
const router = express.Router();
const service = require('./year2_integration_service');

router.get('/health', async (req, res) => {
    try { res.json({ success: true, data: await service.healthCheck() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/erp', async (req, res) => {
    try { res.json({ success: true, data: await service.configureERPIntegration() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/sis', async (req, res) => {
    try { res.json({ success: true, data: await service.configureSISIntegration() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/payments', async (req, res) => {
    try { res.json({ success: true, data: await service.configurePaymentGateway() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/notifications', async (req, res) => {
    try { res.json({ success: true, data: await service.configureNotificationServices() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/analytics', async (req, res) => {
    try { res.json({ success: true, data: await service.configureAnalyticsPlatforms() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/summary', async (req, res) => {
    try { res.json({ success: true, data: await service.getIntegrationSummary() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;

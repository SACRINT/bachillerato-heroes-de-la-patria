/**
 * 🔐 YEAR 2 SECURITY ROUTES - Semana 46
 */
const express = require('express');
const router = express.Router();
const service = require('./year2_security_service');

router.get('/health', async (req, res) => {
    try { res.json({ success: true, data: await service.healthCheck() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/audit', async (req, res) => {
    try { res.json({ success: true, data: await service.runSecurityAudit() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/pentest', async (req, res) => {
    try { res.json({ success: true, data: await service.runPenetrationTest() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/threat-protection', async (req, res) => {
    try { res.json({ success: true, data: await service.configureAdvancedThreatProtection() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/compliance', async (req, res) => {
    try { res.json({ success: true, data: await service.getComplianceStatus() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/summary', async (req, res) => {
    try { res.json({ success: true, data: await service.getSecuritySummary() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;

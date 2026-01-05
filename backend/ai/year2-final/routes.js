/**
 * 🏆 YEAR 2 FINAL ROUTES - Semana 48
 */
const express = require('express');
const router = express.Router();
const service = require('./year2_final_service');

router.get('/health', async (req, res) => {
    try { res.json({ success: true, data: await service.healthCheck() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/report', async (req, res) => {
    try { res.json({ success: true, data: await service.generateFinalReport() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/transition', async (req, res) => {
    try { res.json({ success: true, data: await service.prepareYear3Transition() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/archive', async (req, res) => {
    try { res.json({ success: true, data: await service.archiveYear2Data() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/celebration', async (req, res) => {
    try { res.json({ success: true, data: await service.celebrateAchievements() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/summary', async (req, res) => {
    try { res.json({ success: true, data: await service.getYear2Summary() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;

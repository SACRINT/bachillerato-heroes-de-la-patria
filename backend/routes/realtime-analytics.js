/**
 * ⏱️ REAL-TIME ANALYTICS ROUTES
 * Propósito: API para heartbeats y dashboards en vivo (Fase 6 - Semana 47)
 */

const express = require('express');
const router = express.Router();
const realtimeService = require('../services/realtime-analytics.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Heartbeat del cliente (cada 30s)
router.post('/heartbeat', async (req, res) => {
    try {
        const { page, action, device } = req.body;
        await realtimeService.recordHeartbeat(req.user.id, page, action, device);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Dashboard Docente: Estado en vivo
router.get('/class/:classId', async (req, res) => {
    try {
        const metrics = await realtimeService.getLiveClassMetrics(req.params.classId);
        res.json({ success: true, data: metrics });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

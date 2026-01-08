/**
 * ❤️ SENTIMENT ANALYSIS ROUTES
 * Propósito: API para análisis de texto y moderación (Fase 6 - Semana 44)
 */

const express = require('express');
const router = express.Router();
const sentimentService = require('../services/sentiment-analysis.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Analizar texto (usado internamente o por frontend antes de postear)
router.post('/analyze', async (req, res) => {
    try {
        const { text, sourceType, sourceId } = req.body;
        const result = await sentimentService.analyzeText(req.user.id, sourceType || 'temp', sourceId || 0, text);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Admin: Obtener alertas de moderación
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await sentimentService.getAlerts();
        res.json({ success: true, data: alerts });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

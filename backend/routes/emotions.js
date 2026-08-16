const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const emotionalService = require('../services/emotional-analytics.service.js');

// POST /api/emotions/track
router.post('/track', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { emotion, source, context } = req.body;

        if (!emotion) return res.status(400).json({ error: 'Emotion name required' });

        await emotionalService.trackEmotion(userId, emotion, source, context);
        res.json({ success: true });
    } catch (error) {
        console.error('Track emotion error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/emotions/current
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const state = await emotionalService.getCurrentState(userId);
        res.json({ success: true, data: state });
    } catch (error) {
        console.error('Get emotional state error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/emotions/check-intervention
router.get('/check-intervention', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const check = await emotionalService.checkInterventionNeeded(userId);
        res.json({ success: true, data: check });
    } catch (error) {
        console.error('Check intervention error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/emotions/history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = req.query.limit || 10;
        const history = await emotionalService.getEmotionHistory(userId, limit);
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

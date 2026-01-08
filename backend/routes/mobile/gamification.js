const express = require('express');
const router = express.Router();
const mobileGamificationService = require('../../services/mobile-gamification.service');
const { authenticateToken } = require('../../middleware/auth');

// POST /api/gamification/spin
// Girar la ruleta diaria
router.post('/spin', authenticateToken, async (req, res) => {
    try {
        const reward = await mobileGamificationService.spinDailyWheel(req.user.id);
        res.json({ success: true, data: reward });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// POST /api/gamification/score
// Registrar puntaje de juego
router.post('/score', authenticateToken, async (req, res) => {
    try {
        const { gameId, score, combo } = req.body;
        const result = await mobileGamificationService.submitGameScore(req.user.id, gameId, score, combo || 0);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

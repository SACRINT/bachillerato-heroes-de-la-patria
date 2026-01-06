const express = require('express');
const router = express.Router();
const mobileWidgetService = require('../services/mobile-widget.service');
const { authenticateToken } = require('../middleware/auth');

// GET /api/widgets/streak
// Datos para el widget de racha (Autenticado)
router.get('/streak', authenticateToken, async (req, res) => {
    try {
        const data = await mobileWidgetService.getStreakWidgetData(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

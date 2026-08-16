const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const recommendationService = require('../services/recommendations.service.js');

// GET /api/ai/recommendations
// Obtiene recursos sugeridos para el estudiante
router.get('/', authenticateToken, async (req, res) => {
    try {
        const resources = await recommendationService.getRecommendations(req.user.id);
        res.json({ success: true, data: resources });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo recomendaciones' });
    }
});

module.exports = router;

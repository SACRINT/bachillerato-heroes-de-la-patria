const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const adaptiveService = require('../services/adaptive-content.service.js');

// GET /api/adaptive-content/:nodeId
// Obtiene el contenido optimizado para el usuario
router.get('/:nodeId', authenticateToken, async (req, res) => {
    try {
        const { nodeId } = req.params;
        const result = await adaptiveService.getContentForNode(req.user.id, nodeId);

        if (!result) {
            return res.status(404).json({ success: false, message: 'No adaptation found for this content' });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/adaptive-content/log
// Registra interacción para mejorar el algoritmo
router.post('/log', authenticateToken, async (req, res) => {
    try {
        const { adaptationId, interactionType, score, success } = req.body;
        // interactionType: 'view', 'quiz', 'complete'

        await adaptiveService.logInteraction(req.user.id, adaptationId, {
            type: interactionType,
            score: score || 0,
            success: success || false
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

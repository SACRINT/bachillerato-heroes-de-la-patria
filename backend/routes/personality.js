const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const personalityService = require('../services/personality-profiling.service');

// GET /api/personality/profile
// Obtiene el perfil de aprendizaje del usuario
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const profile = await personalityService.getProfile(req.user.id);
        res.json({ success: true, data: profile || null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/personality/assess
// Procesa el test de estilo de aprendizaje (VAK)
router.post('/assess', authenticateToken, async (req, res) => {
    try {
        const { responses } = req.body;
        // responses:Array<{ questionId, category, value }>

        if (!responses || !Array.isArray(responses)) {
            return res.status(400).json({ success: false, error: 'Invalid responses format' });
        }

        const profile = await personalityService.processVAKAssessment(req.user.id, responses);
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

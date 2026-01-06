const express = require('express');
const router = express.Router();
const voiceInterfaceService = require('../services/voice-interface.service');
const { authenticateToken } = require('../middleware/auth');

// POST /api/voice/command
// Procesa un comando de texto (transcrito desde voz en el cliente mobile)
router.post('/command', authenticateToken, async (req, res) => {
    try {
        const { transcript } = req.body;
        if (!transcript) {
            return res.status(400).json({ success: false, error: 'Transcript is required' });
        }

        const result = await voiceInterfaceService.processCommand(req.user.id, transcript);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

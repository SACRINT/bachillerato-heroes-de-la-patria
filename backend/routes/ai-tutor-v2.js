/**
 * 🤖 AI TUTOR V2 ROUTES
 * Propósito: API para el chat contextual (Fase 6 - Semana 42)
 */

const express = require('express');
const router = express.Router();
const tutorService = require('../services/ai-tutor-v2.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/session/start', async (req, res) => {
    try {
        const { topic } = req.body;
        const session = await tutorService.startSession(req.user.id, topic);
        res.json({ success: true, data: session });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const response = await tutorService.sendMessage(sessionId, req.user.id, message);
        res.json({ success: true, data: response });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

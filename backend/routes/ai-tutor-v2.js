/**
 * 🤖 AI TUTOR V2 ROUTES (Contextual Multi-turn Chat API)
 * Bachillerato General Estatal "Héroes de la Patria"
 * FASE 5 (Semanas 18-20)
 */

const express = require('express');
const router = express.Router();
const tutorService = require('../services/ai-tutor-v2.service.js');
const devLogger = require('../utils/devLogger.js');

// Iniciar nueva sesión de tutoría
router.post('/session/start', async (req, res) => {
    try {
        const { topic = 'Ciencias y Matemáticas', subject = 'Física' } = req.body;
        const userId = req.user?.id || req.body.userId || null;
        
        const session = await tutorService.startSession(userId, topic, subject);
        res.json({
            success: true,
            data: session
        });
    } catch (e) {
        devLogger.error('[AI-TUTOR-V2-ROUTE] Error in /session/start:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Enviar mensaje en la sesión (mantiene memoria)
router.post('/chat', async (req, res) => {
    try {
        const { sessionId, message, subject } = req.body;
        const userId = req.user?.id || req.body.userId || null;

        if (!sessionId || !message) {
            return res.status(400).json({
                success: false,
                error: 'sessionId y message son obligatorios'
            });
        }

        const response = await tutorService.sendMessage(sessionId, userId, message, subject);
        res.json({
            success: true,
            data: response
        });
    } catch (e) {
        devLogger.error('[AI-TUTOR-V2-ROUTE] Error in /chat:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Obtener historial completo de la sesión
router.get('/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 30;
        const history = await tutorService.getSessionHistory(sessionId, limit);

        res.json({
            success: true,
            data: {
                sessionId,
                messagesCount: history.length,
                messages: history
            }
        });
    } catch (e) {
        devLogger.error('[AI-TUTOR-V2-ROUTE] Error in /history:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const personalityService = require('../services/personality-profiling.service');
const devLogger = require('../utils/devLogger');

// ==========================================
// AI HYPERPERSONALIZATION ROUTES
// Fase 2: Semanas 9-16
// ==========================================

/**
 * GET /api/ai/personality/me
 * Obtener mi perfil de aprendizaje
 */
router.get('/personality/me', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await personalityService.getProfile(userId);

        if (!profile) {
            return res.json({ success: true, data: null, message: 'Perfil no configurado aún' });
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        devLogger.error('[AI-Hyper] Error getting personality profile', error);
        next(error);
    }
});

/**
 * POST /api/ai/personality/assess
 * Enviar respuestas del quiz VAK
 * Body: { responses: [{ questionId, category, value }, ...] }
 */
router.post('/personality/assess', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { responses } = req.body;

        if (!responses || !Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json({ success: false, error: 'Respuestas inválidas' });
        }

        const profile = await personalityService.processVAKAssessment(userId, responses);

        // Bonus: Dar achievement 'Self Aware' si es la primera vez (Lógica futura)

        res.json({ success: true, data: profile, message: 'Perfil de aprendizaje generado exitosamente' });
    } catch (error) {
        devLogger.error('[AI-Hyper] Error processing assessment', error);
        next(error);
    }
});

const adaptiveContentService = require('../services/adaptive-content.service');

// ==========================================
// ADAPTIVE CONTENT (Semana 10)
// ==========================================

/**
 * GET /api/ai/hyper/content/adaptive/:nodeId
 * Obtener contenido optimizado para el usuario
 */
router.get('/content/adaptive/:nodeId', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const nodeId = req.params.nodeId;

        const result = await adaptiveContentService.getContentForNode(userId, nodeId);

        if (!result) {
            return res.status(404).json({ success: false, message: 'No se encontró contenido adaptado para este nodo' });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        devLogger.error('[AI-Hyper] Error getting adaptive content', error);
        next(error);
    }
});

/**
 * POST /api/ai/hyper/content/interaction
 * Registrar interacción y ajustar dificultad
 */
router.post('/content/interaction', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { adaptationId, type, score, success = true } = req.body;

        if (!adaptationId || !type) {
            return res.status(400).json({ success: false, error: 'Datos incompletos' });
        }

        await adaptiveContentService.logInteraction(userId, adaptationId, { type, score, success });

        res.json({ success: true, message: 'Interacción registrada' });
    } catch (error) {
        devLogger.error('[AI-Hyper] Error logging interaction', error);
        next(error);
    }
});

module.exports = router;

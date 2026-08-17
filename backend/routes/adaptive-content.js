/**
 * 🎓 ADAPTIVE CONTENT & VAK ROUTES
 * Bachillerato General Estatal "Héroes de la Patria"
 * FASE 5 (Semanas 18-20)
 */

const express = require('express');
const router = express.Router();
const personalityService = require('../services/personality-profiling.service.js');
const devLogger = require('../utils/devLogger.js');

// 1. Procesar Cuestionario VAK
router.post('/vak/assess', async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || 1;
        const { responses = [] } = req.body;

        const profile = await personalityService.processVAKAssessment(userId, responses);
        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        devLogger.error('[ADAPTIVE-CONTENT-ROUTE] Error in /vak/assess:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Obtener Perfil VAK de un usuario
router.get('/vak/profile/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId) || 1;
        const profile = await personalityService.getProfile(userId);
        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        devLogger.error('[ADAPTIVE-CONTENT-ROUTE] Error in /vak/profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Recomendación de formato de lección según VAK
router.get('/recommend/:topic', async (req, res) => {
    try {
        const topic = decodeURIComponent(req.params.topic);
        const userId = req.user?.id || parseInt(req.query.userId) || 1;
        
        // Obtener estilo dominante del alumno
        const profile = await personalityService.getProfile(userId);
        const dominantStyle = profile?.dominant_style || req.query.style || 'visual';

        const recommendation = personalityService.getLessonRecommendation(dominantStyle, topic);
        res.json({
            success: true,
            data: {
                userId,
                ...recommendation
            }
        });
    } catch (error) {
        devLogger.error('[ADAPTIVE-CONTENT-ROUTE] Error in /recommend:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Agendar Repaso Espaciado (Spaced Repetition)
router.post('/spaced-repetition/schedule', async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || 1;
        const { subject = 'Matemáticas', topic = 'Álgebra', score = 4 } = req.body;

        const schedule = await personalityService.scheduleSpacedRepetition(userId, subject, topic, score);
        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        devLogger.error('[ADAPTIVE-CONTENT-ROUTE] Error in /spaced-repetition/schedule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Consultar temas pendientes de repaso
router.get('/spaced-repetition/due/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId) || 1;
        const dueReviews = await personalityService.getDueReviews(userId);

        res.json({
            success: true,
            data: {
                userId,
                count: dueReviews.length,
                reviews: dueReviews
            }
        });
    } catch (error) {
        devLogger.error('[ADAPTIVE-CONTENT-ROUTE] Error in /spaced-repetition/due:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

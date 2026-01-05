/**
 * 🎮 SMART GAMIFICATION API ROUTES - Semana 26
 * 
 * Endpoints para Gamificación Inteligente:
 * - Logros dinámicos
 * - Misiones personalizadas
 * - Narrativa evolutiva
 * - Detección de trampas
 * - Avatares evolutivos
 * - Feedback en tiempo real
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const gamificationService = require('./smart_gamification_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('SMART_GAMIFICATION_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/smart-gamification/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await gamificationService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Logros Dinámicos ============

/**
 * POST /api/ai/smart-gamification/achievements/generate
 * Generar logro dinámico basado en comportamiento
 */
router.post('/achievements/generate', async (req, res) => {
    try {
        const { studentId, behavior } = req.body;
        if (!studentId || !behavior) {
            return res.status(400).json({ success: false, error: 'Se requiere studentId y behavior' });
        }
        const result = await gamificationService.generateDynamicAchievement(studentId, behavior);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Misiones Personalizadas ============

/**
 * GET /api/ai/smart-gamification/missions/:studentId
 * Obtener misiones personalizadas para estudiante
 */
router.get('/missions/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const missions = await gamificationService.generatePersonalizedMissions(studentId);
        res.json({ success: true, data: missions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Narrativa Evolutiva ============

/**
 * POST /api/ai/smart-gamification/narrative
 * Generar actualización de narrativa
 */
router.post('/narrative', async (req, res) => {
    try {
        const { studentId, event } = req.body;
        if (!studentId) {
            return res.status(400).json({ success: false, error: 'Se requiere studentId' });
        }
        const narrative = await gamificationService.generateNarrativeUpdate(studentId, event || {});
        res.json({ success: true, data: narrative });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Detección de Trampas ============

/**
 * POST /api/ai/smart-gamification/anti-cheat/analyze
 * Analizar actividad por comportamiento sospechoso
 */
router.post('/anti-cheat/analyze', async (req, res) => {
    try {
        const { studentId, activity } = req.body;
        if (!studentId || !activity) {
            return res.status(400).json({ success: false, error: 'Se requiere studentId y activity' });
        }
        const result = await gamificationService.detectCheatBehavior(studentId, activity);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Avatares Evolutivos ============

/**
 * GET /api/ai/smart-gamification/avatar/:studentId
 * Obtener estado del avatar
 */
router.get('/avatar/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const avatar = await gamificationService.getAvatarState(studentId);
        res.json({ success: true, data: avatar });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Feedback en Tiempo Real ============

/**
 * POST /api/ai/smart-gamification/feedback
 * Generar feedback lúdico
 */
router.post('/feedback', async (req, res) => {
    try {
        const { studentId, event } = req.body;
        if (!studentId || !event) {
            return res.status(400).json({ success: false, error: 'Se requiere studentId y event' });
        }
        const feedback = await gamificationService.generateRealTimeFeedback(studentId, event);
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Dificultad Adaptativa ============

/**
 * GET /api/ai/smart-gamification/difficulty/:studentId
 * Ajustar dificultad para estudiante
 */
router.get('/difficulty/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const difficulty = await gamificationService.adjustDifficulty(studentId);
        res.json({ success: true, data: difficulty });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Social Inteligente ============

/**
 * GET /api/ai/smart-gamification/team-suggestion/:studentId
 * Sugerir formación de equipo
 */
router.get('/team-suggestion/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const suggestion = await gamificationService.suggestTeamFormation(studentId);
        res.json({ success: true, data: suggestion });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

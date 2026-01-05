/**
 * 📚 CONTENT RECOMMENDATION API ROUTES - Semana 15
 * 
 * Endpoints para el Sistema de Recomendación de Contenidos:
 * - Recomendaciones personalizadas
 * - Catálogo de recursos
 * - Perfiles de usuario
 * - Feedback y ratings
 * - Recomendaciones de refuerzo
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const recommendationService = require('./recommendation_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('RECOMMENDATIONS_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/recommendations/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await recommendationService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/recommendations/catalog
 * Obtener catálogo de recursos con filtros
 */
router.get('/catalog', async (req, res) => {
    try {
        const filters = {
            subject: req.query.subject,
            difficulty: req.query.difficulty,
            type: req.query.type
        };
        const catalog = await recommendationService.getResourceCatalog(filters);
        res.json({ success: true, data: catalog });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/recommendations/profile/:userId
 * Obtener perfil de intereses del usuario
 */
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await recommendationService.createUserProfile(parseInt(userId));
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/recommendations/personalized/:userId
 * Obtener todas las recomendaciones personalizadas
 */
router.get('/personalized/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const recommendations = await recommendationService.getPersonalizedRecommendations(parseInt(userId));
        res.json({ success: true, data: recommendations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/recommendations/next-steps/:userId
 * Obtener recomendaciones "Próximos Pasos"
 */
router.get('/next-steps/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const nextSteps = await recommendationService.getNextStepsRecommendations(parseInt(userId));
        res.json({ success: true, data: nextSteps });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/recommendations/collaborative/:userId
 * Obtener recomendaciones por filtrado colaborativo
 */
router.get('/collaborative/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        const recommendations = await recommendationService.getCollaborativeRecommendations(parseInt(userId), limit);
        res.json({ success: true, data: recommendations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/recommendations/content-based/:userId
 * Obtener recomendaciones basadas en contenido
 */
router.get('/content-based/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        const recommendations = await recommendationService.getContentBasedRecommendations(parseInt(userId), limit);
        res.json({ success: true, data: recommendations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/recommendations/explore/:userId
 * Obtener recomendaciones de exploración
 */
router.get('/explore/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const recommendations = await recommendationService.getExplorationRecommendations(parseInt(userId));
        res.json({ success: true, data: recommendations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/recommendations/reinforcement/:userId
 * Obtener recomendaciones de refuerzo académico
 */
router.get('/reinforcement/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const recommendations = await recommendationService.getReinforcementRecommendations(parseInt(userId));
        res.json({ success: true, data: recommendations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/recommendations/feedback
 * Registrar feedback del usuario sobre un recurso
 */
router.post('/feedback', async (req, res) => {
    try {
        const { userId, resourceId, feedback } = req.body;
        if (!userId || !resourceId || !feedback) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren userId, resourceId y feedback'
            });
        }
        const result = await recommendationService.recordFeedback(userId, resourceId, feedback);
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/recommendations/rating
 * Registrar rating del usuario sobre un recurso
 */
router.post('/rating', async (req, res) => {
    try {
        const { userId, resourceId, rating } = req.body;
        if (!userId || !resourceId || rating === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren userId, resourceId y rating'
            });
        }
        const result = await recommendationService.recordRating(userId, resourceId, rating);
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

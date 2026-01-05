/**
 * 🚀 YEAR 2 FEATURES ROUTES - Semana 41
 * 
 * Endpoints para Features del Año 2:
 * - Mobile App
 * - Gamification
 * - Payments
 * - Parent Portal
 * - Voice Tutoring
 * - Adaptive Testing
 * - Multi-campus
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const featuresService = require('./year2_features_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('YEAR2_FEATURES_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/year2/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await featuresService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// MOBILE APP
// =========================================================

/**
 * GET /api/ai/year2/mobile-app/init
 * Inicializar Mobile App MVP
 */
router.get('/mobile-app/init', async (req, res) => {
    try {
        const result = await featuresService.initializeMobileAppMVP();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/year2/mobile-app/status
 * Estado del Mobile App
 */
router.get('/mobile-app/status', async (req, res) => {
    try {
        const status = await featuresService.getMobileAppStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// GAMIFICATION
// =========================================================

/**
 * GET /api/ai/year2/gamification/init
 * Inicializar Advanced Gamification
 */
router.get('/gamification/init', async (req, res) => {
    try {
        const result = await featuresService.initializeAdvancedGamification();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/year2/gamification/stats
 * Estadísticas de gamificación
 */
router.get('/gamification/stats', async (req, res) => {
    try {
        const stats = await featuresService.getGamificationStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// PAYMENTS
// =========================================================

/**
 * GET /api/ai/year2/payments/init
 * Inicializar Payment Integration
 */
router.get('/payments/init', async (req, res) => {
    try {
        const result = await featuresService.initializePaymentIntegration();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/year2/payments/status
 * Estado de pagos
 */
router.get('/payments/status', async (req, res) => {
    try {
        const status = await featuresService.getPaymentStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// PARENT PORTAL
// =========================================================

/**
 * GET /api/ai/year2/parent-portal/init
 * Inicializar Enhanced Parent Portal
 */
router.get('/parent-portal/init', async (req, res) => {
    try {
        const result = await featuresService.initializeEnhancedParentPortal();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// VOICE TUTORING
// =========================================================

/**
 * GET /api/ai/year2/voice-tutor/init
 * Inicializar Voice-based Tutoring
 */
router.get('/voice-tutor/init', async (req, res) => {
    try {
        const result = await featuresService.initializeVoiceTutoring();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// ADAPTIVE TESTING
// =========================================================

/**
 * GET /api/ai/year2/adaptive-test/init
 * Inicializar Adaptive Testing Engine
 */
router.get('/adaptive-test/init', async (req, res) => {
    try {
        const result = await featuresService.initializeAdaptiveTesting();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// MULTI-CAMPUS
// =========================================================

/**
 * GET /api/ai/year2/multicampus/init
 * Inicializar Multi-campus Support
 */
router.get('/multicampus/init', async (req, res) => {
    try {
        const result = await featuresService.initializeMultiCampusSupport();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// ADDITIONAL FEATURES
// =========================================================

/**
 * GET /api/ai/year2/collaboration/init
 * Inicializar Real-time Collaboration
 */
router.get('/collaboration/init', async (req, res) => {
    try {
        const result = await featuresService.initializeRealTimeCollaboration();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/year2/ai-scheduling/init
 * Inicializar AI Scheduling
 */
router.get('/ai-scheduling/init', async (req, res) => {
    try {
        const result = await featuresService.initializeAIScheduling();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/year2/learning-paths/init
 * Inicializar Learning Paths
 */
router.get('/learning-paths/init', async (req, res) => {
    try {
        const result = await featuresService.initializeLearningPaths();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// FEATURE MANAGEMENT
// =========================================================

/**
 * GET /api/ai/year2/features
 * Obtener todas las features
 */
router.get('/features', async (req, res) => {
    try {
        const features = await featuresService.getAllFeatures();
        res.json({ success: true, data: features });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/year2/roadmap
 * Obtener roadmap de features
 */
router.get('/roadmap', async (req, res) => {
    try {
        const roadmap = await featuresService.getFeatureRoadmap();
        res.json({ success: true, data: roadmap });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/year2/feature-flags
 * Toggle feature flag
 */
router.post('/feature-flags', async (req, res) => {
    try {
        const { featureName, enabled } = req.body;
        const result = await featuresService.toggleFeatureFlag(featureName, enabled);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/year2/feature-flags
 * Obtener feature flags
 */
router.get('/feature-flags', async (req, res) => {
    try {
        const flags = await featuresService.getFeatureFlags();
        res.json({ success: true, data: flags });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

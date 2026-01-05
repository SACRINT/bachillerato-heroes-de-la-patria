/**
 * 📚 KNOWLEDGE TRANSFER ROUTES - Semana 35
 * 
 * Endpoints para Documentación y Transferencia:
 * - Arquitectura
 * - Manuales
 * - Videos
 * - MLOps
 * - Knowledge base
 * - Brown Bag Sessions
 * - ADRs
 * - API docs
 * - Onboarding
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const ktService = require('./knowledge_transfer_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('KNOWLEDGE_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/knowledge/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await ktService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/architecture
 * Documentación de arquitectura
 */
router.get('/architecture', async (req, res) => {
    try {
        const doc = await ktService.generateArchitectureDoc();
        res.json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/manuals
 * Manuales de usuario
 */
router.get('/manuals', async (req, res) => {
    try {
        const manuals = await ktService.generateUserManuals();
        res.json({ success: true, data: manuals });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/videos
 * Tutoriales en video
 */
router.get('/videos', async (req, res) => {
    try {
        const videos = await ktService.generateVideoTutorials();
        res.json({ success: true, data: videos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/mlops
 * Documentación MLOps
 */
router.get('/mlops', async (req, res) => {
    try {
        const mlops = await ktService.documentMLOpsProcesses();
        res.json({ success: true, data: mlops });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/knowledge-base
 * Base de conocimiento
 */
router.get('/knowledge-base', async (req, res) => {
    try {
        const kb = await ktService.createKnowledgeBase();
        res.json({ success: true, data: kb });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/knowledge/brown-bag
 * Programar Brown Bag Session
 */
router.post('/brown-bag', async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ success: false, error: 'Se requiere topic' });
        }
        const session = await ktService.scheduleBrownBagSession(topic);
        res.json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/brown-bag/calendar
 * Calendario de Brown Bag Sessions
 */
router.get('/brown-bag/calendar', async (req, res) => {
    try {
        const calendar = await ktService.getBrownBagCalendar();
        res.json({ success: true, data: calendar });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/knowledge/adr
 * Crear ADR
 */
router.post('/adr', async (req, res) => {
    try {
        const decision = req.body;
        if (!decision.title) {
            return res.status(400).json({ success: false, error: 'Se requiere title' });
        }
        const adr = await ktService.createADR(decision);
        res.json({ success: true, data: adr });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/adr
 * Listar ADRs
 */
router.get('/adr', async (req, res) => {
    try {
        const adrs = await ktService.listADRs();
        res.json({ success: true, data: adrs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/api-docs
 * Documentación de API
 */
router.get('/api-docs', async (req, res) => {
    try {
        const docs = await ktService.generateAPIDocumentation();
        res.json({ success: true, data: docs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/onboarding/:role
 * Guía de onboarding por rol
 */
router.get('/onboarding/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const guide = await ktService.createOnboardingGuide(role);
        res.json({ success: true, data: guide });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/knowledge/package
 * Paquete completo de documentación
 */
router.get('/package', async (req, res) => {
    try {
        const pkg = await ktService.generateDocumentationPackage();
        res.json({ success: true, data: pkg });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

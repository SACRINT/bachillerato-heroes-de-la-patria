/**
 * 🎨 MULTIMODAL CHATBOT API ROUTES - Semana 17
 * 
 * Endpoints para el Chatbot Multimodal:
 * - Procesamiento de imágenes
 * - Transcripción de audio
 * - Síntesis de voz
 * - Generación de gráficos
 * - Integración con Tutor IA
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const multimodalService = require('./multimodal_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('MULTIMODAL_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/multimodal/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await multimodalService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/multimodal/config
 * Obtener configuración optimizada del chat
 */
router.get('/config', (req, res) => {
    try {
        const config = multimodalService.getOptimizedChatConfig();
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/multimodal/metrics
 * Obtener métricas del servicio
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = multimodalService.getMetrics();
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/multimodal/costs
 * Obtener estimación de costos
 */
router.get('/costs', (req, res) => {
    try {
        const costs = multimodalService.getCostEstimate();
        res.json({ success: true, data: costs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/multimodal/process-image
 * Procesar imagen
 */
router.post('/process-image', async (req, res) => {
    try {
        const { imageData, context } = req.body;
        if (!imageData) {
            return res.status(400).json({ success: false, error: 'Se requiere imageData' });
        }
        const result = await multimodalService.processImage(imageData, context);
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/multimodal/tutor-image
 * Procesar imagen para el Tutor IA
 */
router.post('/tutor-image', async (req, res) => {
    try {
        const { imageData, question, subject } = req.body;
        if (!imageData) {
            return res.status(400).json({ success: false, error: 'Se requiere imageData' });
        }
        const result = await multimodalService.processForTutor(imageData, question, subject);
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/multimodal/transcribe
 * Transcribir audio a texto
 */
router.post('/transcribe', async (req, res) => {
    try {
        const { audioData, language } = req.body;
        if (!audioData) {
            return res.status(400).json({ success: false, error: 'Se requiere audioData' });
        }
        const result = await multimodalService.transcribeAudio(audioData, language);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/multimodal/synthesize
 * Sintetizar texto a voz
 */
router.post('/synthesize', async (req, res) => {
    try {
        const { text, options } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere text' });
        }
        const result = await multimodalService.synthesizeSpeech(text, options);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/multimodal/generate-visual
 * Generar gráfico/diagrama
 */
router.post('/generate-visual', async (req, res) => {
    try {
        const { type, data } = req.body;
        if (!type) {
            return res.status(400).json({ success: false, error: 'Se requiere type' });
        }
        const result = await multimodalService.generateVisualResponse(type, data || {});
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/multimodal/validate-image
 * Validar seguridad de imagen
 */
router.post('/validate-image', async (req, res) => {
    try {
        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ success: false, error: 'Se requiere imageData' });
        }
        const result = await multimodalService.validateImageSafety(imageData);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/multimodal/latency
 * Obtener métricas de latencia
 */
router.get('/latency', (req, res) => {
    try {
        const latency = multimodalService.getLatencyMetrics();
        res.json({ success: true, data: latency });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

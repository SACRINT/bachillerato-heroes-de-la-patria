/**
 * ♿ ACCESSIBILITY AI ROUTES - Semana 27
 * 
 * Endpoints para Accesibilidad e Inclusión:
 * - Auditoría WCAG
 * - Speech-to-Text
 * - Simplificación de textos
 * - Alt-text automático
 * - Personalización visual
 * - Traducción
 * - Evaluación de sesgos
 * - Comandos de voz
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const accessibilityService = require('./accessibility_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('ACCESSIBILITY_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/accessibility/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await accessibilityService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Auditoría WCAG ============

/**
 * POST /api/ai/accessibility/audit
 * Auditar accesibilidad de una página
 */
router.post('/audit', async (req, res) => {
    try {
        const { url, level } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: 'Se requiere url' });
        }
        const result = await accessibilityService.auditAccessibility(url, { level });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Speech-to-Text ============

/**
 * POST /api/ai/accessibility/transcribe
 * Transcribir audio con detección de acentos
 */
router.post('/transcribe', async (req, res) => {
    try {
        const { audioData, language, detectAccent, sampleText } = req.body;
        const result = await accessibilityService.transcribeWithAccents(audioData, {
            language, detectAccent, sampleText
        });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Simplificación de Textos ============

/**
 * POST /api/ai/accessibility/simplify
 * Simplificar texto para facilitar lectura
 */
router.post('/simplify', async (req, res) => {
    try {
        const { text, targetLevel } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere text' });
        }
        const result = await accessibilityService.simplifyText(text, targetLevel);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Alt-Text Automático ============

/**
 * POST /api/ai/accessibility/alt-text
 * Generar alt-text para imagen
 */
router.post('/alt-text', async (req, res) => {
    try {
        const { imageUrl, context } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ success: false, error: 'Se requiere imageUrl' });
        }
        const result = await accessibilityService.generateAltText(imageUrl, context);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Configuración Chatbot Accesible ============

/**
 * GET /api/ai/accessibility/chatbot/config
 * Obtener configuración de chatbot accesible
 */
router.get('/chatbot/config', async (req, res) => {
    try {
        const config = await accessibilityService.getChatbotAccessibilityConfig();
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Personalización Visual ============

/**
 * POST /api/ai/accessibility/visual/adapt
 * Obtener adaptación visual personalizada
 */
router.post('/visual/adapt', async (req, res) => {
    try {
        const { userId, preferences } = req.body;
        const result = await accessibilityService.getVisualAdaptation(userId, preferences);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Traducción ============

/**
 * POST /api/ai/accessibility/translate
 * Traducir contenido a idiomas soportados
 */
router.post('/translate', async (req, res) => {
    try {
        const { text, targetLanguage, sourceLanguage } = req.body;
        if (!text || !targetLanguage) {
            return res.status(400).json({ success: false, error: 'Se requiere text y targetLanguage' });
        }
        const result = await accessibilityService.translateContent(text, targetLanguage, sourceLanguage);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Evaluación de Sesgos ============

/**
 * POST /api/ai/accessibility/bias/evaluate
 * Evaluar sesgos de un modelo de IA
 */
router.post('/bias/evaluate', async (req, res) => {
    try {
        const { modelId, testData } = req.body;
        if (!modelId) {
            return res.status(400).json({ success: false, error: 'Se requiere modelId' });
        }
        const result = await accessibilityService.evaluateBias(modelId, testData);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Comandos de Voz ============

/**
 * GET /api/ai/accessibility/voice/commands
 * Obtener lista de comandos de voz
 */
router.get('/voice/commands', async (req, res) => {
    try {
        const commands = await accessibilityService.getVoiceCommands();
        res.json({ success: true, data: commands });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/accessibility/voice/process
 * Procesar comando de voz
 */
router.post('/voice/process', async (req, res) => {
    try {
        const { command, context } = req.body;
        if (!command) {
            return res.status(400).json({ success: false, error: 'Se requiere command' });
        }
        const result = await accessibilityService.processVoiceCommand(command, context);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

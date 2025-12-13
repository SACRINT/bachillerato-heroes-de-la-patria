"use strict";
/**
 * 🤖 AI Generation Routes - TypeScript
 * Endpoints para generación de contenido con IA
 * FASE 1 - Semana 3-4
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
// @ts-ignore
const devLogger_1 = __importDefault(require("../utils/devLogger"));
const express_validator_1 = require("express-validator");
// @ts-ignore
const auth_1 = require("../middleware/auth");
// @ts-ignore
const AIGenerationService_1 = __importDefault(require("../services/AIGenerationService"));
const router = express_1.default.Router();
// =====================================================
// POST /api/ai/generate - Generar contenido con IA
// =====================================================
router.post('/generate', auth_1.authenticateToken, [
    (0, express_validator_1.body)('prompt').isString().isLength({ min: 10, max: 10000 }).withMessage('Prompt debe tener 10-10000 caracteres'),
    (0, express_validator_1.body)('provider').optional().isIn(['openai', 'anthropic', 'gemini']).withMessage('Proveedor inválido'),
    (0, express_validator_1.body)('model').optional().isString(),
    (0, express_validator_1.body)('generationType').optional().isIn(['text', 'essay', 'summary', 'code', 'explanation', 'quiz', 'translation']),
    (0, express_validator_1.body)('systemPrompt').optional().isString().isLength({ max: 2000 }),
    (0, express_validator_1.body)('maxTokens').optional().isInt({ min: 100, max: 4000 }).toInt(),
    (0, express_validator_1.body)('temperature').optional().isFloat({ min: 0, max: 2 }).toFloat()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        const userId = req.user.id;
        const { prompt, provider = 'openai', model = 'gpt-3.5-turbo', generationType = 'text', systemPrompt = '', maxTokens = 1000, temperature = 0.7 } = req.body;
        devLogger_1.default.log(`[AI-GENERATION] Usuario ${userId} solicita generación ${generationType} con ${provider}/${model}`);
        const result = await AIGenerationService_1.default.generate(userId, {
            provider,
            model,
            prompt,
            systemPrompt,
            generationType,
            maxTokens,
            temperature
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        devLogger_1.default.error('[AI-GENERATION] Error:', error);
        // Manejar errores específicos
        if (error.message.includes('Saldo insuficiente')) {
            res.status(402).json({
                success: false,
                message: error.message,
                code: 'INSUFFICIENT_BALANCE'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error al generar contenido'
        });
    }
});
// =====================================================
// GET /api/ai/history - Historial de generaciones
// =====================================================
router.get('/history', auth_1.authenticateToken, [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt()
], async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const result = await AIGenerationService_1.default.getUserGenerations(userId, limit, offset);
        res.json({
            success: true,
            data: result.generations,
            pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset
            }
        });
    }
    catch (error) {
        devLogger_1.default.error('[AI-GENERATION] Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de generaciones'
        });
    }
});
// =====================================================
// GET /api/ai/pricing - Precios de modelos
// =====================================================
router.get('/pricing', async (req, res) => {
    try {
        const pricing = AIGenerationService_1.default.getPricing();
        res.json({
            success: true,
            data: pricing
        });
    }
    catch (error) {
        devLogger_1.default.error('[AI-GENERATION] Error obteniendo precios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener precios'
        });
    }
});
// =====================================================
// GET /api/ai/types - Tipos de generación disponibles
// =====================================================
router.get('/types', async (req, res) => {
    try {
        const types = AIGenerationService_1.default.getGenerationTypes();
        res.json({
            success: true,
            data: types
        });
    }
    catch (error) {
        devLogger_1.default.error('[AI-GENERATION] Error obteniendo tipos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tipos de generación'
        });
    }
});
// =====================================================
// POST /api/ai/essay - Generar ensayo académico
// =====================================================
router.post('/essay', auth_1.authenticateToken, [
    (0, express_validator_1.body)('topic').isString().isLength({ min: 10, max: 500 }).withMessage('Tema requerido'),
    (0, express_validator_1.body)('length').optional().isIn(['short', 'medium', 'long']),
    (0, express_validator_1.body)('style').optional().isIn(['formal', 'casual', 'academic']),
    (0, express_validator_1.body)('provider').optional().isIn(['openai', 'anthropic', 'gemini'])
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        const userId = req.user.id;
        const { topic, length = 'medium', style = 'academic', provider = 'openai' } = req.body;
        const lengthTokens = { short: 500, medium: 1000, long: 2000 };
        const systemPrompt = `Eres un asistente académico experto. Escribe ensayos bien estructurados con introducción, desarrollo y conclusión. Estilo: ${style}.`;
        const prompt = `Escribe un ensayo ${style} sobre el siguiente tema: ${topic}

Incluye:
- Introducción con tesis clara
- Desarrollo con argumentos y evidencias
- Conclusión que resuma los puntos principales

Longitud: ${length}`;
        const result = await AIGenerationService_1.default.generate(userId, {
            provider,
            model: provider === 'openai' ? 'gpt-4' : provider === 'anthropic' ? 'claude-3-sonnet' : 'gemini-pro',
            prompt,
            systemPrompt,
            generationType: 'essay',
            maxTokens: lengthTokens[length],
            temperature: 0.7
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        devLogger_1.default.error('[AI-GENERATION] Error generando ensayo:', error);
        if (error.message.includes('Saldo insuficiente')) {
            res.status(402).json({
                success: false,
                message: error.message,
                code: 'INSUFFICIENT_BALANCE'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error al generar ensayo'
        });
    }
});
// =====================================================
// POST /api/ai/explain - Explicar concepto educativo
// =====================================================
router.post('/explain', auth_1.authenticateToken, [
    (0, express_validator_1.body)('concept').isString().isLength({ min: 3, max: 500 }).withMessage('Concepto requerido'),
    (0, express_validator_1.body)('subject').optional().isString(),
    (0, express_validator_1.body)('level').optional().isIn(['basic', 'intermediate', 'advanced']),
    (0, express_validator_1.body)('provider').optional().isIn(['openai', 'anthropic', 'gemini'])
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        const userId = req.user.id;
        const { concept, subject = 'general', level = 'intermediate', provider = 'openai' } = req.body;
        const systemPrompt = `Eres un profesor experto que explica conceptos de forma clara y pedagógica. Adapta tu explicación al nivel del estudiante.`;
        const prompt = `Explica el siguiente concepto de forma clara y didáctica:

Concepto: ${concept}
Materia: ${subject}
Nivel: ${level}

Incluye:
- Definición clara
- Ejemplos prácticos
- Analogías si es útil
- Puntos clave a recordar`;
        const result = await AIGenerationService_1.default.generate(userId, {
            provider,
            model: 'gpt-3.5-turbo',
            prompt,
            systemPrompt,
            generationType: 'explanation',
            maxTokens: 1000,
            temperature: 0.5
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        devLogger_1.default.error('[AI-GENERATION] Error explicando concepto:', error);
        if (error.message.includes('Saldo insuficiente')) {
            res.status(402).json({
                success: false,
                message: error.message,
                code: 'INSUFFICIENT_BALANCE'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error al explicar concepto'
        });
    }
});
// =====================================================
// POST /api/ai/quiz - Generar quiz de evaluación
// =====================================================
router.post('/quiz', auth_1.authenticateToken, [
    (0, express_validator_1.body)('topic').isString().isLength({ min: 5, max: 500 }).withMessage('Tema requerido'),
    (0, express_validator_1.body)('questionCount').optional().isInt({ min: 3, max: 20 }).toInt(),
    (0, express_validator_1.body)('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    (0, express_validator_1.body)('provider').optional().isIn(['openai', 'anthropic', 'gemini'])
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        const userId = req.user.id;
        const { topic, questionCount = 5, difficulty = 'medium', provider = 'openai' } = req.body;
        const systemPrompt = `Eres un experto en evaluación educativa. Genera preguntas de opción múltiple claras y bien estructuradas.`;
        const prompt = `Genera un quiz sobre: ${topic}

Requisitos:
- ${questionCount} preguntas de opción múltiple
- Dificultad: ${difficulty}
- 4 opciones por pregunta (a, b, c, d)
- Incluir la respuesta correcta

Formato JSON:
{
  "questions": [
    {
      "question": "...",
      "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
      "correct": "a",
      "explanation": "..."
    }
  ]
}`;
        const result = await AIGenerationService_1.default.generate(userId, {
            provider,
            model: 'gpt-3.5-turbo',
            prompt,
            systemPrompt,
            generationType: 'quiz',
            maxTokens: 2000,
            temperature: 0.3
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        devLogger_1.default.error('[AI-GENERATION] Error generando quiz:', error);
        if (error.message.includes('Saldo insuficiente')) {
            res.status(402).json({
                success: false,
                message: error.message,
                code: 'INSUFFICIENT_BALANCE'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error al generar quiz'
        });
    }
});
module.exports = router;
//# sourceMappingURL=ai-generation.js.map
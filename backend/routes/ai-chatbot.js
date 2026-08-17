"use strict";
/**
 * 💬 AI CHATBOT ROUTES - GPT-4 POWERED
 * SEMANA 18 - AI Chatbot Endpoints
 * Refactored: Jan 2026 (AI Orchestrator Integration)
 *
 * Endpoints para chatbot inteligente con GPT-4 via AI Orchestrator.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
// @ts-ignore
const auth_1 = require('../middleware/auth.js');
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// @ts-ignore
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
// @ts-ignore
const ai_chatbot_dao_1 = __importDefault(require('../data/ai-chatbot.dao.js'));
// @ts-ignore
const { aiService } = require('../services/ai/AIService.js');
// @ts-ignore
const health_dao_1 = __importDefault(require('../data/health.dao.js'));

const router = express_1.default.Router();

// ============================================
// RATE LIMITING
// ============================================
// Límite para usuarios autenticados: 30 mensajes por hora
const authenticatedLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 30,
    message: {
        error: 'rate_limit_exceeded',
        message: 'Has alcanzado el límite de mensajes por hora. Intenta más tarde.',
        retryAfter: 3600 // segundos
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Límite para usuarios anónimos: 10 mensajes por hora
const anonymousLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: {
        error: 'rate_limit_exceeded',
        message: 'Has alcanzado el límite de mensajes. Inicia sesión para más interacciones.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// USER ROUTES
// ============================================

/**
 * GET /api/ai-chatbot/health
 * Health check para el cliente del chatbot
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'BGE AI Chatbot with RAG',
        availableModel: 'gemini-2.0-flash',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/ai-chatbot/message
 * Enviar mensaje al chatbot (con o sin autenticación)
 */
router.post('/message', async (req, res) => {
    try {
        const message = req.body.message || req.body.payload?.message;
        const language = req.body.language || req.body.payload?.language || 'es';
        const includeContext = req.body.includeContext ?? req.body.payload?.includeContext ?? true;

        // Validación de mensaje
        if (!message || typeof message !== 'string') {
            res.status(400).json({
                error: 'invalid_message',
                message: 'El campo "message" es requerido y debe ser un string.'
            });
            return;
        }
        if (message.trim().length === 0) {
            res.status(400).json({
                error: 'empty_message',
                message: 'El mensaje no puede estar vacío.'
            });
            return;
        }
        if (message.length > 1000) {
            res.status(400).json({
                error: 'message_too_long',
                message: 'El mensaje no puede exceder 1000 caracteres.'
            });
            return;
        }

        // Obtener userId si está autenticado (opcional)
        const userId = req.user?.id || null;
        const isAuthenticated = userId !== null;
        devLogger_1.default.log(`[AI-CHATBOT-API] Message from ${isAuthenticated ? 'user ' + userId : 'anonymous'}`);

        // Aplicar rate limiting según autenticación
        if (isAuthenticated) {
            await new Promise((resolve, reject) => {
                authenticatedLimiter(req, res, (err) => {
                    if (err) reject(err); else resolve();
                });
            });
        } else {
            await new Promise((resolve, reject) => {
                anonymousLimiter(req, res, (err) => {
                    if (err) reject(err); else resolve();
                });
            });
        }

        // Generate response via AI Orchestrator
        const responseCallback = await aiService.processRequest('GENERAL_CHAT', {
            message,
            language,
            includeContext
        }, {
            userId: userId,
            username: req.user?.username,
            role: req.user?.role
        });

        res.status(200).json({
            success: true,
            ...responseCallback
        });

    } catch (error) {
        console.error('[AI-CHATBOT-API] Error processing message:', error);
        res.status(500).json({
            error: 'processing_error',
            message: 'Error al procesar tu mensaje. Intenta nuevamente.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/ai-chatbot/history
 * Obtener historial de conversación del usuario autenticado
 */
router.get('/history', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        devLogger_1.default.log(`[AI-CHATBOT-API] Fetching chat history for user ${userId} (limit: ${limit})`);

        const rawHistory = await ai_chatbot_dao_1.default.getChatHistory(userId, limit);

        // Format for frontend
        const history = rawHistory.reverse().flatMap(row => [
            { role: 'user', content: row.user_message },
            { role: 'assistant', content: row.assistant_message }
        ]);

        res.status(200).json({
            success: true,
            history,
            count: history.length
        });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Error fetching history:', error);
        res.status(500).json({
            error: 'fetch_error',
            message: 'Error al obtener el historial de conversación.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * DELETE /api/ai-chatbot/history
 * Limpiar historial de conversación del usuario autenticado
 */
router.delete('/history', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        devLogger_1.default.log(`[AI-CHATBOT-API] Clearing chat history for user ${userId}`);
        const deletedCount = await ai_chatbot_dao_1.default.deleteChatHistory(userId);
        res.status(200).json({ success: true, message: 'Historial de conversación eliminado exitosamente.', deletedCount });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Error clearing history:', error);
        res.status(500).json({
            error: 'delete_error',
            message: 'Error al eliminar el historial de conversación.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ADMIN ROUTES - FAQ MANAGEMENT
// ============================================

/**
 * POST /api/ai-chatbot/faq
 * Crear nuevo FAQ (solo admin)
 */
router.post('/faq', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'administrativo']), async (req, res) => {
    try {
        const { pregunta, respuesta, categoria, idioma = 'es', activo = true } = req.body;

        // Validaciones
        if (!pregunta || !respuesta || !categoria) {
            res.status(400).json({
                error: 'missing_fields',
                message: 'Los campos "pregunta", "respuesta" y "categoria" son requeridos.'
            });
            return;
        }

        devLogger_1.default.log(`[AI-CHATBOT-API] Creating FAQ: ${pregunta.substring(0, 50)}...`);
        const faq = await ai_chatbot_dao_1.default.createFAQ({
            pregunta,
            respuesta,
            categoria,
            idioma,
            activo
        });

        res.status(201).json({
            success: true,
            faq,
            message: 'FAQ creado exitosamente.'
        });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Error creating FAQ:', error);
        res.status(500).json({
            error: 'create_error',
            message: 'Error al crear el FAQ.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/ai-chatbot/faq/:id
 * Actualizar FAQ existente (solo admin)
 */
router.put('/faq/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'administrativo']), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        if (isNaN(id)) {
            res.status(400).json({ error: 'invalid_id', message: 'ID inválido.' });
            return;
        }

        devLogger_1.default.log(`[AI-CHATBOT-API] Updating FAQ: ${id}`);
        const faq = await ai_chatbot_dao_1.default.updateFAQ(id, updates);

        if (!faq) {
            res.status(404).json({
                error: 'not_found',
                message: 'FAQ no encontrado.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            faq,
            message: 'FAQ actualizado exitosamente.'
        });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Error updating FAQ:', error);
        res.status(500).json({
            error: 'update_error',
            message: 'Error al actualizar el FAQ.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * DELETE /api/ai-chatbot/faq/:id
 * Eliminar FAQ (solo admin)
 */
router.delete('/faq/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'administrativo']), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'invalid_id', message: 'ID inválido.' });
            return;
        }

        devLogger_1.default.log(`[AI-CHATBOT-API] Deleting FAQ: ${id}`);
        const deletedFAQ = await ai_chatbot_dao_1.default.deleteFaq(id);

        if (!deletedFAQ) {
            res.status(404).json({ error: 'not_found', message: 'FAQ no encontrado.' });
            return;
        }

        res.status(200).json({ success: true, message: 'FAQ eliminado exitosamente.', deletedFAQ });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Error deleting FAQ:', error);
        res.status(500).json({
            error: 'delete_error',
            message: 'Error al eliminar el FAQ.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/ai-chatbot/faqs
 * Listar todos los FAQs con filtros opcionales (admin)
 */
router.get('/faqs', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'administrativo', 'docente']), async (req, res) => {
    try {
        const { categoria, idioma, activo, search } = req.query;
        const filters = { categoria, idioma, activo: activo === 'true' ? true : (activo === 'false' ? false : undefined), search };

        devLogger_1.default.log(`[AI-CHATBOT-API] Fetching FAQs with filters:`, filters);
        const faqs = await ai_chatbot_dao_1.default.getAllFAQs(filters);

        res.status(200).json({
            success: true,
            faqs,
            count: faqs.length
        });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Error fetching FAQs:', error);
        res.status(500).json({
            error: 'fetch_error',
            message: 'Error al obtener los FAQs.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/ai-chatbot/faqs/public
 * Listar FAQs públicos (sin autenticación)
 */
router.get('/faqs/public', async (req, res) => {
    try {
        const { categoria, idioma = 'es' } = req.query;
        const filters = {
            activo: true,
            idioma,
            categoria
        };

        console.log(`[AI-CHATBOT-API] Fetching public FAQs`);
        const faqs = await ai_chatbot_dao_1.default.getAllFAQs(filters);

        // Solo retornar campos públicos
        const publicFAQs = faqs.map((faq) => ({
            id: faq.id,
            pregunta: faq.pregunta,
            respuesta: faq.respuesta,
            categoria: faq.categoria
        }));

        res.status(200).json({
            success: true,
            faqs: publicFAQs,
            count: publicFAQs.length
        });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Error fetching public FAQs:', error);
        res.status(500).json({
            error: 'fetch_error',
            message: 'Error al obtener los FAQs.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ADMIN ROUTES - ANALYTICS
// ============================================

/**
 * GET /api/ai-chatbot/analytics
 * Obtener estadísticas de uso del chatbot (solo admin)
 */
router.get('/analytics', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'administrativo']), async (req, res) => {
    try {
        const { dateFrom, dateTo, userId } = req.query;
        const filters = { dateFrom, dateTo, userId };

        console.log(`[AI-CHATBOT-API] Fetching analytics with filters:`, filters);
        const analytics = await ai_chatbot_dao_1.default.getChatbotAnalytics(filters);

        const totalTokens = parseInt(analytics?.total_tokens) || 0;
        const estimatedCost = (totalTokens / 1000) * 0.02;

        res.status(200).json({
            success: true,
            analytics: {
                ...analytics,
                estimated_cost_usd: estimatedCost.toFixed(4)
            }
        });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Error fetching analytics:', error);
        res.status(500).json({
            error: 'fetch_error',
            message: 'Error al obtener las estadísticas.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/ai-chatbot/health
 * Health check del servicio de chatbot
 */
router.get('/health', async (req, res) => {
    try {
        // Verificar conexión a BD
        await health_dao_1.default.ping();
        // Verificar que OpenAI API key existe
        const hasApiKey = !!process.env.OPENAI_API_KEY;

        res.status(200).json({
            success: true,
            service: 'ai-chatbot',
            status: 'healthy',
            checks: {
                database: 'ok',
                openai_api_key: hasApiKey ? 'configured' : 'missing',
                orchestrator: 'integrated'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[AI-CHATBOT-API] Health check failed:', error);
        res.status(503).json({
            success: false,
            service: 'ai-chatbot',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
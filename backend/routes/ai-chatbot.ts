/**
 * 💬 AI CHATBOT ROUTES - GPT-4 POWERED - TypeScript
 * SEMANA 18 - AI Chatbot Endpoints
 * Migrado: 08 Diciembre 2025
 *
 * Endpoints para chatbot inteligente con GPT-4, multi-language support,
 * context-aware responses y FAQ management.
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import openaiService from '../services/openai-service';
// @ts-ignore
import { authenticateJWT, requireRole } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import devLogger from '../utils/devLogger';
// @ts-ignore
import AIChatbotDAO from '../data/ai-chatbot.dao';
// @ts-ignore
import HealthDAO from '../data/health.dao';

const router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface ChatMessage {
    message: string;
    language?: string;
    includeContext?: boolean;
}

interface NewFAQ {
    pregunta: string;
    respuesta: string;
    categoria: string;
    idioma?: string;
    activo?: boolean;
}

// ============================================
// RATE LIMITING
// ============================================

// Límite para usuarios autenticados: 30 mensajes por hora
const authenticatedLimiter = rateLimit({
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
const anonymousLimiter = rateLimit({
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
 * POST /api/ai-chatbot/message
 * Enviar mensaje al chatbot (con o sin autenticación)
 */
router.post('/message', async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, language = 'es', includeContext = true } = req.body as ChatMessage;

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
        const userId = (req as any).user?.id || null;
        const isAuthenticated = userId !== null;

        devLogger.log(`[AI-CHATBOT-API] Message from ${isAuthenticated ? 'user ' + userId : 'anonymous'}`);

        // Aplicar rate limiting según autenticación
        if (isAuthenticated) {
            await new Promise<void>((resolve, reject) => {
                authenticatedLimiter(req, res, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } else {
            await new Promise<void>((resolve, reject) => {
                anonymousLimiter(req, res, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // Si usuario autenticado, usar conversación continua con historial
        let response;
        if (isAuthenticated) {
            response = await openaiService.continueConversation(userId, message, {
                language,
                includeContext
            });
        } else {
            // Usuario anónimo - sin historial
            response = await openaiService.generateChatResponse(message, {
                language,
                includeContext
            });
        }

        res.status(200).json({
            success: true,
            ...response
        });

    } catch (error: any) {
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
router.get('/history', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        devLogger.log(`[AI-CHATBOT-API] Fetching chat history for user ${userId} (limit: ${limit})`);

        const history = await openaiService.getChatHistory(userId, limit);

        res.status(200).json({
            success: true,
            history,
            count: history.length
        });

    } catch (error: any) {
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
router.delete('/history', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        devLogger.log(`[AI-CHATBOT-API] Clearing chat history for user ${userId}`);

        const deletedCount = await AIChatbotDAO.deleteChatHistory(userId);
        res.status(200).json({ success: true, message: 'Historial de conversación eliminado exitosamente.', deletedCount });

    } catch (error: any) {
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
router.post('/faq', authenticateJWT, requireRole(['admin', 'administrativo']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { pregunta, respuesta, categoria, idioma = 'es', activo = true } = req.body as NewFAQ;

        // Validaciones
        if (!pregunta || !respuesta || !categoria) {
            res.status(400).json({
                error: 'missing_fields',
                message: 'Los campos "pregunta", "respuesta" y "categoria" son requeridos.'
            });
            return;
        }

        if (pregunta.length > 500) {
            res.status(400).json({
                error: 'pregunta_too_long',
                message: 'La pregunta no puede exceder 500 caracteres.'
            });
            return;
        }

        if (respuesta.length > 2000) {
            res.status(400).json({
                error: 'respuesta_too_long',
                message: 'La respuesta no puede exceder 2000 caracteres.'
            });
            return;
        }

        devLogger.log(`[AI-CHATBOT-API] Creating FAQ: ${pregunta.substring(0, 50)}...`);

        const faq = await openaiService.createFAQ({
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

    } catch (error: any) {
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
router.put('/faq/:id', authenticateJWT, requireRole(['admin', 'administrativo']), async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        if (isNaN(id)) {
            res.status(400).json({ error: 'invalid_id', message: 'ID inválido.' });
            return;
        }

        if (Object.keys(updates).length === 0) {
            res.status(400).json({
                error: 'no_updates',
                message: 'No se proporcionaron campos para actualizar.'
            });
            return;
        }

        devLogger.log(`[AI-CHATBOT-API] Updating FAQ: ${id}`);

        const faq = await openaiService.updateFAQ(id, updates);

        res.status(200).json({
            success: true,
            faq,
            message: 'FAQ actualizado exitosamente.'
        });

    } catch (error: any) {
        console.error('[AI-CHATBOT-API] Error updating FAQ:', error);

        if (error.message === 'FAQ not found') {
            res.status(404).json({
                error: 'not_found',
                message: 'FAQ no encontrado.'
            });
            return;
        }

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
router.delete('/faq/:id', authenticateJWT, requireRole(['admin', 'administrativo']), async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ error: 'invalid_id', message: 'ID inválido.' });
            return;
        }

        devLogger.log(`[AI-CHATBOT-API] Deleting FAQ: ${id}`);

        const deletedFAQ = await AIChatbotDAO.deleteFaq(id);
        if (!deletedFAQ) {
            res.status(404).json({ error: 'not_found', message: 'FAQ no encontrado.' });
            return;
        }
        res.status(200).json({ success: true, message: 'FAQ eliminado exitosamente.', deletedFAQ });

    } catch (error: any) {
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
router.get('/faqs', authenticateJWT, requireRole(['admin', 'administrativo', 'docente']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { categoria, idioma, activo, search } = req.query;

        const filters: any = {};
        if (categoria) filters.categoria = categoria;
        if (idioma) filters.idioma = idioma;
        if (activo !== undefined) filters.activo = activo === 'true';
        if (search) filters.search = search;

        devLogger.log(`[AI-CHATBOT-API] Fetching FAQs with filters:`, filters);

        const faqs = await openaiService.getAllFAQs(filters);

        res.status(200).json({
            success: true,
            faqs,
            count: faqs.length
        });

    } catch (error: any) {
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
router.get('/faqs/public', async (req: Request, res: Response): Promise<void> => {
    try {
        const { categoria, idioma = 'es' } = req.query;

        const filters: any = {
            activo: true,
            idioma
        };
        if (categoria) filters.categoria = categoria;

        console.log(`[AI-CHATBOT-API] Fetching public FAQs`);

        const faqs = await openaiService.getAllFAQs(filters);

        // Solo retornar campos públicos (sin metadata administrativa)
        const publicFAQs = faqs.map((faq: any) => ({
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

    } catch (error: any) {
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
router.get('/analytics', authenticateJWT, requireRole(['admin', 'administrativo']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { dateFrom, dateTo, userId } = req.query;

        const filters: any = {};
        if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
        if (dateTo) filters.dateTo = new Date(dateTo as string);
        if (userId) filters.userId = userId;

        console.log(`[AI-CHATBOT-API] Fetching analytics with filters:`, filters);

        const analytics = await openaiService.getChatbotAnalytics(filters);

        // Calcular costo estimado (GPT-4 Turbo: $0.01/1K tokens input, $0.03/1K tokens output)
        const totalTokens = parseInt(analytics.total_tokens) || 0;
        const estimatedCost = (totalTokens / 1000) * 0.02; // Promedio $0.02/1K tokens

        res.status(200).json({
            success: true,
            analytics: {
                ...analytics,
                estimated_cost_usd: estimatedCost.toFixed(4)
            }
        });

    } catch (error: any) {
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
router.get('/health', async (req: Request, res: Response): Promise<void> => {
    try {
        // Verificar conexión a BD
        await HealthDAO.ping();

        // Verificar que OpenAI API key existe
        const hasApiKey = !!process.env.OPENAI_API_KEY;

        res.status(200).json({
            success: true,
            service: 'ai-chatbot',
            status: 'healthy',
            checks: {
                database: 'ok',
                openai_api_key: hasApiKey ? 'configured' : 'missing'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
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

// @ts-ignore
export = router;

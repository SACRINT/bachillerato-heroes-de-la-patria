/**
 * 💬 AI CHATBOT ROUTES - GPT-4 POWERED
 * SEMANA 18 - AI Chatbot Endpoints
 *
 * Endpoints para chatbot inteligente con GPT-4, multi-language support,
 * context-aware responses y FAQ management.
 *
 * Rutas:
 * - POST /api/ai-chatbot/message - Enviar mensaje al chatbot
 * - GET  /api/ai-chatbot/history - Obtener historial de conversación
 * - DELETE /api/ai-chatbot/history - Limpiar historial
 * - POST /api/ai-chatbot/faq - Crear FAQ (admin)
 * - PUT  /api/ai-chatbot/faq/:id - Actualizar FAQ (admin)
 * - GET  /api/ai-chatbot/faqs - Listar FAQs (admin)
 * - GET  /api/ai-chatbot/analytics - Estadísticas de uso (admin)
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai-service');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const devLogger = require('../utils/devLogger');
// ✅ FASE 3: Using DAO layer
const AIChatbotDAO = require('../data/ai-chatbot.dao');

// =============================================================================
// RATE LIMITING
// =============================================================================

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

// =============================================================================
// USER ROUTES
// =============================================================================

/**
 * POST /api/ai-chatbot/message
 * Enviar mensaje al chatbot (con o sin autenticación)
 *
 * Body:
 * {
 *   "message": "¿Cómo puedo solicitar una beca?",
 *   "language": "es" (opcional, default: "es"),
 *   "includeContext": true (opcional, default: true)
 * }
 */
router.post('/message', async (req, res) => {
  try {
    const { message, language = 'es', includeContext = true } = req.body;

    // Validación de mensaje
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'invalid_message',
        message: 'El campo "message" es requerido y debe ser un string.'
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        error: 'empty_message',
        message: 'El mensaje no puede estar vacío.'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: 'message_too_long',
        message: 'El mensaje no puede exceder 1000 caracteres.'
      });
    }

    // Obtener userId si está autenticado (opcional)
    const userId = req.user?.id || null;
    const isAuthenticated = userId !== null;

    devLogger.log(`[AI-CHATBOT-API] Message from ${isAuthenticated ? 'user ' + userId : 'anonymous'}`);

    // Aplicar rate limiting según autenticación
    if (isAuthenticated) {
      await new Promise((resolve, reject) => {
        authenticatedLimiter(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } else {
      await new Promise((resolve, reject) => {
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
 *
 * Query params:
 * - limit: número de mensajes (default: 20, max: 100)
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    devLogger.log(`[AI-CHATBOT-API] Fetching chat history for user ${userId} (limit: ${limit})`);

    const history = await openaiService.getChatHistory(userId, limit);

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
router.delete('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    devLogger.log(`[AI-CHATBOT-API] Clearing chat history for user ${userId}`);
    // ✅ FASE 3: Using AIChatbotDAO
    const deletedCount = await AIChatbotDAO.deleteChatHistory(userId);
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

// =============================================================================
// ADMIN ROUTES - FAQ MANAGEMENT
// =============================================================================

/**
 * POST /api/ai-chatbot/faq
 * Crear nuevo FAQ (solo admin)
 *
 * Body:
 * {
 *   "pregunta": "¿Cómo solicitar una beca?",
 *   "respuesta": "Para solicitar una beca...",
 *   "categoria": "Becas y Apoyos",
 *   "idioma": "es" (opcional, default: "es"),
 *   "activo": true (opcional, default: true)
 * }
 */
router.post('/faq', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const { pregunta, respuesta, categoria, idioma = 'es', activo = true } = req.body;

    // Validaciones
    if (!pregunta || !respuesta || !categoria) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'Los campos "pregunta", "respuesta" y "categoria" son requeridos.'
      });
    }

    if (pregunta.length > 500) {
      return res.status(400).json({
        error: 'pregunta_too_long',
        message: 'La pregunta no puede exceder 500 caracteres.'
      });
    }

    if (respuesta.length > 2000) {
      return res.status(400).json({
        error: 'respuesta_too_long',
        message: 'La respuesta no puede exceder 2000 caracteres.'
      });
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
 *
 * Body (todos los campos opcionales):
 * {
 *   "pregunta": "...",
 *   "respuesta": "...",
 *   "categoria": "...",
 *   "idioma": "es",
 *   "activo": true
 * }
 */
router.put('/faq/:id', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'no_updates',
        message: 'No se proporcionaron campos para actualizar.'
      });
    }

    devLogger.log(`[AI-CHATBOT-API] Updating FAQ: ${id}`);

    const faq = await openaiService.updateFAQ(id, updates);

    res.status(200).json({
      success: true,
      faq,
      message: 'FAQ actualizado exitosamente.'
    });

  } catch (error) {
    console.error('[AI-CHATBOT-API] Error updating FAQ:', error);

    if (error.message === 'FAQ not found') {
      return res.status(404).json({
        error: 'not_found',
        message: 'FAQ no encontrado.'
      });
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
router.delete('/faq/:id', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const { id } = req.params;
    devLogger.log(`[AI-CHATBOT-API] Deleting FAQ: ${id}`);
    // ✅ FASE 3: Using AIChatbotDAO
    const deletedFAQ = await AIChatbotDAO.deleteFaq(id);
    if (!deletedFAQ) {
      return res.status(404).json({ error: 'not_found', message: 'FAQ no encontrado.' });
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
 *
 * Query params:
 * - categoria: filtrar por categoría
 * - idioma: filtrar por idioma (es, en)
 * - activo: filtrar por estado (true, false)
 * - search: búsqueda de texto en pregunta/respuesta
 */
router.get('/faqs', authenticateJWT, requireRole(['admin', 'administrativo', 'docente']), async (req, res) => {
  try {
    const { categoria, idioma, activo, search } = req.query;

    const filters = {};
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
 *
 * Solo retorna FAQs activos para mostrar en página de ayuda pública.
 */
router.get('/faqs/public', async (req, res) => {
  try {
    const { categoria, idioma = 'es' } = req.query;

    const filters = {
      activo: true,
      idioma
    };
    if (categoria) filters.categoria = categoria;

    console.log(`[AI-CHATBOT-API] Fetching public FAQs`);

    const faqs = await openaiService.getAllFAQs(filters);

    // Solo retornar campos públicos (sin metadata administrativa)
    const publicFAQs = faqs.map(faq => ({
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

// =============================================================================
// ADMIN ROUTES - ANALYTICS
// =============================================================================

/**
 * GET /api/ai-chatbot/analytics
 * Obtener estadísticas de uso del chatbot (solo admin)
 *
 * Query params:
 * - dateFrom: fecha de inicio (ISO string)
 * - dateTo: fecha de fin (ISO string)
 * - userId: filtrar por usuario específico
 */
router.get('/analytics', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const { dateFrom, dateTo, userId } = req.query;

    const filters = {};
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
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
    // ✅ FASE 3: Using HealthDAO
    const HealthDAO = require('../data/health.dao');

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

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;

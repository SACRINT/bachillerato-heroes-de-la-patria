/**
 * 🎯 RECOMMENDATIONS ROUTES - ML-POWERED
 * SEMANA 19 - Recommendation Engine Endpoints
 *
 * Endpoints para sistema de recomendaciones híbrido (collaborative + content-based)
 *
 * Rutas:
 * - GET  /api/recommendations/:type - Obtener recomendaciones personalizadas
 * - POST /api/recommendations/interaction - Registrar interacción (view, click, rating)
 * - GET  /api/recommendations/popular/:type - Items populares (trending)
 * - GET  /api/recommendations/similar/:type/:itemId - Items similares
 * - GET  /api/recommendations/analytics - Analytics de recomendaciones (admin)
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const devLogger = require('../utils/devLogger');
const { spawn } = require('child_process');
const path = require('path');
const pool = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// =============================================================================
// RATE LIMITING
// =============================================================================

const recommendationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Máximo 50 requests por 15 min
  message: {
    error: 'rate_limit_exceeded',
    message: 'Demasiadas solicitudes de recomendaciones. Intenta en 15 minutos.'
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Ejecuta Python recommendation engine
 * @param {object} params - Parámetros (student_id, type, limit)
 * @returns {Promise<object>} Recommendations
 */
async function executePythonRecommendations(params) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/recommendation-engine.py');
    const python = spawn('python3', [pythonScript]);

    let stdout = '';
    let stderr = '';

    // Enviar parámetros via stdin
    python.stdin.write(JSON.stringify(params));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('[RECOMMENDATIONS] Python error:', stderr);
        reject(new Error(`Python script failed with code ${code}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        console.error('[RECOMMENDATIONS] JSON parse error:', error);
        console.error('[RECOMMENDATIONS] Stdout:', stdout);
        reject(error);
      }
    });
  });
}

/**
 * Obtiene popular items (fallback cuando ML falla)
 * ✅ FASE 3: Using AnalyticsDAO
 * @param {string} type - Tipo de recomendación
 * @param {number} limit - Número de items
 * @returns {Promise<array>} Popular items
 */
async function getPopularItems(type, limit = 10) {
  try {
    return await AnalyticsDAO.getPopularItemsAlt(type, limit);
  } catch (error) {
    console.error('[RECOMMENDATIONS] Error fetching popular items:', error);
    return [];
  }
}

// =============================================================================
// USER ROUTES
// =============================================================================

/**
 * GET /api/recommendations/:type
 * Obtener recomendaciones personalizadas para el usuario autenticado
 *
 * Params:
 *   type: 'courses', 'materials', 'activities', 'resources'
 *
 * Query params:
 *   limit: número de recomendaciones (default: 10, max: 50)
 */
router.get('/:type', authenticateJWT, recommendationsLimiter, async (req, res) => {
  try {
    const { type } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const studentId = req.user.id;

    // Validar tipo
    const validTypes = ['courses', 'materials', 'activities', 'resources'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'invalid_type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    devLogger.log(`[RECOMMENDATIONS] Generating ${type} recommendations for user ${studentId}`);

    try {
      // Ejecutar Python recommendation engine
      const result = await executePythonRecommendations({
        student_id: studentId,
        type,
        limit
      });

      // Si no hay recomendaciones ML, usar fallback
      if (!result.success || result.recommendations.length === 0) {
        devLogger.log('[RECOMMENDATIONS] Using fallback popular items');

        const popular = await getPopularItems(type, limit);

        return res.status(200).json({
          success: true,
          student_id: studentId,
          type,
          recommendations: popular,
          count: popular.length,
          algorithm: 'fallback (popular items)',
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json(result);

    } catch (mlError) {
      console.error('[RECOMMENDATIONS] ML engine failed, using fallback:', mlError);

      // Fallback a popular items
      const popular = await getPopularItems(type, limit);

      res.status(200).json({
        success: true,
        student_id: studentId,
        type,
        recommendations: popular,
        count: popular.length,
        algorithm: 'fallback (popular items)',
        timestamp: new Date().toISOString(),
        ml_error: process.env.NODE_ENV === 'development' ? mlError.message : undefined
      });
    }

  } catch (error) {
    console.error('[RECOMMENDATIONS] Error:', error);

    res.status(500).json({
      error: 'server_error',
      message: 'Error al generar recomendaciones',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/recommendations/interaction
 * Registrar interacción del usuario con un item
 *
 * Body:
 * {
 *   "type": "courses",
 *   "item_id": 42,
 *   "interaction_type": "view" | "click" | "enroll" | "rate",
 *   "rating": 4.5 (opcional, solo para "rate")
 * }
 */
router.post('/interaction', authenticateJWT, async (req, res) => {
  try {
    const { type, item_id, interaction_type, rating } = req.body;
    const userId = req.user.id;

    // Validaciones
    if (!type || !item_id || !interaction_type) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'Los campos "type", "item_id" e "interaction_type" son requeridos.'
      });
    }

    const validTypes = ['courses', 'materials', 'activities', 'resources'];
    const validInteractions = ['view', 'click', 'enroll', 'rate', 'bookmark', 'complete'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'invalid_type',
        message: `Type debe ser uno de: ${validTypes.join(', ')}`
      });
    }

    if (!validInteractions.includes(interaction_type)) {
      return res.status(400).json({
        error: 'invalid_interaction_type',
        message: `interaction_type debe ser uno de: ${validInteractions.join(', ')}`
      });
    }

    devLogger.log(`[RECOMMENDATIONS] Recording interaction: user ${userId} → ${interaction_type} on ${type}/${item_id}`);

    // ✅ FASE 3: Using AnalyticsDAO
    await AnalyticsDAO.recordInteraction(userId, type, item_id, interaction_type, rating || null);

    // Actualizar contador de visualizaciones/interacciones en tabla de items (opcional)
    // ...

    res.status(201).json({
      success: true,
      message: 'Interacción registrada exitosamente',
      interaction: {
        user_id: userId,
        type,
        item_id,
        interaction_type,
        rating
      }
    });

  } catch (error) {
    console.error('[RECOMMENDATIONS] Error recording interaction:', error);

    res.status(500).json({
      error: 'server_error',
      message: 'Error al registrar interacción',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/recommendations/popular/:type
 * Obtener items populares/trending (sin personalización)
 *
 * Public endpoint (sin autenticación)
 */
router.get('/popular/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const validTypes = ['courses', 'materials', 'activities', 'resources'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'invalid_type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    devLogger.log(`[RECOMMENDATIONS] Fetching popular ${type}`);

    const popular = await getPopularItems(type, limit);

    res.status(200).json({
      success: true,
      type,
      popular_items: popular,
      count: popular.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RECOMMENDATIONS] Error fetching popular:', error);

    res.status(500).json({
      error: 'server_error',
      message: 'Error al obtener items populares',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/recommendations/similar/:type/:itemId
 * Obtener items similares a un item específico
 *
 * Content-based similarity
 */
router.get('/similar/:type/:itemId', async (req, res) => {
  try {
    const { type, itemId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const validTypes = ['courses', 'materials', 'activities', 'resources'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'invalid_type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    devLogger.log(`[RECOMMENDATIONS] Fetching similar ${type} to item ${itemId}`);

    // ✅ FASE 3: Using AnalyticsDAO
    const similarItems = await AnalyticsDAO.getSimilarItemsAlt(type, itemId, limit);

    res.status(200).json({
      success: true,
      type,
      reference_item_id: itemId,
      similar_items: similarItems,
      count: similarItems.length,
      algorithm: 'category-based (simple)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RECOMMENDATIONS] Error fetching similar items:', error);

    res.status(500).json({
      error: 'server_error',
      message: 'Error al obtener items similares',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * GET /api/recommendations/analytics
 * Analytics de recomendaciones (admin)
 *
 * Query params:
 * - dateFrom: fecha de inicio
 * - dateTo: fecha de fin
 */
router.get('/admin/analytics', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    // ✅ FASE 3: Using AnalyticsDAO
    const analytics = await AnalyticsDAO.getInteractionAnalytics({ dateFrom, dateTo });

    res.status(200).json({
      success: true,
      analytics,
      period: {
        from: dateFrom || 'all time',
        to: dateTo || 'now'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RECOMMENDATIONS] Error fetching analytics:', error);

    res.status(500).json({
      error: 'server_error',
      message: 'Error al obtener analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/recommendations/health
 * Health check
 */
router.get('/health', async (req, res) => {
  try {
    // ✅ FASE 3: Using HealthDAO + AnalyticsDAO
    const HealthDAO = require('../data/health.dao');
    await HealthDAO.ping();

    const healthInfo = await AnalyticsDAO.getRecommendationsHealth();

    res.status(200).json({
      success: true,
      service: 'recommendations',
      status: 'healthy',
      checks: {
        database: 'ok',
        tables: healthInfo.tables_found.length === 2 ? 'ok' : 'missing'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RECOMMENDATIONS] Health check failed:', error);

    res.status(503).json({
      success: false,
      service: 'recommendations',
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

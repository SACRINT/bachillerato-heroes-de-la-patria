/**
 * 📋 DSAR (DATA SUBJECT ACCESS REQUEST) ROUTES
 * SEMANA 16 - GDPR Compliance
 *
 * Endpoints para GDPR compliance:
 * - POST /api/dsar/request - Crear solicitud DSAR
 * - GET /api/dsar/verify/:token - Verificar identidad
 * - GET /api/dsar/download/:requestId - Descargar exportación
 * - GET /api/dsar/status/:requestId - Consultar status
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const dsarService = require('../services/dsar-service.js');
const { authenticateJWT } = require('../middleware/auth.js');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const devLogger = require('../utils/devLogger.js');

// ✅ FASE 3: Using DAO layer instead of direct pool access
const DsarDAO = require('../data/dsar.dao.js');

// =============================================================================
// RATE LIMITING
// =============================================================================

// Rate limit para prevenir abuso
const dsarLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 3, // Máximo 3 solicitudes por usuario por día
  message: 'Too many DSAR requests. Please try again tomorrow.',
  keyGenerator: (req) => {
    return req.body.email || req.ip; // Rate limit por email o IP
  }
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/dsar/request
 * Crear nueva solicitud DSAR (GDPR Article 15/20)
 *
 * Body:
 * {
 *   "userId": "uuid",
 *   "requestType": "access" | "portability" | "rectification" | "erasure",
 *   "email": "user@example.com",
 *   "reason": "Optional explanation"
 * }
 */
router.post('/request', dsarLimiter, async (req, res) => {
  try {
    const { userId, requestType, email, reason } = req.body;

    // Validaciones
    if (!userId || !requestType || !email) {
      return res.status(400).json({
        error: 'Missing required fields: userId, requestType, email'
      });
    }

    const validTypes = ['access', 'portability', 'rectification', 'erasure'];
    if (!validTypes.includes(requestType)) {
      return res.status(400).json({
        error: `Invalid requestType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Crear solicitud
    const dsarRequest = await dsarService.createDSARRequest(
      userId,
      requestType,
      email,
      { reason }
    );

    devLogger.log(`[DSAR-API] Request created: ${dsarRequest.id} for user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'DSAR request created successfully. Please check your email to verify your identity.',
      requestId: dsarRequest.id,
      status: dsarRequest.status,
      dueDate: dsarRequest.due_date
    });

  } catch (error) {
    console.error('[DSAR-API] Error creating request:', error);

    res.status(500).json({
      error: 'Failed to create DSAR request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dsar/verify/:token
 * Verificar identidad del solicitante mediante token de email
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required'
      });
    }

    // Verificar token
    const dsarRequest = await dsarService.verifyDSARRequest(token);

    console.log(`[DSAR-API] Request verified: ${dsarRequest.id}`);

    res.status(200).json({
      success: true,
      message: 'Identity verified successfully. Your request is being processed.',
      requestId: dsarRequest.id,
      status: dsarRequest.status,
      estimatedCompletion: dsarRequest.due_date
    });

  } catch (error) {
    console.error('[DSAR-API] Error verifying token:', error);

    if (error.message === 'Invalid or expired verification token') {
      return res.status(404).json({
        error: 'Invalid or expired verification token'
      });
    }

    res.status(500).json({
      error: 'Failed to verify DSAR request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dsar/status/:requestId
 * Consultar el status de una solicitud DSAR
 */
router.get('/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    // ✅ FASE 3: Using DsarDAO
    const request = await DsarDAO.getByIdPublic(requestId);

    if (!request) {
      return res.status(404).json({
        error: 'DSAR request not found'
      });
    }

    res.status(200).json({
      success: true,
      requestId: request.id,
      requestType: request.request_type,
      status: request.status,
      createdAt: request.created_at,
      dueDate: request.due_date,
      completedAt: request.completed_at
    });

  } catch (error) {
    console.error('[DSAR-API] Error fetching status:', error);

    res.status(500).json({
      error: 'Failed to fetch DSAR request status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dsar/download/:requestId
 * Descargar exportación de datos (solo si status = completed)
 *
 * Security:
 * - Requiere autenticación JWT
 * - Solo el dueño de los datos puede descargar
 * - Link expira después de 30 días
 */
router.get('/download/:requestId', authenticateJWT, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id; // Del JWT

    // ✅ FASE 3: Using DsarDAO
    const request = await DsarDAO.getById(requestId);

    if (!request) {
      return res.status(404).json({
        error: 'DSAR request not found'
      });
    }

    // Verificar ownership
    if (request.user_id !== userId) {
      console.warn(`[DSAR-API] Unauthorized download attempt: User ${userId} tried to access request ${requestId}`);
      return res.status(403).json({
        error: 'You are not authorized to download this export'
      });
    }

    // Verificar que esté completado
    if (request.status !== 'completed') {
      return res.status(400).json({
        error: `Export not ready. Current status: ${request.status}`,
        status: request.status
      });
    }

    // Verificar que no haya expirado (30 días)
    if (request.export_expires_at && new Date(request.export_expires_at) < new Date()) {
      return res.status(410).json({
        error: 'Export has expired. Please submit a new request.'
      });
    }

    // Verificar que el archivo exista
    const exportPath = request.export_path;
    if (!exportPath) {
      return res.status(500).json({
        error: 'Export path not found'
      });
    }

    try {
      await fs.access(exportPath);
    } catch (error) {
      console.error(`[DSAR-API] Export file not found: ${exportPath}`);
      return res.status(404).json({
        error: 'Export file not found. It may have been deleted.'
      });
    }

    // Descargar archivo
    devLogger.log(`[DSAR-API] Download initiated: ${requestId} by user ${userId}`);

    res.download(exportPath, `personal_data_export_${requestId}.zip`, (err) => {
      if (err) {
        console.error('[DSAR-API] Error sending file:', err);

        if (!res.headersSent) {
          res.status(500).json({
            error: 'Failed to download export'
          });
        }
      } else {
        devLogger.log(`[DSAR-API] Download completed: ${requestId}`);
      }
    });

  } catch (error) {
    console.error('[DSAR-API] Error downloading export:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to download export',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

/**
 * GET /api/dsar/my-requests
 * Listar todas las solicitudes DSAR del usuario autenticado
 */
router.get('/my-requests', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ FASE 3: Using DsarDAO
    const requests = await DsarDAO.getUserRequests(userId);

    res.status(200).json({
      success: true,
      requests
    });

  } catch (error) {
    console.error('[DSAR-API] Error fetching user requests:', error);

    res.status(500).json({
      error: 'Failed to fetch DSAR requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/dsar/cancel/:requestId
 * Cancelar una solicitud DSAR pendiente
 */
router.delete('/cancel/:requestId', authenticateJWT, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // ✅ FASE 3: Using DsarDAO
    const request = await DsarDAO.getByIdAndUser(requestId, userId);

    if (!request) {
      return res.status(404).json({
        error: 'DSAR request not found or you are not authorized'
      });
    }

    if (request.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot cancel a completed request'
      });
    }

    // Cancelar (soft delete)
    await DsarDAO.cancelRequest(requestId);

    devLogger.log(`[DSAR-API] Request cancelled: ${requestId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'DSAR request cancelled successfully'
    });

  } catch (error) {
    console.error('[DSAR-API] Error cancelling request:', error);

    res.status(500).json({
      error: 'Failed to cancel DSAR request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// ADMIN ROUTES (Protected)
// =============================================================================

/**
 * GET /api/dsar/admin/pending
 * Listar todas las solicitudes DSAR pendientes (solo admin)
 */
router.get('/admin/pending', authenticateJWT, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin' && req.user.role !== 'administrativo') {
      return res.status(403).json({
        error: 'Access denied. Admin role required.'
      });
    }

    // ✅ FASE 3: Using DsarDAO
    const pendingRequests = await DsarDAO.getPendingAdmin();

    res.status(200).json({
      success: true,
      pendingRequests
    });

  } catch (error) {
    console.error('[DSAR-API] Error fetching pending requests:', error);

    res.status(500).json({
      error: 'Failed to fetch pending requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;

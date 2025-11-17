/**
 * 🗑️ RIGHT TO ERASURE ROUTES
 * SEMANA 16 - GDPR Article 17
 *
 * Endpoints:
 * - POST /api/erasure/request - Solicitar eliminación de datos
 * - GET /api/erasure/validate/:userId - Validar si se puede eliminar
 * - POST /api/erasure/execute/:userId - Ejecutar eliminación (admin)
 * - POST /api/erasure/restore/:userId - Restaurar usuario (admin, <30 días)
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const erasureService = require('../services/right-to-erasure-service');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// =============================================================================
// RATE LIMITING
// =============================================================================

const erasureLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 2, // Máximo 2 solicitudes por día
  message: 'Too many erasure requests. Please try again tomorrow.'
});

// =============================================================================
// USER ROUTES
// =============================================================================

/**
 * POST /api/erasure/request
 * Solicitar derecho al olvido (requiere autenticación)
 *
 * Body:
 * {
 *   "reason": "Optional reason for erasure"
 * }
 */
router.post('/request', authenticateJWT, erasureLimiter, async (req, res) => {
  try {
    const userId = req.user.id; // Del JWT
    const { reason } = req.body;

    console.log(`[ERASURE-API] Erasure request from user: ${userId}`);

    // 1. Validar si se puede eliminar
    const validation = await erasureService.validateErasureRequest(userId);

    if (!validation.canErase || validation.canErase === false) {
      return res.status(400).json({
        success: false,
        canErase: false,
        reason: validation.reason,
        exception: validation.exception,
        message: 'Your data cannot be erased at this time due to legal or contractual obligations.'
      });
    }

    // 2. Si se puede eliminar, crear solicitud para revisión
    const pool = require('../config/database');

    const requestId = require('crypto').randomUUID();

    await pool.query(
      `INSERT INTO dsar_requests (
        id, user_id, request_type, email, status, metadata, created_at, due_date
      ) VALUES (
        $1, $2, 'erasure', $3, 'verified', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
      )`,
      [
        requestId,
        userId,
        req.user.email,
        JSON.stringify({ reason, validation })
      ]
    );

    console.log(`[ERASURE-API] Erasure request created: ${requestId}`);

    res.status(201).json({
      success: true,
      canErase: validation.canErase,
      requestId,
      message: 'Erasure request submitted successfully. Your request will be reviewed within 30 days.',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('[ERASURE-API] Error creating erasure request:', error);

    res.status(500).json({
      error: 'Failed to create erasure request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/erasure/validate/:userId
 * Validar si un usuario puede ejercer el derecho al olvido
 */
router.get('/validate/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;

    // Solo el propio usuario o admin puede validar
    if (userId !== requesterId && req.user.role !== 'admin' && req.user.role !== 'administrativo') {
      return res.status(403).json({
        error: 'Access denied. You can only validate your own erasure request.'
      });
    }

    const validation = await erasureService.validateErasureRequest(userId);

    res.status(200).json({
      success: true,
      userId,
      canErase: validation.canErase,
      reason: validation.reason,
      exception: validation.exception
    });

  } catch (error) {
    console.error('[ERASURE-API] Error validating erasure request:', error);

    res.status(500).json({
      error: 'Failed to validate erasure request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * POST /api/erasure/execute/:userId
 * Ejecutar derecho al olvido (solo admin)
 *
 * Body:
 * {
 *   "reason": "Reason for erasure",
 *   "confirmed": true
 * }
 */
router.post('/execute/:userId', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, confirmed } = req.body;
    const adminId = req.user.id;

    if (!confirmed) {
      return res.status(400).json({
        error: 'Confirmation required. Set "confirmed": true to proceed with erasure.'
      });
    }

    console.log(`[ERASURE-API] Admin ${adminId} executing erasure for user ${userId}`);

    // Ejecutar eliminación
    const result = await erasureService.executeRightToErasure(userId, adminId, reason);

    res.status(200).json({
      success: true,
      ...result,
      executedBy: adminId,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERASURE-API] Error executing erasure:', error);

    if (error.message.includes('cannot be erased')) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to execute erasure',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/erasure/restore/:userId
 * Restaurar usuario eliminado (solo admin, dentro de 30 días)
 *
 * Body:
 * {
 *   "reason": "Reason for restoration",
 *   "confirmed": true
 * }
 */
router.post('/restore/:userId', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, confirmed } = req.body;
    const adminId = req.user.id;

    if (!confirmed) {
      return res.status(400).json({
        error: 'Confirmation required. Set "confirmed": true to proceed with restoration.'
      });
    }

    console.log(`[ERASURE-API] Admin ${adminId} restoring user ${userId}`);

    const result = await erasureService.restoreErasedUser(userId);

    // Log restoration
    const pool = require('../config/database');
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, resource, resource_id, changes, ip_address, user_agent, hash, previous_hash
      ) VALUES (
        $1, 'RESTORE_ERASED_USER', 'usuarios', $2, $3::jsonb, '0.0.0.0', 'System', '', ''
      )`,
      [
        adminId,
        userId,
        JSON.stringify({ reason, restoredBy: adminId })
      ]
    );

    res.status(200).json({
      success: true,
      ...result,
      restoredBy: adminId,
      restoredAt: new Date().toISOString(),
      warning: 'Pseudonymized personal data cannot be recovered'
    });

  } catch (error) {
    console.error('[ERASURE-API] Error restoring user:', error);

    if (error.message.includes('expired') || error.message.includes('not found')) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to restore user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/erasure/admin/requests
 * Listar solicitudes de eliminación pendientes (solo admin)
 */
router.get('/admin/requests', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const pool = require('../config/database');

    const result = await pool.query(
      `SELECT
        dr.id, dr.user_id, dr.email, dr.status, dr.created_at, dr.due_date, dr.metadata,
        u.nombre, u.apellido_paterno, u.email AS user_email, u.role, u.status AS user_status
       FROM dsar_requests dr
       LEFT JOIN usuarios u ON dr.user_id = u.uuid
       WHERE dr.request_type = 'erasure'
         AND dr.status IN ('verified', 'processing')
       ORDER BY dr.created_at ASC`
    );

    res.status(200).json({
      success: true,
      pendingRequests: result.rows
    });

  } catch (error) {
    console.error('[ERASURE-API] Error fetching erasure requests:', error);

    res.status(500).json({
      error: 'Failed to fetch erasure requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;

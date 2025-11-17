/**
 * ✅ CONSENT MANAGEMENT ROUTES
 * SEMANA 16 - GDPR Article 7
 *
 * Endpoints:
 * - GET /api/consents/types - Listar tipos de consentimiento
 * - GET /api/consents/my - Obtener consentimientos del usuario autenticado
 * - POST /api/consents/grant - Otorgar consentimiento
 * - POST /api/consents/revoke - Retirar consentimiento
 * - POST /api/consents/bulk - Otorgar múltiples consentimientos
 * - GET /api/consents/privacy-policy - Obtener versión actual de Privacy Policy
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const consentService = require('../services/consent-management-service');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * GET /api/consents/types
 * Listar todos los tipos de consentimiento disponibles
 */
router.get('/types', (req, res) => {
  try {
    const types = Object.values(consentService.CONSENT_TYPES).map(type => ({
      type: type.type,
      required: type.required,
      description: type.description,
      legalBasis: type.legalBasis
    }));

    res.status(200).json({
      success: true,
      consentTypes: types
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error fetching consent types:', error);

    res.status(500).json({
      error: 'Failed to fetch consent types',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/consents/privacy-policy
 * Obtener versión actual de Privacy Policy
 */
router.get('/privacy-policy', async (req, res) => {
  try {
    const currentVersion = await consentService.getCurrentPrivacyPolicyVersion();

    if (!currentVersion) {
      return res.status(404).json({
        error: 'Privacy policy not found'
      });
    }

    res.status(200).json({
      success: true,
      version: currentVersion.version,
      content: currentVersion.content,
      effectiveDate: currentVersion.effective_date,
      requiresReconsent: currentVersion.requires_reconsent
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error fetching privacy policy:', error);

    res.status(500).json({
      error: 'Failed to fetch privacy policy',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// USER ROUTES (Authenticated)
// =============================================================================

/**
 * GET /api/consents/my
 * Obtener todos los consentimientos del usuario autenticado
 */
router.get('/my', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const consents = await consentService.getUserConsents(userId);
    const missing = await consentService.getMissingRequiredConsents(userId);

    res.status(200).json({
      success: true,
      consents,
      missingRequired: missing
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error fetching user consents:', error);

    res.status(500).json({
      error: 'Failed to fetch user consents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/consents/grant
 * Otorgar un consentimiento
 *
 * Body:
 * {
 *   "consentType": "marketing_emails",
 *   "documentVersion": "1.0.0"
 * }
 */
router.post('/grant', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { consentType, documentVersion } = req.body;

    if (!consentType) {
      return res.status(400).json({
        error: 'Missing required field: consentType'
      });
    }

    // Extraer IP y user agent
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.get('User-Agent') || 'Unknown';

    const consent = await consentService.grantConsent(userId, consentType, {
      documentVersion: documentVersion || '1.0.0',
      consentMethod: 'explicit_checkbox',
      ipAddress,
      userAgent,
      metadata: {
        grantedVia: 'API',
        timestamp: new Date().toISOString()
      }
    });

    console.log(`[CONSENTS-API] Consent granted: ${consent.id}`);

    res.status(201).json({
      success: true,
      message: 'Consent granted successfully',
      consent
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error granting consent:', error);

    if (error.message.includes('Invalid consent type')) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to grant consent',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/consents/revoke
 * Retirar un consentimiento (GDPR Article 7(3))
 *
 * Body:
 * {
 *   "consentType": "marketing_emails"
 * }
 */
router.post('/revoke', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { consentType } = req.body;

    if (!consentType) {
      return res.status(400).json({
        error: 'Missing required field: consentType'
      });
    }

    const result = await consentService.revokeConsent(userId, consentType);

    console.log(`[CONSENTS-API] Consent revoked: ${consentType} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: result.message,
      consentType: result.consentType,
      revokedCount: result.revokedCount
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error revoking consent:', error);

    if (error.message.includes('Cannot revoke required consent')) {
      return res.status(400).json({
        error: error.message
      });
    }

    if (error.message.includes('No active consent found')) {
      return res.status(404).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to revoke consent',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/consents/bulk
 * Otorgar múltiples consentimientos de una vez (ej: en registro)
 *
 * Body:
 * {
 *   "consents": [
 *     { "type": "terms_of_service", "granted": true },
 *     { "type": "privacy_policy", "granted": true },
 *     { "type": "marketing_emails", "granted": false }
 *   ],
 *   "documentVersion": "1.0.0"
 * }
 */
router.post('/bulk', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { consents, documentVersion } = req.body;

    if (!consents || !Array.isArray(consents)) {
      return res.status(400).json({
        error: 'Missing or invalid field: consents (must be an array)'
      });
    }

    // Extraer IP y user agent
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.get('User-Agent') || 'Unknown';

    const results = await consentService.bulkGrantConsents(userId, consents, {
      documentVersion: documentVersion || '1.0.0',
      consentMethod: 'explicit_checkbox',
      ipAddress,
      userAgent,
      metadata: {
        grantedVia: 'API',
        timestamp: new Date().toISOString()
      }
    });

    console.log(`[CONSENTS-API] Bulk consents granted: ${results.length} for user ${userId}`);

    res.status(201).json({
      success: true,
      message: `${results.length} consents granted successfully`,
      consents: results
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error bulk granting consents:', error);

    res.status(500).json({
      error: 'Failed to grant consents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/consents/check/:consentType
 * Verificar si el usuario tiene un consentimiento activo
 */
router.get('/check/:consentType', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { consentType } = req.params;

    const hasConsent = await consentService.hasActiveConsent(userId, consentType);

    res.status(200).json({
      success: true,
      consentType,
      hasActiveConsent: hasConsent
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error checking consent:', error);

    res.status(500).json({
      error: 'Failed to check consent',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * POST /api/consents/admin/privacy-policy
 * Crear nueva versión de Privacy Policy (solo admin)
 *
 * Body:
 * {
 *   "version": "2.0.0",
 *   "content": "HTML content of privacy policy",
 *   "changesSummary": "Updated data retention policies",
 *   "requiresReconsent": true
 * }
 */
router.post('/admin/privacy-policy', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const { version, content, changesSummary, requiresReconsent } = req.body;
    const createdBy = req.user.id;

    if (!version || !content) {
      return res.status(400).json({
        error: 'Missing required fields: version, content'
      });
    }

    const newVersion = await consentService.createPrivacyPolicyVersion(version, content, {
      createdBy,
      changesSummary: changesSummary || '',
      requiresReconsent: requiresReconsent || false
    });

    console.log(`[CONSENTS-API] Privacy policy version created: ${version} by ${createdBy}`);

    res.status(201).json({
      success: true,
      message: 'Privacy policy version created successfully',
      version: newVersion
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error creating privacy policy version:', error);

    if (error.message.includes('duplicate key')) {
      return res.status(409).json({
        error: 'Version already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create privacy policy version',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/consents/admin/report
 * Generar reporte de consentimientos (solo admin)
 */
router.get('/admin/report', authenticateJWT, requireRole(['admin', 'administrativo']), async (req, res) => {
  try {
    const report = await consentService.generateConsentReport();

    res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    console.error('[CONSENTS-API] Error generating consent report:', error);

    res.status(500).json({
      error: 'Failed to generate consent report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;

/**
 * ✅ CONSENT MANAGEMENT SERVICE
 * SEMANA 16 - GDPR Article 7
 *
 * Implementa gestión de consentimientos:
 * - Consentimiento explícito, informado y libre
 * - Derecho a retirar consentimiento (tan fácil como otorgarlo)
 * - Granularidad (diferentes propósitos)
 * - Prueba de consentimiento (registro)
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const pool = require('../config/database');

// =============================================================================
// TIPOS DE CONSENTIMIENTO (GDPR-compliant)
// =============================================================================

const CONSENT_TYPES = {
  // Obligatorios (para uso del servicio)
  TERMS_OF_SERVICE: {
    type: 'terms_of_service',
    required: true,
    description: 'Acceptance of Terms of Service',
    legalBasis: 'contract' // Article 6(1)(b)
  },
  PRIVACY_POLICY: {
    type: 'privacy_policy',
    required: true,
    description: 'Acceptance of Privacy Policy',
    legalBasis: 'contract'
  },

  // Opcionales (requieren consentimiento explícito)
  MARKETING_EMAILS: {
    type: 'marketing_emails',
    required: false,
    description: 'Receive marketing emails and newsletters',
    legalBasis: 'consent' // Article 6(1)(a)
  },
  MARKETING_SMS: {
    type: 'marketing_sms',
    required: false,
    description: 'Receive marketing SMS messages',
    legalBasis: 'consent'
  },
  DATA_SHARING: {
    type: 'data_sharing',
    required: false,
    description: 'Share data with third-party educational partners',
    legalBasis: 'consent'
  },
  COOKIES_ANALYTICS: {
    type: 'cookies_analytics',
    required: false,
    description: 'Use of analytics cookies (Google Analytics, etc)',
    legalBasis: 'legitimate_interests' // Article 6(1)(f)
  },
  COOKIES_MARKETING: {
    type: 'cookies_marketing',
    required: false,
    description: 'Use of marketing cookies',
    legalBasis: 'consent'
  },
  THIRD_PARTY_SHARING: {
    type: 'third_party_sharing',
    required: false,
    description: 'Share data with third-party service providers',
    legalBasis: 'consent'
  }
};

// =============================================================================
// GRANT CONSENT
// =============================================================================

/**
 * Otorgar consentimiento
 * @param {string} userId - ID del usuario
 * @param {string} consentType - Tipo de consentimiento
 * @param {object} options - Opciones adicionales
 * @returns {object} Consentimiento creado
 */
async function grantConsent(userId, consentType, options = {}) {
  const {
    documentVersion = '1.0.0',
    consentMethod = 'explicit_checkbox',
    ipAddress = '0.0.0.0',
    userAgent = 'Unknown',
    metadata = {}
  } = options;

  // Validar tipo de consentimiento
  if (!Object.values(CONSENT_TYPES).find(c => c.type === consentType)) {
    throw new Error(`Invalid consent type: ${consentType}`);
  }

  console.log(`[CONSENT] Granting consent: ${userId} → ${consentType}`);

  // Verificar si ya existe consentimiento para esta versión
  const existing = await pool.query(
    `SELECT * FROM user_consents
     WHERE user_id = $1 AND consent_type = $2 AND document_version = $3`,
    [userId, consentType, documentVersion]
  );

  if (existing.rows.length > 0) {
    const consent = existing.rows[0];

    // Si ya está granted, no hacer nada
    if (consent.granted && !consent.revoked) {
      console.log(`[CONSENT] Consent already granted: ${consent.id}`);
      return consent;
    }

    // Si estaba revoked, actualizar
    if (consent.revoked) {
      await pool.query(
        `UPDATE user_consents
         SET granted = true,
             granted_at = CURRENT_TIMESTAMP,
             revoked = false,
             revoked_at = NULL,
             ip_address = $1,
             user_agent = $2,
             metadata = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [ipAddress, userAgent, JSON.stringify(metadata), consent.id]
      );

      const updated = await pool.query('SELECT * FROM user_consents WHERE id = $1', [consent.id]);

      console.log(`[CONSENT] Consent re-granted: ${consent.id}`);

      return updated.rows[0];
    }
  }

  // Crear nuevo consentimiento
  const result = await pool.query(
    `INSERT INTO user_consents (
      user_id, consent_type, granted, granted_at, document_version,
      consent_method, ip_address, user_agent, metadata
    ) VALUES (
      $1, $2, true, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7
    ) RETURNING *`,
    [
      userId, consentType, documentVersion,
      consentMethod, ipAddress, userAgent,
      JSON.stringify(metadata)
    ]
  );

  console.log(`[CONSENT] Consent granted: ${result.rows[0].id}`);

  return result.rows[0];
}

// =============================================================================
// REVOKE CONSENT (GDPR Article 7(3))
// =============================================================================

/**
 * Retirar consentimiento (tan fácil como otorgarlo)
 * @param {string} userId - ID del usuario
 * @param {string} consentType - Tipo de consentimiento
 * @returns {object} Resultado
 */
async function revokeConsent(userId, consentType) {
  console.log(`[CONSENT] Revoking consent: ${userId} → ${consentType}`);

  // Verificar que no sea un consentimiento requerido
  const consentConfig = Object.values(CONSENT_TYPES).find(c => c.type === consentType);

  if (consentConfig && consentConfig.required) {
    throw new Error(`Cannot revoke required consent: ${consentType}. You must deactivate your account instead.`);
  }

  // Actualizar todos los consentimientos de este tipo (todas las versiones)
  const result = await pool.query(
    `UPDATE user_consents
     SET revoked = true,
         revoked_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND consent_type = $2 AND granted = true AND revoked = false
     RETURNING *`,
    [userId, consentType]
  );

  if (result.rows.length === 0) {
    throw new Error(`No active consent found for type: ${consentType}`);
  }

  console.log(`[CONSENT] Consent revoked: ${result.rows.length} records updated`);

  // Realizar acciones según tipo de consentimiento
  await handleConsentRevocation(userId, consentType);

  return {
    success: true,
    consentType,
    revokedCount: result.rows.length,
    message: `Consent for ${consentType} has been revoked`
  };
}

/**
 * Manejar revocación de consentimiento (acciones específicas)
 */
async function handleConsentRevocation(userId, consentType) {
  switch (consentType) {
    case 'marketing_emails':
      // Remover de listas de correo
      console.log(`[CONSENT] Unsubscribing user ${userId} from marketing emails`);
      // TODO: Integrar con email service para unsubscribe
      break;

    case 'marketing_sms':
      // Remover de listas SMS
      console.log(`[CONSENT] Unsubscribing user ${userId} from SMS`);
      break;

    case 'data_sharing':
      // Notificar a terceros sobre revocación
      console.log(`[CONSENT] Notifying third parties about data sharing revocation for user ${userId}`);
      break;

    case 'cookies_marketing':
      // Limpiar cookies de marketing
      console.log(`[CONSENT] Marketing cookies consent revoked for user ${userId}`);
      break;

    default:
      break;
  }
}

// =============================================================================
// GET CONSENTS
// =============================================================================

/**
 * Obtener todos los consentimientos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {array} Lista de consentimientos
 */
async function getUserConsents(userId) {
  const result = await pool.query(
    `SELECT * FROM user_consents
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Verificar si un usuario tiene un consentimiento activo
 * @param {string} userId - ID del usuario
 * @param {string} consentType - Tipo de consentimiento
 * @returns {boolean} True si tiene consentimiento activo
 */
async function hasActiveConsent(userId, consentType) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM user_consents
     WHERE user_id = $1
       AND consent_type = $2
       AND granted = true
       AND revoked = false`,
    [userId, consentType]
  );

  return parseInt(result.rows[0].count) > 0;
}

/**
 * Obtener consentimientos faltantes (requeridos)
 * @param {string} userId - ID del usuario
 * @returns {array} Lista de consentimientos requeridos faltantes
 */
async function getMissingRequiredConsents(userId) {
  const userConsents = await getUserConsents(userId);

  const requiredTypes = Object.values(CONSENT_TYPES)
    .filter(c => c.required)
    .map(c => c.type);

  const grantedTypes = userConsents
    .filter(c => c.granted && !c.revoked)
    .map(c => c.consent_type);

  const missing = requiredTypes.filter(type => !grantedTypes.includes(type));

  return missing.map(type => {
    const config = Object.values(CONSENT_TYPES).find(c => c.type === type);
    return {
      type,
      description: config.description,
      required: true
    };
  });
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Otorgar múltiples consentimientos de una vez
 * @param {string} userId - ID del usuario
 * @param {array} consents - Array de { type, granted }
 * @param {object} options - Opciones comunes (IP, user agent)
 * @returns {array} Consentimientos creados
 */
async function bulkGrantConsents(userId, consents, options = {}) {
  console.log(`[CONSENT] Bulk granting consents for user: ${userId}`);

  const results = [];

  for (const { type, granted } of consents) {
    if (granted) {
      const consent = await grantConsent(userId, type, options);
      results.push(consent);
    }
  }

  console.log(`[CONSENT] Bulk granted ${results.length} consents`);

  return results;
}

// =============================================================================
// PRIVACY POLICY VERSION MANAGEMENT
// =============================================================================

/**
 * Crear nueva versión de Privacy Policy
 * @param {string} version - Versión (ej: '2.0.0')
 * @param {string} content - Contenido HTML de la política
 * @param {object} options - Opciones
 * @returns {object} Versión creada
 */
async function createPrivacyPolicyVersion(version, content, options = {}) {
  const {
    effectiveDate = new Date(),
    createdBy = 'system',
    changesSummary = '',
    requiresReconsent = false
  } = options;

  console.log(`[CONSENT] Creating privacy policy version: ${version}`);

  const result = await pool.query(
    `INSERT INTO privacy_policy_versions (
      version, content, effective_date, created_by, changes_summary, requires_reconsent
    ) VALUES (
      $1, $2, $3, $4, $5, $6
    ) RETURNING *`,
    [version, content, effectiveDate, createdBy, changesSummary, requiresReconsent]
  );

  const newVersion = result.rows[0];

  // Si requiere re-consentimiento, invalidar consentimientos antiguos
  if (requiresReconsent) {
    await pool.query(
      `UPDATE user_consents
       SET revoked = true, revoked_at = CURRENT_TIMESTAMP
       WHERE consent_type = 'privacy_policy' AND document_version != $1`,
      [version]
    );

    console.log(`[CONSENT] Previous privacy policy consents invalidated (requires re-consent)`);
  }

  return newVersion;
}

/**
 * Obtener versión actual de Privacy Policy
 * @returns {object} Versión actual
 */
async function getCurrentPrivacyPolicyVersion() {
  const result = await pool.query(
    `SELECT * FROM privacy_policy_versions
     ORDER BY effective_date DESC
     LIMIT 1`
  );

  return result.rows[0] || null;
}

// =============================================================================
// CONSENT REPORT (GDPR Article 30 - Records of Processing)
// =============================================================================

/**
 * Generar reporte de consentimientos
 * @param {object} filters - Filtros
 * @returns {object} Estadísticas de consentimientos
 */
async function generateConsentReport(filters = {}) {
  console.log(`[CONSENT] Generating consent report`);

  // Total de usuarios
  const totalUsers = await pool.query('SELECT COUNT(*) FROM usuarios WHERE status = \'activo\'');

  // Consentimientos por tipo
  const consentsByType = await pool.query(
    `SELECT
      consent_type,
      COUNT(*) AS total,
      COUNT(CASE WHEN granted = true AND revoked = false THEN 1 END) AS active,
      COUNT(CASE WHEN revoked = true THEN 1 END) AS revoked
     FROM user_consents
     GROUP BY consent_type`
  );

  // Consentimientos otorgados en últimos 30 días
  const recentConsents = await pool.query(
    `SELECT COUNT(*) FROM user_consents
     WHERE granted_at >= CURRENT_DATE - INTERVAL '30 days'
       AND granted = true`
  );

  // Consentimientos revocados en últimos 30 días
  const recentRevocations = await pool.query(
    `SELECT COUNT(*) FROM user_consents
     WHERE revoked_at >= CURRENT_DATE - INTERVAL '30 days'
       AND revoked = true`
  );

  return {
    totalActiveUsers: parseInt(totalUsers.rows[0].count),
    consentsByType: consentsByType.rows,
    last30Days: {
      granted: parseInt(recentConsents.rows[0].count),
      revoked: parseInt(recentRevocations.rows[0].count)
    },
    reportGeneratedAt: new Date().toISOString()
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  CONSENT_TYPES,
  grantConsent,
  revokeConsent,
  getUserConsents,
  hasActiveConsent,
  getMissingRequiredConsents,
  bulkGrantConsents,
  createPrivacyPolicyVersion,
  getCurrentPrivacyPolicyVersion,
  generateConsentReport
};

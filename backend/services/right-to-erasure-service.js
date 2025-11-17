/**
 * 🗑️ RIGHT TO ERASURE (RIGHT TO BE FORGOTTEN) SERVICE
 * SEMANA 16 - GDPR Article 17
 *
 * Implementa el derecho al olvido:
 * - Eliminar datos personales cuando ya no sean necesarios
 * - Eliminar datos cuando el consentimiento es retirado
 * - Excepciones: Obligaciones legales, interés público
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const pool = require('../config/database');
const crypto = require('crypto');

// =============================================================================
// ERASURE REQUEST VALIDATION
// =============================================================================

/**
 * Verifica si un usuario puede ejercer el derecho al olvido
 * @param {string} userId - ID del usuario
 * @returns {object} { canErase: boolean, reason: string }
 */
async function validateErasureRequest(userId) {
  console.log(`[RIGHT-TO-ERASURE] Validating erasure request for user: ${userId}`);

  // Obtener información del usuario
  const userResult = await pool.query(
    'SELECT * FROM usuarios WHERE uuid = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    return {
      canErase: false,
      reason: 'User not found'
    };
  }

  const user = userResult.rows[0];

  // ============================================================================
  // EXCEPCIONES AL DERECHO AL OLVIDO (GDPR Article 17(3))
  // ============================================================================

  // 1. Cumplimiento de obligación legal (Article 17(3)(b))
  //    - Registros académicos deben conservarse por ley (7 años)
  const hasLegalRetentionRequirement = await checkLegalRetention(userId);
  if (hasLegalRetentionRequirement) {
    return {
      canErase: false,
      reason: 'Legal retention requirement: Academic records must be retained for 7 years as per educational regulations',
      exception: 'Article 17(3)(b) - Compliance with legal obligation'
    };
  }

  // 2. Interés público (Article 17(3)(c))
  //    - Estudiantes activos NO pueden eliminarse
  if (user.status === 'activo') {
    return {
      canErase: false,
      reason: 'Cannot erase data of active students. Please deactivate account first.',
      exception: 'Article 17(3)(c) - Public interest (active enrollment)'
    };
  }

  // 3. Ejercicio del derecho a la libertad de expresión (Article 17(3)(a))
  //    - Comentarios públicos, publicaciones
  const hasPublicContent = await checkPublicContent(userId);
  if (hasPublicContent) {
    return {
      canErase: 'partial',
      reason: 'Some public content will be anonymized instead of deleted',
      exception: 'Article 17(3)(a) - Freedom of expression'
    };
  }

  // 4. Establecimiento, ejercicio o defensa de reclamaciones (Article 17(3)(e))
  const hasActiveClaims = await checkActiveClaims(userId);
  if (hasActiveClaims) {
    return {
      canErase: false,
      reason: 'Cannot erase data while active legal claims exist',
      exception: 'Article 17(3)(e) - Legal claims'
    };
  }

  // Si no hay excepciones, proceder con eliminación
  return {
    canErase: true,
    reason: 'User data can be erased'
  };
}

/**
 * Verifica requisitos de retención legal
 */
async function checkLegalRetention(userId) {
  // Verificar si el usuario tiene registros académicos recientes (<7 años)
  const query = `
    SELECT created_at
    FROM calificaciones
    WHERE estudiante_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return false; // No hay registros académicos
    }

    const lastGrade = result.rows[0];
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    // Si el último registro es menor a 7 años, NO se puede eliminar
    return new Date(lastGrade.created_at) > sevenYearsAgo;

  } catch (error) {
    // Si la tabla no existe, no hay retención legal
    return false;
  }
}

/**
 * Verifica contenido público (comentarios, posts)
 */
async function checkPublicContent(userId) {
  // Verificar comentarios, publicaciones públicas
  const tables = ['comentarios', 'publicaciones', 'foros'];

  for (const table of tables) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) FROM ${table} WHERE usuario_id = $1`,
        [userId]
      );

      if (parseInt(result.rows[0].count) > 0) {
        return true;
      }
    } catch (error) {
      // Tabla no existe, continuar
      continue;
    }
  }

  return false;
}

/**
 * Verifica reclamaciones legales activas
 */
async function checkActiveClaims(userId) {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM reclamaciones
       WHERE usuario_id = $1 AND status IN ('open', 'in_progress')`,
      [userId]
    );

    return parseInt(result.rows[0].count) > 0;

  } catch (error) {
    return false; // Tabla no existe
  }
}

// =============================================================================
// ERASURE EXECUTION
// =============================================================================

/**
 * Ejecuta el derecho al olvido
 * @param {string} userId - ID del usuario
 * @param {string} requestedBy - ID del usuario que solicita (puede ser el mismo)
 * @param {string} reason - Razón de la eliminación
 * @returns {object} Resultado de la eliminación
 */
async function executeRightToErasure(userId, requestedBy, reason = 'User request') {
  console.log(`[RIGHT-TO-ERASURE] Starting erasure for user: ${userId}`);

  // Validar que se pueda eliminar
  const validation = await validateErasureRequest(userId);

  if (!validation.canErase || validation.canErase === false) {
    throw new Error(validation.reason);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. PSEUDONIMIZACIÓN (en lugar de eliminación total)
    //    - Mantiene integridad referencial
    //    - Cumple con retención legal
    //    - Irreversible
    const pseudonym = crypto.randomBytes(16).toString('hex');

    await pseudonymizeUserData(client, userId, pseudonym);

    // 2. ELIMINACIÓN DE DATOS NO NECESARIOS
    await deleteNonEssentialData(client, userId);

    // 3. ANONIMIZACIÓN DE CONTENIDO PÚBLICO
    if (validation.canErase === 'partial') {
      await anonymizePublicContent(client, userId, pseudonym);
    }

    // 4. REGISTRO DE ELIMINACIÓN (Audit log)
    await logErasureAction(client, userId, requestedBy, reason, validation);

    await client.query('COMMIT');

    console.log(`[RIGHT-TO-ERASURE] Erasure completed for user: ${userId}`);

    return {
      success: true,
      userId,
      pseudonym,
      erasureType: validation.canErase === 'partial' ? 'partial_anonymization' : 'full_pseudonymization',
      message: 'User data has been erased/pseudonymized successfully'
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[RIGHT-TO-ERASURE] Error during erasure:`, error);
    throw error;

  } finally {
    client.release();
  }
}

/**
 * Pseudonimiza datos del usuario (GDPR-compliant irreversible anonymization)
 */
async function pseudonymizeUserData(client, userId, pseudonym) {
  console.log(`[RIGHT-TO-ERASURE] Pseudonymizing user data: ${userId} → ${pseudonym}`);

  // Actualizar tabla usuarios
  await client.query(
    `UPDATE usuarios SET
      email = $1,
      username = $1,
      nombre = 'DELETED',
      apellido_paterno = 'USER',
      apellido_materno = '',
      phone = NULL,
      address = NULL,
      date_of_birth = NULL,
      profile_picture = NULL,
      status = 'deleted',
      deleted_at = CURRENT_TIMESTAMP,
      deletion_reason = 'GDPR Article 17 - Right to Erasure'
     WHERE uuid = $2`,
    [`deleted_${pseudonym}@anonymized.local`, userId]
  );

  console.log(`[RIGHT-TO-ERASURE] User profile pseudonymized`);
}

/**
 * Elimina datos no esenciales (sin obligación de retención)
 */
async function deleteNonEssentialData(client, userId) {
  console.log(`[RIGHT-TO-ERASURE] Deleting non-essential data for user: ${userId}`);

  const tablesToDelete = [
    // Datos de marketing (NO necesarios)
    { table: 'user_consents', column: 'user_id' },
    { table: 'suscriptores_notificaciones', column: 'email' },

    // Sesiones y tokens (NO necesarios)
    { table: 'sessions', column: 'user_id' },
    { table: 'refresh_tokens', column: 'user_id' },

    // Notificaciones (NO necesarias)
    { table: 'notificaciones', column: 'usuario_id' },

    // Archivos subidos (NO esenciales)
    { table: 'user_files', column: 'user_id' },

    // Búsquedas y actividad reciente (NO necesarias)
    { table: 'search_history', column: 'user_id' },
    { table: 'recent_activity', column: 'user_id' }
  ];

  for (const { table, column } of tablesToDelete) {
    try {
      const result = await client.query(
        `DELETE FROM ${table} WHERE ${column} = $1`,
        [userId]
      );

      console.log(`[RIGHT-TO-ERASURE] Deleted ${result.rowCount} rows from ${table}`);

    } catch (error) {
      // Tabla no existe, continuar
      console.warn(`[RIGHT-TO-ERASURE] Table ${table} not found, skipping...`);
    }
  }
}

/**
 * Anonimiza contenido público (comentarios, posts)
 */
async function anonymizePublicContent(client, userId, pseudonym) {
  console.log(`[RIGHT-TO-ERASURE] Anonymizing public content for user: ${userId}`);

  const tablesToAnonymize = [
    { table: 'comentarios', column: 'usuario_id' },
    { table: 'publicaciones', column: 'usuario_id' },
    { table: 'foros', column: 'usuario_id' }
  ];

  for (const { table, column } of tablesToAnonymize) {
    try {
      await client.query(
        `UPDATE ${table}
         SET ${column} = $1,
             author_name = 'Anonymous User',
             updated_at = CURRENT_TIMESTAMP
         WHERE ${column} = $2`,
        [pseudonym, userId]
      );

      console.log(`[RIGHT-TO-ERASURE] Anonymized public content in ${table}`);

    } catch (error) {
      console.warn(`[RIGHT-TO-ERASURE] Table ${table} not found, skipping...`);
    }
  }
}

/**
 * Registra la acción de eliminación en audit log
 */
async function logErasureAction(client, userId, requestedBy, reason, validation) {
  await client.query(
    `INSERT INTO audit_logs (
      user_id, action, resource, resource_id, changes, ip_address, user_agent, hash, previous_hash
    ) VALUES (
      $1, 'ERASE_USER_DATA', 'usuarios', $2,
      $3::jsonb,
      '0.0.0.0', 'System',
      '', ''
    )`,
    [
      requestedBy,
      userId,
      JSON.stringify({
        reason,
        validation,
        timestamp: new Date().toISOString()
      })
    ]
  );

  console.log(`[RIGHT-TO-ERASURE] Erasure action logged`);
}

// =============================================================================
// RESTORE (SOLO EN CASO DE ERROR - 30 DÍAS)
// =============================================================================

/**
 * Restaura un usuario eliminado (solo dentro de 30 días)
 * @param {string} userId - ID del usuario a restaurar
 * @returns {object} Resultado
 */
async function restoreErasedUser(userId) {
  // Verificar si el usuario fue eliminado hace menos de 30 días
  const result = await pool.query(
    `SELECT * FROM usuarios WHERE uuid = $1 AND status = 'deleted'`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found or not deleted');
  }

  const user = result.rows[0];

  if (!user.deleted_at) {
    throw new Error('User was not deleted via Right to Erasure');
  }

  const deletedDate = new Date(user.deleted_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (deletedDate < thirtyDaysAgo) {
    throw new Error('Restore period expired (30 days). Data is permanently deleted.');
  }

  // Restaurar (cambiar status, pero datos pseudonimizados NO se recuperan)
  await pool.query(
    `UPDATE usuarios
     SET status = 'suspended',
         deleted_at = NULL,
         deletion_reason = NULL
     WHERE uuid = $1`,
    [userId]
  );

  console.log(`[RIGHT-TO-ERASURE] User restored: ${userId} (pseudonymized data NOT recovered)`);

  return {
    success: true,
    message: 'User account restored. Note: Personal data was pseudonymized and cannot be recovered.',
    userId
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  validateErasureRequest,
  executeRightToErasure,
  restoreErasedUser,
  checkLegalRetention,
  checkPublicContent,
  checkActiveClaims
};

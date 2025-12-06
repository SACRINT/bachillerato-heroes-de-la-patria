/**
 * Security Advanced DAO
 * Capa de acceso a datos para funcionalidades de seguridad avanzada
 * Incluye: 2FA, sesiones, historial de contraseñas, detección de intrusos
 * 
 * @version 1.0.0
 * @module data/security-advanced.dao
 */

const { pool } = require('../config/database');

// ============================================
// TWO-FACTOR AUTHENTICATION QUERIES
// ============================================

/**
 * Guarda o actualiza configuración 2FA de usuario
 * @param {number} userId - ID del usuario
 * @param {string} encryptedSecret - Secreto TOTP encriptado
 * @param {string} hashedBackupCodesJson - Códigos de respaldo hasheados (JSON)
 * @returns {Promise<{id: number}>}
 */
async function upsert2FASetup(userId, encryptedSecret, hashedBackupCodesJson) {
    const query = `
        INSERT INTO user_2fa (
            user_id, totp_secret, backup_codes, enabled, created_at
        ) VALUES ($1, $2, $3, false, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            totp_secret = EXCLUDED.totp_secret,
            backup_codes = EXCLUDED.backup_codes,
            enabled = false,
            updated_at = NOW()
        RETURNING id
    `;
    const result = await pool.query(query, [userId, encryptedSecret, hashedBackupCodesJson]);
    return result.rows[0];
}

/**
 * Habilita 2FA para un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
async function enable2FA(userId) {
    const query = 'UPDATE user_2fa SET enabled = true, verified_at = NOW() WHERE user_id = $1';
    await pool.query(query, [userId]);
}

/**
 * Deshabilita 2FA para un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
async function disable2FA(userId) {
    const query = 'UPDATE user_2fa SET enabled = false, totp_secret = NULL WHERE user_id = $1';
    await pool.query(query, [userId]);
}

/**
 * Obtiene configuración 2FA de usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object|null>}
 */
async function get2FAConfig(userId) {
    const query = 'SELECT * FROM user_2fa WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
}

/**
 * Actualiza códigos de respaldo usados
 * @param {number} userId - ID del usuario
 * @param {string} remainingCodesJson - Códigos restantes (JSON)
 * @returns {Promise<void>}
 */
async function updateBackupCodes(userId, remainingCodesJson) {
    const query = 'UPDATE user_2fa SET backup_codes = $2, updated_at = NOW() WHERE user_id = $1';
    await pool.query(query, [userId, remainingCodesJson]);
}

/**
 * Resetea intentos fallidos de 2FA
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
async function reset2FAAttempts(userId) {
    const query = 'UPDATE user_2fa SET failed_attempts = 0 WHERE user_id = $1';
    await pool.query(query, [userId]);
}

/**
 * Incrementa intentos fallidos de 2FA
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
async function increment2FAFailedAttempts(userId) {
    const query = 'UPDATE user_2fa SET failed_attempts = failed_attempts + 1, last_failed_at = NOW() WHERE user_id = $1';
    await pool.query(query, [userId]);
}

// ============================================
// SECURITY THREATS (IDS) QUERIES
// ============================================

/**
 * Registra amenaza de seguridad detectada
 * @param {string} ip - Dirección IP
 * @param {Object} threats - Detalles de las amenazas
 * @returns {Promise<void>}
 */
async function logSecurityThreat(ip, threats) {
    const query = `
        INSERT INTO security_threats (ip_address, threats, detected_at)
        VALUES ($1, $2, NOW())
    `;
    await pool.query(query, [ip, JSON.stringify(threats)]);
}

/**
 * Obtiene amenazas por IP
 * @param {string} ip - Dirección IP
 * @param {number} hours - Horas hacia atrás para buscar
 * @returns {Promise<Array>}
 */
async function getThreatsForIP(ip, hours = 24) {
    const query = `
        SELECT * FROM security_threats 
        WHERE ip_address = $1 AND detected_at > NOW() - INTERVAL '${hours} hours'
        ORDER BY detected_at DESC
    `;
    const result = await pool.query(query, [ip]);
    return result.rows;
}

// ============================================
// SESSION MANAGEMENT QUERIES
// ============================================

/**
 * Crea nueva sesión
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Promise<{id: string}>}
 */
async function createSession(sessionData) {
    const { userId, sessionId, tokenHash, deviceInfo, ipAddress, expiresAt } = sessionData;
    const query = `
        INSERT INTO user_sessions (
            id, user_id, token_hash, device_info, ip_address, 
            created_at, last_activity, expires_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, true)
        RETURNING id
    `;
    const result = await pool.query(query, [
        sessionId, userId, tokenHash, JSON.stringify(deviceInfo), ipAddress, expiresAt
    ]);
    return result.rows[0];
}

/**
 * Valida sesión por ID y token
 * @param {string} sessionId - ID de sesión
 * @param {string} token - Token de sesión
 * @returns {Promise<Object|null>}
 */
async function validateSession(sessionId, token) {
    const query = `
        SELECT s.*, u.email, u.role
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $1 
        AND s.token_hash = $2 
        AND s.is_active = true
        AND s.expires_at > NOW()
    `;
    const result = await pool.query(query, [sessionId, token]);
    return result.rows[0] || null;
}

/**
 * Destruye sesión
 * @param {string} sessionId - ID de sesión
 * @returns {Promise<void>}
 */
async function destroySession(sessionId) {
    const query = 'UPDATE user_sessions SET is_active = false, ended_at = NOW() WHERE id = $1';
    await pool.query(query, [sessionId]);
}

/**
 * Destruye todas las sesiones de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
async function destroyAllUserSessions(userId) {
    const query = 'UPDATE user_sessions SET is_active = false, ended_at = NOW() WHERE user_id = $1 AND is_active = true';
    await pool.query(query, [userId]);
}

/**
 * Lista sesiones activas de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>}
 */
async function listUserSessions(userId) {
    const query = `
        SELECT id, device_info, ip_address, created_at, last_activity
        FROM user_sessions
        WHERE user_id = $1 AND is_active = true
        ORDER BY last_activity DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

/**
 * Cuenta sesiones activas de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<number>}
 */
async function countActiveSessions(userId) {
    const query = 'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1 AND is_active = true';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
}

/**
 * Destruye sesiones más antiguas excediendo límite
 * @param {number} userId - ID del usuario
 * @param {number} limit - Número máximo de sesiones permitidas
 * @returns {Promise<void>}
 */
async function destroyOldestSessions(userId, limit) {
    const query = `
        UPDATE user_sessions SET is_active = false, ended_at = NOW()
        WHERE id IN (
            SELECT id FROM user_sessions 
            WHERE user_id = $1 AND is_active = true
            ORDER BY last_activity ASC
            LIMIT (SELECT COUNT(*) - $2 FROM user_sessions WHERE user_id = $1 AND is_active = true)
        )
    `;
    await pool.query(query, [userId, limit]);
}

/**
 * Actualiza última actividad de sesión
 * @param {string} sessionId - ID de sesión
 * @returns {Promise<void>}
 */
async function updateSessionActivity(sessionId) {
    const query = 'UPDATE user_sessions SET last_activity = NOW() WHERE id = $1';
    await pool.query(query, [sessionId]);
}

/**
 * Rota token de sesión
 * @param {string} sessionId - ID de sesión
 * @param {string} newTokenHash - Nuevo hash de token
 * @returns {Promise<void>}
 */
async function rotateSessionToken(sessionId, newTokenHash) {
    const query = 'UPDATE user_sessions SET token_hash = $2, last_activity = NOW() WHERE id = $1';
    await pool.query(query, [sessionId, newTokenHash]);
}

// ============================================
// PASSWORD HISTORY QUERIES
// ============================================

/**
 * Obtiene historial de contraseñas de usuario
 * @param {number} userId - ID del usuario
 * @param {number} limit - Número de registros a obtener
 * @returns {Promise<Array>}
 */
async function getPasswordHistory(userId, limit) {
    const query = `
        SELECT password_hash 
        FROM password_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
}

/**
 * Guarda contraseña en historial
 * @param {number} userId - ID del usuario
 * @param {string} passwordHash - Hash de la contraseña
 * @returns {Promise<void>}
 */
async function savePasswordToHistory(userId, passwordHash) {
    const query = 'INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())';
    await pool.query(query, [userId, passwordHash]);
}

/**
 * Limpia historial de contraseñas antiguas
 * @param {number} userId - ID del usuario
 * @param {number} keepCount - Número de registros a mantener
 * @returns {Promise<void>}
 */
async function cleanOldPasswordHistory(userId, keepCount) {
    const query = `
        DELETE FROM password_history 
        WHERE user_id = $1 AND id NOT IN (
            SELECT id FROM password_history 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
        )
    `;
    await pool.query(query, [userId, keepCount]);
}

/**
 * Verifica si contraseña necesita cambio
 * @param {number} userId - ID del usuario
 * @returns {Promise<{needs_change: boolean, last_changed: Date|null}>}
 */
async function checkPasswordAge(userId) {
    const query = `
        SELECT password_changed_at 
        FROM users 
        WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];

    if (!user || !user.password_changed_at) {
        return { needs_change: true, last_changed: null };
    }

    return {
        needs_change: false,
        last_changed: user.password_changed_at
    };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // 2FA
    upsert2FASetup,
    enable2FA,
    disable2FA,
    get2FAConfig,
    updateBackupCodes,
    reset2FAAttempts,
    increment2FAFailedAttempts,

    // Security Threats (IDS)
    logSecurityThreat,
    getThreatsForIP,

    // Sessions
    createSession,
    validateSession,
    destroySession,
    destroyAllUserSessions,
    listUserSessions,
    countActiveSessions,
    destroyOldestSessions,
    updateSessionActivity,
    rotateSessionToken,

    // Password History
    getPasswordHistory,
    savePasswordToHistory,
    cleanOldPasswordHistory,
    checkPasswordAge
};

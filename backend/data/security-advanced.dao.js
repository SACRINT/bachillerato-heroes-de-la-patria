"use strict";
/**
 * Security Advanced DAO - TypeScript
 * Capa de acceso a datos para funcionalidades de seguridad avanzada
 * Incluye: 2FA, sesiones, historial de contraseñas, detección de intrusos
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsert2FASetup = upsert2FASetup;
exports.enable2FA = enable2FA;
exports.disable2FA = disable2FA;
exports.get2FAConfig = get2FAConfig;
exports.updateBackupCodes = updateBackupCodes;
exports.reset2FAAttempts = reset2FAAttempts;
exports.increment2FAFailedAttempts = increment2FAFailedAttempts;
exports.logSecurityThreat = logSecurityThreat;
exports.getThreatsForIP = getThreatsForIP;
exports.createSession = createSession;
exports.validateSession = validateSession;
exports.destroySession = destroySession;
exports.destroyAllUserSessions = destroyAllUserSessions;
exports.listUserSessions = listUserSessions;
exports.countActiveSessions = countActiveSessions;
exports.destroyOldestSessions = destroyOldestSessions;
exports.updateSessionActivity = updateSessionActivity;
exports.rotateSessionToken = rotateSessionToken;
exports.getPasswordHistory = getPasswordHistory;
exports.savePasswordToHistory = savePasswordToHistory;
exports.cleanOldPasswordHistory = cleanOldPasswordHistory;
exports.checkPasswordAge = checkPasswordAge;
const database_1 = require('../config/database.js');
// =====================================================
// SECURITY ADVANCED DAO FUNCTIONS
// =====================================================
// ============================================
// TWO-FACTOR AUTHENTICATION QUERIES
// ============================================
/**
 * Guarda o actualiza configuración 2FA de usuario
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
    const result = await database_1.pool.query(query, [userId, encryptedSecret, hashedBackupCodesJson]);
    return result.rows[0];
}
/**
 * Habilita 2FA para un usuario
 */
async function enable2FA(userId) {
    const query = 'UPDATE user_2fa SET enabled = true, verified_at = NOW() WHERE user_id = $1';
    await database_1.pool.query(query, [userId]);
}
/**
 * Deshabilita 2FA para un usuario
 */
async function disable2FA(userId) {
    const query = 'UPDATE user_2fa SET enabled = false, totp_secret = NULL WHERE user_id = $1';
    await database_1.pool.query(query, [userId]);
}
/**
 * Obtiene configuración 2FA de usuario
 */
async function get2FAConfig(userId) {
    const query = 'SELECT * FROM user_2fa WHERE user_id = $1';
    const result = await database_1.pool.query(query, [userId]);
    return result.rows[0] || null;
}
/**
 * Actualiza códigos de respaldo usados
 */
async function updateBackupCodes(userId, remainingCodesJson) {
    const query = 'UPDATE user_2fa SET backup_codes = $2, updated_at = NOW() WHERE user_id = $1';
    await database_1.pool.query(query, [userId, remainingCodesJson]);
}
/**
 * Resetea intentos fallidos de 2FA
 */
async function reset2FAAttempts(userId) {
    const query = 'UPDATE user_2fa SET failed_attempts = 0 WHERE user_id = $1';
    await database_1.pool.query(query, [userId]);
}
/**
 * Incrementa intentos fallidos de 2FA
 */
async function increment2FAFailedAttempts(userId) {
    const query = 'UPDATE user_2fa SET failed_attempts = failed_attempts + 1, last_failed_at = NOW() WHERE user_id = $1';
    await database_1.pool.query(query, [userId]);
}
// ============================================
// SECURITY THREATS (IDS) QUERIES
// ============================================
/**
 * Registra amenaza de seguridad detectada
 */
async function logSecurityThreat(ip, threats) {
    const query = `
        INSERT INTO security_threats (ip_address, threats, detected_at)
        VALUES ($1, $2, NOW())
    `;
    await database_1.pool.query(query, [ip, JSON.stringify(threats)]);
}
/**
 * Obtiene amenazas por IP
 */
async function getThreatsForIP(ip, hours = 24) {
    const query = `
        SELECT * FROM security_threats 
        WHERE ip_address = $1 AND detected_at > NOW() - INTERVAL '${hours} hours'
        ORDER BY detected_at DESC
    `;
    const result = await database_1.pool.query(query, [ip]);
    return result.rows;
}
// ============================================
// SESSION MANAGEMENT QUERIES
// ============================================
/**
 * Crea nueva sesión
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
    const result = await database_1.pool.query(query, [
        sessionId, userId, tokenHash, JSON.stringify(deviceInfo), ipAddress, expiresAt
    ]);
    return result.rows[0];
}
/**
 * Valida sesión por ID y token
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
    const result = await database_1.pool.query(query, [sessionId, token]);
    return result.rows[0] || null;
}
/**
 * Destruye sesión
 */
async function destroySession(sessionId) {
    const query = 'UPDATE user_sessions SET is_active = false, ended_at = NOW() WHERE id = $1';
    await database_1.pool.query(query, [sessionId]);
}
/**
 * Destruye todas las sesiones de un usuario
 */
async function destroyAllUserSessions(userId) {
    const query = 'UPDATE user_sessions SET is_active = false, ended_at = NOW() WHERE user_id = $1 AND is_active = true';
    await database_1.pool.query(query, [userId]);
}
/**
 * Lista sesiones activas de un usuario
 */
async function listUserSessions(userId) {
    const query = `
        SELECT id, device_info, ip_address, created_at, last_activity
        FROM user_sessions
        WHERE user_id = $1 AND is_active = true
        ORDER BY last_activity DESC
    `;
    const result = await database_1.pool.query(query, [userId]);
    return result.rows;
}
/**
 * Cuenta sesiones activas de un usuario
 */
async function countActiveSessions(userId) {
    const query = 'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1 AND is_active = true';
    const result = await database_1.pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
}
/**
 * Destruye sesiones más antiguas excediendo límite
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
    await database_1.pool.query(query, [userId, limit]);
}
/**
 * Actualiza última actividad de sesión
 */
async function updateSessionActivity(sessionId) {
    const query = 'UPDATE user_sessions SET last_activity = NOW() WHERE id = $1';
    await database_1.pool.query(query, [sessionId]);
}
/**
 * Rota token de sesión
 */
async function rotateSessionToken(sessionId, newTokenHash) {
    const query = 'UPDATE user_sessions SET token_hash = $2, last_activity = NOW() WHERE id = $1';
    await database_1.pool.query(query, [sessionId, newTokenHash]);
}
// ============================================
// PASSWORD HISTORY QUERIES
// ============================================
/**
 * Obtiene historial de contraseñas de usuario
 */
async function getPasswordHistory(userId, limit) {
    const query = `
        SELECT password_hash 
        FROM password_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
    `;
    const result = await database_1.pool.query(query, [userId, limit]);
    return result.rows.map((row) => row.password_hash);
}
/**
 * Guarda contraseña en historial
 */
async function savePasswordToHistory(userId, passwordHash) {
    const query = 'INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())';
    await database_1.pool.query(query, [userId, passwordHash]);
}
/**
 * Limpia historial de contraseñas antiguas
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
    await database_1.pool.query(query, [userId, keepCount]);
}
/**
 * Verifica si contraseña necesita cambio
 */
async function checkPasswordAge(userId) {
    const query = `
        SELECT password_changed_at 
        FROM users 
        WHERE id = $1
    `;
    const result = await database_1.pool.query(query, [userId]);
    const user = result.rows[0];
    if (!user || !user.password_changed_at) {
        return { needs_change: true, last_changed: null };
    }
    return {
        needs_change: false,
        last_changed: user.password_changed_at
    };
}
//# sourceMappingURL=security-advanced.dao.js.map
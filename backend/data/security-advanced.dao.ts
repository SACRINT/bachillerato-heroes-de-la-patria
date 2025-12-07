/**
 * Security Advanced DAO - TypeScript
 * Capa de acceso a datos para funcionalidades de seguridad avanzada
 * Incluye: 2FA, sesiones, historial de contraseñas, detección de intrusos
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface User2FAConfig {
    id: number;
    user_id: number;
    totp_secret: string;
    backup_codes: string; // JSON
    enabled: boolean;
    created_at: Date;
    updated_at?: Date;
    verified_at?: Date;
    failed_attempts: number;
    last_failed_at?: Date;
}

export interface SecurityThreat {
    id: number;
    ip_address: string;
    threats: any; // JSON
    detected_at: Date;
}

export interface UserSession {
    id: string; // UUID
    user_id: number;
    token_hash: string;
    device_info: any; // JSON
    ip_address: string;
    created_at: Date;
    last_activity: Date;
    expires_at: Date;
    is_active: boolean;
    ended_at?: Date;
    // Joined fields
    email?: string;
    role?: string;
}

export interface CreateSessionInput {
    userId: number;
    sessionId: string;
    tokenHash: string;
    deviceInfo: any;
    ipAddress: string;
    expiresAt: Date;
}

export interface PasswordHistoryEntry {
    id: number;
    user_id: number;
    password_hash: string;
    created_at: Date;
}

export interface PasswordAgeCheck {
    needs_change: boolean;
    last_changed: Date | null;
}

// =====================================================
// SECURITY ADVANCED DAO FUNCTIONS
// =====================================================

// ============================================
// TWO-FACTOR AUTHENTICATION QUERIES
// ============================================

/**
 * Guarda o actualiza configuración 2FA de usuario
 */
export async function upsert2FASetup(userId: number, encryptedSecret: string, hashedBackupCodesJson: string): Promise<{ id: number }> {
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
 */
export async function enable2FA(userId: number): Promise<void> {
    const query = 'UPDATE user_2fa SET enabled = true, verified_at = NOW() WHERE user_id = $1';
    await pool.query(query, [userId]);
}

/**
 * Deshabilita 2FA para un usuario
 */
export async function disable2FA(userId: number): Promise<void> {
    const query = 'UPDATE user_2fa SET enabled = false, totp_secret = NULL WHERE user_id = $1';
    await pool.query(query, [userId]);
}

/**
 * Obtiene configuración 2FA de usuario
 */
export async function get2FAConfig(userId: number): Promise<User2FAConfig | null> {
    const query = 'SELECT * FROM user_2fa WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
}

/**
 * Actualiza códigos de respaldo usados
 */
export async function updateBackupCodes(userId: number, remainingCodesJson: string): Promise<void> {
    const query = 'UPDATE user_2fa SET backup_codes = $2, updated_at = NOW() WHERE user_id = $1';
    await pool.query(query, [userId, remainingCodesJson]);
}

/**
 * Resetea intentos fallidos de 2FA
 */
export async function reset2FAAttempts(userId: number): Promise<void> {
    const query = 'UPDATE user_2fa SET failed_attempts = 0 WHERE user_id = $1';
    await pool.query(query, [userId]);
}

/**
 * Incrementa intentos fallidos de 2FA
 */
export async function increment2FAFailedAttempts(userId: number): Promise<void> {
    const query = 'UPDATE user_2fa SET failed_attempts = failed_attempts + 1, last_failed_at = NOW() WHERE user_id = $1';
    await pool.query(query, [userId]);
}

// ============================================
// SECURITY THREATS (IDS) QUERIES
// ============================================

/**
 * Registra amenaza de seguridad detectada
 */
export async function logSecurityThreat(ip: string, threats: any): Promise<void> {
    const query = `
        INSERT INTO security_threats (ip_address, threats, detected_at)
        VALUES ($1, $2, NOW())
    `;
    await pool.query(query, [ip, JSON.stringify(threats)]);
}

/**
 * Obtiene amenazas por IP
 */
export async function getThreatsForIP(ip: string, hours: number = 24): Promise<SecurityThreat[]> {
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
 */
export async function createSession(sessionData: CreateSessionInput): Promise<{ id: string }> {
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
 */
export async function validateSession(sessionId: string, token: string): Promise<UserSession | null> {
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
 */
export async function destroySession(sessionId: string): Promise<void> {
    const query = 'UPDATE user_sessions SET is_active = false, ended_at = NOW() WHERE id = $1';
    await pool.query(query, [sessionId]);
}

/**
 * Destruye todas las sesiones de un usuario
 */
export async function destroyAllUserSessions(userId: number): Promise<void> {
    const query = 'UPDATE user_sessions SET is_active = false, ended_at = NOW() WHERE user_id = $1 AND is_active = true';
    await pool.query(query, [userId]);
}

/**
 * Lista sesiones activas de un usuario
 */
export async function listUserSessions(userId: number): Promise<UserSession[]> {
    const query = `
        SELECT id, device_info, ip_address, created_at, last_activity
        FROM user_sessions
        WHERE user_id = $1 AND is_active = true
        ORDER BY last_activity DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows as UserSession[];
}

/**
 * Cuenta sesiones activas de un usuario
 */
export async function countActiveSessions(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1 AND is_active = true';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
}

/**
 * Destruye sesiones más antiguas excediendo límite
 */
export async function destroyOldestSessions(userId: number, limit: number): Promise<void> {
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
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
    const query = 'UPDATE user_sessions SET last_activity = NOW() WHERE id = $1';
    await pool.query(query, [sessionId]);
}

/**
 * Rota token de sesión
 */
export async function rotateSessionToken(sessionId: string, newTokenHash: string): Promise<void> {
    const query = 'UPDATE user_sessions SET token_hash = $2, last_activity = NOW() WHERE id = $1';
    await pool.query(query, [sessionId, newTokenHash]);
}

// ============================================
// PASSWORD HISTORY QUERIES
// ============================================

/**
 * Obtiene historial de contraseñas de usuario
 */
export async function getPasswordHistory(userId: number, limit: number): Promise<string[]> {
    const query = `
        SELECT password_hash 
        FROM password_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows.map((row: any) => row.password_hash);
}

/**
 * Guarda contraseña en historial
 */
export async function savePasswordToHistory(userId: number, passwordHash: string): Promise<void> {
    const query = 'INSERT INTO password_history (user_id, password_hash, created_at) VALUES ($1, $2, NOW())';
    await pool.query(query, [userId, passwordHash]);
}

/**
 * Limpia historial de contraseñas antiguas
 */
export async function cleanOldPasswordHistory(userId: number, keepCount: number): Promise<void> {
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
 */
export async function checkPasswordAge(userId: number): Promise<PasswordAgeCheck> {
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

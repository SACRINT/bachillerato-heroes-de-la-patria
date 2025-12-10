/**
 * Security Advanced DAO - TypeScript
 * Capa de acceso a datos para funcionalidades de seguridad avanzada
 * Incluye: 2FA, sesiones, historial de contraseñas, detección de intrusos
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface User2FAConfig {
    id: number;
    user_id: number;
    totp_secret: string;
    backup_codes: string;
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
    threats: any;
    detected_at: Date;
}
export interface UserSession {
    id: string;
    user_id: number;
    token_hash: string;
    device_info: any;
    ip_address: string;
    created_at: Date;
    last_activity: Date;
    expires_at: Date;
    is_active: boolean;
    ended_at?: Date;
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
/**
 * Guarda o actualiza configuración 2FA de usuario
 */
export declare function upsert2FASetup(userId: number, encryptedSecret: string, hashedBackupCodesJson: string): Promise<{
    id: number;
}>;
/**
 * Habilita 2FA para un usuario
 */
export declare function enable2FA(userId: number): Promise<void>;
/**
 * Deshabilita 2FA para un usuario
 */
export declare function disable2FA(userId: number): Promise<void>;
/**
 * Obtiene configuración 2FA de usuario
 */
export declare function get2FAConfig(userId: number): Promise<User2FAConfig | null>;
/**
 * Actualiza códigos de respaldo usados
 */
export declare function updateBackupCodes(userId: number, remainingCodesJson: string): Promise<void>;
/**
 * Resetea intentos fallidos de 2FA
 */
export declare function reset2FAAttempts(userId: number): Promise<void>;
/**
 * Incrementa intentos fallidos de 2FA
 */
export declare function increment2FAFailedAttempts(userId: number): Promise<void>;
/**
 * Registra amenaza de seguridad detectada
 */
export declare function logSecurityThreat(ip: string, threats: any): Promise<void>;
/**
 * Obtiene amenazas por IP
 */
export declare function getThreatsForIP(ip: string, hours?: number): Promise<SecurityThreat[]>;
/**
 * Crea nueva sesión
 */
export declare function createSession(sessionData: CreateSessionInput): Promise<{
    id: string;
}>;
/**
 * Valida sesión por ID y token
 */
export declare function validateSession(sessionId: string, token: string): Promise<UserSession | null>;
/**
 * Destruye sesión
 */
export declare function destroySession(sessionId: string): Promise<void>;
/**
 * Destruye todas las sesiones de un usuario
 */
export declare function destroyAllUserSessions(userId: number): Promise<void>;
/**
 * Lista sesiones activas de un usuario
 */
export declare function listUserSessions(userId: number): Promise<UserSession[]>;
/**
 * Cuenta sesiones activas de un usuario
 */
export declare function countActiveSessions(userId: number): Promise<number>;
/**
 * Destruye sesiones más antiguas excediendo límite
 */
export declare function destroyOldestSessions(userId: number, limit: number): Promise<void>;
/**
 * Actualiza última actividad de sesión
 */
export declare function updateSessionActivity(sessionId: string): Promise<void>;
/**
 * Rota token de sesión
 */
export declare function rotateSessionToken(sessionId: string, newTokenHash: string): Promise<void>;
/**
 * Obtiene historial de contraseñas de usuario
 */
export declare function getPasswordHistory(userId: number, limit: number): Promise<string[]>;
/**
 * Guarda contraseña en historial
 */
export declare function savePasswordToHistory(userId: number, passwordHash: string): Promise<void>;
/**
 * Limpia historial de contraseñas antiguas
 */
export declare function cleanOldPasswordHistory(userId: number, keepCount: number): Promise<void>;
/**
 * Verifica si contraseña necesita cambio
 */
export declare function checkPasswordAge(userId: number): Promise<PasswordAgeCheck>;
//# sourceMappingURL=security-advanced.dao.d.ts.map
export class AdvancedSecurityService {
    pool: any;
    twoFactor: TwoFactorAuth;
    rateLimiter: RateLimiter;
    ids: IntrusionDetectionSystem;
    sessionManager: SessionManager;
    passwordValidator: PasswordValidator;
    initialized: boolean;
    /**
     * Inicializa el servicio
     */
    initialize(pool: any): Promise<void>;
    setup2FA(userId: any): Promise<{
        secret: string;
        otpAuthUrl: string;
        backupCodes: string[];
    }>;
    enable2FA(userId: any, code: any): Promise<{
        enabled: boolean;
    }>;
    verify2FA(userId: any, code: any): Promise<boolean>;
    disable2FA(userId: any, password: any): Promise<{
        disabled: boolean;
    }>;
    generateVerificationCode(userId: any, method: any): Promise<string>;
    verifyTemporaryCode(userId: any, code: any, method: any): Promise<boolean>;
    checkRateLimit(key: any, windowType: any): {
        allowed: boolean;
        retryAfter?: undefined;
        limit?: undefined;
        remaining?: undefined;
    } | {
        allowed: boolean;
        retryAfter: number;
        limit: any;
        remaining: number;
    } | {
        allowed: boolean;
        limit: any;
        remaining: number;
        retryAfter?: undefined;
    };
    resetRateLimit(key: any, windowType: any): void;
    analyzeRequest(request: any): {
        blocked: boolean;
        reason: string;
        threats?: undefined;
    } | {
        blocked: boolean;
        reason: string;
        threats: ({
            type: string;
            pattern: string;
            severity: string;
        } | {
            type: string;
            severity: string;
            pattern?: undefined;
        })[];
    } | {
        blocked: boolean;
        threats: ({
            type: string;
            pattern: string;
            severity: string;
        } | {
            type: string;
            severity: string;
            pattern?: undefined;
        })[];
        reason?: undefined;
    };
    recordFailedLogin(ip: any, userId: any): {
        blocked: boolean;
        attempts: any;
    };
    clearFailedLogins(ip: any): void;
    unblockIP(ip: any): void;
    getBlockedIPs(): {
        ip: any;
        since: Date;
        until: Date;
    }[];
    createSession(userId: any, deviceInfo: any): Promise<{
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        token: string;
        expiresAt: Date;
    }>;
    validateSession(sessionId: any, token: any): Promise<{
        valid: boolean;
        reason: string;
        userId?: undefined;
        newToken?: undefined;
    } | {
        valid: boolean;
        userId: number;
        newToken: any;
        reason?: undefined;
    }>;
    destroySession(sessionId: any): Promise<void>;
    destroyAllSessions(userId: any): Promise<void>;
    listSessions(userId: any): Promise<{
        device_info: any;
        id: string;
        user_id: number;
        token_hash: string;
        ip_address: string;
        created_at: Date;
        last_activity: Date;
        expires_at: Date;
        is_active: boolean;
        ended_at?: Date;
        email?: string;
        role?: string;
    }[]>;
    validatePassword(password: any): {
        valid: boolean;
        errors: string[];
        strength: string;
    };
    checkPasswordHistory(userId: any, password: any): Promise<{
        used: boolean;
        message: string;
    } | {
        used: boolean;
        message?: undefined;
    }>;
    savePasswordToHistory(userId: any, passwordHash: any): Promise<void>;
    passwordNeedsChange(userId: any): Promise<boolean>;
}
export const securityService: AdvancedSecurityService;
export class ServiceError extends Error {
    constructor(message: any, code: any, statusCode?: number);
    code: any;
    statusCode: number;
}
declare class TwoFactorAuth {
    constructor(pool: any);
    pool: any;
    pendingCodes: Map<any, any>;
    /**
     * Genera secreto TOTP para usuario
     */
    setupTOTP(userId: any): Promise<{
        secret: string;
        otpAuthUrl: string;
        backupCodes: string[];
    }>;
    /**
     * Verifica y habilita 2FA
     */
    enableTOTP(userId: any, code: any): Promise<{
        enabled: boolean;
    }>;
    /**
     * Verifica código 2FA
     */
    verify(userId: any, code: any): Promise<boolean>;
    /**
     * Genera código temporal (para email/SMS)
     */
    generateTemporaryCode(userId: any, method?: string): Promise<string>;
    /**
     * Verifica código temporal
     */
    verifyTemporaryCode(userId: any, code: any, method?: string): Promise<boolean>;
    /**
     * Deshabilita 2FA
     */
    disable(userId: any, password: any): Promise<{
        disabled: boolean;
    }>;
    _generateSecret(length: any): string;
    _generateBackupCodes(): string[];
    _generateNumericCode(length: any): string;
    _verifyTOTP(secret: any, code: any): boolean;
    _generateTOTP(secret: any, counter: any): string;
    _getUserAuth(userId: any): Promise<securityDAO.User2FAConfig>;
    _encryptSecret(secret: any): Promise<string>;
    _decryptSecret(encryptedSecret: any): Promise<string>;
    _verifyBackupCode(userId: any, code: any, hashedCodes: any): Promise<boolean>;
    _resetAttempts(userId: any): Promise<void>;
    _incrementFailedAttempts(userId: any): Promise<void>;
}
declare class RateLimiter {
    requests: Map<any, any>;
    /**
     * Verifica límite de tasa
     */
    check(key: any, windowType?: string): {
        allowed: boolean;
        retryAfter?: undefined;
        limit?: undefined;
        remaining?: undefined;
    } | {
        allowed: boolean;
        retryAfter: number;
        limit: any;
        remaining: number;
    } | {
        allowed: boolean;
        limit: any;
        remaining: number;
        retryAfter?: undefined;
    };
    /**
     * Reset manual de límites
     */
    reset(key: any, windowType?: string): void;
    /**
     * Limpia entradas expiradas
     */
    cleanup(): void;
}
declare class IntrusionDetectionSystem {
    constructor(pool: any);
    pool: any;
    blockedIPs: Map<any, any>;
    failedAttempts: Map<any, any>;
    /**
     * Analiza request por amenazas
     */
    analyze(request: any): {
        blocked: boolean;
        reason: string;
        threats?: undefined;
    } | {
        blocked: boolean;
        reason: string;
        threats: ({
            type: string;
            pattern: string;
            severity: string;
        } | {
            type: string;
            severity: string;
            pattern?: undefined;
        })[];
    } | {
        blocked: boolean;
        threats: ({
            type: string;
            pattern: string;
            severity: string;
        } | {
            type: string;
            severity: string;
            pattern?: undefined;
        })[];
        reason?: undefined;
    };
    /**
     * Registra intento de login fallido
     */
    recordFailedLogin(ip: any, userId: any): {
        blocked: boolean;
        attempts: any;
    };
    /**
     * Limpia intentos fallidos después de login exitoso
     */
    clearFailedLogins(ip: any): void;
    /**
     * Verifica si una IP está bloqueada
     */
    _isBlocked(ip: any): boolean;
    /**
     * Bloquea una IP
     */
    _blockIP(ip: any): void;
    /**
     * Desbloquea una IP manualmente
     */
    unblockIP(ip: any): void;
    /**
     * Lista IPs bloqueadas
     */
    getBlockedIPs(): {
        ip: any;
        since: Date;
        until: Date;
    }[];
    /**
     * Registra amenaza en BD
     */
    _logThreat(ip: any, threats: any): Promise<void>;
}
declare class SessionManager {
    constructor(pool: any);
    pool: any;
    /**
     * Crea nueva sesión
     */
    create(userId: any, deviceInfo?: {}): Promise<{
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        token: string;
        expiresAt: Date;
    }>;
    /**
     * Valida sesión
     */
    validate(sessionId: any, token: any): Promise<{
        valid: boolean;
        reason: string;
        userId?: undefined;
        newToken?: undefined;
    } | {
        valid: boolean;
        userId: number;
        newToken: any;
        reason?: undefined;
    }>;
    /**
     * Destruye sesión
     */
    destroy(sessionId: any): Promise<void>;
    /**
     * Destruye todas las sesiones de un usuario
     */
    destroyAll(userId: any): Promise<void>;
    /**
     * Lista sesiones activas de un usuario
     */
    listUserSessions(userId: any): Promise<{
        device_info: any;
        id: string;
        user_id: number;
        token_hash: string;
        ip_address: string;
        created_at: Date;
        last_activity: Date;
        expires_at: Date;
        is_active: boolean;
        ended_at?: Date;
        email?: string;
        role?: string;
    }[]>;
    _generateToken(): string;
    _enforceSessionLimit(userId: any): Promise<void>;
    _updateActivity(sessionId: any): Promise<void>;
    _rotateToken(sessionId: any): Promise<string>;
}
declare class PasswordValidator {
    constructor(pool: any);
    pool: any;
    /**
     * Valida fortaleza de contraseña
     */
    validate(password: any): {
        valid: boolean;
        errors: string[];
        strength: string;
    };
    /**
     * Verifica si contraseña fue usada anteriormente
     */
    checkHistory(userId: any, password: any): Promise<{
        used: boolean;
        message: string;
    } | {
        used: boolean;
        message?: undefined;
    }>;
    /**
     * Guarda contraseña en historial
     */
    saveToHistory(userId: any, passwordHash: any): Promise<void>;
    /**
     * Verifica si contraseña necesita cambio
     */
    needsChange(userId: any): Promise<boolean>;
    _calculateStrength(password: any): "good" | "weak" | "fair" | "strong";
}
import securityDAO = require("../data/security-advanced.dao");
export {};
//# sourceMappingURL=AdvancedSecurityService.d.ts.map
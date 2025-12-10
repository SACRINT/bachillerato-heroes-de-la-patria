/**
 * 🔐 ADVANCED SECURITY SERVICE - TypeScript Version
 * Servicio de seguridad avanzada con 2FA, rate limiting, intrusion detection
 * OWASP Top 10 compliance
 *
 * Refactorizado: 07 Diciembre 2025
 */
declare const CONFIG: {
    twoFactor: {
        codeLength: number;
        codeExpiry: number;
        maxAttempts: number;
        backupCodesCount: number;
    };
    rateLimiting: {
        windows: {
            api: {
                duration: number;
                maxRequests: number;
            };
            auth: {
                duration: number;
                maxRequests: number;
            };
            sensitive: {
                duration: number;
                maxRequests: number;
            };
        };
    };
    session: {
        maxConcurrent: number;
        inactivityTimeout: number;
        maxAge: number;
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
        tagLength: number;
    };
};
export interface ServiceError extends Error {
    code: string;
    statusCode: number;
}
export interface TwoFactorSetupResult {
    success: boolean;
    secret: string;
    qrCode: string;
    backupCodes: string[];
}
export interface TwoFactorVerifyResult {
    success: boolean;
    remainingAttempts?: number;
    message?: string;
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}
export interface SecurityAuditEntry {
    userId: number;
    action: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    details?: Record<string, any>;
    timestamp: Date;
}
export interface SessionInfo {
    id: string;
    userId: number;
    deviceInfo: string;
    ipAddress: string;
    createdAt: Date;
    lastActivity: Date;
    isActive: boolean;
}
declare class SecurityServiceError extends Error implements ServiceError {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
declare class TwoFactorAuth {
    private pendingCodes;
    constructor();
    setupTOTP(userId: number): Promise<TwoFactorSetupResult>;
    enableTOTP(userId: number, code: string): Promise<TwoFactorVerifyResult>;
    verify(userId: number, code: string): Promise<TwoFactorVerifyResult>;
    generateTemporaryCode(userId: number, method?: string): Promise<string>;
    verifyTemporaryCode(userId: number, code: string, method?: string): Promise<TwoFactorVerifyResult>;
    disable(userId: number, password: string): Promise<{
        success: boolean;
    }>;
    private _generateSecret;
    private _generateBackupCodes;
    private _generateNumericCode;
    private _verifyTOTP;
    private _generateTOTP;
    private _encryptSecret;
    private _decryptSecret;
}
declare class RateLimiter {
    private requests;
    constructor();
    check(key: string, windowType?: keyof typeof CONFIG.rateLimiting.windows): RateLimitResult;
    reset(key: string, windowType?: string): void;
    cleanup(): void;
}
declare class SecurityAudit {
    log(entry: SecurityAuditEntry): Promise<void>;
    getRecentActivity(userId: number, limit?: number): Promise<SecurityAuditEntry[]>;
    getSuspiciousActivity(options?: {
        timeframe?: number;
        threshold?: number;
    }): Promise<any[]>;
}
declare class SessionManager {
    createSession(userId: number, deviceInfo: string, ipAddress: string): Promise<SessionInfo>;
    validateSession(sessionId: string): Promise<{
        valid: boolean;
        session?: SessionInfo;
    }>;
    terminateSession(sessionId: string): Promise<void>;
    terminateAllSessions(userId: number, exceptSessionId?: string): Promise<void>;
}
declare class AdvancedSecurityService {
    twoFactor: TwoFactorAuth;
    rateLimiter: RateLimiter;
    audit: SecurityAudit;
    sessions: SessionManager;
    constructor();
    healthCheck(): Promise<{
        status: string;
        components: Record<string, boolean>;
    }>;
}
declare const advancedSecurityService: AdvancedSecurityService;
export { AdvancedSecurityService, TwoFactorAuth, RateLimiter, SecurityAudit, SessionManager, SecurityServiceError };
export default advancedSecurityService;
//# sourceMappingURL=advanced-security.service.d.ts.map
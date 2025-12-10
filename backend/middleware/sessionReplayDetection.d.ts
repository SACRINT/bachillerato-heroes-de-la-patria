export = sessionReplayDetection;
declare const sessionReplayDetection: SessionReplayDetection;
declare class SessionReplayDetection {
    activeSessions: Map<any, any>;
    config: {
        maxConcurrentSessions: number;
        maxLocationChanges: number;
        sessionTimeoutMinutes: number;
        ipChangeWarningThreshold: number;
        userAgentChangeAllowed: boolean;
        geoLocationCheckEnabled: boolean;
        auditLogEnabled: boolean;
    };
    ipChangeHistory: Map<any, any>;
    revokedSessions: Set<any>;
    sessionRateLimit: Map<any, any>;
    rateLimitConfig: {
        windowMs: number;
        maxRequests: number;
    };
    /**
     * MIDDLEWARE PRINCIPAL
     */
    middleware(): (req: any, res: any, next: any) => Promise<any>;
    /**
     * EXTRAER TOKEN DE SESIÓN
     */
    extractSessionToken(req: any): any;
    /**
     * OBTENER IP DEL CLIENTE
     */
    getClientIP(req: any): any;
    /**
     * OBTENER O CREAR SESIÓN
     */
    getOrCreateSession(userId: any, sessionToken: any, ip: any, userAgent: any): any;
    /**
     * GENERAR FINGERPRINT DE SESIÓN
     */
    generateFingerprint(ip: any, userAgent: any): string;
    /**
     * VALIDAR INTEGRIDAD DE SESIÓN
     */
    validateSessionIntegrity(sessionInfo: any, currentIP: any, currentUserAgent: any): {
        valid: boolean;
        severity: string;
        reason: string;
        issues: {
            type: string;
            severity: string;
            message: string;
        }[];
    };
    /**
     * DETECTAR SESIONES CONCURRENTES SOSPECHOSAS
     */
    checkConcurrentSessions(userId: any, currentSessionToken: any): {
        suspicious: boolean;
        count: number;
        sessions?: undefined;
    } | {
        suspicious: boolean;
        count: number;
        sessions: {
            sessionId: any;
            ip: any;
            createdAt: string;
            lastActivity: string;
        }[];
    };
    /**
     * DETECTAR CAMBIOS RÁPIDOS DE IP
     */
    detectRapidIPChanges(userId: any, currentIP: any): boolean;
    /**
     * ACTUALIZAR ÚLTIMA ACTIVIDAD DE SESIÓN
     */
    updateSessionActivity(sessionInfo: any): void;
    /**
     * VERIFICAR SI SESIÓN ESTÁ REVOCADA
     */
    isSessionRevoked(sessionToken: any): boolean;
    /**
     * REVOCAR SESIÓN
     */
    revokeSession(sessionToken: any): void;
    /**
     * REVOCAR TODAS LAS SESIONES DE UN USUARIO
     */
    revokeAllUserSessions(userId: any): number;
    /**
     * RATE LIMITING POR SESIÓN
     */
    isSessionRateLimited(sessionToken: any): boolean;
    /**
     * AUDIT LOGGING
     */
    auditLog(userId: any, eventType: any, details?: {}): void;
    /**
     * BLOQUEAR REQUEST
     */
    blockRequest(res: any, message: any, statusCode?: number): void;
    /**
     * CLEANUP DE SESIONES EXPIRADAS
     */
    cleanup(): void;
    /**
     * OBTENER ESTADÍSTICAS DE SESIONES
     */
    getStats(): {
        totalUsers: number;
        totalSessions: number;
        revokedSessions: number;
        ipChangeHistoryEntries: number;
        rateLimitEntries: number;
        usersWithMultipleSessions: number;
    };
}
//# sourceMappingURL=sessionReplayDetection.d.ts.map
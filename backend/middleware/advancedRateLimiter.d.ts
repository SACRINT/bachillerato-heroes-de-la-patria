export = advancedRateLimiter;
declare const advancedRateLimiter: AdvancedRateLimiter;
declare class AdvancedRateLimiter {
    requestHistory: Map<any, any>;
    defaultLimits: {
        guest: {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
        user: {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
        admin: {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
    };
    endpointLimits: {
        'POST /api/auth/login': {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
        'POST /api/auth/register': {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
        'POST /api/auth/reset-password': {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
        'POST /api/auth/2fa/verify': {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
        'POST /api/contact': {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
        'POST /api/support/tickets': {
            maxRequests: number;
            windowMs: number;
            burstAllowance: number;
        };
    };
    whitelistedIPs: Set<any>;
    /**
     * MIDDLEWARE PRINCIPAL
     */
    middleware(): (req: any, res: any, next: any) => Promise<any>;
    /**
     * FACTORY METHOD: Crear middleware con límites custom
     */
    limit(customLimits: any): (req: any, res: any, next: any) => Promise<any>;
    /**
     * OBTENER LÍMITES APLICABLES PARA REQUEST
     */
    getLimits(req: any): any;
    /**
     * GENERAR KEY ÚNICA PARA TRACKING
     */
    generateKey(req: any): string;
    /**
     * CHECK RATE LIMIT (Sliding Window Algorithm)
     */
    checkRateLimit(key: any, limits: any): {
        allowed: boolean;
        currentRequests: any;
        remaining: number;
        resetTime: string;
        retryAfter: number;
    };
    /**
     * OBTENER IP DEL CLIENTE
     */
    getClientIP(req: any): any;
    /**
     * AGREGAR IP A WHITELIST
     */
    addToWhitelist(ip: any): void;
    /**
     * REMOVER IP DE WHITELIST
     */
    removeFromWhitelist(ip: any): void;
    /**
     * AGREGAR LÍMITE CUSTOM POR ENDPOINT
     */
    addEndpointLimit(method: any, path: any, limits: any): void;
    /**
     * RESET RATE LIMIT PARA UN KEY
     */
    reset(key: any): void;
    /**
     * RESET RATE LIMIT PARA UN USUARIO
     */
    resetUser(userId: any): number;
    /**
     * RESET RATE LIMIT PARA UN IP
     */
    resetIP(ip: any): number;
    /**
     * CLEANUP DE HISTORIAL ANTIGUO
     */
    cleanup(): void;
    /**
     * OBTENER ESTADÍSTICAS
     */
    getStats(): {
        totalKeys: number;
        whitelistedIPs: number;
        customEndpoints: number;
        topKeys: any[];
    };
    /**
     * OBTENER STATUS DE UN KEY
     */
    getStatus(key: any): {
        key: any;
        requests: number;
        status: string;
        recentRequests?: undefined;
        oldestRequest?: undefined;
        newestRequest?: undefined;
    } | {
        key: any;
        requests: any;
        recentRequests: any;
        oldestRequest: string;
        newestRequest: string;
        status?: undefined;
    };
}
//# sourceMappingURL=advancedRateLimiter.d.ts.map
declare const _exports: RateLimiterService;
export = _exports;
/**
 * Servicio de Rate Limiting Avanzado
 * BGE Héroes de la Patria
 * FASE 4 - Semana 27-28
 *
 * Control de límites de peticiones por usuario, IP, endpoint
 */
declare class RateLimiterService {
    requests: Map<any, any>;
    defaultLimits: {
        windowMs: number;
        max: number;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    endpointLimits: {
        auth: {
            windowMs: number;
            max: number;
            blockDuration: number;
        };
        api: {
            windowMs: number;
            max: number;
        };
        search: {
            windowMs: number;
            max: number;
        };
        upload: {
            windowMs: number;
            max: number;
        };
        ai: {
            windowMs: number;
            max: number;
        };
        webhook: {
            windowMs: number;
            max: number;
        };
        admin: {
            windowMs: number;
            max: number;
        };
        public: {
            windowMs: number;
            max: number;
        };
    };
    whitelist: Set<any>;
    blacklist: Map<any, any>;
    stats: {
        totalRequests: number;
        blockedRequests: number;
        byEndpointType: {};
    };
    /**
     * Verificar si el request está permitido
     */
    isAllowed(identifier: any, endpointType?: string, options?: {}): {
        allowed: boolean;
        remaining: number;
        retryAfter?: undefined;
        reason?: undefined;
        limit?: undefined;
        current?: undefined;
        resetTime?: undefined;
    } | {
        allowed: boolean;
        retryAfter: number;
        reason: any;
        remaining?: undefined;
        limit?: undefined;
        current?: undefined;
        resetTime?: undefined;
    } | {
        allowed: boolean;
        retryAfter: number;
        limit: any;
        current: any;
        remaining?: undefined;
        reason?: undefined;
        resetTime?: undefined;
    } | {
        allowed: boolean;
        remaining: number;
        resetTime: any;
        limit: any;
        retryAfter?: undefined;
        reason?: undefined;
        current?: undefined;
    };
    /**
     * Middleware de Express
     */
    middleware(endpointType?: string, options?: {}): (req: any, res: any, next: any) => any;
    /**
     * Agregar IP a whitelist
     */
    addToWhitelist(ip: any): boolean;
    /**
     * Remover IP de whitelist
     */
    removeFromWhitelist(ip: any): boolean;
    /**
     * Bloquear identificador temporalmente
     */
    block(identifier: any, durationMs: any, reason?: string): boolean;
    /**
     * Desbloquear identificador
     */
    unblock(identifier: any): boolean;
    /**
     * Resetear límites para un identificador
     */
    reset(identifier: any, endpointType?: any): boolean;
    /**
     * Obtener estado actual de un identificador
     */
    getStatus(identifier: any, endpointType?: string): {
        count: number;
        limit: any;
        remaining: any;
        windowMs: any;
        resetTime?: undefined;
    } | {
        count: any;
        limit: any;
        remaining: number;
        resetTime: any;
        windowMs: any;
    };
    /**
     * Obtener estadísticas globales
     */
    getStats(): {
        activeRecords: number;
        whitelistSize: number;
        blacklistSize: number;
        blockRate: string;
        totalRequests: number;
        blockedRequests: number;
        byEndpointType: {};
    };
    /**
     * Obtener los principales consumidores
     */
    getTopConsumers(limit?: number): {
        identifier: any;
        type: any;
        count: any;
        resetTime: any;
    }[];
    /**
     * Limpiar registros expirados
     */
    cleanup(): number;
    /**
     * Configurar límites personalizados
     */
    setLimits(endpointType: any, limits: any): boolean;
    /**
     * Obtener configuración actual
     */
    getConfig(): {
        defaultLimits: {
            windowMs: number;
            max: number;
            skipSuccessfulRequests: boolean;
            skipFailedRequests: boolean;
        };
        endpointLimits: {
            auth: {
                windowMs: number;
                max: number;
                blockDuration: number;
            };
            api: {
                windowMs: number;
                max: number;
            };
            search: {
                windowMs: number;
                max: number;
            };
            upload: {
                windowMs: number;
                max: number;
            };
            ai: {
                windowMs: number;
                max: number;
            };
            webhook: {
                windowMs: number;
                max: number;
            };
            admin: {
                windowMs: number;
                max: number;
            };
            public: {
                windowMs: number;
                max: number;
            };
        };
    };
    /**
     * Resetear estadísticas
     */
    resetStats(): boolean;
}
//# sourceMappingURL=RateLimiterService.d.ts.map
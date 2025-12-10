export const cacheMiddleware: CacheMiddleware;
declare class CacheMiddleware {
    defaultTTLs: {
        '/api/config/tenant': number;
        '/api/noticias': number;
        '/api/egresados': number;
        '/api/admin/stats': number;
        '/api/students': number;
        '/api/teachers': number;
        '/api/parents': number;
    };
    /**
     * CACHE RESPONSE MIDDLEWARE
     */
    cacheResponse(options?: {}): (req: any, res: any, next: any) => Promise<any>;
    /**
     * INVALIDATE CACHE MIDDLEWARE (para POST/PUT/DELETE)
     */
    invalidateCache(options?: {}): (req: any, res: any, next: any) => Promise<void>;
    /**
     * GENERAR CACHE KEY
     */
    generateCacheKey(req: any): string;
    /**
     * GENERAR INVALIDATION PATTERN
     */
    generateInvalidationPattern(req: any): string;
    /**
     * OBTENER TTL PARA PATH
     */
    getTTLForPath(path: any): any;
    /**
     * AGREGAR TTL CUSTOM PARA PATH
     */
    addTTL(path: any, ttl: any): void;
}
export declare let cacheResponse: any;
export declare let invalidateCache: any;
export declare let addTTL: any;
export {};
//# sourceMappingURL=cacheMiddleware.d.ts.map
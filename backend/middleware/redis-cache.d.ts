export = redisCache;
declare const redisCache: RedisCache;
declare class RedisCache {
    constructor(options?: {});
    redis: any;
    config: {
        host: string;
        port: string | number;
        password: string;
        db: string | number;
        maxRetriesPerRequest: any;
        enableReadyCheck: boolean;
    };
    stats: {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        errors: number;
        lastClear: Date;
    };
    defaultTTL: any;
    keyPrefix: any;
    prefix: string;
    /**
     * Conectar a Redis con reintentos
     */
    connect(): Promise<void>;
    /**
     * Generar clave de cache
     */
    generateKey(baseKey: any, params?: {}): any;
    /**
     * Obtener valor del cache
     */
    get(key: any): Promise<any>;
    /**
     * Guardar valor en cache
     */
    set(key: any, value: any, ttl?: any): Promise<boolean>;
    /**
     * Eliminar clave del cache
     */
    delete(key: any): Promise<boolean>;
    /**
     * Invalidar patrón de cache
     */
    invalidatePattern(pattern: any): Promise<any>;
    /**
     * Endpoint para obtener estadísticas de cache
     */
    getStatsEndpoint: (req: any, res: any) => void;
}
//# sourceMappingURL=redis-cache.d.ts.map
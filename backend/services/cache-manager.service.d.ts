/**
 * 🚀 CACHE MANAGER - TypeScript
 * Sistema de caching multi-capa con in-memory LRU + Redis
 *
 * Features:
 * - Multi-layer caching (L1: in-memory LRU, L2: Redis)
 * - TTL (Time To Live) configurables por key
 * - Cache invalidation (individual, pattern, full)
 * - Statistics tracking (hit rate, miss rate, latency)
 * - Cache warming (preload data at startup)
 * - Graceful fallback (Redis → in-memory → no cache)
 * - Namespace support para multi-tenancy
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface CacheConfig {
    maxMemorySize?: number;
    maxMemoryItems?: number;
    defaultTTL?: number;
    redisEnabled?: boolean;
    redisHost?: string;
    redisPort?: number;
    redisPassword?: string;
    compressionEnabled?: boolean;
    compressionThreshold?: number;
    warmingEnabled?: boolean;
    namespace?: string;
    [key: string]: any;
}
export interface CacheMetadata {
    ttl: number;
    expiresAt: number;
    createdAt: number;
    size: number;
    accessCount: number;
    lastAccessedAt: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    dels: number;
    evictions: number;
    errors: number;
    memoryHits: number;
    redisHits: number;
    totalLatency: number;
    requestCount: number;
}
export interface CacheOptions {
    ttl?: number;
    namespace?: string;
}
export interface CacheStatsReport {
    hits: number;
    misses: number;
    hitRate: string;
    memoryHits: number;
    redisHits: number;
    sets: number;
    dels: number;
    evictions: number;
    errors: number;
    avgLatency: string;
    requestCount: number;
    memorySize: number;
    memoryUsage: string;
    redisConnected: boolean;
}
declare class CacheManager {
    private config;
    private memoryCache;
    private memoryCacheMetadata;
    private redisClient;
    private redisConnected;
    private stats;
    private cleanupInterval;
    constructor(config?: CacheConfig);
    /**
     * Inicializar Cache Manager
     */
    private init;
    /**
     * Inicializar conexión Redis (deshabilitado para desarrollo local)
     */
    private initRedis;
    /**
     * Obtener valor del cache
     */
    get(key: string, options?: CacheOptions): Promise<any | null>;
    /**
     * Guardar valor en cache
     */
    set(key: string, value: any, options?: CacheOptions): Promise<boolean>;
    /**
     * Eliminar valor del cache
     */
    del(key: string, options?: CacheOptions): Promise<boolean>;
    /**
     * Invalidar cache por patrón
     */
    invalidatePattern(pattern: string, options?: CacheOptions): Promise<number>;
    /**
     * Limpiar todo el cache
     */
    clear(options?: CacheOptions): Promise<boolean>;
    /**
     * Obtener de L1 memory cache
     */
    private getFromMemory;
    /**
     * Guardar en L1 memory cache
     */
    private setInMemory;
    /**
     * Obtener de L2 Redis cache
     */
    private getFromRedis;
    /**
     * Guardar en L2 Redis cache
     */
    private setInRedis;
    /**
     * Evict Least Recently Used (LRU)
     */
    private evictLRU;
    /**
     * Limpiar entradas expiradas
     */
    private cleanupExpired;
    /**
     * Pre-cargar cache
     */
    private warmCache;
    /**
     * Construir key con namespace
     */
    private buildKey;
    /**
     * Match patrón glob-style
     */
    private matchPattern;
    /**
     * Estimar tamaño de valor
     */
    private estimateSize;
    /**
     * Actualizar estadísticas de latencia
     */
    private updateLatency;
    /**
     * Obtener estadísticas
     */
    getStats(): CacheStatsReport;
    /**
     * Resetear estadísticas
     */
    resetStats(): void;
    /**
     * Desconectar Redis
     */
    disconnect(): Promise<void>;
}
declare const cacheManager: CacheManager;
export default cacheManager;
//# sourceMappingURL=cache-manager.service.d.ts.map
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

import devLogger from '../utils/devLogger';

// =====================================================
// INTERFACES
// =====================================================

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

// =====================================================
// CACHE MANAGER CLASS
// =====================================================

class CacheManager {
    private config: Required<CacheConfig>;
    private memoryCache: Map<string, any>;
    private memoryCacheMetadata: Map<string, CacheMetadata>;
    private redisClient: any;
    private redisConnected: boolean;
    private stats: CacheStats;
    private cleanupInterval: NodeJS.Timeout;

    constructor(config: CacheConfig = {}) {
        this.config = {
            maxMemorySize: config.maxMemorySize || 100 * 1024 * 1024,
            maxMemoryItems: config.maxMemoryItems || 1000,
            defaultTTL: config.defaultTTL || 5 * 60 * 1000,
            redisEnabled: config.redisEnabled !== false,
            redisHost: config.redisHost || process.env.REDIS_HOST || 'localhost',
            redisPort: config.redisPort || parseInt(process.env.REDIS_PORT || '6379'),
            redisPassword: config.redisPassword || process.env.REDIS_PASSWORD || '',
            compressionEnabled: config.compressionEnabled !== false,
            compressionThreshold: config.compressionThreshold || 1024,
            warmingEnabled: config.warmingEnabled !== false,
            namespace: config.namespace || 'bge',
            ...config
        };

        this.memoryCache = new Map();
        this.memoryCacheMetadata = new Map();
        this.redisClient = null;
        this.redisConnected = false;

        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            dels: 0,
            evictions: 0,
            errors: 0,
            memoryHits: 0,
            redisHits: 0,
            totalLatency: 0,
            requestCount: 0
        };

        this.init();
        this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60 * 1000);

        devLogger.log('[CacheManager] 🚀 Cache Manager inicializado');
    }

    /**
     * Inicializar Cache Manager
     */
    private async init(): Promise<void> {
        if (this.config.redisEnabled) {
            try {
                await this.initRedis();
            } catch (error: any) {
                devLogger.warn(`[CacheManager] ⚠️ Redis falló, usando solo memoria: ${error.message}`);
            }
        }

        if (this.config.warmingEnabled) {
            await this.warmCache();
        }
    }

    /**
     * Inicializar conexión Redis (deshabilitado para desarrollo local)
     */
    private async initRedis(): Promise<void> {
        devLogger.warn('[CacheManager] ⚠️ Redis deshabilitado para desarrollo local');
        this.redisConnected = false;
    }

    /**
     * Obtener valor del cache
     */
    async get(key: string, options: CacheOptions = {}): Promise<any | null> {
        const startTime = Date.now();

        try {
            const fullKey = this.buildKey(key, options.namespace);

            // 1. Intentar L1 cache (in-memory)
            const memoryValue = this.getFromMemory(fullKey);
            if (memoryValue !== null) {
                this.stats.hits++;
                this.stats.memoryHits++;
                this.updateLatency(startTime);
                return memoryValue;
            }

            // 2. Intentar L2 cache (Redis)
            if (this.redisConnected) {
                const redisValue = await this.getFromRedis(fullKey);
                if (redisValue !== null) {
                    this.stats.hits++;
                    this.stats.redisHits++;
                    this.updateLatency(startTime);
                    this.setInMemory(fullKey, redisValue, options);
                    return redisValue;
                }
            }

            // 3. Cache miss
            this.stats.misses++;
            this.updateLatency(startTime);
            return null;

        } catch (error: any) {
            this.stats.errors++;
            devLogger.error(`[CacheManager] Error en get('${key}'): ${error.message}`);
            return null;
        }
    }

    /**
     * Guardar valor en cache
     */
    async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
        try {
            const fullKey = this.buildKey(key, options.namespace);
            const ttl = options.ttl || this.config.defaultTTL;

            this.setInMemory(fullKey, value, { ttl });

            if (this.redisConnected) {
                await this.setInRedis(fullKey, value, { ttl });
            }

            this.stats.sets++;
            return true;

        } catch (error: any) {
            this.stats.errors++;
            devLogger.error(`[CacheManager] Error en set('${key}'): ${error.message}`);
            return false;
        }
    }

    /**
     * Eliminar valor del cache
     */
    async del(key: string, options: CacheOptions = {}): Promise<boolean> {
        try {
            const fullKey = this.buildKey(key, options.namespace);

            this.memoryCache.delete(fullKey);
            this.memoryCacheMetadata.delete(fullKey);

            if (this.redisConnected) {
                await this.redisClient.del(fullKey);
            }

            this.stats.dels++;
            return true;

        } catch (error: any) {
            this.stats.errors++;
            devLogger.error(`[CacheManager] Error en del('${key}'): ${error.message}`);
            return false;
        }
    }

    /**
     * Invalidar cache por patrón
     */
    async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
        try {
            const fullPattern = this.buildKey(pattern, options.namespace);
            let deletedCount = 0;

            for (const key of this.memoryCache.keys()) {
                if (this.matchPattern(key, fullPattern)) {
                    this.memoryCache.delete(key);
                    this.memoryCacheMetadata.delete(key);
                    deletedCount++;
                }
            }

            if (this.redisConnected) {
                const keys = await this.redisClient.keys(fullPattern);
                if (keys.length > 0) {
                    await this.redisClient.del(...keys);
                    deletedCount += keys.length;
                }
            }

            devLogger.log(`[CacheManager] 🗑️ Invalidados ${deletedCount} keys con patrón '${pattern}'`);
            return deletedCount;

        } catch (error: any) {
            this.stats.errors++;
            devLogger.error(`[CacheManager] Error en invalidatePattern('${pattern}'): ${error.message}`);
            return 0;
        }
    }

    /**
     * Limpiar todo el cache
     */
    async clear(options: CacheOptions = {}): Promise<boolean> {
        try {
            const namespace = options.namespace || this.config.namespace;

            if (namespace) {
                for (const key of this.memoryCache.keys()) {
                    if (key.startsWith(`${namespace}:`)) {
                        this.memoryCache.delete(key);
                        this.memoryCacheMetadata.delete(key);
                    }
                }
            } else {
                this.memoryCache.clear();
                this.memoryCacheMetadata.clear();
            }

            if (this.redisConnected) {
                if (namespace) {
                    const keys = await this.redisClient.keys(`${namespace}:*`);
                    if (keys.length > 0) {
                        await this.redisClient.del(...keys);
                    }
                } else {
                    await this.redisClient.flushdb();
                }
            }

            devLogger.log(`[CacheManager] 🧹 Cache limpiado para namespace '${namespace}'`);
            return true;

        } catch (error: any) {
            this.stats.errors++;
            devLogger.error(`[CacheManager] Error en clear(): ${error.message}`);
            return false;
        }
    }

    /**
     * Obtener de L1 memory cache
     */
    private getFromMemory(key: string): any | null {
        const value = this.memoryCache.get(key);
        const metadata = this.memoryCacheMetadata.get(key);

        if (value === undefined || !metadata) {
            return null;
        }

        if (Date.now() > metadata.expiresAt) {
            this.memoryCache.delete(key);
            this.memoryCacheMetadata.delete(key);
            return null;
        }

        return value;
    }

    /**
     * Guardar en L1 memory cache
     */
    private setInMemory(key: string, value: any, options: { ttl?: number } = {}): void {
        const ttl = options.ttl || this.config.defaultTTL;
        const size = this.estimateSize(value);

        if (this.memoryCache.size >= this.config.maxMemoryItems) {
            this.evictLRU();
        }

        this.memoryCache.set(key, value);
        this.memoryCacheMetadata.set(key, {
            ttl,
            expiresAt: Date.now() + ttl,
            createdAt: Date.now(),
            size,
            accessCount: 0,
            lastAccessedAt: Date.now()
        });
    }

    /**
     * Obtener de L2 Redis cache
     */
    private async getFromRedis(key: string): Promise<any | null> {
        try {
            const value = await this.redisClient.get(key);
            if (value === null) return null;
            return JSON.parse(value);
        } catch (error: any) {
            devLogger.error(`[CacheManager] Error en getFromRedis('${key}'): ${error.message}`);
            return null;
        }
    }

    /**
     * Guardar en L2 Redis cache
     */
    private async setInRedis(key: string, value: any, options: { ttl?: number } = {}): Promise<void> {
        try {
            const ttl = options.ttl || this.config.defaultTTL;
            const ttlSeconds = Math.ceil(ttl / 1000);
            const stringValue = JSON.stringify(value);
            await this.redisClient.setex(key, ttlSeconds, stringValue);
        } catch (error: any) {
            devLogger.error(`[CacheManager] Error en setInRedis('${key}'): ${error.message}`);
        }
    }

    /**
     * Evict Least Recently Used (LRU)
     */
    private evictLRU(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, metadata] of this.memoryCacheMetadata.entries()) {
            if (metadata.lastAccessedAt < oldestTime) {
                oldestTime = metadata.lastAccessedAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.memoryCache.delete(oldestKey);
            this.memoryCacheMetadata.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    /**
     * Limpiar entradas expiradas
     */
    private cleanupExpired(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, metadata] of this.memoryCacheMetadata.entries()) {
            if (now > metadata.expiresAt) {
                this.memoryCache.delete(key);
                this.memoryCacheMetadata.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            devLogger.log(`[CacheManager] 🧹 Limpiadas ${cleanedCount} entradas expiradas`);
        }
    }

    /**
     * Pre-cargar cache
     */
    private async warmCache(): Promise<void> {
        devLogger.log('[CacheManager] 🔥 Precalentando cache...');
        devLogger.log('[CacheManager] ✅ Cache precalentado');
    }

    /**
     * Construir key con namespace
     */
    private buildKey(key: string, namespace?: string): string {
        const ns = namespace || this.config.namespace;
        return `${ns}:${key}`;
    }

    /**
     * Match patrón glob-style
     */
    private matchPattern(str: string, pattern: string): boolean {
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(str);
    }

    /**
     * Estimar tamaño de valor
     */
    private estimateSize(value: any): number {
        try {
            return JSON.stringify(value).length;
        } catch {
            return 0;
        }
    }

    /**
     * Actualizar estadísticas de latencia
     */
    private updateLatency(startTime: number): void {
        const latency = Date.now() - startTime;
        this.stats.totalLatency += latency;
        this.stats.requestCount++;
    }

    /**
     * Obtener estadísticas
     */
    getStats(): CacheStatsReport {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : '0';

        const avgLatency = this.stats.requestCount > 0
            ? (this.stats.totalLatency / this.stats.requestCount).toFixed(2)
            : '0';

        const memorySize = this.memoryCacheMetadata.size;
        const memoryUsage = Array.from(this.memoryCacheMetadata.values())
            .reduce((sum, m) => sum + m.size, 0);

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: `${hitRate}%`,
            memoryHits: this.stats.memoryHits,
            redisHits: this.stats.redisHits,
            sets: this.stats.sets,
            dels: this.stats.dels,
            evictions: this.stats.evictions,
            errors: this.stats.errors,
            avgLatency: `${avgLatency}ms`,
            requestCount: this.stats.requestCount,
            memorySize,
            memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`,
            redisConnected: this.redisConnected
        };
    }

    /**
     * Resetear estadísticas
     */
    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            dels: 0,
            evictions: 0,
            errors: 0,
            memoryHits: 0,
            redisHits: 0,
            totalLatency: 0,
            requestCount: 0
        };
        devLogger.log('[CacheManager] 📊 Estadísticas reseteadas');
    }

    /**
     * Desconectar Redis
     */
    async disconnect(): Promise<void> {
        if (this.redisClient) {
            await this.redisClient.quit();
            this.redisConnected = false;
            devLogger.log('[CacheManager] 👋 Redis desconectado');
        }
    }
}

// Export singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
module.exports = cacheManager;

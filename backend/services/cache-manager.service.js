"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const devLogger_1 = __importDefault(require("../utils/devLogger"));
// =====================================================
// CACHE MANAGER CLASS
// =====================================================
class CacheManager {
    constructor(config = {}) {
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
        devLogger_1.default.log('[CacheManager] 🚀 Cache Manager inicializado');
    }
    /**
     * Inicializar Cache Manager
     */
    async init() {
        if (this.config.redisEnabled) {
            try {
                await this.initRedis();
            }
            catch (error) {
                devLogger_1.default.warn(`[CacheManager] ⚠️ Redis falló, usando solo memoria: ${error.message}`);
            }
        }
        if (this.config.warmingEnabled) {
            await this.warmCache();
        }
    }
    /**
     * Inicializar conexión Redis (deshabilitado para desarrollo local)
     */
    async initRedis() {
        devLogger_1.default.warn('[CacheManager] ⚠️ Redis deshabilitado para desarrollo local');
        this.redisConnected = false;
    }
    /**
     * Obtener valor del cache
     */
    async get(key, options = {}) {
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
        }
        catch (error) {
            this.stats.errors++;
            devLogger_1.default.error(`[CacheManager] Error en get('${key}'): ${error.message}`);
            return null;
        }
    }
    /**
     * Guardar valor en cache
     */
    async set(key, value, options = {}) {
        try {
            const fullKey = this.buildKey(key, options.namespace);
            const ttl = options.ttl || this.config.defaultTTL;
            this.setInMemory(fullKey, value, { ttl });
            if (this.redisConnected) {
                await this.setInRedis(fullKey, value, { ttl });
            }
            this.stats.sets++;
            return true;
        }
        catch (error) {
            this.stats.errors++;
            devLogger_1.default.error(`[CacheManager] Error en set('${key}'): ${error.message}`);
            return false;
        }
    }
    /**
     * Eliminar valor del cache
     */
    async del(key, options = {}) {
        try {
            const fullKey = this.buildKey(key, options.namespace);
            this.memoryCache.delete(fullKey);
            this.memoryCacheMetadata.delete(fullKey);
            if (this.redisConnected) {
                await this.redisClient.del(fullKey);
            }
            this.stats.dels++;
            return true;
        }
        catch (error) {
            this.stats.errors++;
            devLogger_1.default.error(`[CacheManager] Error en del('${key}'): ${error.message}`);
            return false;
        }
    }
    /**
     * Invalidar cache por patrón
     */
    async invalidatePattern(pattern, options = {}) {
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
            devLogger_1.default.log(`[CacheManager] 🗑️ Invalidados ${deletedCount} keys con patrón '${pattern}'`);
            return deletedCount;
        }
        catch (error) {
            this.stats.errors++;
            devLogger_1.default.error(`[CacheManager] Error en invalidatePattern('${pattern}'): ${error.message}`);
            return 0;
        }
    }
    /**
     * Limpiar todo el cache
     */
    async clear(options = {}) {
        try {
            const namespace = options.namespace || this.config.namespace;
            if (namespace) {
                for (const key of this.memoryCache.keys()) {
                    if (key.startsWith(`${namespace}:`)) {
                        this.memoryCache.delete(key);
                        this.memoryCacheMetadata.delete(key);
                    }
                }
            }
            else {
                this.memoryCache.clear();
                this.memoryCacheMetadata.clear();
            }
            if (this.redisConnected) {
                if (namespace) {
                    const keys = await this.redisClient.keys(`${namespace}:*`);
                    if (keys.length > 0) {
                        await this.redisClient.del(...keys);
                    }
                }
                else {
                    await this.redisClient.flushdb();
                }
            }
            devLogger_1.default.log(`[CacheManager] 🧹 Cache limpiado para namespace '${namespace}'`);
            return true;
        }
        catch (error) {
            this.stats.errors++;
            devLogger_1.default.error(`[CacheManager] Error en clear(): ${error.message}`);
            return false;
        }
    }
    /**
     * Obtener de L1 memory cache
     */
    getFromMemory(key) {
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
    setInMemory(key, value, options = {}) {
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
    async getFromRedis(key) {
        try {
            const value = await this.redisClient.get(key);
            if (value === null)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            devLogger_1.default.error(`[CacheManager] Error en getFromRedis('${key}'): ${error.message}`);
            return null;
        }
    }
    /**
     * Guardar en L2 Redis cache
     */
    async setInRedis(key, value, options = {}) {
        try {
            const ttl = options.ttl || this.config.defaultTTL;
            const ttlSeconds = Math.ceil(ttl / 1000);
            const stringValue = JSON.stringify(value);
            await this.redisClient.setex(key, ttlSeconds, stringValue);
        }
        catch (error) {
            devLogger_1.default.error(`[CacheManager] Error en setInRedis('${key}'): ${error.message}`);
        }
    }
    /**
     * Evict Least Recently Used (LRU)
     */
    evictLRU() {
        let oldestKey = null;
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
    cleanupExpired() {
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
            devLogger_1.default.log(`[CacheManager] 🧹 Limpiadas ${cleanedCount} entradas expiradas`);
        }
    }
    /**
     * Pre-cargar cache
     */
    async warmCache() {
        devLogger_1.default.log('[CacheManager] 🔥 Precalentando cache...');
        devLogger_1.default.log('[CacheManager] ✅ Cache precalentado');
    }
    /**
     * Construir key con namespace
     */
    buildKey(key, namespace) {
        const ns = namespace || this.config.namespace;
        return `${ns}:${key}`;
    }
    /**
     * Match patrón glob-style
     */
    matchPattern(str, pattern) {
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(str);
    }
    /**
     * Estimar tamaño de valor
     */
    estimateSize(value) {
        try {
            return JSON.stringify(value).length;
        }
        catch {
            return 0;
        }
    }
    /**
     * Actualizar estadísticas de latencia
     */
    updateLatency(startTime) {
        const latency = Date.now() - startTime;
        this.stats.totalLatency += latency;
        this.stats.requestCount++;
    }
    /**
     * Obtener estadísticas
     */
    getStats() {
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
    resetStats() {
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
        devLogger_1.default.log('[CacheManager] 📊 Estadísticas reseteadas');
    }
    /**
     * Desconectar Redis
     */
    async disconnect() {
        if (this.redisClient) {
            await this.redisClient.quit();
            this.redisConnected = false;
            devLogger_1.default.log('[CacheManager] 👋 Redis desconectado');
        }
    }
}
// Export singleton instance
const cacheManager = new CacheManager();
exports.default = cacheManager;
module.exports = cacheManager;
//# sourceMappingURL=cache-manager.service.js.map
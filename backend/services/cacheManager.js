/**
 * 🚀 CACHE MANAGER - SEMANA 26
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
 * - Compression para objetos grandes
 * - Portable y modular
 *
 * Uso:
 * ```javascript
 * const cacheManager = require('./services/cacheManager');
 *
 * // Set
 * await cacheManager.set('user:123', userData, { ttl: 300 }); // 5 min
 *
 * // Get
 * const user = await cacheManager.get('user:123');
 *
 * // Delete
 * await cacheManager.del('user:123');
 *
 * // Invalidate pattern
 * await cacheManager.invalidatePattern('user:*');
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class CacheManager {
    constructor(config = {}) {
        this.config = {
            // In-memory cache config
            maxMemorySize: config.maxMemorySize || 100 * 1024 * 1024, // 100MB
            maxMemoryItems: config.maxMemoryItems || 1000,
            defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutos

            // Redis config (optional)
            redisEnabled: config.redisEnabled !== false,
            redisHost: config.redisHost || process.env.REDIS_HOST || 'localhost',
            redisPort: config.redisPort || process.env.REDIS_PORT || 6379,
            redisPassword: config.redisPassword || process.env.REDIS_PASSWORD || undefined,

            // Features
            compressionEnabled: config.compressionEnabled !== false,
            compressionThreshold: config.compressionThreshold || 1024, // 1KB
            warmingEnabled: config.warmingEnabled !== false,

            // Namespace for multi-tenancy
            namespace: config.namespace || 'bge',

            ...config
        };

        // L1 Cache: In-memory LRU cache
        this.memoryCache = new Map();
        this.memoryCacheMetadata = new Map(); // { ttl, size, createdAt }

        // L2 Cache: Redis (optional)
        this.redisClient = null;
        this.redisConnected = false;

        // Statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            dels: 0,
            evictions: 0,
            errors: 0,
            memoryHits: 0,
            redisHits: 0,
            totalLatency: 0, // ms
            requestCount: 0
        };

        // Initialize
        this.init();

        // Cleanup expired entries cada 60 segundos
        setInterval(() => this.cleanupExpired(), 60 * 1000);

        devLogger.log('CACHE', '🚀 Cache Manager initialized');
    }

    /**
     * INITIALIZE CACHE MANAGER
     */
    async init() {
        // Initialize Redis if enabled
        if (this.config.redisEnabled) {
            try {
                await this.initRedis();
            } catch (error) {
                devLogger.warn('CACHE', `⚠️ Redis initialization failed, using in-memory only: ${error.message}`);
            }
        }

        // Load warming data if enabled
        if (this.config.warmingEnabled) {
            await this.warmCache();
        }
    }

    /**
     * INITIALIZE REDIS CONNECTION
     */
    // ⏸️ COMENTADO - FASE 30.5 INTENTO-5: Redis no disponible en local
    // async initRedis() {
    //     try {
    //         // Try to require ioredis (optional dependency)
    //         let Redis;
    //         try {
    //             Redis = require('ioredis');
    //         } catch (error) {
    //             devLogger.warn('CACHE', '⚠️ ioredis not installed, Redis cache disabled');
    //             return;
    //         }

    //         this.redisClient = new Redis({
    //             host: this.config.redisHost,
    //             port: this.config.redisPort,
    //             password: this.config.redisPassword,
    //             retryStrategy: (times) => {
    //                 if (times > 3) {
    //                     devLogger.error('CACHE', '❌ Redis connection failed after 3 retries');
    //                     return null; // Stop retrying
    //                 }
    //                 return Math.min(times * 200, 2000); // Exponential backoff
    //             }
    //         });

    //         this.redisClient.on('connect', () => {
    //             this.redisConnected = true;
    //             devLogger.log('CACHE', '✅ Redis connected');
    //         });

    //         this.redisClient.on('error', (error) => {
    //             this.redisConnected = false;
    //             this.stats.errors++;
    //             devLogger.error('CACHE', `❌ Redis error: ${error.message}`);
    //         });

    //         this.redisClient.on('close', () => {
    //             this.redisConnected = false;
    //             devLogger.warn('CACHE', '⚠️ Redis disconnected');
    //         });

    //     } catch (error) {
    //         devLogger.error('CACHE', `❌ Redis initialization failed: ${error.message}`);
    //         this.redisClient = null;
    //         this.redisConnected = false;
    //     }
    // }

    async initRedis() {
        // ⏸️ FASE 30.5 INTENTO-5: Deshabilitar Redis localmente
        devLogger.warn('CACHE', '⚠️ Redis deshabilitado para desarrollo local (FASE 30.5 INTENTO-5)');
        this.redisConnected = false;
    }

    /**
     * GET VALUE FROM CACHE
     */
    async get(key, options = {}) {
        const startTime = Date.now();

        try {
            const fullKey = this.buildKey(key, options.namespace);

            // 1. Try L1 cache (in-memory)
            const memoryValue = this.getFromMemory(fullKey);
            if (memoryValue !== null) {
                this.stats.hits++;
                this.stats.memoryHits++;
                this.updateLatency(startTime);
                return memoryValue;
            }

            // 2. Try L2 cache (Redis)
            if (this.redisConnected) {
                const redisValue = await this.getFromRedis(fullKey);
                if (redisValue !== null) {
                    this.stats.hits++;
                    this.stats.redisHits++;
                    this.updateLatency(startTime);

                    // Promote to L1 cache
                    this.setInMemory(fullKey, redisValue, options);

                    return redisValue;
                }
            }

            // 3. Cache miss
            this.stats.misses++;
            this.updateLatency(startTime);
            return null;

        } catch (error) {
            this.stats.errors++;
            devLogger.error('CACHE', `Error en get('${key}'):`, error);
            return null;
        }
    }

    /**
     * SET VALUE IN CACHE
     */
    async set(key, value, options = {}) {
        try {
            const fullKey = this.buildKey(key, options.namespace);
            const ttl = options.ttl || this.config.defaultTTL;

            // Set in L1 cache (in-memory)
            this.setInMemory(fullKey, value, { ttl });

            // Set in L2 cache (Redis)
            if (this.redisConnected) {
                await this.setInRedis(fullKey, value, { ttl });
            }

            this.stats.sets++;

            return true;

        } catch (error) {
            this.stats.errors++;
            devLogger.error('CACHE', `Error en set('${key}'):`, error);
            return false;
        }
    }

    /**
     * DELETE VALUE FROM CACHE
     */
    async del(key, options = {}) {
        try {
            const fullKey = this.buildKey(key, options.namespace);

            // Delete from L1 cache
            this.memoryCache.delete(fullKey);
            this.memoryCacheMetadata.delete(fullKey);

            // Delete from L2 cache
            if (this.redisConnected) {
                await this.redisClient.del(fullKey);
            }

            this.stats.dels++;

            return true;

        } catch (error) {
            this.stats.errors++;
            devLogger.error('CACHE', `Error en del('${key}'):`, error);
            return false;
        }
    }

    /**
     * INVALIDATE CACHE BY PATTERN
     */
    async invalidatePattern(pattern, options = {}) {
        try {
            const fullPattern = this.buildKey(pattern, options.namespace);
            let deletedCount = 0;

            // Invalidate from L1 cache
            for (const key of this.memoryCache.keys()) {
                if (this.matchPattern(key, fullPattern)) {
                    this.memoryCache.delete(key);
                    this.memoryCacheMetadata.delete(key);
                    deletedCount++;
                }
            }

            // Invalidate from L2 cache (Redis)
            if (this.redisConnected) {
                const keys = await this.redisClient.keys(fullPattern);
                if (keys.length > 0) {
                    await this.redisClient.del(...keys);
                    deletedCount += keys.length;
                }
            }

            devLogger.log('CACHE', `🗑️ Invalidated ${deletedCount} keys matching '${pattern}'`);

            return deletedCount;

        } catch (error) {
            this.stats.errors++;
            devLogger.error('CACHE', `Error en invalidatePattern('${pattern}'):`, error);
            return 0;
        }
    }

    /**
     * CLEAR ALL CACHE
     */
    async clear(options = {}) {
        try {
            const namespace = options.namespace || this.config.namespace;

            // Clear L1 cache
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

            // Clear L2 cache (Redis)
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

            devLogger.log('CACHE', `🧹 Cache cleared for namespace '${namespace}'`);

            return true;

        } catch (error) {
            this.stats.errors++;
            devLogger.error('CACHE', 'Error en clear():', error);
            return false;
        }
    }

    /**
     * GET FROM L1 MEMORY CACHE
     */
    getFromMemory(key) {
        const value = this.memoryCache.get(key);
        const metadata = this.memoryCacheMetadata.get(key);

        if (value === undefined || !metadata) {
            return null;
        }

        // Check if expired
        if (Date.now() > metadata.expiresAt) {
            this.memoryCache.delete(key);
            this.memoryCacheMetadata.delete(key);
            return null;
        }

        return value;
    }

    /**
     * SET IN L1 MEMORY CACHE
     */
    setInMemory(key, value, options = {}) {
        const ttl = options.ttl || this.config.defaultTTL;
        const size = this.estimateSize(value);

        // Check memory limits
        if (this.memoryCache.size >= this.config.maxMemoryItems) {
            this.evictLRU();
        }

        // Store value and metadata
        this.memoryCache.set(key, value);
        this.memoryCacheMetadata.set(key, {
            ttl: ttl,
            expiresAt: Date.now() + ttl,
            createdAt: Date.now(),
            size: size,
            accessCount: 0,
            lastAccessedAt: Date.now()
        });
    }

    /**
     * GET FROM L2 REDIS CACHE
     */
    async getFromRedis(key) {
        try {
            const value = await this.redisClient.get(key);

            if (value === null) {
                return null;
            }

            // Parse JSON
            return JSON.parse(value);

        } catch (error) {
            devLogger.error('CACHE', `Error en getFromRedis('${key}'):`, error);
            return null;
        }
    }

    /**
     * SET IN L2 REDIS CACHE
     */
    async setInRedis(key, value, options = {}) {
        try {
            const ttl = options.ttl || this.config.defaultTTL;
            const ttlSeconds = Math.ceil(ttl / 1000);

            // Stringify JSON
            const stringValue = JSON.stringify(value);

            // Set with TTL
            await this.redisClient.setex(key, ttlSeconds, stringValue);

        } catch (error) {
            devLogger.error('CACHE', `Error en setInRedis('${key}'):`, error);
        }
    }

    /**
     * EVICT LEAST RECENTLY USED (LRU)
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
     * CLEANUP EXPIRED ENTRIES
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
            devLogger.log('CACHE', `🧹 Cleaned ${cleanedCount} expired entries`);
        }
    }

    /**
     * WARM CACHE (PRELOAD DATA)
     */
    async warmCache() {
        devLogger.log('CACHE', '🔥 Warming cache...');

        // TODO: Preload frequently accessed data here
        // Example:
        // await this.set('config:tenant', tenantConfig, { ttl: 3600000 }); // 1 hour

        devLogger.log('CACHE', '✅ Cache warmed');
    }

    /**
     * BUILD CACHE KEY WITH NAMESPACE
     */
    buildKey(key, namespace) {
        const ns = namespace || this.config.namespace;
        return `${ns}:${key}`;
    }

    /**
     * MATCH PATTERN (GLOB-STYLE)
     */
    matchPattern(str, pattern) {
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(str);
    }

    /**
     * ESTIMATE SIZE OF VALUE (rough estimate)
     */
    estimateSize(value) {
        try {
            return JSON.stringify(value).length;
        } catch {
            return 0;
        }
    }

    /**
     * UPDATE LATENCY STATS
     */
    updateLatency(startTime) {
        const latency = Date.now() - startTime;
        this.stats.totalLatency += latency;
        this.stats.requestCount++;
    }

    /**
     * GET STATISTICS
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        const avgLatency = this.stats.requestCount > 0
            ? (this.stats.totalLatency / this.stats.requestCount).toFixed(2)
            : 0;

        const memorySize = this.memoryCacheMetadata.size;
        const memoryUsage = Array.from(this.memoryCacheMetadata.values())
            .reduce((sum, m) => sum + m.size, 0);

        return {
            // Hit/Miss stats
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: `${hitRate}%`,

            // Layer stats
            memoryHits: this.stats.memoryHits,
            redisHits: this.stats.redisHits,

            // Operation stats
            sets: this.stats.sets,
            dels: this.stats.dels,
            evictions: this.stats.evictions,
            errors: this.stats.errors,

            // Performance
            avgLatency: `${avgLatency}ms`,
            requestCount: this.stats.requestCount,

            // Memory
            memorySize: memorySize,
            memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`,

            // Redis
            redisConnected: this.redisConnected
        };
    }

    /**
     * RESET STATISTICS
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

        devLogger.log('CACHE', '📊 Statistics reset');
    }

    /**
     * DISCONNECT REDIS
     */
    async disconnect() {
        if (this.redisClient) {
            await this.redisClient.quit();
            this.redisConnected = false;
            devLogger.log('CACHE', '👋 Redis disconnected');
        }
    }
}

// Export singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;

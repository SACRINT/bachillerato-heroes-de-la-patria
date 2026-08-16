/**
 * ⚡ MIDDLEWARE DE CACHÉ EN MEMORIA
 * Sistema de caché simple con TTL para mejorar performance de endpoints
 * Fecha: 17 Noviembre 2025
 *
 * CARACTERÍSTICAS:
 * - Caché in-memory con Map
 * - TTL configurable por endpoint
 * - Limpieza automática de entradas expiradas
 * - Estadísticas de hits/misses
 * - Fácil de usar como middleware Express
 *
 * USO:
 * const { cacheMiddleware, cacheStats, clearCache } = require('./middleware/cache-middleware');
 *
 * // Cachear endpoint por 5 minutos
 * router.get('/api/students', cacheMiddleware({ ttl: 300 }), async (req, res) => {
 *   // ... lógica del endpoint
 * });
 */

const { debugLog } = require('../utils/debug-logger.js');

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };

        // Limpieza automática cada 10 minutos
        setInterval(() => this.cleanExpired(), 10 * 60 * 1000);
    }

    /**
     * Generar clave de caché basada en request
     * @param {Object} req - Express request object
     * @returns {string} Cache key
     */
    generateKey(req) {
        const baseKey = `${req.method}:${req.originalUrl || req.url}`;

        // Incluir query params ordenados (para consistencia)
        if (req.query && Object.keys(req.query).length > 0) {
            const sortedQuery = Object.keys(req.query)
                .sort()
                .map(k => `${k}=${req.query[k]}`)
                .join('&');
            return `${baseKey}?${sortedQuery}`;
        }

        return baseKey;
    }

    /**
     * Obtener valor del caché
     * @param {string} key - Cache key
     * @returns {Object|null} Cached value or null
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Verificar si expiró
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            debugLog.log('CACHE', `🔴 Cache miss (expired): ${key}`);
            return null;
        }

        this.stats.hits++;
        debugLog.log('CACHE', `✅ Cache hit: ${key}`);
        return entry.data;
    }

    /**
     * Guardar valor en caché
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttl - Time to live in seconds
     */
    set(key, data, ttl = 300) {
        const entry = {
            data: data,
            createdAt: Date.now(),
            expiresAt: Date.now() + (ttl * 1000)
        };

        this.cache.set(key, entry);
        this.stats.sets++;
        debugLog.log('CACHE', `💾 Cached: ${key} (TTL: ${ttl}s)`);
    }

    /**
     * Eliminar entrada del caché
     * @param {string} key - Cache key
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.deletes++;
            debugLog.log('CACHE', `🗑️ Deleted from cache: ${key}`);
        }
        return deleted;
    }

    /**
     * Limpiar entradas expiradas
     */
    cleanExpired() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            debugLog.log('CACHE', `🧹 Cleaned ${cleaned} expired entries`);
        }
    }

    /**
     * Limpiar todo el caché
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        debugLog.log('CACHE', `🧹 Cleared entire cache (${size} entries)`);
    }

    /**
     * Obtener estadísticas del caché
     * @returns {Object} Cache stats
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            hitRate: parseFloat(hitRate),
            size: this.cache.size,
            timestamp: new Date().toISOString()
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
            deletes: 0
        };
        debugLog.log('CACHE', '🔄 Stats reset');
    }
}

// Singleton instance
const cacheManager = new CacheManager();

/**
 * Middleware de caché para Express
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in seconds (default: 300 = 5min)
 * @param {Function} options.condition - Function to determine if should cache (default: always cache)
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/api/students', cacheMiddleware({ ttl: 600 }), async (req, res) => { ... });
 *
 * @example
 * router.get('/api/news', cacheMiddleware({
 *   ttl: 300,
 *   condition: (req) => !req.query.fresh  // No cachear si query param "fresh" está presente
 * }), async (req, res) => { ... });
 */
function cacheMiddleware(options = {}) {
    const {
        ttl = 300, // 5 minutos por defecto
        condition = () => true // Cachear siempre por defecto
    } = options;

    return (req, res, next) => {
        // Solo cachear GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Verificar condición personalizada
        if (!condition(req)) {
            debugLog.log('CACHE', `⏭️ Skipping cache (condition not met): ${req.url}`);
            return next();
        }

        // Generar key
        const cacheKey = cacheManager.generateKey(req);

        // Intentar obtener del caché
        const cachedData = cacheManager.get(cacheKey);

        if (cachedData) {
            // Cache hit - devolver datos cacheados
            return res.json(cachedData);
        }

        // Cache miss - continuar con la lógica normal pero interceptar respuesta

        // Guardar referencia original a res.json
        const originalJson = res.json.bind(res);

        // Sobrescribir res.json para cachear la respuesta
        res.json = function(data) {
            // Guardar en caché SOLO si la respuesta es exitosa (2xx status)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cacheManager.set(cacheKey, data, ttl);
            }

            // Llamar al método original
            return originalJson(data);
        };

        next();
    };
}

/**
 * Middleware para invalidar caché en operaciones POST/PUT/DELETE
 * Invalida automáticamente el caché de GET para el mismo recurso
 *
 * @example
 * router.post('/api/students', invalidateCacheMiddleware('/api/students'), async (req, res) => { ... });
 */
function invalidateCacheMiddleware(pattern) {
    return (req, res, next) => {
        // Interceptar respuesta exitosa
        const originalJson = res.json.bind(res);

        res.json = function(data) {
            // Si la operación fue exitosa, invalidar caché
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Invalidar todas las entradas que coincidan con el pattern
                for (const [key, _] of cacheManager.cache.entries()) {
                    if (key.includes(pattern)) {
                        cacheManager.delete(key);
                    }
                }
            }

            return originalJson(data);
        };

        next();
    };
}

/**
 * Obtener estadísticas del caché
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
    return cacheManager.getStats();
}

/**
 * Limpiar todo el caché
 */
function clearCache() {
    cacheManager.clear();
}

/**
 * Limpiar entradas expiradas manualmente
 */
function cleanExpiredCache() {
    cacheManager.cleanExpired();
}

module.exports = {
    cacheMiddleware,
    invalidateCacheMiddleware,
    getCacheStats,
    clearCache,
    cleanExpiredCache,
    cacheManager // Exportar para uso avanzado
};

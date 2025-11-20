/**
 * 🚀 CACHE MIDDLEWARE - SEMANA 26
 * Middleware para caching automático de respuestas HTTP
 *
 * Features:
 * - Caching automático de responses GET
 * - Cache invalidation en POST/PUT/DELETE/PATCH
 * - Custom cache keys (por query params, user, etc)
 * - TTL configurables por ruta
 * - Cache bypass con header X-No-Cache
 * - Cache warming
 * - Portable y modular
 *
 * Uso:
 * ```javascript
 * const { cacheResponse } = require('./middleware/cacheMiddleware');
 *
 * // Cache por 5 minutos
 * app.get('/api/noticias', cacheResponse({ ttl: 300000 }), handler);
 *
 * // Cache con custom key
 * app.get('/api/user/:id', cacheResponse({
 *   ttl: 60000,
 *   keyGenerator: (req) => `user:${req.params.id}`
 * }), handler);
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const cacheManager = require('../services/cacheManager');
const devLogger = require('../utils/devLogger');

class CacheMiddleware {
    constructor() {
        // Default TTLs por tipo de endpoint (en ms)
        this.defaultTTLs = {
            '/api/config/tenant': 5 * 60 * 1000,        // 5 minutos
            '/api/noticias': 10 * 60 * 1000,            // 10 minutos
            '/api/egresados': 30 * 60 * 1000,           // 30 minutos
            '/api/admin/stats': 1 * 60 * 1000,          // 1 minuto
            '/api/students': 5 * 60 * 1000,             // 5 minutos
            '/api/teachers': 5 * 60 * 1000,             // 5 minutos
            '/api/parents': 5 * 60 * 1000               // 5 minutos
        };
    }

    /**
     * CACHE RESPONSE MIDDLEWARE
     */
    cacheResponse(options = {}) {
        return async (req, res, next) => {
            try {
                // Solo cachear GET requests
                if (req.method !== 'GET') {
                    return next();
                }

                // Bypass cache si header X-No-Cache presente
                if (req.headers['x-no-cache']) {
                    devLogger.log('CACHE-MW', `⏩ Cache bypass: ${req.path}`);
                    return next();
                }

                // Generar cache key
                const cacheKey = options.keyGenerator
                    ? options.keyGenerator(req)
                    : this.generateCacheKey(req);

                // Buscar en cache
                const cachedResponse = await cacheManager.get(cacheKey);

                if (cachedResponse) {
                    // Cache HIT
                    devLogger.log('CACHE-MW', `✅ Cache HIT: ${cacheKey}`);

                    // Agregar header para indicar cache hit
                    res.setHeader('X-Cache', 'HIT');
                    res.setHeader('X-Cache-Key', cacheKey);

                    return res.status(cachedResponse.status || 200).json(cachedResponse.data);
                }

                // Cache MISS - Interceptar response para cachear
                devLogger.log('CACHE-MW', `❌ Cache MISS: ${cacheKey}`);

                // Agregar header para indicar cache miss
                res.setHeader('X-Cache', 'MISS');
                res.setHeader('X-Cache-Key', cacheKey);

                // Guardar json original
                const originalJson = res.json.bind(res);

                // Interceptar json() para cachear respuesta
                res.json = function (data) {
                    // Cachear solo respuestas exitosas
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const ttl = options.ttl || this.getTTLForPath(req.path);

                        cacheManager.set(cacheKey, {
                            status: res.statusCode,
                            data: data
                        }, { ttl }).catch(error => {
                            devLogger.error('CACHE-MW', `Error cacheando response: ${error.message}`);
                        });
                    }

                    return originalJson(data);
                }.bind(this);

                next();

            } catch (error) {
                devLogger.error('CACHE-MW', `Error en cacheResponse middleware: ${error.message}`);
                next(); // No bloquear en caso de error
            }
        };
    }

    /**
     * INVALIDATE CACHE MIDDLEWARE (para POST/PUT/DELETE)
     */
    invalidateCache(options = {}) {
        return async (req, res, next) => {
            try {
                // Ejecutar handler primero
                const originalSend = res.send.bind(res);
                const originalJson = res.json.bind(res);

                const invalidatePattern = async () => {
                    // Solo invalidar si respuesta fue exitosa
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const pattern = options.pattern
                            ? options.pattern(req)
                            : this.generateInvalidationPattern(req);

                        const count = await cacheManager.invalidatePattern(pattern);

                        devLogger.log('CACHE-MW', `🗑️ Cache invalidated: ${pattern} (${count} keys)`);
                    }
                };

                res.send = function (data) {
                    invalidatePattern();
                    return originalSend(data);
                };

                res.json = function (data) {
                    invalidatePattern();
                    return originalJson(data);
                };

                next();

            } catch (error) {
                devLogger.error('CACHE-MW', `Error en invalidateCache middleware: ${error.message}`);
                next();
            }
        };
    }

    /**
     * GENERAR CACHE KEY
     */
    generateCacheKey(req) {
        const path = req.path;
        const query = JSON.stringify(req.query || {});
        const userId = req.user ? req.user.id : 'anonymous';

        // Format: "path|userId|query"
        return `http:${path}|${userId}|${query}`;
    }

    /**
     * GENERAR INVALIDATION PATTERN
     */
    generateInvalidationPattern(req) {
        const basePath = req.baseUrl || req.path.split('/').slice(0, 3).join('/');

        // Invalidar todas las variaciones de esta ruta
        return `http:${basePath}*`;
    }

    /**
     * OBTENER TTL PARA PATH
     */
    getTTLForPath(path) {
        // Buscar match exacto
        if (this.defaultTTLs[path]) {
            return this.defaultTTLs[path];
        }

        // Buscar match parcial
        for (const [pattern, ttl] of Object.entries(this.defaultTTLs)) {
            if (path.startsWith(pattern)) {
                return ttl;
            }
        }

        // TTL por defecto: 5 minutos
        return 5 * 60 * 1000;
    }

    /**
     * AGREGAR TTL CUSTOM PARA PATH
     */
    addTTL(path, ttl) {
        this.defaultTTLs[path] = ttl;
        devLogger.log('CACHE-MW', `✅ TTL configurado: ${path} = ${ttl}ms`);
    }
}

// Export singleton instance and methods
const cacheMiddleware = new CacheMiddleware();

module.exports = {
    cacheResponse: cacheMiddleware.cacheResponse.bind(cacheMiddleware),
    invalidateCache: cacheMiddleware.invalidateCache.bind(cacheMiddleware),
    addTTL: cacheMiddleware.addTTL.bind(cacheMiddleware),
    cacheMiddleware: cacheMiddleware
};

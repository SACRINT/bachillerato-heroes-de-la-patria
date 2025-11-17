/**
 * 🚀 REDIS CACHE MIDDLEWARE - SEMANA 3
 * Middleware de caché con Redis para producción
 * Integración con cache-service.js (Redis real con ioredis)
 *
 * Beneficios vs in-memory cache:
 * - ✅ Persistente (sobrevive reinicios)
 * - ✅ Compartido entre múltiples instancias de servidor
 * - ✅ Escalable (no limitado por memoria de Node.js)
 * - ✅ Eviction policies sofisticadas
 * - ✅ Invalidación por patrones
 */

const { redis, TTL, isRedisAvailable } = require('../services/cache-service');

/**
 * Middleware de caché con Redis
 * @param {Object} options - Opciones de configuración
 * @param {number} options.ttl - Tiempo de vida en segundos
 * @param {Function} options.keyGenerator - Función para generar cache key personalizada
 * @param {boolean} options.enabled - Si el caché está habilitado
 * @param {string} options.prefix - Prefijo para las keys (útil para namespacing)
 * @returns {Function} Express middleware
 */
function redisCacheMiddleware(options = {}) {
    const {
        ttl = TTL.MEDIUM,  // 30 minutos por defecto
        keyGenerator = null,
        enabled = process.env.REDIS_CACHE_ENABLED !== 'false',
        prefix = 'api'
    } = options;

    return async (req, res, next) => {
        // Si caché deshabilitado o Redis no disponible, skip
        if (!enabled) {
            console.log('[REDIS-CACHE] Caché deshabilitado');
            return next();
        }

        // Solo cachear GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Verificar disponibilidad de Redis
            const redisOk = await isRedisAvailable();
            if (!redisOk) {
                console.log('[REDIS-CACHE] Redis no disponible, usando endpoint sin caché');
                return next();
            }

            // Generar cache key
            const cacheKey = keyGenerator
                ? `${prefix}:${keyGenerator(req)}`
                : `${prefix}:${req.originalUrl || req.url}`;

            // Intentar obtener del caché
            const cachedData = await redis.get(cacheKey);

            if (cachedData) {
                // Cache HIT
                console.log(`[REDIS] ✅ HIT: ${cacheKey}`);

                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-Source', 'Redis');

                // Parse y retornar datos cacheados
                const data = JSON.parse(cachedData);
                return res.json(data);
            }

            // Cache MISS
            console.log(`[REDIS] ⏳ MISS: ${cacheKey}`);
            res.setHeader('X-Cache', 'MISS');
            res.setHeader('X-Cache-Source', 'Redis');

            // Interceptar res.json para cachear la respuesta
            const originalJson = res.json.bind(res);
            res.json = async function(data) {
                // Solo cachear respuestas exitosas
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        // Guardar en Redis
                        if (ttl > 0) {
                            await redis.setex(cacheKey, ttl, JSON.stringify(data));
                        } else {
                            await redis.set(cacheKey, JSON.stringify(data));
                        }

                        console.log(`[REDIS] 💾 SAVED: ${cacheKey} (TTL: ${ttl}s)`);
                    } catch (error) {
                        console.error('[REDIS-CACHE] Error al guardar en caché:', error);
                        // No fallar la request si Redis falla
                    }
                }

                return originalJson(data);
            };

            next();

        } catch (error) {
            // Si Redis falla, continuar sin caché
            console.error('[REDIS-CACHE] Error en middleware:', error);
            return next();
        }
    };
}

/**
 * Invalidar caché por patrón
 * Útil cuando se crea/actualiza/elimina un recurso
 * @param {string} pattern - Patrón de keys a invalidar (ej: "api:/noticias*")
 */
async function invalidateRedisCache(pattern) {
    try {
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`[REDIS] 🗑️ INVALIDATED: ${pattern} (${keys.length} keys)`);
        }

        return keys.length;
    } catch (error) {
        console.error('[REDIS-CACHE] Error al invalidar:', error);
        return 0;
    }
}

/**
 * Invalidar todo el caché
 * USO CON CUIDADO - Elimina TODA la caché
 */
async function flushRedisCache() {
    try {
        await redis.flushdb();
        console.log('[REDIS] 🧹 FLUSH: Toda la caché eliminada');
        return true;
    } catch (error) {
        console.error('[REDIS-CACHE] Error al flush:', error);
        return false;
    }
}

/**
 * Obtener estadísticas del caché Redis
 */
async function getRedisStats() {
    try {
        const info = await redis.info('stats');
        const keyspace = await redis.info('keyspace');
        const totalKeys = await redis.dbsize();

        return {
            totalKeys,
            info: info.split('\r\n').filter(line => line && !line.startsWith('#')),
            keyspace: keyspace.split('\r\n').filter(line => line && !line.startsWith('#'))
        };
    } catch (error) {
        console.error('[REDIS-CACHE] Error al obtener stats:', error);
        return null;
    }
}

/**
 * Middleware para invalidar caché después de modificaciones
 * Usar en POST, PUT, DELETE endpoints
 * @param {string|Function} pattern - Patrón a invalidar o función que retorna patrón
 */
function invalidateCacheMiddleware(pattern) {
    return async (req, res, next) => {
        // Guardar el res.json original
        const originalJson = res.json.bind(res);

        // Interceptar para invalidar después de respuesta exitosa
        res.json = async function(data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const invalidatePattern = typeof pattern === 'function'
                    ? pattern(req)
                    : pattern;

                await invalidateRedisCache(invalidatePattern);
            }

            return originalJson(data);
        };

        next();
    };
}

// Backward compatibility: Alias para el old API
const cacheMiddleware = redisCacheMiddleware;
const invalidateCache = invalidateRedisCache;

module.exports = {
    // New API (recommended)
    redisCacheMiddleware,
    invalidateRedisCache,
    flushRedisCache,
    getRedisStats,
    invalidateCacheMiddleware,

    // Backward compatibility
    cacheMiddleware,
    invalidateCache,
    redis,

    // Re-exportar TTL config del service
    TTL
};

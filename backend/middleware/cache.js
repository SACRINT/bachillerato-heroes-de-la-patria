/**
 * MIDDLEWARE DE CACHÉ
 * Sistema simple de caché en memoria para consultas frecuentes
 * Fecha: 18 de Octubre, 2025
 */

// Almacenamiento de caché en memoria
const cache = new Map();

// Configuración de TTL (Time To Live) por tipo de endpoint
const TTL_CONFIG = {
    stats: 5 * 60 * 1000,      // 5 minutos para estadísticas
    list: 2 * 60 * 1000,       // 2 minutos para listados
    detail: 10 * 60 * 1000,    // 10 minutos para detalles
    default: 3 * 60 * 1000     // 3 minutos por defecto
};

/**
 * Middleware de caché
 * @param {number} ttl - Tiempo de vida del caché en milisegundos (opcional)
 * @param {string} keyGenerator - Función para generar la clave de caché (opcional)
 */
function cacheMiddleware(options = {}) {
    const {
        ttl = TTL_CONFIG.default,
        keyGenerator = null,
        enabled = process.env.CACHE_ENABLED !== 'false'
    } = options;

    return (req, res, next) => {
        // Si el caché está deshabilitado, continuar
        if (!enabled) {
            return next();
        }

        // Solo cachear GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generar clave de caché
        const cacheKey = keyGenerator
            ? keyGenerator(req)
            : `${req.originalUrl || req.url}`;

        // Buscar en caché
        const cachedData = cache.get(cacheKey);

        if (cachedData && Date.now() < cachedData.expires) {
            // Caché válido encontrado
            console.log(`🟢 [CACHE HIT] ${cacheKey}`);
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Cache-Expires', new Date(cachedData.expires).toISOString());
            return res.json(cachedData.data);
        }

        // Caché no encontrado o expirado
        console.log(`🔴 [CACHE MISS] ${cacheKey}`);
        res.setHeader('X-Cache', 'MISS');

        // Interceptar res.json para almacenar en caché
        const originalJson = res.json.bind(res);
        res.json = function(data) {
            // Almacenar en caché solo si la respuesta es exitosa
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(cacheKey, {
                    data: data,
                    expires: Date.now() + ttl,
                    created: Date.now()
                });

                console.log(`💾 [CACHE SAVED] ${cacheKey} (TTL: ${ttl / 1000}s)`);
            }

            return originalJson(data);
        };

        next();
    };
}

/**
 * Función para invalidar caché manualmente
 * @param {string|RegExp} pattern - Patrón para invalidar claves específicas
 */
function invalidateCache(pattern) {
    let count = 0;

    if (typeof pattern === 'string') {
        // Invalidar clave específica
        if (cache.has(pattern)) {
            cache.delete(pattern);
            count = 1;
        }
    } else if (pattern instanceof RegExp) {
        // Invalidar por patrón regex
        for (const key of cache.keys()) {
            if (pattern.test(key)) {
                cache.delete(key);
                count++;
            }
        }
    } else {
        // Limpiar todo el caché
        count = cache.size;
        cache.clear();
    }

    console.log(`🧹 [CACHE INVALIDATED] ${count} entradas eliminadas`);
    return count;
}

/**
 * Función para obtener estadísticas del caché
 */
function getCacheStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    let totalSize = 0;

    for (const [key, value] of cache.entries()) {
        totalSize += JSON.stringify(value.data).length;

        if (now < value.expires) {
            valid++;
        } else {
            expired++;
        }
    }

    return {
        total: cache.size,
        valid,
        expired,
        sizeBytes: totalSize,
        sizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
}

/**
 * Limpiar caché expirado automáticamente
 */
function cleanExpiredCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of cache.entries()) {
        if (now >= value.expires) {
            cache.delete(key);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`🧹 [CACHE CLEANUP] ${cleaned} entradas expiradas eliminadas`);
    }

    return cleaned;
}

// Limpiar caché expirado cada 5 minutos
setInterval(cleanExpiredCache, 5 * 60 * 1000);

module.exports = {
    cacheMiddleware,
    invalidateCache,
    getCacheStats,
    cleanExpiredCache,
    TTL_CONFIG
};

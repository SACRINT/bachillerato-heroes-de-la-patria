/**
 * 💾 REDIS CACHE MIDDLEWARE
 * Cache Layer con Redis para optimizar performance del backend
 * Semana 4 - Tarea 2
 */

// Simular Redis con Map en desarrollo
class RedisCache {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();
    }

    async get(key) {
        if (!this.cache.has(key)) return null;

        const ttl = this.ttls.get(key);
        if (ttl && Date.now() > ttl) {
            this.cache.delete(key);
            this.ttls.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    async set(key, value, ttl = 3600) {
        this.cache.set(key, value);
        if (ttl > 0) {
            this.ttls.set(key, Date.now() + (ttl * 1000));
        }
        return 'OK';
    }

    async del(key) {
        this.cache.delete(key);
        this.ttls.delete(key);
        return 1;
    }

    async flushall() {
        this.cache.clear();
        this.ttls.clear();
        return 'OK';
    }
}

const redis = new RedisCache();

/**
 * Middleware de cache para rutas GET
 */
function cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = `cache:${req.originalUrl}`;

        try {
            const cached = await redis.get(cacheKey);

            if (cached) {
                console.log(`[REDIS] ✅ Cache HIT: ${req.originalUrl}`);
                return res.json(JSON.parse(cached));
            }

            console.log(`[REDIS] ⏳ Cache MISS: ${req.originalUrl}`);

            const originalJson = res.json.bind(res);
            res.json = function(data) {
                redis.set(cacheKey, JSON.stringify(data), ttl).catch(console.error);
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('[REDIS] Error:', error);
            next();
        }
    };
}

/**
 * Invalidar cache por patrón
 */
async function invalidateCache(pattern) {
    const keys = Array.from(redis.cache.keys()).filter(k => k.includes(pattern));
    for (const key of keys) {
        await redis.del(key);
    }
    console.log(`[REDIS] 🗑️ Invalidados ${keys.length} keys con patrón: ${pattern}`);
}

module.exports = {
    redis,
    cacheMiddleware,
    invalidateCache
};

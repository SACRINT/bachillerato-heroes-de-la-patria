/**
 * 🔴 Redis Cache Middleware - FASE 30.5 TAREA 5
 *
 * Propósito:
 * - Cachear respuestas de endpoints críticos para reducir carga de BD
 * - Soporte para cache con TTL (Time To Live) configurable
 * - Invalidación de cache automática por patrones
 * - Estadísticas de hit/miss rate para monitoring
 *
 * Uso:
 * const redisCache = require('./middleware/redis-cache');
 * app.use(redisCache.middleware);
 */

// ⏸️ COMENTADO - FASE 30.5 INTENTO-5: Redis no disponible en local
// const Redis = require('ioredis');
const crypto = require('crypto');

class RedisCache {
  constructor(options = {}) {
    // Configuración Redis
    this.redis = null;
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    // Estadísticas
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      lastClear: new Date(),
    };

    // Configuración de cache
    this.defaultTTL = options.defaultTTL || 300; // 5 minutos por defecto
    this.keyPrefix = options.keyPrefix || 'bge:cache:';

    // Logging prefix
    this.prefix = '[REDIS-CACHE]';

    // Inicializar conexión
    this.connect();
  }

  /**
   * Conectar a Redis con reintentos
   */
  async connect() {
    try {
      this.redis = new Redis(this.config);

      // Eventos
      this.redis.on('connect', () => {
        console.log(`${this.prefix} ✅ Conectado a Redis en ${this.config.host}:${this.config.port}`);
      });

      this.redis.on('error', (err) => {
        console.error(`${this.prefix} ❌ Error de Redis:`, err.message);
        this.stats.errors++;
      });

      // Verificar conexión
      await this.redis.ping();
      console.log(`${this.prefix} Redis configurado: TTL=${this.defaultTTL}s, Prefix=${this.keyPrefix}`);
    } catch (err) {
      console.error(`${this.prefix} Error conectando a Redis:`, err.message);
      console.warn(`${this.prefix} Continuando sin Redis (cache deshabilitado)`);
      this.redis = null;
    }
  }

  /**
   * Generar clave de cache
   */
  generateKey(baseKey, params = {}) {
    let key = this.keyPrefix + baseKey;

    // Si hay parámetros, agregar hash
    if (Object.keys(params).length > 0) {
      const paramStr = JSON.stringify(params);
      const hash = crypto.createHash('md5').update(paramStr).digest('hex').substring(0, 8);
      key += `:${hash}`;
    }

    return key;
  }

  /**
   * Obtener valor del cache
   */
  async get(key) {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }
      this.stats.misses++;
      return null;
    } catch (err) {
      console.error(`${this.prefix} Error obteniendo del cache:`, err.message);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Guardar valor en cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.redis) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      this.stats.sets++;
      return true;
    } catch (err) {
      console.error(`${this.prefix} Error guardando en cache:`, err.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Eliminar clave del cache
   */
  async delete(key) {
    if (!this.redis) return false;

    try {
      const result = await this.redis.del(key);
      if (result > 0) this.stats.deletes++;
      return result > 0;
    } catch (err) {
      console.error(`${this.prefix} Error eliminando del cache:`, err.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Invalidar patrón de cache
   */
  async invalidatePattern(pattern) {
    if (!this.redis) return 0;

    try {
      const keys = await this.redis.keys(this.keyPrefix + pattern + '*');
      if (keys.length === 0) return 0;

      const deleted = await this.redis.del(...keys);
      this.stats.deletes += deleted;
      console.log(`${this.prefix} Invalidadas ${deleted} claves con patrón: ${pattern}`);
      return deleted;
    } catch (err) {
      console.error(`${this.prefix} Error invalidando patrón:`, err.message);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Endpoint para obtener estadísticas de cache
   */
  getStatsEndpoint = (req, res) => {
    try {
      const hitRate = this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : 0;

      res.json({
        status: 'ok',
        cache: {
          connected: this.redis ? true : false,
          hits: this.stats.hits,
          misses: this.stats.misses,
          sets: this.stats.sets,
          deletes: this.stats.deletes,
          errors: this.stats.errors,
          hitRate: `${hitRate}%`,
          lastClear: this.stats.lastClear,
        },
        config: {
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          defaultTTL: this.defaultTTL,
          keyPrefix: this.keyPrefix,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`${this.prefix} Error getting stats:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

// Crear instancia global
const redisCache = new RedisCache();

module.exports = redisCache;

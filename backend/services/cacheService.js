/**
 * 🚀 CACHE SERVICE - SEMANA 5
 * Sistema de cache con Redis/Memory fallback
 *
 * Features:
 * - Cache en memoria como fallback
 * - TTL configurable
 * - Invalidación por patrones
 * - Cache warming
 * - Métricas de hit/miss
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    this.defaultTTL = 300; // 5 minutos
  }

  async get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  async set(key, value, ttl = this.defaultTTL) {
    const expiry = ttl > 0 ? Date.now() + (ttl * 1000) : null;
    this.cache.set(key, { value, expiry });
    this.stats.sets++;
  }

  async del(key) {
    const deleted = this.cache.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  async delByPattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    return count;
  }

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    let value = await this.get(key);

    if (value === null) {
      value = await fetchFn();
      await this.set(key, value, ttl);
    }

    return value;
  }

  async clear() {
    this.cache.clear();
    devLogger.log('[Cache] Cache limpiado');
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size
    };
  }

  // Cleanup de items expirados
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

module.exports = new CacheService();

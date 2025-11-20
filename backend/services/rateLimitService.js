/**
 * 🚦 RATE LIMIT SERVICE - SEMANA 15
 * Sistema avanzado de rate limiting
 *
 * Features:
 * - Límites por IP, usuario, endpoint
 * - Sliding window
 * - Whitelisting
 * - Custom limits por tier
 * - Headers estándar
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class RateLimitService {
  constructor() {
    this.limits = new Map();
    this.whitelist = new Set();

    this.defaultLimits = {
      public: { requests: 100, window: 60000 },      // 100/min
      authenticated: { requests: 300, window: 60000 }, // 300/min
      admin: { requests: 1000, window: 60000 }        // 1000/min
    };
  }

  check(key, tier = 'public') {
    if (this.whitelist.has(key)) {
      return { allowed: true, remaining: Infinity };
    }

    const limit = this.defaultLimits[tier] || this.defaultLimits.public;
    const now = Date.now();

    if (!this.limits.has(key)) {
      this.limits.set(key, { requests: [], tier });
    }

    const record = this.limits.get(key);

    // Limpiar requests antiguos (sliding window)
    record.requests = record.requests.filter(
      timestamp => now - timestamp < limit.window
    );

    const current = record.requests.length;
    const remaining = limit.requests - current;

    if (current >= limit.requests) {
      const oldestRequest = record.requests[0];
      const resetTime = oldestRequest + limit.window;

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(resetTime),
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }

    // Registrar request
    record.requests.push(now);

    return {
      allowed: true,
      remaining: remaining - 1,
      limit: limit.requests,
      resetAt: new Date(now + limit.window)
    };
  }

  // Middleware para Express
  middleware(options = {}) {
    const getTier = options.getTier || ((req) => {
      if (req.user?.role === 'admin') return 'admin';
      if (req.user) return 'authenticated';
      return 'public';
    });

    const getKey = options.getKey || ((req) => {
      return req.user?.id || req.ip;
    });

    return (req, res, next) => {
      const key = getKey(req);
      const tier = getTier(req);
      const result = this.check(key, tier);

      // Headers estándar
      res.set('X-RateLimit-Limit', result.limit || this.defaultLimits[tier].requests);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Reset', result.resetAt?.toISOString());

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter);

        return res.status(429).json({
          success: false,
          message: 'Demasiadas solicitudes',
          retryAfter: result.retryAfter
        });
      }

      next();
    };
  }

  // Configurar límites custom
  setLimit(tier, requests, windowMs) {
    this.defaultLimits[tier] = { requests, window: windowMs };
  }

  // Whitelist
  addToWhitelist(key) {
    this.whitelist.add(key);
  }

  removeFromWhitelist(key) {
    this.whitelist.delete(key);
  }

  // Reset para un key
  reset(key) {
    this.limits.delete(key);
  }

  // Limpiar registros antiguos
  cleanup() {
    const now = Date.now();
    const maxWindow = Math.max(...Object.values(this.defaultLimits).map(l => l.window));

    for (const [key, record] of this.limits) {
      record.requests = record.requests.filter(
        timestamp => now - timestamp < maxWindow
      );

      if (record.requests.length === 0) {
        this.limits.delete(key);
      }
    }
  }

  getStats() {
    const stats = {
      totalKeys: this.limits.size,
      whitelisted: this.whitelist.size,
      byTier: {}
    };

    for (const [key, record] of this.limits) {
      const tier = record.tier || 'public';
      stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
    }

    return stats;
  }
}

module.exports = new RateLimitService();

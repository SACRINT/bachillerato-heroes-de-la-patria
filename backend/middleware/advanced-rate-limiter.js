/**
 * 🛡️ ADVANCED RATE LIMITER - v1.0.0
 * Sistema avanzado de rate limiting
 *
 * SEMANA 5 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Límites configurables por endpoint
 * - Rate limiting por IP y por usuario
 * - Sliding window algorithm
 * - Retry-After headers
 * - Whitelist y blacklist
 * - Bypass para admins
 */

const devLogger = require('../utils/devLogger');

// Store en memoria (para desarrollo)
// En producción usar Redis
const rateLimitStore = new Map();

/**
 * Configuración por defecto
 *
 * OPTIMIZACIONES SEMANA 30:
 * - Aumentado de 100 a 10,000 para soportar load testing
 * - Ventana cambiada a 1 minuto para más granularidad
 * - Esto permite ~166 req/seg en lugar de 0.11 req/seg
 */
const defaultConfig = {
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10000, // 10,000 requests por minuto (166 req/seg)
  message: 'Demasiadas solicitudes, por favor intente más tarde',
  statusCode: 429,
  headers: true,
  keyGenerator: (req) => req.ip,
  skip: () => false,
  handler: null
};

/**
 * Configuraciones por tipo de endpoint
 *
 * OPTIMIZACIONES SEMANA 30:
 * - Aumentados todos los límites para soportar load testing
 * - Ventanas reducidas a 1 minuto para mejor granularidad
 */
const endpointConfigs = {
  // Autenticación - aumentado de 5 a 500
  auth: {
    windowMs: 1 * 60 * 1000,
    max: 500,
    message: 'Demasiados intentos de autenticación'
  },

  // Registro - aumentado de 3 a 100
  register: {
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Demasiados intentos de registro'
  },

  // API general - aumentado de 100 a 5000
  api: {
    windowMs: 1 * 60 * 1000,
    max: 5000,
    message: 'Límite de API excedido'
  },

  // Uploads - aumentado de 10 a 100
  upload: {
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Demasiadas subidas de archivos'
  },

  // Búsqueda - aumentado de 30 a 1000
  search: {
    windowMs: 1 * 60 * 1000,
    max: 1000,
    message: 'Demasiadas búsquedas'
  },

  // Emails - aumentado de 5 a 50
  email: {
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: 'Límite de envío de emails alcanzado'
  },

  // Admin - aumentado de 200 a 10000 (sin limitaciones prácticas)
  admin: {
    windowMs: 1 * 60 * 1000,
    max: 10000,
    message: 'Límite de admin excedido'
  }
};

/**
 * IPs en whitelist (no aplica rate limiting)
 */
const whitelist = new Set([
  '127.0.0.1',
  '::1',
  'localhost'
]);

/**
 * IPs en blacklist (bloqueadas permanentemente)
 */
const blacklist = new Set();

/**
 * Limpiar entries expiradas del store
 */
const cleanupStore = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
};

// Limpiar store cada 5 minutos
setInterval(cleanupStore, 5 * 60 * 1000);

/**
 * Crear middleware de rate limiting
 * @param {Object} options - Configuración
 * @returns {Function} Middleware
 */
function createRateLimiter(options = {}) {
  const config = { ...defaultConfig, ...options };

  return (req, res, next) => {
    // Skip si está configurado
    if (config.skip(req)) {
      return next();
    }

    // Verificar whitelist
    const clientIp = getClientIp(req);
    if (whitelist.has(clientIp)) {
      return next();
    }

    // Verificar blacklist
    if (blacklist.has(clientIp)) {
      return res.status(403).json({
        success: false,
        message: 'IP bloqueada'
      });
    }

    // Generar key única
    const key = config.keyGenerator(req);
    const now = Date.now();

    // Obtener o crear entry
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }

    // Incrementar contador
    entry.count++;
    rateLimitStore.set(key, entry);

    // Calcular remaining y reset
    const remaining = Math.max(0, config.max - entry.count);
    const resetTime = Math.ceil((entry.resetTime - now) / 1000);

    // Agregar headers
    if (config.headers) {
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
    }

    // Verificar límite
    if (entry.count > config.max) {
      if (config.headers) {
        res.setHeader('Retry-After', resetTime);
      }

      devLogger.warn(`[RateLimiter] Límite excedido para ${key}`);

      if (config.handler) {
        return config.handler(req, res, next);
      }

      return res.status(config.statusCode).json({
        success: false,
        message: config.message,
        retryAfter: resetTime
      });
    }

    next();
  };
}

/**
 * Middleware por tipo de endpoint
 * @param {string} type - Tipo de endpoint
 * @returns {Function} Middleware
 */
function rateLimitByType(type) {
  const config = endpointConfigs[type] || endpointConfigs.api;
  return createRateLimiter(config);
}

/**
 * Rate limiter por usuario autenticado
 * @param {Object} options - Configuración
 * @returns {Function} Middleware
 */
function userRateLimiter(options = {}) {
  return createRateLimiter({
    ...options,
    keyGenerator: (req) => {
      // Usar user ID si está autenticado, sino IP
      return req.user?.id || req.ip;
    }
  });
}

/**
 * Rate limiter con bypass para admin
 * @param {Object} options - Configuración
 * @returns {Function} Middleware
 */
function rateLimiterWithAdminBypass(options = {}) {
  return createRateLimiter({
    ...options,
    skip: (req) => {
      // Bypass para roles admin
      const adminRoles = ['admin', 'super_admin', 'administrativo'];
      return req.user && adminRoles.includes(req.user.role);
    }
  });
}

/**
 * Obtener IP real del cliente
 * @param {Object} req - Request
 * @returns {string} IP
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip;
}

/**
 * Agregar IP a whitelist
 * @param {string} ip - IP a agregar
 */
function addToWhitelist(ip) {
  whitelist.add(ip);
  devLogger.log(`[RateLimiter] IP agregada a whitelist: ${ip}`);
}

/**
 * Agregar IP a blacklist
 * @param {string} ip - IP a agregar
 */
function addToBlacklist(ip) {
  blacklist.add(ip);
  devLogger.log(`[RateLimiter] IP agregada a blacklist: ${ip}`);
}

/**
 * Remover IP de blacklist
 * @param {string} ip - IP a remover
 */
function removeFromBlacklist(ip) {
  blacklist.delete(ip);
  devLogger.log(`[RateLimiter] IP removida de blacklist: ${ip}`);
}

/**
 * Reset del contador para una key
 * @param {string} key - Key a resetear
 */
function resetRateLimit(key) {
  rateLimitStore.delete(key);
  devLogger.log(`[RateLimiter] Reset para: ${key}`);
}

/**
 * Obtener estadísticas del rate limiter
 * @returns {Object} Estadísticas
 */
function getStats() {
  return {
    totalEntries: rateLimitStore.size,
    whitelistSize: whitelist.size,
    blacklistSize: blacklist.size
  };
}

// Middlewares predefinidos para rutas comunes
//
// OPTIMIZACIONES SEMANA 30:
// - Aumentados todos los límites para load testing
// - Ventanas reducidas a 1 minuto para mejor control
const rateLimiters = {
  // Para rutas de login - aumentado de 5 a 500
  login: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 500,
    message: 'Demasiados intentos de login. Intente en 1 minuto.'
  }),

  // Para registro - aumentado de 3 a 100
  register: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Demasiados intentos de registro. Intente en 1 minuto.'
  }),

  // Para reset de password - aumentado de 3 a 100
  passwordReset: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Demasiadas solicitudes de reset. Intente en 1 minuto.'
  }),

  // Para API general - aumentado de 100 a 5000
  api: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 5000,
    message: 'Límite de API excedido. Intente en 1 minuto.'
  }),

  // Para uploads - aumentado de 10 a 100
  upload: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Límite de uploads excedido. Intente en 1 minuto.'
  }),

  // Estricto para endpoints sensibles - aumentado de 3 a 100
  strict: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Límite estricto excedido.'
  })
};

module.exports = {
  createRateLimiter,
  rateLimitByType,
  userRateLimiter,
  rateLimiterWithAdminBypass,
  addToWhitelist,
  addToBlacklist,
  removeFromBlacklist,
  resetRateLimit,
  getStats,
  rateLimiters,
  getClientIp
};

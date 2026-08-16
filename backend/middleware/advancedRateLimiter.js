/**
 * 🚦 ADVANCED RATE LIMITER - SEMANA 25
 * Sistema avanzado de rate limiting con múltiples estrategias
 *
 * Features:
 * - Rate limiting por endpoint específico
 * - Sliding window algorithm (más preciso que fixed window)
 * - Different limits por roles de usuario (admin, user, guest)
 * - Burst allowance (permite spikes cortos)
 * - Distributed rate limiting ready (Redis compatible)
 * - Custom limits por ruta
 * - Headers informativos (X-RateLimit-*)
 * - Portable y modular
 *
 * Uso:
 * const rateLimiter = require('./middleware/advancedRateLimiter');
 *
 * // Aplicar globalmente
 * app.use(rateLimiter.middleware());
 *
 * // O por endpoint específico
 * app.post('/api/login', rateLimiter.limit({ maxRequests: 5, windowMs: 60000 }), handler);
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger.js');

class AdvancedRateLimiter {
    constructor() {
        // Almacén de requests (en producción usar Redis)
        // Estructura: Map<key, Array<timestamp>>
        this.requestHistory = new Map();

        // Configuración por defecto
        this.defaultLimits = {
            // Usuarios no autenticados
            guest: {
                maxRequests: 30,
                windowMs: 60 * 1000,        // 1 minuto
                burstAllowance: 5           // 5 requests extra permitidos en bursts
            },
            // Usuarios autenticados normales
            user: {
                maxRequests: 100,
                windowMs: 60 * 1000,
                burstAllowance: 10
            },
            // Administradores
            admin: {
                maxRequests: 500,
                windowMs: 60 * 1000,
                burstAllowance: 50
            }
        };

        // Límites personalizados por endpoint
        this.endpointLimits = {
            'POST /api/auth/login': {
                maxRequests: 5,
                windowMs: 5 * 60 * 1000,    // 5 minutos
                burstAllowance: 2
            },
            'POST /api/auth/register': {
                maxRequests: 3,
                windowMs: 10 * 60 * 1000,   // 10 minutos
                burstAllowance: 1
            },
            'POST /api/auth/reset-password': {
                maxRequests: 3,
                windowMs: 15 * 60 * 1000,   // 15 minutos
                burstAllowance: 0
            },
            'POST /api/auth/2fa/verify': {
                maxRequests: 5,
                windowMs: 5 * 60 * 1000,
                burstAllowance: 2
            },
            'POST /api/contact': {
                maxRequests: 5,
                windowMs: 60 * 60 * 1000,   // 1 hora
                burstAllowance: 1
            },
            'POST /api/support/tickets': {
                maxRequests: 10,
                windowMs: 60 * 60 * 1000,
                burstAllowance: 2
            }
        };

        // Whitelist de IPs (sin rate limiting)
        this.whitelistedIPs = new Set([
            // Agregar IPs de servidores de monitoreo, etc
        ]);

        // Cleanup cada 5 minutos
        setInterval(() => this.cleanup(), 5 * 60 * 1000);

        devLogger.log('RATE-LIMITER', '🚦 Advanced Rate Limiter initialized');
    }

    /**
     * MIDDLEWARE PRINCIPAL
     */
    middleware() {
        return async (req, res, next) => {
            try {
                const ip = this.getClientIP(req);

                // Skip si está en whitelist
                if (this.whitelistedIPs.has(ip)) {
                    return next();
                }

                // Obtener límites aplicables
                const limits = this.getLimits(req);

                // Generar key única para tracking
                const key = this.generateKey(req);

                // Verificar rate limit
                const result = this.checkRateLimit(key, limits);

                // Agregar headers informativos
                res.setHeader('X-RateLimit-Limit', limits.maxRequests);
                res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
                res.setHeader('X-RateLimit-Reset', result.resetTime);

                if (result.allowed) {
                    // Request permitido
                    return next();
                } else {
                    // Rate limit excedido
                    devLogger.warn('RATE-LIMITER', `❌ Rate limit excedido: key=${key}, requests=${result.currentRequests}`);

                    res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000));

                    return res.status(429).json({
                        success: false,
                        error: 'Rate limit exceeded',
                        message: 'Demasiadas peticiones. Por favor intenta de nuevo más tarde.',
                        retryAfter: result.retryAfter,
                        timestamp: new Date().toISOString()
                    });
                }

            } catch (error) {
                devLogger.error('RATE-LIMITER', 'Error en middleware:', error);
                next(); // No bloquear en caso de error
            }
        };
    }

    /**
     * FACTORY METHOD: Crear middleware con límites custom
     */
    limit(customLimits) {
        return async (req, res, next) => {
            try {
                const ip = this.getClientIP(req);

                if (this.whitelistedIPs.has(ip)) {
                    return next();
                }

                const key = this.generateKey(req);
                const result = this.checkRateLimit(key, customLimits);

                res.setHeader('X-RateLimit-Limit', customLimits.maxRequests);
                res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
                res.setHeader('X-RateLimit-Reset', result.resetTime);

                if (result.allowed) {
                    return next();
                } else {
                    res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000));

                    return res.status(429).json({
                        success: false,
                        error: 'Rate limit exceeded',
                        message: 'Demasiadas peticiones. Por favor intenta de nuevo más tarde.',
                        retryAfter: result.retryAfter,
                        timestamp: new Date().toISOString()
                    });
                }

            } catch (error) {
                devLogger.error('RATE-LIMITER', 'Error en limit middleware:', error);
                next();
            }
        };
    }

    /**
     * OBTENER LÍMITES APLICABLES PARA REQUEST
     */
    getLimits(req) {
        // 1. Verificar si hay límite específico para este endpoint
        const endpointKey = `${req.method} ${req.path}`;

        if (this.endpointLimits[endpointKey]) {
            return this.endpointLimits[endpointKey];
        }

        // 2. Determinar límites según rol de usuario
        let userRole = 'guest';

        if (req.user) {
            userRole = req.user.role || 'user';

            // Normalizar roles
            if (['administrativo', 'administrator'].includes(userRole)) {
                userRole = 'admin';
            } else if (['docente', 'estudiante', 'padre'].includes(userRole)) {
                userRole = 'user';
            }
        }

        return this.defaultLimits[userRole] || this.defaultLimits.guest;
    }

    /**
     * GENERAR KEY ÚNICA PARA TRACKING
     */
    generateKey(req) {
        const ip = this.getClientIP(req);
        const userId = req.user ? req.user.id : 'anonymous';
        const endpoint = `${req.method} ${req.path}`;

        // Key format: "ip:userId:endpoint"
        return `${ip}:${userId}:${endpoint}`;
    }

    /**
     * CHECK RATE LIMIT (Sliding Window Algorithm)
     */
    checkRateLimit(key, limits) {
        const now = Date.now();
        const windowStart = now - limits.windowMs;

        // Obtener historial de requests
        let history = this.requestHistory.get(key) || [];

        // Filtrar requests dentro de la ventana (sliding window)
        history = history.filter(timestamp => timestamp > windowStart);

        // Contar requests actuales
        const currentRequests = history.length;

        // Calcular límite efectivo (incluyendo burst allowance)
        const effectiveLimit = limits.maxRequests + (limits.burstAllowance || 0);

        // Verificar si se permite el request
        const allowed = currentRequests < effectiveLimit;

        if (allowed) {
            // Agregar timestamp actual al historial
            history.push(now);
            this.requestHistory.set(key, history);
        }

        // Calcular cuándo se resetea el límite
        const oldestRequest = history[0] || now;
        const resetTime = new Date(oldestRequest + limits.windowMs).toISOString();
        const retryAfter = oldestRequest + limits.windowMs - now;

        return {
            allowed: allowed,
            currentRequests: currentRequests,
            remaining: Math.max(0, limits.maxRequests - currentRequests),
            resetTime: resetTime,
            retryAfter: Math.max(0, retryAfter)
        };
    }

    /**
     * OBTENER IP DEL CLIENTE
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               'unknown';
    }

    /**
     * AGREGAR IP A WHITELIST
     */
    addToWhitelist(ip) {
        this.whitelistedIPs.add(ip);
        devLogger.log('RATE-LIMITER', `✅ IP agregada a whitelist: ${ip}`);
    }

    /**
     * REMOVER IP DE WHITELIST
     */
    removeFromWhitelist(ip) {
        this.whitelistedIPs.delete(ip);
        devLogger.log('RATE-LIMITER', `🗑️ IP removida de whitelist: ${ip}`);
    }

    /**
     * AGREGAR LÍMITE CUSTOM POR ENDPOINT
     */
    addEndpointLimit(method, path, limits) {
        const key = `${method} ${path}`;
        this.endpointLimits[key] = limits;

        devLogger.log('RATE-LIMITER', `✅ Límite custom agregado: ${key} = ${limits.maxRequests} req/${limits.windowMs}ms`);
    }

    /**
     * RESET RATE LIMIT PARA UN KEY
     */
    reset(key) {
        this.requestHistory.delete(key);
        devLogger.log('RATE-LIMITER', `🔄 Rate limit reseteado: ${key}`);
    }

    /**
     * RESET RATE LIMIT PARA UN USUARIO
     */
    resetUser(userId) {
        let count = 0;

        for (const [key, history] of this.requestHistory.entries()) {
            if (key.includes(`:${userId}:`)) {
                this.requestHistory.delete(key);
                count++;
            }
        }

        devLogger.log('RATE-LIMITER', `🔄 Rate limit reseteado para usuario: userId=${userId}, keys=${count}`);

        return count;
    }

    /**
     * RESET RATE LIMIT PARA UN IP
     */
    resetIP(ip) {
        let count = 0;

        for (const [key, history] of this.requestHistory.entries()) {
            if (key.startsWith(`${ip}:`)) {
                this.requestHistory.delete(key);
                count++;
            }
        }

        devLogger.log('RATE-LIMITER', `🔄 Rate limit reseteado para IP: ip=${ip}, keys=${count}`);

        return count;
    }

    /**
     * CLEANUP DE HISTORIAL ANTIGUO
     */
    cleanup() {
        const now = Date.now();
        const maxWindowMs = Math.max(...Object.values(this.defaultLimits).map(l => l.windowMs));
        let cleanedKeys = 0;

        for (const [key, history] of this.requestHistory.entries()) {
            // Filtrar timestamps antiguos
            const filtered = history.filter(timestamp => timestamp > (now - maxWindowMs * 2));

            if (filtered.length === 0) {
                this.requestHistory.delete(key);
                cleanedKeys++;
            } else if (filtered.length < history.length) {
                this.requestHistory.set(key, filtered);
            }
        }

        if (cleanedKeys > 0) {
            devLogger.log('RATE-LIMITER', `🧹 Cleanup: ${cleanedKeys} keys eliminadas`);
        }
    }

    /**
     * OBTENER ESTADÍSTICAS
     */
    getStats() {
        const stats = {
            totalKeys: this.requestHistory.size,
            whitelistedIPs: this.whitelistedIPs.size,
            customEndpoints: Object.keys(this.endpointLimits).length,
            topKeys: []
        };

        // Top 10 keys con más requests
        const keysWithCounts = Array.from(this.requestHistory.entries())
            .map(([key, history]) => ({ key, count: history.length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        stats.topKeys = keysWithCounts;

        return stats;
    }

    /**
     * OBTENER STATUS DE UN KEY
     */
    getStatus(key) {
        const history = this.requestHistory.get(key);

        if (!history || history.length === 0) {
            return {
                key: key,
                requests: 0,
                status: 'no activity'
            };
        }

        const now = Date.now();
        const recentRequests = history.filter(t => t > (now - 60000)); // Últimos 60 segundos

        return {
            key: key,
            requests: history.length,
            recentRequests: recentRequests.length,
            oldestRequest: new Date(history[0]).toISOString(),
            newestRequest: new Date(history[history.length - 1]).toISOString()
        };
    }
}

// Exportar instancia singleton
const advancedRateLimiter = new AdvancedRateLimiter();

module.exports = advancedRateLimiter;

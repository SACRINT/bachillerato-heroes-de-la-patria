/**
 * Servicio de Rate Limiting Avanzado
 * BGE Héroes de la Patria
 * FASE 4 - Semana 27-28
 *
 * Control de límites de peticiones por usuario, IP, endpoint
 */

class RateLimiterService {
    constructor() {
        // Almacenamiento de requests
        this.requests = new Map();

        // Configuración por defecto
        this.defaultLimits = {
            windowMs: 60000, // 1 minuto
            max: 100, // 100 requests por minuto
            skipSuccessfulRequests: false,
            skipFailedRequests: false
        };

        // Límites específicos por tipo de endpoint
        this.endpointLimits = {
            // Autenticación - más restrictivo
            auth: {
                windowMs: 300000, // 5 minutos
                max: 5, // 5 intentos
                blockDuration: 900000 // 15 min de bloqueo
            },
            // API general
            api: {
                windowMs: 60000,
                max: 100
            },
            // Búsquedas
            search: {
                windowMs: 60000,
                max: 30
            },
            // Uploads
            upload: {
                windowMs: 3600000, // 1 hora
                max: 20
            },
            // AI/ML endpoints - costosos
            ai: {
                windowMs: 3600000, // 1 hora
                max: 50
            },
            // Webhooks externos
            webhook: {
                windowMs: 60000,
                max: 10
            },
            // Admin endpoints
            admin: {
                windowMs: 60000,
                max: 200
            },
            // Público - sin auth
            public: {
                windowMs: 60000,
                max: 60
            }
        };

        // Whitelist de IPs
        this.whitelist = new Set();

        // Blacklist de IPs (bloqueo temporal)
        this.blacklist = new Map();

        // Estadísticas
        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            byEndpointType: {}
        };

        console.log('[RATE-LIMITER] Servicio inicializado');
    }

    /**
     * Verificar si el request está permitido
     */
    isAllowed(identifier, endpointType = 'api', options = {}) {
        // Verificar whitelist
        if (this.whitelist.has(identifier)) {
            return { allowed: true, remaining: Infinity };
        }

        // Verificar blacklist
        const blacklistEntry = this.blacklist.get(identifier);
        if (blacklistEntry && Date.now() < blacklistEntry.until) {
            this.stats.blockedRequests++;
            return {
                allowed: false,
                retryAfter: Math.ceil((blacklistEntry.until - Date.now()) / 1000),
                reason: blacklistEntry.reason || 'Temporarily blocked'
            };
        }

        // Obtener límites para este tipo de endpoint
        const limits = { ...this.defaultLimits, ...this.endpointLimits[endpointType], ...options };

        // Crear key única
        const key = `${endpointType}:${identifier}`;

        // Obtener o crear registro
        let record = this.requests.get(key);
        const now = Date.now();

        if (!record || now > record.resetTime) {
            record = {
                count: 0,
                resetTime: now + limits.windowMs,
                firstRequest: now
            };
        }

        // Incrementar contador
        record.count++;
        this.requests.set(key, record);

        // Actualizar estadísticas
        this.stats.totalRequests++;
        this.stats.byEndpointType[endpointType] = (this.stats.byEndpointType[endpointType] || 0) + 1;

        // Verificar límite
        if (record.count > limits.max) {
            this.stats.blockedRequests++;

            // Si hay blockDuration, agregar a blacklist temporalmente
            if (limits.blockDuration) {
                this.blacklist.set(identifier, {
                    until: now + limits.blockDuration,
                    reason: `Exceeded ${limits.max} requests in ${limits.windowMs / 1000}s`
                });
            }

            return {
                allowed: false,
                retryAfter: Math.ceil((record.resetTime - now) / 1000),
                limit: limits.max,
                current: record.count
            };
        }

        return {
            allowed: true,
            remaining: limits.max - record.count,
            resetTime: record.resetTime,
            limit: limits.max
        };
    }

    /**
     * Middleware de Express
     */
    middleware(endpointType = 'api', options = {}) {
        return (req, res, next) => {
            // Determinar identificador (IP o userId si está autenticado)
            const identifier = req.user?.id
                ? `user:${req.user.id}`
                : `ip:${req.ip || req.connection.remoteAddress}`;

            const result = this.isAllowed(identifier, endpointType, options);

            // Agregar headers de rate limiting
            res.set('X-RateLimit-Limit', result.limit || this.defaultLimits.max);
            res.set('X-RateLimit-Remaining', result.remaining || 0);
            if (result.resetTime) {
                res.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
            }

            if (!result.allowed) {
                res.set('Retry-After', result.retryAfter);
                return res.status(429).json({
                    success: false,
                    error: 'Too Many Requests',
                    message: `Has excedido el límite de peticiones. Intenta en ${result.retryAfter} segundos.`,
                    retryAfter: result.retryAfter
                });
            }

            next();
        };
    }

    /**
     * Agregar IP a whitelist
     */
    addToWhitelist(ip) {
        this.whitelist.add(ip);
        return true;
    }

    /**
     * Remover IP de whitelist
     */
    removeFromWhitelist(ip) {
        return this.whitelist.delete(ip);
    }

    /**
     * Bloquear identificador temporalmente
     */
    block(identifier, durationMs, reason = 'Manual block') {
        this.blacklist.set(identifier, {
            until: Date.now() + durationMs,
            reason
        });
        return true;
    }

    /**
     * Desbloquear identificador
     */
    unblock(identifier) {
        return this.blacklist.delete(identifier);
    }

    /**
     * Resetear límites para un identificador
     */
    reset(identifier, endpointType = null) {
        if (endpointType) {
            this.requests.delete(`${endpointType}:${identifier}`);
        } else {
            // Resetear todos los tipos
            for (const type of Object.keys(this.endpointLimits)) {
                this.requests.delete(`${type}:${identifier}`);
            }
        }
        return true;
    }

    /**
     * Obtener estado actual de un identificador
     */
    getStatus(identifier, endpointType = 'api') {
        const key = `${endpointType}:${identifier}`;
        const record = this.requests.get(key);
        const limits = this.endpointLimits[endpointType] || this.defaultLimits;

        if (!record) {
            return {
                count: 0,
                limit: limits.max,
                remaining: limits.max,
                windowMs: limits.windowMs
            };
        }

        const remaining = Math.max(0, limits.max - record.count);

        return {
            count: record.count,
            limit: limits.max,
            remaining,
            resetTime: record.resetTime,
            windowMs: limits.windowMs
        };
    }

    /**
     * Obtener estadísticas globales
     */
    getStats() {
        return {
            ...this.stats,
            activeRecords: this.requests.size,
            whitelistSize: this.whitelist.size,
            blacklistSize: this.blacklist.size,
            blockRate: this.stats.totalRequests > 0
                ? ((this.stats.blockedRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Obtener los principales consumidores
     */
    getTopConsumers(limit = 10) {
        const consumers = [];

        for (const [key, record] of this.requests) {
            const [type, identifier] = key.split(':');
            consumers.push({
                identifier,
                type,
                count: record.count,
                resetTime: record.resetTime
            });
        }

        return consumers
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Limpiar registros expirados
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        // Limpiar requests expirados
        for (const [key, record] of this.requests) {
            if (now > record.resetTime) {
                this.requests.delete(key);
                cleaned++;
            }
        }

        // Limpiar blacklist expirada
        for (const [identifier, entry] of this.blacklist) {
            if (now > entry.until) {
                this.blacklist.delete(identifier);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Configurar límites personalizados
     */
    setLimits(endpointType, limits) {
        this.endpointLimits[endpointType] = {
            ...this.endpointLimits[endpointType],
            ...limits
        };
        return true;
    }

    /**
     * Obtener configuración actual
     */
    getConfig() {
        return {
            defaultLimits: this.defaultLimits,
            endpointLimits: this.endpointLimits
        };
    }

    /**
     * Resetear estadísticas
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            byEndpointType: {}
        };
        return true;
    }
}

module.exports = new RateLimiterService();

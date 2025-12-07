/**
 * 🚦 RATE LIMIT SERVICE - TypeScript
 * Sistema avanzado de rate limiting
 *
 * Features:
 * - Límites por IP, usuario, endpoint
 * - Sliding window
 * - Whitelisting
 * - Custom limits por tier
 * - Headers estándar
 *
 * Migración TypeScript: 07 Diciembre 2025
 */

import { Request, Response, NextFunction } from 'express';
import devLogger from '../utils/devLogger';

// =====================================================
// INTERFACES
// =====================================================

export interface RateLimitConfig {
    requests: number;
    window: number;
}

export interface RateLimitRecord {
    requests: number[];
    tier: string;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    limit?: number;
    resetAt?: Date;
    retryAfter?: number;
}

export interface RateLimitMiddlewareOptions {
    getTier?: (req: Request) => string;
    getKey?: (req: Request) => string;
}

export interface RateLimitStats {
    totalKeys: number;
    whitelisted: number;
    byTier: Record<string, number>;
}

// =====================================================
// RATE LIMIT SERVICE CLASS
// =====================================================

class RateLimitService {
    private limits: Map<string, RateLimitRecord>;
    private whitelist: Set<string>;
    private defaultLimits: Record<string, RateLimitConfig>;

    constructor() {
        this.limits = new Map();
        this.whitelist = new Set();

        this.defaultLimits = {
            public: { requests: 100, window: 60000 },      // 100/min
            authenticated: { requests: 300, window: 60000 }, // 300/min
            admin: { requests: 1000, window: 60000 }        // 1000/min
        };
    }

    /**
     * Verificar si request está permitida
     */
    check(key: string, tier: string = 'public'): RateLimitResult {
        if (this.whitelist.has(key)) {
            return { allowed: true, remaining: Infinity };
        }

        const limit = this.defaultLimits[tier] || this.defaultLimits.public;
        const now = Date.now();

        if (!this.limits.has(key)) {
            this.limits.set(key, { requests: [], tier });
        }

        const record = this.limits.get(key)!;

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

    /**
     * Middleware para Express
     */
    middleware(options: RateLimitMiddlewareOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
        const getTier = options.getTier || ((req: Request): string => {
            const user = (req as any).user;
            if (user?.role === 'admin') return 'admin';
            if (user) return 'authenticated';
            return 'public';
        });

        const getKey = options.getKey || ((req: Request): string => {
            const user = (req as any).user;
            return user?.id?.toString() || req.ip || 'unknown';
        });

        return (req: Request, res: Response, next: NextFunction): void => {
            const key = getKey(req);
            const tier = getTier(req);
            const result = this.check(key, tier);

            // Headers estándar
            res.set('X-RateLimit-Limit', String(result.limit || this.defaultLimits[tier].requests));
            res.set('X-RateLimit-Remaining', String(result.remaining));
            if (result.resetAt) {
                res.set('X-RateLimit-Reset', result.resetAt.toISOString());
            }

            if (!result.allowed) {
                res.set('Retry-After', String(result.retryAfter));

                res.status(429).json({
                    success: false,
                    message: 'Demasiadas solicitudes',
                    retryAfter: result.retryAfter
                });
                return;
            }

            next();
        };
    }

    /**
     * Configurar límites custom
     */
    setLimit(tier: string, requests: number, windowMs: number): void {
        this.defaultLimits[tier] = { requests, window: windowMs };
    }

    /**
     * Agregar a whitelist
     */
    addToWhitelist(key: string): void {
        this.whitelist.add(key);
    }

    /**
     * Remover de whitelist
     */
    removeFromWhitelist(key: string): void {
        this.whitelist.delete(key);
    }

    /**
     * Reset para un key
     */
    reset(key: string): void {
        this.limits.delete(key);
    }

    /**
     * Limpiar registros antiguos
     */
    cleanup(): void {
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

    /**
     * Obtener estadísticas
     */
    getStats(): RateLimitStats {
        const stats: RateLimitStats = {
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

export default new RateLimitService();
module.exports = new RateLimitService();

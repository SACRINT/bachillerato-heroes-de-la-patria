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
declare class RateLimitService {
    private limits;
    private whitelist;
    private defaultLimits;
    constructor();
    /**
     * Verificar si request está permitida
     */
    check(key: string, tier?: string): RateLimitResult;
    /**
     * Middleware para Express
     */
    middleware(options?: RateLimitMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Configurar límites custom
     */
    setLimit(tier: string, requests: number, windowMs: number): void;
    /**
     * Agregar a whitelist
     */
    addToWhitelist(key: string): void;
    /**
     * Remover de whitelist
     */
    removeFromWhitelist(key: string): void;
    /**
     * Reset para un key
     */
    reset(key: string): void;
    /**
     * Limpiar registros antiguos
     */
    cleanup(): void;
    /**
     * Obtener estadísticas
     */
    getStats(): RateLimitStats;
}
declare const _default: RateLimitService;
export default _default;
//# sourceMappingURL=rate-limit.service.d.ts.map
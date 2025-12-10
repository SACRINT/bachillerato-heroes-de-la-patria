/**
 * Rate limiter para endpoints públicos (sin autenticación)
 * Ejemplo: /api/noticias, /api/calendar, /health
 */
export const publicLimiter: any;
/**
 * Rate limiter para endpoints de autenticación
 * Ejemplo: /api/auth/login, /api/auth/register
 * MÁS RESTRICTIVO para prevenir brute force
 */
export const authLimiter: any;
/**
 * Rate limiter para endpoints admin (requiere autenticación)
 * Ejemplo: /api/admin/*, /api/approvals/*
 * MENOS RESTRICTIVO porque ya están autenticados
 */
export const adminLimiter: any;
/**
 * Rate limiter para API keys (terceros integrados)
 * Ejemplo: /api/external/*, /api/webhooks/*
 */
export const apiKeyLimiter: any;
/**
 * Rate limiter para uploads de archivos
 * MÁS RESTRICTIVO para prevenir abuso de storage
 */
export const uploadLimiter: any;
/**
 * Rate limiter para formularios de contacto/solicitudes
 * Prevenir spam
 */
export const formLimiter: any;
/**
 * Rate limiter para búsquedas
 * Prevenir scraping masivo
 */
export const searchLimiter: any;
/**
 * Rate limiter global muy permisivo
 * Última línea de defensa contra ataques DDoS
 */
export const globalLimiter: any;
/**
 * Middleware para logging de rate limit hits
 */
export function rateLimitLogger(req: any, res: any, next: any): void;
/**
 * Crear rate limiter personalizado
 */
export function createCustomLimiter(options: any): any;
export { createCustomLimiter as createRateLimiter };
//# sourceMappingURL=rate-limiter-advanced.d.ts.map
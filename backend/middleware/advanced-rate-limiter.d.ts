/**
 * Crear middleware de rate limiting
 * @param {Object} options - Configuración
 * @returns {Function} Middleware
 */
export function createRateLimiter(options?: any): Function;
/**
 * Middleware por tipo de endpoint
 * @param {string} type - Tipo de endpoint
 * @returns {Function} Middleware
 */
export function rateLimitByType(type: string): Function;
/**
 * Rate limiter por usuario autenticado
 * @param {Object} options - Configuración
 * @returns {Function} Middleware
 */
export function userRateLimiter(options?: any): Function;
/**
 * Rate limiter con bypass para admin
 * @param {Object} options - Configuración
 * @returns {Function} Middleware
 */
export function rateLimiterWithAdminBypass(options?: any): Function;
/**
 * Agregar IP a whitelist
 * @param {string} ip - IP a agregar
 */
export function addToWhitelist(ip: string): void;
/**
 * Agregar IP a blacklist
 * @param {string} ip - IP a agregar
 */
export function addToBlacklist(ip: string): void;
/**
 * Remover IP de blacklist
 * @param {string} ip - IP a remover
 */
export function removeFromBlacklist(ip: string): void;
/**
 * Reset del contador para una key
 * @param {string} key - Key a resetear
 */
export function resetRateLimit(key: string): void;
/**
 * Obtener estadísticas del rate limiter
 * @returns {Object} Estadísticas
 */
export function getStats(): any;
export namespace rateLimiters {
    let login: Function;
    let register: Function;
    let passwordReset: Function;
    let api: Function;
    let upload: Function;
    let strict: Function;
}
/**
 * Obtener IP real del cliente
 * @param {Object} req - Request
 * @returns {string} IP
 */
export function getClientIp(req: any): string;
//# sourceMappingURL=advanced-rate-limiter.d.ts.map
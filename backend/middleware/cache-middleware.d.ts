/**
 * Middleware de caché para Express
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in seconds (default: 300 = 5min)
 * @param {Function} options.condition - Function to determine if should cache (default: always cache)
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/api/students', cacheMiddleware({ ttl: 600 }), async (req, res) => { ... });
 *
 * @example
 * router.get('/api/news', cacheMiddleware({
 *   ttl: 300,
 *   condition: (req) => !req.query.fresh  // No cachear si query param "fresh" está presente
 * }), async (req, res) => { ... });
 */
export function cacheMiddleware(options?: {
    ttl: number;
    condition: Function;
}): Function;
/**
 * Middleware para invalidar caché en operaciones POST/PUT/DELETE
 * Invalida automáticamente el caché de GET para el mismo recurso
 *
 * @example
 * router.post('/api/students', invalidateCacheMiddleware('/api/students'), async (req, res) => { ... });
 */
export function invalidateCacheMiddleware(pattern: any): (req: any, res: any, next: any) => void;
/**
 * Obtener estadísticas del caché
 * @returns {Object} Cache statistics
 */
export function getCacheStats(): any;
/**
 * Limpiar todo el caché
 */
export function clearCache(): void;
/**
 * Limpiar entradas expiradas manualmente
 */
export function cleanExpiredCache(): void;
export const cacheManager: CacheManager;
declare class CacheManager {
    cache: Map<any, any>;
    stats: {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
    };
    /**
     * Generar clave de caché basada en request
     * @param {Object} req - Express request object
     * @returns {string} Cache key
     */
    generateKey(req: any): string;
    /**
     * Obtener valor del caché
     * @param {string} key - Cache key
     * @returns {Object|null} Cached value or null
     */
    get(key: string): any | null;
    /**
     * Guardar valor en caché
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttl - Time to live in seconds
     */
    set(key: string, data: any, ttl?: number): void;
    /**
     * Eliminar entrada del caché
     * @param {string} key - Cache key
     */
    delete(key: string): boolean;
    /**
     * Limpiar entradas expiradas
     */
    cleanExpired(): void;
    /**
     * Limpiar todo el caché
     */
    clear(): void;
    /**
     * Obtener estadísticas del caché
     * @returns {Object} Cache stats
     */
    getStats(): any;
    /**
     * Resetear estadísticas
     */
    resetStats(): void;
}
export {};
//# sourceMappingURL=cache-middleware.d.ts.map
/**
 * Middleware de caché
 * @param {number} ttl - Tiempo de vida del caché en milisegundos (opcional)
 * @param {string} keyGenerator - Función para generar la clave de caché (opcional)
 */
export function cacheMiddleware(options?: {}): (req: any, res: any, next: any) => any;
/**
 * Función para invalidar caché manualmente
 * @param {string|RegExp} pattern - Patrón para invalidar claves específicas
 */
export function invalidateCache(pattern: string | RegExp): number;
/**
 * Función para obtener estadísticas del caché
 */
export function getCacheStats(): {
    total: number;
    valid: number;
    expired: number;
    sizeBytes: number;
    sizeMB: string;
};
/**
 * Limpiar caché expirado automáticamente
 */
export function cleanExpiredCache(): number;
export namespace TTL_CONFIG {
    export let stats: number;
    export let list: number;
    export let detail: number;
    let _default: number;
    export { _default as default };
}
//# sourceMappingURL=cache.d.ts.map
/**
 * Middleware de caché HTTP para respuestas JSON
 * @param {Object} options - Opciones de configuración
 * @param {number} options.maxAge - Tiempo de caché en segundos (default: 300)
 * @param {boolean} options.private - Si es caché privado (default: false)
 * @param {boolean} options.immutable - Si el recurso es inmutable (default: false)
 * @param {boolean} options.mustRevalidate - Si debe revalidar al expirar (default: true)
 * @param {boolean} options.etag - Si usar ETag (default: true)
 * @param {string[]} options.vary - Headers que afectan el caché (default: ['Accept-Encoding'])
 */
export function httpCacheMiddleware(options?: {
    maxAge: number;
    private: boolean;
    immutable: boolean;
    mustRevalidate: boolean;
    etag: boolean;
    vary: string[];
}): (req: any, res: any, next: any) => any;
/**
 * Middleware de caché para archivos estáticos
 * Más agresivo que el de API (TTL más largo)
 */
export function staticCacheMiddleware(options?: {}): (req: any, res: any, next: any) => any;
/**
 * Middleware de caché para API
 * TTL corto, must-revalidate
 */
export function apiCacheMiddleware(options?: {}): (req: any, res: any, next: any) => any;
/**
 * No-Cache Middleware
 * Para recursos que nunca deben cachearse
 */
export function noCacheMiddleware(): (req: any, res: any, next: any) => void;
export namespace CACHE_PRESETS {
    namespace REALTIME {
        let maxAge: number;
    }
    namespace API_PUBLIC {
        let maxAge_1: number;
        export { maxAge_1 as maxAge };
        let _private: boolean;
        export { _private as private };
    }
    namespace DYNAMIC {
        let maxAge_2: number;
        export { maxAge_2 as maxAge };
        export let mustRevalidate: boolean;
    }
    namespace CONTENT {
        let maxAge_3: number;
        export { maxAge_3 as maxAge };
        let mustRevalidate_1: boolean;
        export { mustRevalidate_1 as mustRevalidate };
    }
    namespace VERSIONED {
        let maxAge_4: number;
        export { maxAge_4 as maxAge };
        export let immutable: boolean;
    }
    namespace IMMUTABLE {
        let maxAge_5: number;
        export { maxAge_5 as maxAge };
        let immutable_1: boolean;
        export { immutable_1 as immutable };
    }
    let NO_CACHE: any;
}
/**
 * Generar ETag de una respuesta
 * @param {*} body - Cuerpo de la respuesta
 * @returns {string} ETag hash
 */
export function generateETag(body: any): string;
//# sourceMappingURL=http-cache.d.ts.map
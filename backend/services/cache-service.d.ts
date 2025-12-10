export namespace redis {
    function get(key: any): Promise<any>;
    function set(key: any, value: any, mode: any, time: any): Promise<boolean>;
    function setex(key: any, ttl: any, value: any): Promise<boolean>;
    function del(...keys: any[]): Promise<number>;
    function keys(pattern: any): Promise<any[]>;
    function dbsize(): Promise<number>;
    function ping(): Promise<string>;
    function flushdb(): Promise<boolean>;
    function info(section: any): Promise<string>;
    function on(event: any, handler: any): void;
}
export namespace TTL {
    let VERY_SHORT: number;
    let SHORT: number;
    let MEDIUM: number;
    let LONG: number;
    let VERY_LONG: number;
    let PERMANENT: number;
}
/**
 * Cache wrapper genérico para queries
 * @param {string} key - Cache key único
 * @param {number} ttl - Time to live en segundos
 * @param {Function} queryFn - Función async que ejecuta el query
 * @returns {Promise<any>} Resultado del query (desde caché o DB)
 */
export function cacheQuery(key: string, ttl: number, queryFn: Function): Promise<any>;
/**
 * Guardar en caché
 * @param {string} key - Cache key
 * @param {any} value - Valor a cachear
 * @param {number} ttl - Time to live (0 = sin expiración)
 */
export function setCache(key: string, value: any, ttl?: number): Promise<void>;
/**
 * Obtener de caché
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Valor cacheado o null
 */
export function getCache(key: string): Promise<any | null>;
/**
 * Eliminar de caché
 * @param {string} key - Cache key
 */
export function deleteCache(key: string): Promise<void>;
/**
 * Invalidar caché por patrón
 * @param {string} pattern - Patrón de keys (ej: "estudiantes:*")
 */
export function invalidateCache(pattern: string): Promise<void>;
/**
 * Limpiar TODA la caché (usar con cuidado)
 */
export function clearAllCache(): Promise<void>;
/**
 * Cache-Aside Pattern (Lazy Loading)
 * La aplicación verifica caché primero, si no existe, carga de DB y cachea
 */
export function cacheAside(key: any, ttl: any, loader: any): Promise<any>;
/**
 * Write-Through Pattern
 * Escritura en caché y DB simultáneamente
 */
export function writeThrough(key: any, value: any, ttl: any, dbWriter: any): Promise<any>;
/**
 * Write-Behind Pattern (Write-Back)
 * Escribir en caché primero, DB después (async)
 */
export function writeBehind(key: any, value: any, ttl: any, dbWriter: any): Promise<any>;
/**
 * Obtener estadísticas de caché
 */
export function getCacheStats(): Promise<{
    info: string[];
    keyspace: string[];
    totalKeys: number;
}>;
/**
 * Verificar si Redis está disponible
 */
export function isRedisAvailable(): Promise<boolean>;
//# sourceMappingURL=cache-service.d.ts.map
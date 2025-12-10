declare const cacheService: CacheService;
export namespace cacheKeys {
    function user(id: any): string;
    function userProfile(id: any): string;
    function userLevel(id: any): string;
    function wallet(userId: any): string;
    function transactions(userId: any): string;
    function tournament(id: any): string;
    function tournamentLeaderboard(id: any): string;
    function tournamentParticipants(id: any): string;
    function marketplaceItem(id: any): string;
    function marketplaceCategories(): string;
    function marketplaceFeatured(): string;
    function forumCategories(): string;
    function forumTopic(id: any): string;
    function forumTrending(): string;
    function analyticsDaily(date: any): string;
    function analyticsDashboard(): string;
    function tenantConfig(domain: any): string;
    function publicConfig(): string;
}
/**
 * Servicio de Caché en Memoria
 * BGE Héroes de la Patria
 * FASE 4 - Semana 25-26
 *
 * Sistema de caché para optimización de rendimiento
 */
declare class CacheService {
    cache: Map<any, any>;
    defaultTTL: number;
    maxSize: number;
    stats: {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
    };
    cleanupInterval: NodeJS.Timeout;
    /**
     * Obtener valor del caché
     */
    get(key: any): any;
    /**
     * Guardar valor en caché
     */
    set(key: any, value: any, ttlSeconds?: number): boolean;
    /**
     * Eliminar valor del caché
     */
    delete(key: any): boolean;
    /**
     * Verificar si existe una clave
     */
    has(key: any): boolean;
    /**
     * Obtener o establecer (cache-aside pattern)
     */
    getOrSet(key: any, fetchFn: any, ttlSeconds?: number): Promise<any>;
    /**
     * Invalidar por patrón
     */
    invalidatePattern(pattern: any): number;
    /**
     * Limpiar todo el caché
     */
    clear(): number;
    /**
     * Limpiar items expirados
     */
    cleanup(): number;
    /**
     * Evictar el menos usado recientemente (LRU)
     */
    evictLRU(): void;
    /**
     * Obtener estadísticas del caché
     */
    getStats(): {
        size: number;
        maxSize: number;
        hits: number;
        misses: number;
        hitRate: string;
        sets: number;
        deletes: number;
    };
    /**
     * Obtener claves por patrón
     */
    keys(pattern?: any): any[];
    /**
     * Cerrar el servicio
     */
    close(): void;
}
export { cacheService as cache };
//# sourceMappingURL=CacheService.d.ts.map
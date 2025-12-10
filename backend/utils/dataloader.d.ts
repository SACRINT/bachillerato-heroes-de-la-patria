export = DataLoader;
/**
 * 🚀 DATALOADER - N+1 QUERY OPTIMIZATION - SEMANA 3
 * Resuelve el problema N+1 queries mediante batching y caching
 *
 * Problema N+1:
 * - 1 query para obtener lista de estudiantes
 * - N queries para obtener calificaciones de cada estudiante
 * - Total: 1 + N queries (MUY LENTO para N > 100)
 *
 * Solución con DataLoader:
 * - 1 query para estudiantes
 * - 1 query BATCH para TODAS las calificaciones
 * - Total: 2 queries (RÁPIDO sin importar N)
 *
 * Inspirado en: https://github.com/graphql/dataloader
 */
/**
 * DataLoader genérico para batching y caching
 */
declare class DataLoader {
    constructor(batchLoadFn: any, options?: {});
    batchLoadFn: any;
    cache: boolean;
    cacheMap: Map<any, any>;
    queue: any[];
    batchScheduled: boolean;
    maxBatchSize: any;
    batchScheduleFn: any;
    /**
     * Cargar un item (con batching automático)
     * @param {*} key - ID del item a cargar
     * @returns {Promise} Promesa que resuelve al item
     */
    load(key: any): Promise<any>;
    /**
     * Cargar múltiples items (con batching)
     * @param {Array} keys - Array de IDs
     * @returns {Promise<Array>} Array de items
     */
    loadMany(keys: any[]): Promise<any[]>;
    /**
     * Despachar queue (ejecutar batch query)
     */
    dispatchQueue(): Promise<void>;
    /**
     * Limpiar caché
     */
    clear(key: any): this;
    /**
     * Pre-cargar valor en caché
     */
    prime(key: any, value: any): this;
}
//# sourceMappingURL=dataloader.d.ts.map
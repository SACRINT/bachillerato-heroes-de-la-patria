declare const _exports: QueryOptimizer;
export = _exports;
declare class QueryOptimizer {
    queryStats: Map<any, any>;
    slowQueryThreshold: number;
    queryHistoryLimit: number;
    /**
     * Ejecutar consulta con tracking de performance
     */
    query(text: any, params?: any[], options?: {}): Promise<any>;
    /**
     * Ejecutar consulta con caché
     */
    cachedQuery(cacheKey: any, text: any, params?: any[], ttlSeconds?: number): Promise<any>;
    /**
     * Ejecutar múltiples consultas en paralelo
     */
    parallel(queries: any): Promise<any[]>;
    /**
     * Ejecutar consultas en transacción
     */
    transaction(callback: any): Promise<any>;
    /**
     * Obtener plan de ejecución (EXPLAIN)
     */
    explain(text: any, params?: any[]): Promise<any>;
    /**
     * Analizar consulta y sugerir mejoras
     */
    analyze(text: any): Promise<{
        type: string;
        message: string;
    }[]>;
    /**
     * Obtener índices recomendados para una tabla
     */
    suggestIndexes(tableName: any): Promise<any>;
    /**
     * Obtener estadísticas de la tabla
     */
    getTableStats(tableName: any): Promise<any>;
    /**
     * Generar ID único para consulta
     */
    generateQueryId(text: any): string;
    /**
     * Registrar estadísticas de consulta
     */
    recordQueryStats(queryId: any, text: any, duration: any, rowCount: any): void;
    /**
     * Registrar error de consulta
     */
    recordQueryError(queryId: any, text: any, duration: any, error: any): void;
    /**
     * Obtener estadísticas de rendimiento
     */
    getPerformanceStats(): any;
    /**
     * Limpiar estadísticas
     */
    clearStats(): void;
    /**
     * Obtener estado del pool de conexiones
     */
    getPoolStatus(): {
        totalCount: any;
        idleCount: any;
        waitingCount: any;
    };
    /**
     * Verificar salud de la base de datos
     */
    healthCheck(): Promise<{
        status: string;
        responseTime: number;
        pool: {
            totalCount: any;
            idleCount: any;
            waitingCount: any;
        };
        error?: undefined;
    } | {
        status: string;
        error: any;
        pool: {
            totalCount: any;
            idleCount: any;
            waitingCount: any;
        };
        responseTime?: undefined;
    }>;
}
//# sourceMappingURL=QueryOptimizer.d.ts.map
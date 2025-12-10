export = queryLogger;
declare const queryLogger: QueryLogger;
declare class QueryLogger {
    constructor(config?: {});
    config: {
        slowQueryThreshold: any;
        enableExplain: boolean;
        logAllQueries: any;
        maxStoredQueries: any;
    };
    queries: any[];
    slowQueries: any[];
    queryPatterns: Map<any, any>;
    stats: {
        totalQueries: number;
        slowQueries: number;
        totalTime: number;
        avgTime: number;
        byTable: Map<any, any>;
        byType: Map<any, any>;
    };
    /**
     * LOGGED QUERY (wrapper para pool.query)
     */
    loggedQuery(pool: any, query: any, params?: any[]): Promise<any>;
    /**
     * LOG QUERY
     */
    logQuery(queryInfo: any): Promise<void>;
    /**
     * HANDLE SLOW QUERY
     */
    handleSlowQuery(queryInfo: any, queryType: any, table: any): Promise<void>;
    /**
     * SUGGEST OPTIMIZATIONS
     */
    suggestOptimizations(queryInfo: any): Promise<void>;
    /**
     * EXTRACT QUERY TYPE
     */
    extractQueryType(query: any): "DELETE" | "CREATE" | "UPDATE" | "SELECT" | "INSERT" | "ALTER" | "DROP" | "OTHER";
    /**
     * EXTRACT TABLE NAME
     */
    extractTableName(query: any): any;
    /**
     * GENERATE QUERY PATTERN (para agrupar queries similares)
     */
    generateQueryPattern(query: any): any;
    /**
     * GET TOP SLOW QUERIES
     */
    getTopSlowQueries(limit?: number): {
        id: any;
        type: any;
        table: any;
        duration: any;
        rows: any;
        query: any;
        suggestions: any;
        timestamp: any;
    }[];
    /**
     * GET STATISTICS
     */
    getStats(): {
        summary: {
            totalQueries: number;
            slowQueries: number;
            slowQueryRate: string;
            avgQueryTime: string;
        };
        topTables: {
            table: any;
            count: any;
            avgTime: string;
        }[];
        queryTypes: any;
        topSlowQueries: {
            id: any;
            type: any;
            table: any;
            duration: any;
            rows: any;
            query: any;
            suggestions: any;
            timestamp: any;
        }[];
        repeatedSlowPatterns: {
            pattern: any;
            occurrences: any;
            examples: any;
        }[];
    };
    /**
     * GET REPEATED SLOW PATTERNS
     */
    getRepeatedSlowPatterns(): {
        pattern: any;
        occurrences: any;
        examples: any;
    }[];
    /**
     * CLEANUP OLD QUERIES
     */
    cleanup(): void;
    /**
     * GENERATE QUERY ID
     */
    generateQueryId(): string;
    /**
     * RESET
     */
    reset(): void;
}
//# sourceMappingURL=queryLogger.d.ts.map
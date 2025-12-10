/**
 * 📊 PERFORMANCE MONITOR DAO - TypeScript
 * Data Access Object para monitoreo de rendimiento
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface SlowQuery {
    query: string;
    calls: number;
    avgTime: string;
    totalTime: string;
}
export interface TableStats {
    table_name: string;
    row_count: number;
    dead_rows: number;
    total_size: string;
}
export interface UnusedIndex {
    schemaname: string;
    table_name: string;
    index_name: string;
    scans: number;
}
export interface PoolStats {
    total: number;
    idle: number;
    waiting: number;
}
declare class PerformanceMonitorDAO {
    static getDatabaseSize(): Promise<string>;
    static getActiveConnections(): Promise<number>;
    static getSlowQueries(): Promise<SlowQuery[]>;
    static getTableStats(): Promise<TableStats[]>;
    static getUnusedIndexes(): Promise<UnusedIndex[]>;
    static getPoolStats(): PoolStats;
}
export default PerformanceMonitorDAO;
//# sourceMappingURL=performance-monitor.dao.d.ts.map
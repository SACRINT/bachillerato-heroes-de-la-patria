/**
 * 🏥 HEALTH DAO - TypeScript
 * Data Access Object para health checks de base de datos
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface DbInfo {
    current_time: Date;
    pg_version: string;
}
export interface PoolStats {
    total: number;
    idle: number;
    waiting: number;
}
export interface DbHealth {
    time: Date;
    version: string;
    latency: number;
}
declare class HealthDAO {
    static ping(): Promise<boolean>;
    static getDbInfo(): Promise<DbInfo>;
    static getPoolStats(): PoolStats;
    static getDbHealth(): Promise<DbHealth>;
}
export default HealthDAO;
//# sourceMappingURL=health.dao.d.ts.map
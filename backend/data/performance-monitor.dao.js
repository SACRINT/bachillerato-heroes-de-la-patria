"use strict";
/**
 * 📊 PERFORMANCE MONITOR DAO - TypeScript
 * Data Access Object para monitoreo de rendimiento
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// PERFORMANCE MONITOR DAO CLASS
// =====================================================
class PerformanceMonitorDAO {
    static async getDatabaseSize() {
        const result = await database_1.pool.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
        return result.rows[0]?.size || 'N/A';
    }
    static async getActiveConnections() {
        const result = await database_1.pool.query(`SELECT count(*) as active_connections FROM pg_stat_activity WHERE datname = current_database()`);
        return parseInt(result.rows[0]?.active_connections || 0);
    }
    static async getSlowQueries() {
        try {
            const result = await database_1.pool.query(`
                SELECT query, calls, mean_exec_time, total_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10
            `);
            return result.rows.map((q) => ({
                query: q.query.substring(0, 100) + '...',
                calls: parseInt(q.calls),
                avgTime: parseFloat(q.mean_exec_time).toFixed(2),
                totalTime: parseFloat(q.total_exec_time).toFixed(2)
            }));
        }
        catch {
            return [];
        }
    }
    static async getTableStats() {
        const result = await database_1.pool.query(`
            SELECT relname as table_name, n_live_tup as row_count, n_dead_tup as dead_rows, pg_size_pretty(pg_total_relation_size(relid)) as total_size
            FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10
        `);
        return result.rows.map((row) => ({
            table_name: row.table_name,
            row_count: parseInt(row.row_count),
            dead_rows: parseInt(row.dead_rows),
            total_size: row.total_size
        }));
    }
    static async getUnusedIndexes() {
        const result = await database_1.pool.query(`
            SELECT schemaname, relname as table_name, indexrelname as index_name, idx_scan as scans
            FROM pg_stat_user_indexes WHERE idx_scan = 0 LIMIT 10
        `);
        return result.rows.map((row) => ({
            schemaname: row.schemaname,
            table_name: row.table_name,
            index_name: row.index_name,
            scans: parseInt(row.scans)
        }));
    }
    static getPoolStats() {
        return {
            total: database_1.pool.totalCount || 0,
            idle: database_1.pool.idleCount || 0,
            waiting: database_1.pool.waitingCount || 0
        };
    }
}
exports.default = PerformanceMonitorDAO;
module.exports = PerformanceMonitorDAO;
//# sourceMappingURL=performance-monitor.dao.js.map
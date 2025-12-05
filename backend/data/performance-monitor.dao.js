/**
 * 📊 PERFORMANCE MONITOR DAO
 * Data Access Object para monitoreo de rendimiento
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class PerformanceMonitorDAO {

    static async getDatabaseSize() {
        const result = await pool.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
        return result.rows[0]?.size || 'N/A';
    }

    static async getActiveConnections() {
        const result = await pool.query(`SELECT count(*) as active_connections FROM pg_stat_activity WHERE datname = current_database()`);
        return parseInt(result.rows[0]?.active_connections || 0);
    }

    static async getSlowQueries() {
        try {
            const result = await pool.query(`
                SELECT query, calls, mean_exec_time, total_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10
            `);
            return result.rows.map(q => ({ query: q.query.substring(0, 100) + '...', calls: q.calls, avgTime: parseFloat(q.mean_exec_time).toFixed(2), totalTime: parseFloat(q.total_exec_time).toFixed(2) }));
        } catch { return []; }
    }

    static async getTableStats() {
        const result = await pool.query(`
            SELECT relname as table_name, n_live_tup as row_count, n_dead_tup as dead_rows, pg_size_pretty(pg_total_relation_size(relid)) as total_size
            FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10
        `);
        return result.rows;
    }

    static async getUnusedIndexes() {
        const result = await pool.query(`
            SELECT schemaname, relname as table_name, indexrelname as index_name, idx_scan as scans
            FROM pg_stat_user_indexes WHERE idx_scan = 0 LIMIT 10
        `);
        return result.rows;
    }

    static getPoolStats() {
        return { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount };
    }
}

module.exports = PerformanceMonitorDAO;

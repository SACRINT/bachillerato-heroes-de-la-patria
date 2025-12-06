/**
 * 🏥 HEALTH DAO
 * Data Access Object para health checks de base de datos
 * ✅ FASE 3 DAL
 * 
 * @date 05 Diciembre 2025
 */

const { pool } = require('../config/database');

class HealthDAO {

    /**
     * Ping simple a la base de datos
     * @returns {Promise<boolean>}
     */
    static async ping() {
        await pool.query('SELECT 1');
        return true;
    }

    /**
     * Obtener tiempo actual y versión de PostgreSQL
     * @returns {Promise<Object>} { current_time, pg_version }
     */
    static async getDbInfo() {
        const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
        return result.rows[0];
    }

    /**
     * Obtener estadísticas del pool de conexiones
     * @returns {Object}
     */
    static getPoolStats() {
        return {
            total: pool.totalCount || 0,
            idle: pool.idleCount || 0,
            waiting: pool.waitingCount || 0
        };
    }

    /**
     * Health check completo con latencia
     * @returns {Promise<Object>}
     */
    static async getDbHealth() {
        const start = Date.now();
        const result = await pool.query('SELECT NOW() as time, version() as version');
        const latency = Date.now() - start;

        return {
            time: result.rows[0].time,
            version: result.rows[0].version,
            latency
        };
    }
}

module.exports = HealthDAO;

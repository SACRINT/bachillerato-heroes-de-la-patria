"use strict";
/**
 * 🏥 HEALTH DAO - TypeScript
 * Data Access Object para health checks de base de datos
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// HEALTH DAO CLASS
// =====================================================
class HealthDAO {
    static async ping() {
        await database_1.pool.query('SELECT 1');
        return true;
    }
    static async getDbInfo() {
        const result = await database_1.pool.query('SELECT NOW() as current_time, version() as pg_version');
        return result.rows[0];
    }
    static getPoolStats() {
        return {
            total: database_1.pool.totalCount || 0,
            idle: database_1.pool.idleCount || 0,
            waiting: database_1.pool.waitingCount || 0
        };
    }
    static async getDbHealth() {
        const start = Date.now();
        const result = await database_1.pool.query('SELECT NOW() as time, version() as version');
        const latency = Date.now() - start;
        return {
            time: result.rows[0].time,
            version: result.rows[0].version,
            latency
        };
    }
}
exports.default = HealthDAO;
module.exports = HealthDAO;
//# sourceMappingURL=health.dao.js.map
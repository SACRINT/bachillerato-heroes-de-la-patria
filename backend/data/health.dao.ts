/**
 * 🏥 HEALTH DAO - TypeScript
 * Data Access Object para health checks de base de datos
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

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

// =====================================================
// HEALTH DAO CLASS
// =====================================================

class HealthDAO {

    static async ping(): Promise<boolean> {
        await pool.query('SELECT 1');
        return true;
    }

    static async getDbInfo(): Promise<DbInfo> {
        const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
        return result.rows[0];
    }

    static getPoolStats(): PoolStats {
        return {
            total: (pool as any).totalCount || 0,
            idle: (pool as any).idleCount || 0,
            waiting: (pool as any).waitingCount || 0
        };
    }

    static async getDbHealth(): Promise<DbHealth> {
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

export default HealthDAO;
module.exports = HealthDAO;

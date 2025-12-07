/**
 * 🔄 SYNC DAO - TypeScript
 * Data Access Object para sincronización cross-platform
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface SyncLogEntry {
    id: number;
    user_id: number;
    entity: string;
    entity_id: string;
    action: string;
    data: Record<string, any>;
    updated_at: Date;
}

// =====================================================
// SYNC DAO CLASS
// =====================================================

class SyncDAO {

    static async getChangesSince(userId: number, timestamp: number | string): Promise<SyncLogEntry[]> {
        const result = await pool.query(`
            SELECT * FROM sync_log WHERE user_id = $1 AND updated_at > $2 ORDER BY updated_at ASC
        `, [userId, new Date(timestamp)]);
        return result.rows;
    }

    static async applyChange(
        userId: number,
        entity: string,
        entityId: string,
        action: string,
        data: Record<string, any>,
        timestamp: number | string
    ): Promise<void> {
        await pool.query(`
            INSERT INTO sync_log (user_id, entity, entity_id, action, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, entity, entity_id) DO UPDATE
            SET action = EXCLUDED.action, data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
        `, [userId, entity, entityId, action, JSON.stringify(data), new Date(timestamp)]);
    }
}

export default SyncDAO;
module.exports = SyncDAO;

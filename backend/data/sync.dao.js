/**
 * 🔄 SYNC DAO
 * Data Access Object para sincronización cross-platform
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class SyncDAO {

    static async getChangesSince(userId, timestamp) {
        const result = await pool.query(`
            SELECT * FROM sync_log WHERE user_id = $1 AND updated_at > $2 ORDER BY updated_at ASC
        `, [userId, new Date(timestamp)]);
        return result.rows;
    }

    static async applyChange(userId, entity, entityId, action, data, timestamp) {
        await pool.query(`
            INSERT INTO sync_log (user_id, entity, entity_id, action, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, entity, entity_id) DO UPDATE
            SET action = EXCLUDED.action, data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
        `, [userId, entity, entityId, action, JSON.stringify(data), new Date(timestamp)]);
    }
}

module.exports = SyncDAO;

"use strict";
/**
 * 🔄 SYNC DAO - TypeScript
 * Data Access Object para sincronización cross-platform
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// SYNC DAO CLASS
// =====================================================
class SyncDAO {
    static async getChangesSince(userId, timestamp) {
        const result = await database_1.pool.query(`
            SELECT * FROM sync_log WHERE user_id = $1 AND updated_at > $2 ORDER BY updated_at ASC
        `, [userId, new Date(timestamp)]);
        return result.rows;
    }
    static async applyChange(userId, entity, entityId, action, data, timestamp) {
        await database_1.pool.query(`
            INSERT INTO sync_log (user_id, entity, entity_id, action, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, entity, entity_id) DO UPDATE
            SET action = EXCLUDED.action, data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
        `, [userId, entity, entityId, action, JSON.stringify(data), new Date(timestamp)]);
    }
}
exports.default = SyncDAO;
module.exports = SyncDAO;
//# sourceMappingURL=sync.dao.js.map
"use strict";
/**
 * 📝 AUDIT DAO - TypeScript
 * Data Access Object para auditoría
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// AUDIT DAO CLASS
// =====================================================
class AuditDAO {
    static async log(userId, action, entity, entityId, oldData, newData, ipAddress, userAgent, metadata) {
        try {
            const result = await database_1.pool.query(`
                INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data, new_data, ip_address, user_agent, metadata, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id
            `, [
                userId,
                action,
                entity,
                entityId,
                oldData ? JSON.stringify(oldData) : null,
                newData ? JSON.stringify(newData) : null,
                ipAddress,
                userAgent,
                metadata ? JSON.stringify(metadata) : null
            ]);
            return result.rows[0].id;
        }
        catch {
            return null;
        }
    }
    static async getByUser(userId, action, startDate, endDate, limit, offset) {
        let query = 'SELECT * FROM audit_logs WHERE user_id = $1';
        const params = [userId];
        let idx = 2;
        if (action) {
            query += ` AND action = $${idx++}`;
            params.push(action);
        }
        if (startDate) {
            query += ` AND created_at >= $${idx++}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND created_at <= $${idx++}`;
            params.push(endDate);
        }
        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
        params.push(limit, offset);
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async getByEntity(entity, entityId, limit, offset) {
        const result = await database_1.pool.query('SELECT * FROM audit_logs WHERE entity = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4', [entity, entityId, limit, offset]);
        return result.rows;
    }
    static async getStats(startDate, endDate) {
        let query = 'SELECT action, entity, COUNT(*) as count FROM audit_logs';
        const params = [];
        if (startDate && endDate) {
            query += ' WHERE created_at BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        }
        query += ' GROUP BY action, entity ORDER BY count DESC';
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async cleanup(daysToKeep) {
        const days = parseInt(daysToKeep) || 90;
        const result = await database_1.pool.query(`DELETE FROM audit_logs WHERE created_at < NOW() - make_interval(days => $1)`, [days]);
        return result.rowCount || 0;
    }
    static async cleanupTable(tableName) {
        if (tableName === 'logs_sistema') {
            const result = await database_1.pool.query("DELETE FROM logs_sistema WHERE created_at < NOW() - INTERVAL '24 hours'");
            return result.rowCount || 0;
        } else if (tableName === 'temp_logs') {
            const result = await database_1.pool.query("DELETE FROM temp_logs WHERE created_at < NOW() - INTERVAL '24 hours'");
            return result.rowCount || 0;
        } else {
            const result = await database_1.pool.query("DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '24 hours'");
            return result.rowCount || 0;
        }
    }
    static async cleanupSystemLogs(retentionDays) {
        const days = parseInt(retentionDays) || 30;
        const result = await database_1.pool.query(`DELETE FROM logs_sistema WHERE created_at < NOW() - make_interval(days => $1)`, [days]);
        return result.rowCount || 0;
    }
}
exports.default = AuditDAO;
module.exports = AuditDAO;
//# sourceMappingURL=audit.dao.js.map
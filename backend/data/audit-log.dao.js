"use strict";
/**
 * 📋 AUDIT LOG DAO - TypeScript
 * Data Access Object para auditoría de compliance
 * Abstrae todas las queries SQL de AuditLogService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// AUDIT LOG DAO CLASS
// =====================================================
class AuditLogDAO {
    // ==========================================
    // PERSISTENCIA DE EVENTOS
    // ==========================================
    static async persistEvent(event) {
        await database_1.pool.query(`
            INSERT INTO audit_log (id, timestamp, action, category, severity, user_id, tenant_id,
                resource_type, resource_id, details, ip_hash, user_agent, session_id, checksum)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
            event.id,
            event.timestamp,
            event.action,
            event.category,
            event.severity,
            event.userId,
            event.tenantId,
            event.resourceType,
            event.resourceId,
            JSON.stringify(event.details),
            event.ip,
            event.userAgent,
            event.sessionId,
            event.checksum
        ]);
    }
    static async persistBatch(batch) {
        if (batch.length === 0)
            return;
        const values = batch.map(e => [
            e.id,
            e.timestamp,
            e.action,
            e.category,
            e.severity,
            e.userId,
            e.tenantId,
            e.resourceType,
            e.resourceId,
            JSON.stringify(e.details),
            e.ip,
            e.userAgent,
            e.sessionId,
            e.checksum
        ]);
        const placeholders = values.map((_, i) => {
            const base = i * 14;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14})`;
        });
        await database_1.pool.query(`
            INSERT INTO audit_log (id, timestamp, action, category, severity, user_id, tenant_id,
            resource_type, resource_id, details, ip_hash, user_agent, session_id, checksum) 
            VALUES ${placeholders.join(', ')}
        `, values.flat());
    }
    // ==========================================
    // BÚSQUEDA Y CONSULTAS
    // ==========================================
    static async search(whereClause, params, limit, offset) {
        const countQuery = `SELECT COUNT(*) FROM audit_log WHERE ${whereClause}`;
        const countResult = await database_1.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);
        // Warning: Direct string injection for WHERE clause. Ensure this is constructed safely upstream.
        // TypeScript migration preserves existing logic.
        // Params management for pagination
        // The whereClause uses existing params. We need to append limit and offset params.
        const queryParams = [...params, limit, offset];
        const query = `
            SELECT * FROM audit_log 
            WHERE ${whereClause} 
            ORDER BY timestamp DESC 
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        const result = await database_1.pool.query(query, queryParams);
        return { data: result.rows, total };
    }
    static async getUserActivity(userId, days) {
        const numDays = parseInt(days) || 30;
        const result = await database_1.pool.query(`
            SELECT action, category, timestamp, resource_type, resource_id, details
            FROM audit_log WHERE user_id = $1 AND timestamp >= NOW() - make_interval(days => $2)
            ORDER BY timestamp DESC LIMIT 1000
        `, [userId, numDays]);
        return result.rows;
    }
    static async getStats(days) {
        const numDays = parseInt(days) || 30;
        const result = await database_1.pool.query(`
            SELECT category, severity, COUNT(*) as count FROM audit_log
            WHERE timestamp >= NOW() - make_interval(days => $1) GROUP BY category, severity ORDER BY count DESC
        `, [numDays]);
        return result.rows.map(row => ({
            category: row.category,
            severity: row.severity,
            count: parseInt(row.count)
        }));
    }
    static async getTrend(days) {
        const numDays = parseInt(days) || 30;
        const result = await database_1.pool.query(`
            SELECT DATE_TRUNC('day', timestamp) as day, COUNT(*) as count FROM audit_log
            WHERE timestamp >= NOW() - make_interval(days => $1) GROUP BY DATE_TRUNC('day', timestamp) ORDER BY day
        `, [numDays]);
        return result.rows.map(row => ({
            day: row.day,
            count: parseInt(row.count)
        }));
    }
    static async exportLogs(startDate, endDate) {
        let query = 'SELECT * FROM audit_log WHERE 1=1';
        const params = [];
        if (startDate) {
            params.push(startDate);
            query += ` AND timestamp >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND timestamp <= $${params.length}`;
        }
        query += ' ORDER BY timestamp';
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async getLogsForIntegrity(startDate, endDate) {
        const result = await database_1.pool.query(`
            SELECT * FROM audit_log 
            WHERE timestamp >= $1 AND timestamp <= $2 
            ORDER BY timestamp
        `, [startDate, endDate]);
        return result.rows;
    }
    static async cleanup(retentionDays) {
        const days = parseInt(retentionDays) || 90;
        const result = await database_1.pool.query(`
            DELETE FROM audit_log 
            WHERE timestamp < NOW() - make_interval(days => $1) 
            RETURNING id
        `, [days]);
        return result.rows.length;
    }
}
exports.default = AuditLogDAO;
module.exports = AuditLogDAO;
//# sourceMappingURL=audit-log.dao.js.map
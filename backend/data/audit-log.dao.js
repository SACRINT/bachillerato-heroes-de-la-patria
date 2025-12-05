/**
 * 📋 AUDIT LOG DAO
 * Data Access Object para auditoría de compliance
 * Abstrae todas las queries SQL de AuditLogService
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class AuditLogDAO {

    // ==========================================
    // PERSISTENCIA DE EVENTOS
    // ==========================================

    static async persistEvent(event) {
        await pool.query(`
            INSERT INTO audit_log (id, timestamp, action, category, severity, user_id, tenant_id,
                resource_type, resource_id, details, ip_hash, user_agent, session_id, checksum)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [event.id, event.timestamp, event.action, event.category, event.severity, event.userId, event.tenantId,
        event.resourceType, event.resourceId, JSON.stringify(event.details), event.ip, event.userAgent, event.sessionId, event.checksum]);
    }

    static async persistBatch(batch) {
        const values = batch.map(e => [e.id, e.timestamp, e.action, e.category, e.severity, e.userId, e.tenantId,
        e.resourceType, e.resourceId, JSON.stringify(e.details), e.ip, e.userAgent, e.sessionId, e.checksum]);

        const placeholders = values.map((_, i) => {
            const base = i * 14;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14})`;
        });

        await pool.query(`INSERT INTO audit_log (id, timestamp, action, category, severity, user_id, tenant_id,
            resource_type, resource_id, details, ip_hash, user_agent, session_id, checksum) VALUES ${placeholders.join(', ')}`, values.flat());
    }

    // ==========================================
    // BÚSQUEDA Y CONSULTAS
    // ==========================================

    static async search(whereClause, params, limit, offset) {
        const countQuery = `SELECT COUNT(*) FROM audit_log WHERE ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const query = `SELECT * FROM audit_log WHERE ${whereClause} ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await pool.query(query, params);

        return { data: result.rows, total };
    }

    static async getUserActivity(userId, days) {
        const result = await pool.query(`
            SELECT action, category, timestamp, resource_type, resource_id, details
            FROM audit_log WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
            ORDER BY timestamp DESC LIMIT 1000
        `, [userId]);
        return result.rows;
    }

    static async getStats(days) {
        const result = await pool.query(`
            SELECT category, severity, COUNT(*) as count FROM audit_log
            WHERE timestamp >= NOW() - INTERVAL '${days} days' GROUP BY category, severity ORDER BY count DESC
        `);
        return result.rows;
    }

    static async getTrend(days) {
        const result = await pool.query(`
            SELECT DATE_TRUNC('day', timestamp) as day, COUNT(*) as count FROM audit_log
            WHERE timestamp >= NOW() - INTERVAL '${days} days' GROUP BY DATE_TRUNC('day', timestamp) ORDER BY day
        `);
        return result.rows;
    }

    static async exportLogs(startDate, endDate) {
        let query = 'SELECT * FROM audit_log WHERE 1=1';
        const params = [];
        if (startDate) { params.push(startDate); query += ` AND timestamp >= $${params.length}`; }
        if (endDate) { params.push(endDate); query += ` AND timestamp <= $${params.length}`; }
        query += ' ORDER BY timestamp';
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getLogsForIntegrity(startDate, endDate) {
        const result = await pool.query(`SELECT * FROM audit_log WHERE timestamp >= $1 AND timestamp <= $2 ORDER BY timestamp`, [startDate, endDate]);
        return result.rows;
    }

    static async cleanup(retentionDays) {
        const result = await pool.query(`DELETE FROM audit_log WHERE timestamp < NOW() - INTERVAL '${retentionDays} days' RETURNING id`);
        return result.rows.length;
    }
}

module.exports = AuditLogDAO;

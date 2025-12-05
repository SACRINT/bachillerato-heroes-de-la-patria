/**
 * 🔒 SECURITY AUDIT DAO
 * Data Access Object para auditoría de seguridad
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const pool = require('./database-access').pool;

class SecurityAuditDAO {

    static async insertEventsBatch(events) {
        const values = events.map(e => [e.id, e.timestamp, e.eventType, e.severity, e.userId, e.ip, e.userAgent, e.resource, e.action, JSON.stringify(e.details), e.success, JSON.stringify(e.metadata)]);
        const placeholders = values.map((_, i) => {
            const offset = i * 12;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`;
        }).join(', ');
        await pool.query(`INSERT INTO security_audit_logs (event_id, timestamp, event_type, severity, user_id, ip_address, user_agent, resource, action, details, success, metadata) VALUES ${placeholders}`, values.flat());
        return events.length;
    }

    static async query(baseQuery, params) {
        const result = await pool.query(baseQuery, params);
        return result.rows;
    }

    static async count(countQuery, params) {
        const result = await pool.query(countQuery, params);
        return parseInt(result.rows[0].count);
    }

    static async getSummary(startDate, endDate) {
        const result = await pool.query(`
            SELECT event_type, COUNT(*) as count, COUNT(*) FILTER (WHERE success = false) as failures,
            COUNT(DISTINCT user_id) as unique_users, COUNT(DISTINCT ip_address) as unique_ips
            FROM security_audit_logs WHERE timestamp >= $1 AND timestamp <= $2 GROUP BY event_type ORDER BY count DESC
        `, [startDate, endDate]);
        return result.rows;
    }

    static async getSuspiciousActivity(since) {
        const result = await pool.query(`
            SELECT ip_address, COUNT(*) as total_events, COUNT(*) FILTER (WHERE success = false) as failures,
            COUNT(*) FILTER (WHERE event_type = 'login_failure') as login_failures,
            COUNT(*) FILTER (WHERE severity >= 3) as high_severity, array_agg(DISTINCT event_type) as event_types
            FROM security_audit_logs WHERE timestamp >= $1 GROUP BY ip_address
            HAVING COUNT(*) FILTER (WHERE success = false) > 5 OR COUNT(*) FILTER (WHERE event_type = 'login_failure') > 3
            ORDER BY failures DESC
        `, [since]);
        return result.rows;
    }

    static async getUserTimeline(userId, limit) {
        const result = await pool.query('SELECT * FROM security_audit_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2', [userId, limit]);
        return result.rows;
    }

    static async cleanup(cutoffDate) {
        const result = await pool.query('DELETE FROM security_audit_logs WHERE timestamp < $1 RETURNING event_id', [cutoffDate]);
        return result.rowCount;
    }
}

module.exports = SecurityAuditDAO;

"use strict";
/**
 * 🔒 SECURITY DAO - TypeScript
 * Data Access Object para gestión de seguridad
 * Alertas, IPs bloqueadas y sesiones
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// SECURITY DAO CLASS
// =====================================================
class SecurityDAO {
    static async getAlerts(filters) {
        const { status, severity, limit = 20, page = 1 } = filters;
        let query = 'SELECT * FROM security_alerts WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }
        if (severity) {
            query += ` AND severity >= $${paramIndex++}`;
            params.push(parseInt(String(severity)));
        }
        query += ' ORDER BY created_at DESC';
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, (page - 1) * limit);
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async acknowledgeAlert(id, userId) {
        const result = await database_1.pool.query(`
            UPDATE security_alerts
            SET status = 'acknowledged',
                acknowledged_by = $1,
                acknowledged_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [userId, id]);
        return result.rows[0] || null;
    }
    static async resolveAlert(id, userId, notes) {
        const result = await database_1.pool.query(`
            UPDATE security_alerts
            SET status = 'resolved',
                resolved_by = $1,
                resolved_at = NOW(),
                resolution_notes = $2
            WHERE id = $3
            RETURNING *
        `, [userId, notes || null, id]);
        return result.rows[0] || null;
    }
    static async getBlockedIPs() {
        const result = await database_1.pool.query(`
            SELECT bi.*, u.email as blocked_by_email
            FROM blocked_ips bi
            LEFT JOIN usuarios u ON bi.blocked_by = u.id
            ORDER BY bi.created_at DESC
        `);
        return result.rows;
    }
    static async blockIP(ip, reason, blockedBy, isPermanent, blockedUntil) {
        const result = await database_1.pool.query(`
            INSERT INTO blocked_ips (ip_address, reason, blocked_by, is_permanent, blocked_until)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ip_address)
            DO UPDATE SET reason = $2, blocked_by = $3, is_permanent = $4, blocked_until = $5
            RETURNING *
        `, [ip, reason || 'Manual block', blockedBy, isPermanent, blockedUntil]);
        return result.rows[0];
    }
    static async unblockIP(ip) {
        const result = await database_1.pool.query(`
            DELETE FROM blocked_ips
            WHERE ip_address = $1
            RETURNING *
        `, [ip]);
        return result.rows[0] || null;
    }
    static async getSessions(filters) {
        const { userId, active } = filters;
        let query = `
            SELECT s.*, u.email, u.nombre
            FROM active_sessions s
            JOIN usuarios u ON s.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        if (userId) {
            query += ` AND s.user_id = $${paramIndex++}`;
            params.push(parseInt(String(userId)));
        }
        if (active !== undefined) {
            query += ` AND s.is_active = $${paramIndex++}`;
            params.push(active === 'true' || active === true);
        }
        query += ' ORDER BY s.last_activity DESC';
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async terminateSession(sessionId) {
        const result = await database_1.pool.query(`
            UPDATE active_sessions
            SET is_active = false
            WHERE session_id = $1
            RETURNING *
        `, [sessionId]);
        return result.rows[0] || null;
    }
    static async cleanupExpiredSessions() {
        const result = await database_1.pool.query('SELECT cleanup_expired_sessions() as deleted');
        return result.rows[0]?.deleted || 0;
    }
}
exports.default = SecurityDAO;
module.exports = SecurityDAO;
//# sourceMappingURL=security.dao.js.map
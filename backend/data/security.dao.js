/**
 * 🔒 SECURITY DAO
 * Data Access Object para gestión de seguridad
 * Alertas, IPs bloqueadas y sesiones
 * 
 * Refactorizado: 05 Diciembre 2025
 */

const { pool } = require('../config/database');

class SecurityDAO {

    // ============================================
    // ALERTAS DE SEGURIDAD
    // ============================================

    /**
     * Obtener alertas con filtros
     * @param {Object} filters - status, severity
     * @param {number} limit 
     * @param {number} page 
     * @returns {Promise<Array>}
     */
    static async getAlerts({ status, severity, limit = 20, page = 1 }) {
        let query = 'SELECT * FROM security_alerts WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        if (severity) {
            query += ` AND severity >= $${paramIndex++}`;
            params.push(parseInt(severity));
        }

        query += ' ORDER BY created_at DESC';
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Reconocer alerta
     * @param {number} id - ID de alerta
     * @param {number} userId - ID del admin que reconoce
     * @returns {Promise<Object|null>}
     */
    static async acknowledgeAlert(id, userId) {
        const result = await pool.query(`
            UPDATE security_alerts
            SET status = 'acknowledged',
                acknowledged_by = $1,
                acknowledged_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [userId, id]);
        return result.rows[0] || null;
    }

    /**
     * Resolver alerta
     * @param {number} id - ID de alerta
     * @param {number} userId - ID del admin que resuelve
     * @param {string} notes - Notas de resolución
     * @returns {Promise<Object|null>}
     */
    static async resolveAlert(id, userId, notes) {
        const result = await pool.query(`
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

    // ============================================
    // IPs BLOQUEADAS
    // ============================================

    /**
     * Obtener lista de IPs bloqueadas
     * @returns {Promise<Array>}
     */
    static async getBlockedIPs() {
        const result = await pool.query(`
            SELECT bi.*, u.email as blocked_by_email
            FROM blocked_ips bi
            LEFT JOIN usuarios u ON bi.blocked_by = u.id
            ORDER BY bi.created_at DESC
        `);
        return result.rows;
    }

    /**
     * Bloquear IP
     * @param {string} ip - Dirección IP
     * @param {string} reason - Razón del bloqueo
     * @param {number} blockedBy - ID del admin
     * @param {boolean} isPermanent - Si es permanente
     * @param {string|null} blockedUntil - Fecha hasta cuando está bloqueada
     * @returns {Promise<Object>}
     */
    static async blockIP(ip, reason, blockedBy, isPermanent, blockedUntil) {
        const result = await pool.query(`
            INSERT INTO blocked_ips (ip_address, reason, blocked_by, is_permanent, blocked_until)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ip_address)
            DO UPDATE SET reason = $2, blocked_by = $3, is_permanent = $4, blocked_until = $5
            RETURNING *
        `, [ip, reason || 'Manual block', blockedBy, isPermanent, blockedUntil]);
        return result.rows[0];
    }

    /**
     * Desbloquear IP
     * @param {string} ip - Dirección IP
     * @returns {Promise<Object|null>}
     */
    static async unblockIP(ip) {
        const result = await pool.query(`
            DELETE FROM blocked_ips
            WHERE ip_address = $1
            RETURNING *
        `, [ip]);
        return result.rows[0] || null;
    }

    // ============================================
    // SESIONES ACTIVAS
    // ============================================

    /**
     * Obtener sesiones con filtros
     * @param {Object} filters - userId, active
     * @returns {Promise<Array>}
     */
    static async getSessions({ userId, active }) {
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
            params.push(parseInt(userId));
        }

        if (active !== undefined) {
            query += ` AND s.is_active = $${paramIndex++}`;
            params.push(active === 'true' || active === true);
        }

        query += ' ORDER BY s.last_activity DESC';

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Terminar sesión específica
     * @param {string} sessionId - ID de sesión
     * @returns {Promise<Object|null>}
     */
    static async terminateSession(sessionId) {
        const result = await pool.query(`
            UPDATE active_sessions
            SET is_active = false
            WHERE session_id = $1
            RETURNING *
        `, [sessionId]);
        return result.rows[0] || null;
    }

    /**
     * Limpiar sesiones expiradas
     * @returns {Promise<number>} - Número de sesiones eliminadas
     */
    static async cleanupExpiredSessions() {
        const result = await pool.query('SELECT cleanup_expired_sessions() as deleted');
        return result.rows[0]?.deleted || 0;
    }
}

module.exports = SecurityDAO;

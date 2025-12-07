/**
 * 🔒 SECURITY DAO - TypeScript
 * Data Access Object para gestión de seguridad
 * Alertas, IPs bloqueadas y sesiones
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface SecurityAlert {
    id: number;
    status: 'new' | 'acknowledged' | 'resolved';
    severity: number;
    message: string;
    acknowledged_by?: number;
    acknowledged_at?: Date;
    resolved_by?: number;
    resolved_at?: Date;
    resolution_notes?: string;
    created_at: Date;
}

export interface BlockedIP {
    id: number;
    ip_address: string;
    reason: string;
    blocked_by: number;
    blocked_by_email?: string;
    is_permanent: boolean;
    blocked_until?: Date;
    created_at: Date;
}

export interface ActiveSession {
    id: number;
    session_id: string;
    user_id: number;
    email?: string;
    nombre?: string;
    ip_address?: string;
    user_agent?: string;
    is_active: boolean;
    last_activity: Date;
    created_at: Date;
}

export interface AlertFilters {
    status?: string;
    severity?: string | number;
    limit?: number;
    page?: number;
}

export interface SessionFilters {
    userId?: string | number;
    active?: boolean | string;
}

// =====================================================
// SECURITY DAO CLASS
// =====================================================

class SecurityDAO {

    static async getAlerts(filters: AlertFilters): Promise<SecurityAlert[]> {
        const { status, severity, limit = 20, page = 1 } = filters;

        let query = 'SELECT * FROM security_alerts WHERE 1=1';
        const params: (string | number)[] = [];
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

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async acknowledgeAlert(id: number, userId: number): Promise<SecurityAlert | null> {
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

    static async resolveAlert(id: number, userId: number, notes: string | null): Promise<SecurityAlert | null> {
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

    static async getBlockedIPs(): Promise<BlockedIP[]> {
        const result = await pool.query(`
            SELECT bi.*, u.email as blocked_by_email
            FROM blocked_ips bi
            LEFT JOIN usuarios u ON bi.blocked_by = u.id
            ORDER BY bi.created_at DESC
        `);
        return result.rows;
    }

    static async blockIP(
        ip: string,
        reason: string | null,
        blockedBy: number,
        isPermanent: boolean,
        blockedUntil: Date | string | null
    ): Promise<BlockedIP> {
        const result = await pool.query(`
            INSERT INTO blocked_ips (ip_address, reason, blocked_by, is_permanent, blocked_until)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ip_address)
            DO UPDATE SET reason = $2, blocked_by = $3, is_permanent = $4, blocked_until = $5
            RETURNING *
        `, [ip, reason || 'Manual block', blockedBy, isPermanent, blockedUntil]);
        return result.rows[0];
    }

    static async unblockIP(ip: string): Promise<BlockedIP | null> {
        const result = await pool.query(`
            DELETE FROM blocked_ips
            WHERE ip_address = $1
            RETURNING *
        `, [ip]);
        return result.rows[0] || null;
    }

    static async getSessions(filters: SessionFilters): Promise<ActiveSession[]> {
        const { userId, active } = filters;

        let query = `
            SELECT s.*, u.email, u.nombre
            FROM active_sessions s
            JOIN usuarios u ON s.user_id = u.id
            WHERE 1=1
        `;
        const params: (number | boolean)[] = [];
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

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async terminateSession(sessionId: string): Promise<ActiveSession | null> {
        const result = await pool.query(`
            UPDATE active_sessions
            SET is_active = false
            WHERE session_id = $1
            RETURNING *
        `, [sessionId]);
        return result.rows[0] || null;
    }

    static async cleanupExpiredSessions(): Promise<number> {
        const result = await pool.query('SELECT cleanup_expired_sessions() as deleted');
        return result.rows[0]?.deleted || 0;
    }
}

export default SecurityDAO;
module.exports = SecurityDAO;

/**
 * 📝 AUDIT DAO - TypeScript
 * Data Access Object para auditoría
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface AuditLogRow {
    id: number;
    user_id: number;
    action: string;
    entity: string;
    entity_id: string;
    old_data?: Record<string, any>;
    new_data?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
    created_at: Date;
}

export interface AuditStats {
    action: string;
    entity: string;
    count: number;
}

// =====================================================
// AUDIT DAO CLASS
// =====================================================

class AuditDAO {

    static async log(
        userId: number | null,
        action: string,
        entity: string,
        entityId: string | number,
        oldData: Record<string, any> | null,
        newData: Record<string, any> | null,
        ipAddress: string | null,
        userAgent: string | null,
        metadata: Record<string, any> | null
    ): Promise<number | null> {
        try {
            const result = await pool.query(`
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
        } catch {
            return null;
        }
    }

    static async getByUser(
        userId: number,
        action: string | null,
        startDate: Date | string | null,
        endDate: Date | string | null,
        limit: number,
        offset: number
    ): Promise<AuditLogRow[]> {
        let query = 'SELECT * FROM audit_logs WHERE user_id = $1';
        const params: (number | string | Date)[] = [userId];
        let idx = 2;

        if (action) { query += ` AND action = $${idx++}`; params.push(action); }
        if (startDate) { query += ` AND created_at >= $${idx++}`; params.push(startDate); }
        if (endDate) { query += ` AND created_at <= $${idx++}`; params.push(endDate); }

        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getByEntity(entity: string, entityId: string | number, limit: number, offset: number): Promise<AuditLogRow[]> {
        const result = await pool.query(
            'SELECT * FROM audit_logs WHERE entity = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
            [entity, entityId, limit, offset]
        );
        return result.rows;
    }

    static async getStats(startDate: Date | string | null, endDate: Date | string | null): Promise<AuditStats[]> {
        let query = 'SELECT action, entity, COUNT(*) as count FROM audit_logs';
        const params: (Date | string)[] = [];

        if (startDate && endDate) {
            query += ' WHERE created_at BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        }

        query += ' GROUP BY action, entity ORDER BY count DESC';
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async cleanup(daysToKeep: number): Promise<number> {
        const result = await pool.query(`DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`);
        return result.rowCount || 0;
    }

    static async cleanupTable(tableName: string): Promise<number> {
        const result = await pool.query(`DELETE FROM ${tableName} WHERE created_at < NOW() - INTERVAL '24 hours'`);
        return result.rowCount || 0;
    }

    static async cleanupSystemLogs(retentionDays: number): Promise<number> {
        const result = await pool.query(`DELETE FROM logs_sistema WHERE created_at < NOW() - INTERVAL '${retentionDays} days'`);
        return result.rowCount || 0;
    }
}

export default AuditDAO;
module.exports = AuditDAO;

/**
 * 🏢 TENANT AUDIT DAO - TypeScript
 * Data Access Object para auditoría de tenants
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface TenantAuditFilters {
    user_id?: number;
    event_type?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
    offset?: number;
}

export interface AuditLogEntry {
    id: number;
    tenant_id: number;
    user_id: number;
    event_type: string;
    action: string;
    entity_type: string;
    entity_id: string | number;
    old_value?: any;
    new_value?: any;
    ip_address: string;
    user_agent: string;
    metadata?: any;
    created_at: Date;
}

// =====================================================
// TENANT AUDIT DAO CLASS
// =====================================================

class TenantAuditDAO {

    static async logEvent(
        tenantId: number,
        userId: number,
        eventType: string,
        action: string,
        entityType: string,
        entityId: string | number,
        oldValue: any,
        newValue: any,
        ipAddress: string,
        userAgent: string,
        metadata: any
    ): Promise<number | null> {
        try {
            const result = await pool.query(`
                INSERT INTO audit_log (tenant_id, user_id, event_type, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, metadata, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP) RETURNING id
            `, [
                tenantId, userId, eventType, action, entityType, entityId,
                oldValue ? JSON.stringify(oldValue) : null,
                newValue ? JSON.stringify(newValue) : null,
                ipAddress, userAgent, JSON.stringify(metadata || {})
            ]);
            return result.rows[0].id;
        } catch (error: any) {
            if (error.code === '42P01') return null; // Tabla no existe
            console.error('[AUDIT-DAO] Error:', error.message);
            return null;
        }
    }

    static async getLogs(tenantId: number, filters: TenantAuditFilters): Promise<AuditLogEntry[]> {
        try {
            const { user_id, event_type, start_date, end_date, limit = 100, offset = 0 } = filters;
            let query = 'SELECT * FROM audit_log WHERE tenant_id = $1';
            const params: any[] = [tenantId];
            let idx = 2;

            if (user_id) { query += ` AND user_id = $${idx++}`; params.push(user_id); }
            if (event_type) { query += ` AND event_type = $${idx++}`; params.push(event_type); }
            if (start_date) { query += ` AND created_at >= $${idx++}`; params.push(start_date); }
            if (end_date) { query += ` AND created_at <= $${idx++}`; params.push(end_date); }

            query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error: any) {
            console.error('[AUDIT-DAO] Error obteniendo logs:', error.message);
            return [];
        }
    }
}

export default TenantAuditDAO;
module.exports = TenantAuditDAO;

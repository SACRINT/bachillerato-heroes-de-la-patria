"use strict";
/**
 * 🏢 TENANT AUDIT DAO - TypeScript
 * Data Access Object para auditoría de tenants
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// TENANT AUDIT DAO CLASS
// =====================================================
class TenantAuditDAO {
    static async logEvent(tenantId, userId, eventType, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent, metadata) {
        try {
            const result = await database_1.pool.query(`
                INSERT INTO audit_log (tenant_id, user_id, event_type, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, metadata, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP) RETURNING id
            `, [
                tenantId, userId, eventType, action, entityType, entityId,
                oldValue ? JSON.stringify(oldValue) : null,
                newValue ? JSON.stringify(newValue) : null,
                ipAddress, userAgent, JSON.stringify(metadata || {})
            ]);
            return result.rows[0].id;
        }
        catch (error) {
            if (error.code === '42P01')
                return null; // Tabla no existe
            console.error('[AUDIT-DAO] Error:', error.message);
            return null;
        }
    }
    static async getLogs(tenantId, filters) {
        try {
            const { user_id, event_type, start_date, end_date, limit = 100, offset = 0 } = filters;
            let query = 'SELECT * FROM audit_log WHERE tenant_id = $1';
            const params = [tenantId];
            let idx = 2;
            if (user_id) {
                query += ` AND user_id = $${idx++}`;
                params.push(user_id);
            }
            if (event_type) {
                query += ` AND event_type = $${idx++}`;
                params.push(event_type);
            }
            if (start_date) {
                query += ` AND created_at >= $${idx++}`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND created_at <= $${idx++}`;
                params.push(end_date);
            }
            query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
            params.push(limit, offset);
            const result = await database_1.pool.query(query, params);
            return result.rows;
        }
        catch (error) {
            console.error('[AUDIT-DAO] Error obteniendo logs:', error.message);
            return [];
        }
    }
}
exports.default = TenantAuditDAO;
module.exports = TenantAuditDAO;
//# sourceMappingURL=tenant-audit.dao.js.map
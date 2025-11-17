/**
 * 🏢 TENANT AUDIT LOGGING
 * Registro de acciones críticas por tenant
 * Semana 5 - Multi-tenancy Avanzado - Tarea 10
 */

const pool = require('../config/database');

/**
 * Tipos de eventos auditables
 */
const EventTypes = {
    // Tenant management
    TENANT_CREATED: 'tenant_created',
    TENANT_UPDATED: 'tenant_updated',
    TENANT_DELETED: 'tenant_deleted',
    TENANT_STATUS_CHANGED: 'tenant_status_changed',

    // User actions
    USER_CREATED: 'user_created',
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_UPDATED: 'user_updated',
    USER_DELETED: 'user_deleted',

    // Data operations
    DATA_EXPORTED: 'data_exported',
    DATA_IMPORTED: 'data_imported',
    CONFIG_CHANGED: 'config_changed',

    // Security
    AUTH_FAILED: 'auth_failed',
    ACCESS_DENIED: 'access_denied',
    PERMISSION_CHANGED: 'permission_changed'
};

/**
 * Registra evento de auditoría
 */
async function logAuditEvent({
    tenant_id,
    user_id = null,
    event_type,
    action,
    entity_type = null,
    entity_id = null,
    old_value = null,
    new_value = null,
    ip_address = null,
    user_agent = null,
    metadata = {}
}) {
    try {
        const query = `
            INSERT INTO audit_log (
                tenant_id,
                user_id,
                event_type,
                action,
                entity_type,
                entity_id,
                old_value,
                new_value,
                ip_address,
                user_agent,
                metadata,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
            RETURNING id
        `;

        const values = [
            tenant_id,
            user_id,
            event_type,
            action,
            entity_type,
            entity_id,
            old_value ? JSON.stringify(old_value) : null,
            new_value ? JSON.stringify(new_value) : null,
            ip_address,
            user_agent,
            JSON.stringify(metadata)
        ];

        const result = await pool.query(query, values);

        console.log(`[AUDIT] ${event_type} - Tenant: ${tenant_id}, User: ${user_id || 'SYSTEM'}`);

        return result.rows[0].id;

    } catch (error) {
        // Si tabla audit_log no existe, solo logear a consola (no fallar)
        if (error.code === '42P01') { // Tabla no existe
            console.log(`[AUDIT] ${event_type} - Tenant: ${tenant_id}, User: ${user_id || 'SYSTEM'} (tabla audit_log no existe)`);
            return null;
        }

        console.error('[AUDIT] Error logging audit event:', error.message);
        // No lanzar error para no interrumpir la operación principal
        return null;
    }
}

/**
 * Middleware para auto-logging de auditoría
 */
function auditMiddleware(eventType) {
    return (req, res, next) => {
        // Guardar método JSON original
        const originalJson = res.json.bind(res);

        // Sobrescribir método json
        res.json = function(data) {
            // Solo auditar si la operación fue exitosa
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAuditEvent({
                    tenant_id: req.tenant?.id || 'default',
                    user_id: req.user?.uuid || null,
                    event_type: eventType,
                    action: `${req.method} ${req.path}`,
                    ip_address: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('user-agent'),
                    metadata: {
                        query: req.query,
                        body_keys: req.body ? Object.keys(req.body) : []
                    }
                }).catch(err => {
                    console.error('[AUDIT-MIDDLEWARE] Error:', err.message);
                });
            }

            // Llamar al método original
            return originalJson(data);
        };

        next();
    };
}

/**
 * Obtiene logs de auditoría por tenant
 */
async function getAuditLogs(tenantId, filters = {}) {
    try {
        const {
            user_id,
            event_type,
            start_date,
            end_date,
            limit = 100,
            offset = 0
        } = filters;

        let query = 'SELECT * FROM audit_log WHERE tenant_id = $1';
        const params = [tenantId];
        let paramIndex = 2;

        if (user_id) {
            query += ` AND user_id = $${paramIndex}`;
            params.push(user_id);
            paramIndex++;
        }

        if (event_type) {
            query += ` AND event_type = $${paramIndex}`;
            params.push(event_type);
            paramIndex++;
        }

        if (start_date) {
            query += ` AND created_at >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            query += ` AND created_at <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return result.rows;

    } catch (error) {
        console.error('[AUDIT] Error obteniendo logs:', error.message);
        return [];
    }
}

/**
 * Script SQL para crear tabla audit_log
 */
const CREATE_AUDIT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id UUID,
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
`;

module.exports = {
    EventTypes,
    logAuditEvent,
    auditMiddleware,
    getAuditLogs,
    CREATE_AUDIT_TABLE_SQL
};

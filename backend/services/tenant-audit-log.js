/**
 * 🏢 TENANT AUDIT LOGGING - v2.0.0
 * Refactorizado: 04 Diciembre 2025
 */

const TenantAuditDAO = require('../data/tenant-audit.dao');

const EventTypes = {
    TENANT_CREATED: 'tenant_created', TENANT_UPDATED: 'tenant_updated', TENANT_DELETED: 'tenant_deleted', TENANT_STATUS_CHANGED: 'tenant_status_changed',
    USER_CREATED: 'user_created', USER_LOGIN: 'user_login', USER_LOGOUT: 'user_logout', USER_UPDATED: 'user_updated', USER_DELETED: 'user_deleted',
    DATA_EXPORTED: 'data_exported', DATA_IMPORTED: 'data_imported', CONFIG_CHANGED: 'config_changed',
    AUTH_FAILED: 'auth_failed', ACCESS_DENIED: 'access_denied', PERMISSION_CHANGED: 'permission_changed'
};

async function logAuditEvent({ tenant_id, user_id = null, event_type, action, entity_type = null, entity_id = null, old_value = null, new_value = null, ip_address = null, user_agent = null, metadata = {} }) {
    const id = await TenantAuditDAO.logEvent(tenant_id, user_id, event_type, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, metadata);
    console.log(`[AUDIT] ${event_type} - Tenant: ${tenant_id}, User: ${user_id || 'SYSTEM'}`);
    return id;
}

function auditMiddleware(eventType) {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAuditEvent({ tenant_id: req.tenant?.id || 'default', user_id: req.user?.uuid || null, event_type: eventType, action: `${req.method} ${req.path}`, ip_address: req.ip || req.connection.remoteAddress, user_agent: req.get('user-agent'), metadata: { query: req.query, body_keys: req.body ? Object.keys(req.body) : [] } }).catch(err => console.error('[AUDIT-MIDDLEWARE] Error:', err.message));
            }
            return originalJson(data);
        };
        next();
    };
}

async function getAuditLogs(tenantId, filters = {}) { return TenantAuditDAO.getLogs(tenantId, filters); }

const CREATE_AUDIT_TABLE_SQL = `CREATE TABLE IF NOT EXISTS audit_log (id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, user_id UUID, event_type VARCHAR(100) NOT NULL, action VARCHAR(255) NOT NULL, entity_type VARCHAR(100), entity_id VARCHAR(255), old_value JSONB, new_value JSONB, ip_address VARCHAR(45), user_agent TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);`;

module.exports = { EventTypes, logAuditEvent, auditMiddleware, getAuditLogs, CREATE_AUDIT_TABLE_SQL };

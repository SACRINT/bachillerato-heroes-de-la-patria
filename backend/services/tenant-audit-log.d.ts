export namespace EventTypes {
    let TENANT_CREATED: string;
    let TENANT_UPDATED: string;
    let TENANT_DELETED: string;
    let TENANT_STATUS_CHANGED: string;
    let USER_CREATED: string;
    let USER_LOGIN: string;
    let USER_LOGOUT: string;
    let USER_UPDATED: string;
    let USER_DELETED: string;
    let DATA_EXPORTED: string;
    let DATA_IMPORTED: string;
    let CONFIG_CHANGED: string;
    let AUTH_FAILED: string;
    let ACCESS_DENIED: string;
    let PERMISSION_CHANGED: string;
}
export function logAuditEvent({ tenant_id, user_id, event_type, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, metadata }: {
    tenant_id: any;
    user_id?: any;
    event_type: any;
    action: any;
    entity_type?: any;
    entity_id?: any;
    old_value?: any;
    new_value?: any;
    ip_address?: any;
    user_agent?: any;
    metadata?: {};
}): Promise<any>;
export function auditMiddleware(eventType: any): (req: any, res: any, next: any) => void;
export function getAuditLogs(tenantId: any, filters?: {}): Promise<any>;
export const CREATE_AUDIT_TABLE_SQL: "CREATE TABLE IF NOT EXISTS audit_log (id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, user_id UUID, event_type VARCHAR(100) NOT NULL, action VARCHAR(255) NOT NULL, entity_type VARCHAR(100), entity_id VARCHAR(255), old_value JSONB, new_value JSONB, ip_address VARCHAR(45), user_agent TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);";
//# sourceMappingURL=tenant-audit-log.d.ts.map
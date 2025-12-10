/**
 * 🏢 TENANT AUDIT DAO - TypeScript
 * Data Access Object para auditoría de tenants
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
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
declare class TenantAuditDAO {
    static logEvent(tenantId: number, userId: number, eventType: string, action: string, entityType: string, entityId: string | number, oldValue: any, newValue: any, ipAddress: string, userAgent: string, metadata: any): Promise<number | null>;
    static getLogs(tenantId: number, filters: TenantAuditFilters): Promise<AuditLogEntry[]>;
}
export default TenantAuditDAO;
//# sourceMappingURL=tenant-audit.dao.d.ts.map
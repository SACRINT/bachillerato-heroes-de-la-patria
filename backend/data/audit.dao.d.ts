/**
 * 📝 AUDIT DAO - TypeScript
 * Data Access Object para auditoría
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
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
declare class AuditDAO {
    static log(userId: number | null, action: string, entity: string, entityId: string | number, oldData: Record<string, any> | null, newData: Record<string, any> | null, ipAddress: string | null, userAgent: string | null, metadata: Record<string, any> | null): Promise<number | null>;
    static getByUser(userId: number, action: string | null, startDate: Date | string | null, endDate: Date | string | null, limit: number, offset: number): Promise<AuditLogRow[]>;
    static getByEntity(entity: string, entityId: string | number, limit: number, offset: number): Promise<AuditLogRow[]>;
    static getStats(startDate: Date | string | null, endDate: Date | string | null): Promise<AuditStats[]>;
    static cleanup(daysToKeep: number): Promise<number>;
    static cleanupTable(tableName: string): Promise<number>;
    static cleanupSystemLogs(retentionDays: number): Promise<number>;
}
export default AuditDAO;
//# sourceMappingURL=audit.dao.d.ts.map
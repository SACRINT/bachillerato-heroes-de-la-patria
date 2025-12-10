/**
 * 📋 AUDIT LOG DAO - TypeScript
 * Data Access Object para auditoría de compliance
 * Abstrae todas las queries SQL de AuditLogService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface AuditEvent {
    id: string;
    timestamp: Date | string;
    action: string;
    category: string;
    severity: string;
    userId?: number | string;
    tenantId?: number | string;
    resourceType?: string;
    resourceId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    checksum?: string;
}
export interface AuditLogSearchOptions {
    whereClause: string;
    params: any[];
    limit: number;
    offset: number;
}
export interface AuditLogSearchResult {
    data: AuditEvent[];
    total: number;
}
export interface AuditStats {
    category: string;
    severity: string;
    count: number;
}
export interface AuditTrend {
    day: Date;
    count: number;
}
declare class AuditLogDAO {
    static persistEvent(event: AuditEvent): Promise<void>;
    static persistBatch(batch: AuditEvent[]): Promise<void>;
    static search(whereClause: string, params: any[], limit: number, offset: number): Promise<AuditLogSearchResult>;
    static getUserActivity(userId: number | string, days: number): Promise<AuditEvent[]>;
    static getStats(days: number): Promise<AuditStats[]>;
    static getTrend(days: number): Promise<AuditTrend[]>;
    static exportLogs(startDate?: Date | string, endDate?: Date | string): Promise<AuditEvent[]>;
    static getLogsForIntegrity(startDate: Date | string, endDate: Date | string): Promise<AuditEvent[]>;
    static cleanup(retentionDays: number): Promise<number>;
}
export default AuditLogDAO;
//# sourceMappingURL=audit-log.dao.d.ts.map
/**
 * 🔒 SECURITY AUDIT DAO - TypeScript
 * Data Access Object para auditoría de seguridad
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface SecurityEvent {
    id: string;
    timestamp: Date;
    eventType: string;
    severity: number;
    userId: number | null;
    ip: string;
    userAgent: string;
    resource: string;
    action: string;
    details: any;
    success: boolean;
    metadata: any;
}
export interface SecuritySummary {
    event_type: string;
    count: number;
    failures: number;
    unique_users: number;
    unique_ips: number;
}
export interface SuspiciousActivity {
    ip_address: string;
    total_events: number;
    failures: number;
    login_failures: number;
    high_severity: number;
    event_types: string[];
}
export interface SecurityLogEntry {
    event_id: number;
    timestamp: Date;
    event_type: string;
    severity: number;
    user_id: number;
    ip_address: string;
    user_agent: string;
    resource: string;
    action: string;
    details: any;
    success: boolean;
    metadata: any;
}
declare class SecurityAuditDAO {
    static insertEventsBatch(events: SecurityEvent[]): Promise<number>;
    static query(baseQuery: string, params: any[]): Promise<any[]>;
    static count(countQuery: string, params: any[]): Promise<number>;
    static getSummary(startDate: Date, endDate: Date): Promise<SecuritySummary[]>;
    static getSuspiciousActivity(since: Date): Promise<SuspiciousActivity[]>;
    static getUserTimeline(userId: number, limit: number): Promise<SecurityLogEntry[]>;
    static cleanup(cutoffDate: Date): Promise<number>;
}
export default SecurityAuditDAO;
//# sourceMappingURL=security-audit.dao.d.ts.map
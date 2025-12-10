/**
 * 🔒 SECURITY AUDIT SERVICE - TypeScript Version
 * Servicio de Auditoría de Seguridad BGE
 * Migrado: 07 Diciembre 2025
 */
declare const EVENT_TYPES: {
    readonly LOGIN_SUCCESS: "login_success";
    readonly LOGIN_FAILURE: "login_failure";
    readonly LOGOUT: "logout";
    readonly PASSWORD_CHANGE: "password_change";
    readonly PASSWORD_RESET_REQUEST: "password_reset_request";
    readonly PASSWORD_RESET_COMPLETE: "password_reset_complete";
    readonly SESSION_EXPIRED: "session_expired";
    readonly TOKEN_REFRESH: "token_refresh";
    readonly ACCESS_DENIED: "access_denied";
    readonly PERMISSION_DENIED: "permission_denied";
    readonly INVALID_TOKEN: "invalid_token";
    readonly SESSION_HIJACK_ATTEMPT: "session_hijack_attempt";
    readonly DATA_ACCESS: "data_access";
    readonly DATA_EXPORT: "data_export";
    readonly DATA_MODIFY: "data_modify";
    readonly DATA_DELETE: "data_delete";
    readonly BULK_OPERATION: "bulk_operation";
    readonly ATTACK_DETECTED: "attack_detected";
    readonly RATE_LIMIT_EXCEEDED: "rate_limit_exceeded";
    readonly IP_BLOCKED: "ip_blocked";
    readonly ACCOUNT_LOCKED: "account_locked";
    readonly SUSPICIOUS_ACTIVITY: "suspicious_activity";
    readonly ADMIN_ACTION: "admin_action";
    readonly CONFIG_CHANGE: "config_change";
    readonly USER_CREATE: "user_create";
    readonly USER_DELETE: "user_delete";
    readonly ROLE_CHANGE: "role_change";
    readonly PERMISSION_CHANGE: "permission_change";
    readonly SYSTEM_ERROR: "system_error";
    readonly BACKUP_CREATED: "backup_created";
    readonly MAINTENANCE_MODE: "maintenance_mode";
};
declare const SEVERITY_LEVELS: {
    readonly DEBUG: 0;
    readonly INFO: 1;
    readonly WARNING: 2;
    readonly ERROR: 3;
    readonly CRITICAL: 4;
};
interface AuditEvent {
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
interface LogData {
    userId?: number | null;
    ip?: string | null;
    userAgent?: string | null;
    resource?: string | null;
    action?: string | null;
    details?: any;
    success?: boolean;
    sessionId?: string | null;
    requestId?: string | null;
    duration?: number | null;
}
declare class SecurityAuditService {
    private eventBuffer;
    private bufferMaxSize;
    private flushIntervalMs;
    private flushInterval;
    readonly eventTypes: {
        readonly LOGIN_SUCCESS: "login_success";
        readonly LOGIN_FAILURE: "login_failure";
        readonly LOGOUT: "logout";
        readonly PASSWORD_CHANGE: "password_change";
        readonly PASSWORD_RESET_REQUEST: "password_reset_request";
        readonly PASSWORD_RESET_COMPLETE: "password_reset_complete";
        readonly SESSION_EXPIRED: "session_expired";
        readonly TOKEN_REFRESH: "token_refresh";
        readonly ACCESS_DENIED: "access_denied";
        readonly PERMISSION_DENIED: "permission_denied";
        readonly INVALID_TOKEN: "invalid_token";
        readonly SESSION_HIJACK_ATTEMPT: "session_hijack_attempt";
        readonly DATA_ACCESS: "data_access";
        readonly DATA_EXPORT: "data_export";
        readonly DATA_MODIFY: "data_modify";
        readonly DATA_DELETE: "data_delete";
        readonly BULK_OPERATION: "bulk_operation";
        readonly ATTACK_DETECTED: "attack_detected";
        readonly RATE_LIMIT_EXCEEDED: "rate_limit_exceeded";
        readonly IP_BLOCKED: "ip_blocked";
        readonly ACCOUNT_LOCKED: "account_locked";
        readonly SUSPICIOUS_ACTIVITY: "suspicious_activity";
        readonly ADMIN_ACTION: "admin_action";
        readonly CONFIG_CHANGE: "config_change";
        readonly USER_CREATE: "user_create";
        readonly USER_DELETE: "user_delete";
        readonly ROLE_CHANGE: "role_change";
        readonly PERMISSION_CHANGE: "permission_change";
        readonly SYSTEM_ERROR: "system_error";
        readonly BACKUP_CREATED: "backup_created";
        readonly MAINTENANCE_MODE: "maintenance_mode";
    };
    readonly severityLevels: {
        readonly DEBUG: 0;
        readonly INFO: 1;
        readonly WARNING: 2;
        readonly ERROR: 3;
        readonly CRITICAL: 4;
    };
    constructor();
    log(eventType: string, data?: LogData): Promise<AuditEvent>;
    logLogin(userId: number, ip: string, success: boolean, details?: any): Promise<AuditEvent>;
    logAccessDenied(userId: number | null, ip: string, resource: string, reason: string): Promise<AuditEvent>;
    logDataAccess(userId: number, resource: string, action: string, details?: any): Promise<AuditEvent>;
    logAdminAction(userId: number, action: string, targetResource: string, details?: any): Promise<AuditEvent>;
    logSecurityThreat(ip: string, threatType: string, details?: any): Promise<AuditEvent>;
    determineSeverity(eventType: string): number;
    generateEventId(): string;
    flush(): Promise<number>;
    query(filters?: any, options?: any): Promise<any>;
    getSummary(startDate: Date, endDate: Date): Promise<any>;
    getSuspiciousActivity(hours?: number): Promise<any[]>;
    getUserTimeline(userId: number, limit?: number): Promise<any[]>;
    exportLogs(filters: any, format?: 'json' | 'csv'): Promise<string | any[]>;
    cleanup(retentionDays?: number): Promise<number>;
    getStats(): any;
    stop(): Promise<void>;
}
declare const securityAuditService: SecurityAuditService;
export default securityAuditService;
export { SecurityAuditService, AuditEvent, EVENT_TYPES, SEVERITY_LEVELS };
//# sourceMappingURL=security-audit.service.d.ts.map
declare const _exports: SecurityAuditService;
export = _exports;
declare class SecurityAuditService {
    eventBuffer: any[];
    bufferMaxSize: number;
    flushIntervalMs: number;
    eventTypes: {
        LOGIN_SUCCESS: string;
        LOGIN_FAILURE: string;
        LOGOUT: string;
        PASSWORD_CHANGE: string;
        PASSWORD_RESET_REQUEST: string;
        PASSWORD_RESET_COMPLETE: string;
        SESSION_EXPIRED: string;
        TOKEN_REFRESH: string;
        ACCESS_DENIED: string;
        PERMISSION_DENIED: string;
        INVALID_TOKEN: string;
        SESSION_HIJACK_ATTEMPT: string;
        DATA_ACCESS: string;
        DATA_EXPORT: string;
        DATA_MODIFY: string;
        DATA_DELETE: string;
        BULK_OPERATION: string;
        ATTACK_DETECTED: string;
        RATE_LIMIT_EXCEEDED: string;
        IP_BLOCKED: string;
        ACCOUNT_LOCKED: string;
        SUSPICIOUS_ACTIVITY: string;
        ADMIN_ACTION: string;
        CONFIG_CHANGE: string;
        USER_CREATE: string;
        USER_DELETE: string;
        ROLE_CHANGE: string;
        PERMISSION_CHANGE: string;
        SYSTEM_ERROR: string;
        BACKUP_CREATED: string;
        MAINTENANCE_MODE: string;
    };
    severityLevels: {
        DEBUG: number;
        INFO: number;
        WARNING: number;
        ERROR: number;
        CRITICAL: number;
    };
    flushInterval: NodeJS.Timeout;
    log(eventType: any, data?: {}): Promise<{
        id: string;
        timestamp: string;
        eventType: any;
        severity: number;
        userId: any;
        ip: any;
        userAgent: any;
        resource: any;
        action: any;
        details: any;
        success: any;
        metadata: {
            sessionId: any;
            requestId: any;
            duration: any;
        };
    }>;
    logLogin(userId: any, ip: any, success: any, details?: {}): Promise<{
        id: string;
        timestamp: string;
        eventType: any;
        severity: number;
        userId: any;
        ip: any;
        userAgent: any;
        resource: any;
        action: any;
        details: any;
        success: any;
        metadata: {
            sessionId: any;
            requestId: any;
            duration: any;
        };
    }>;
    logAccessDenied(userId: any, ip: any, resource: any, reason: any): Promise<{
        id: string;
        timestamp: string;
        eventType: any;
        severity: number;
        userId: any;
        ip: any;
        userAgent: any;
        resource: any;
        action: any;
        details: any;
        success: any;
        metadata: {
            sessionId: any;
            requestId: any;
            duration: any;
        };
    }>;
    logDataAccess(userId: any, resource: any, action: any, details?: {}): Promise<{
        id: string;
        timestamp: string;
        eventType: any;
        severity: number;
        userId: any;
        ip: any;
        userAgent: any;
        resource: any;
        action: any;
        details: any;
        success: any;
        metadata: {
            sessionId: any;
            requestId: any;
            duration: any;
        };
    }>;
    logAdminAction(userId: any, action: any, targetResource: any, details?: {}): Promise<{
        id: string;
        timestamp: string;
        eventType: any;
        severity: number;
        userId: any;
        ip: any;
        userAgent: any;
        resource: any;
        action: any;
        details: any;
        success: any;
        metadata: {
            sessionId: any;
            requestId: any;
            duration: any;
        };
    }>;
    logSecurityThreat(ip: any, threatType: any, details?: {}): Promise<{
        id: string;
        timestamp: string;
        eventType: any;
        severity: number;
        userId: any;
        ip: any;
        userAgent: any;
        resource: any;
        action: any;
        details: any;
        success: any;
        metadata: {
            sessionId: any;
            requestId: any;
            duration: any;
        };
    }>;
    determineSeverity(eventType: any): number;
    generateEventId(): string;
    flush(): Promise<any>;
    query(filters?: {}, options?: {}): Promise<{
        logs: any;
        pagination: {
            page: any;
            limit: any;
            total: any;
            totalPages: number;
        };
    }>;
    getSummary(startDate: any, endDate: any): Promise<any>;
    getSuspiciousActivity(hours?: number): Promise<any>;
    getUserTimeline(userId: any, limit?: number): Promise<any>;
    exportLogs(filters: any, format?: string): Promise<any>;
    cleanup(retentionDays?: number): Promise<any>;
    getStats(): {
        bufferSize: number;
        bufferMaxSize: number;
        flushIntervalMs: number;
        eventTypes: number;
        severityLevels: string[];
    };
    stop(): Promise<void>;
}
//# sourceMappingURL=SecurityAuditService.d.ts.map
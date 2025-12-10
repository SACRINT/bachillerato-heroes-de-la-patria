export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export namespace AUDIT_ACTIONS {
    namespace LOGIN_SUCCESS {
        import category = EVENT_CATEGORIES.AUTH;
        export { category };
        import severity = SEVERITY_LEVELS.INFO;
        export { severity };
    }
    namespace LOGIN_FAILED {
        import category_1 = EVENT_CATEGORIES.AUTH;
        export { category_1 as category };
        import severity_1 = SEVERITY_LEVELS.WARNING;
        export { severity_1 as severity };
    }
    namespace LOGOUT {
        import category_2 = EVENT_CATEGORIES.AUTH;
        export { category_2 as category };
        import severity_2 = SEVERITY_LEVELS.INFO;
        export { severity_2 as severity };
    }
    namespace PASSWORD_CHANGE {
        import category_3 = EVENT_CATEGORIES.AUTH;
        export { category_3 as category };
        import severity_3 = SEVERITY_LEVELS.INFO;
        export { severity_3 as severity };
    }
    namespace PASSWORD_RESET {
        import category_4 = EVENT_CATEGORIES.AUTH;
        export { category_4 as category };
        import severity_4 = SEVERITY_LEVELS.WARNING;
        export { severity_4 as severity };
    }
    namespace MFA_ENABLED {
        import category_5 = EVENT_CATEGORIES.AUTH;
        export { category_5 as category };
        import severity_5 = SEVERITY_LEVELS.INFO;
        export { severity_5 as severity };
    }
    namespace MFA_DISABLED {
        import category_6 = EVENT_CATEGORIES.AUTH;
        export { category_6 as category };
        import severity_6 = SEVERITY_LEVELS.WARNING;
        export { severity_6 as severity };
    }
    namespace DATA_CREATE {
        import category_7 = EVENT_CATEGORIES.DATA;
        export { category_7 as category };
        import severity_7 = SEVERITY_LEVELS.INFO;
        export { severity_7 as severity };
    }
    namespace DATA_READ {
        import category_8 = EVENT_CATEGORIES.DATA;
        export { category_8 as category };
        import severity_8 = SEVERITY_LEVELS.INFO;
        export { severity_8 as severity };
    }
    namespace DATA_UPDATE {
        import category_9 = EVENT_CATEGORIES.DATA;
        export { category_9 as category };
        import severity_9 = SEVERITY_LEVELS.INFO;
        export { severity_9 as severity };
    }
    namespace DATA_DELETE {
        import category_10 = EVENT_CATEGORIES.DATA;
        export { category_10 as category };
        import severity_10 = SEVERITY_LEVELS.WARNING;
        export { severity_10 as severity };
    }
    namespace DATA_EXPORT {
        import category_11 = EVENT_CATEGORIES.EXPORT;
        export { category_11 as category };
        import severity_11 = SEVERITY_LEVELS.WARNING;
        export { severity_11 as severity };
    }
    namespace DATA_IMPORT {
        import category_12 = EVENT_CATEGORIES.DATA;
        export { category_12 as category };
        import severity_12 = SEVERITY_LEVELS.WARNING;
        export { severity_12 as severity };
    }
    namespace BULK_OPERATION {
        import category_13 = EVENT_CATEGORIES.DATA;
        export { category_13 as category };
        import severity_13 = SEVERITY_LEVELS.WARNING;
        export { severity_13 as severity };
    }
    namespace USER_CREATE {
        import category_14 = EVENT_CATEGORIES.ADMIN;
        export { category_14 as category };
        import severity_14 = SEVERITY_LEVELS.INFO;
        export { severity_14 as severity };
    }
    namespace USER_UPDATE {
        import category_15 = EVENT_CATEGORIES.ADMIN;
        export { category_15 as category };
        import severity_15 = SEVERITY_LEVELS.INFO;
        export { severity_15 as severity };
    }
    namespace USER_DELETE {
        import category_16 = EVENT_CATEGORIES.ADMIN;
        export { category_16 as category };
        import severity_16 = SEVERITY_LEVELS.WARNING;
        export { severity_16 as severity };
    }
    namespace USER_SUSPEND {
        import category_17 = EVENT_CATEGORIES.ADMIN;
        export { category_17 as category };
        import severity_17 = SEVERITY_LEVELS.WARNING;
        export { severity_17 as severity };
    }
    namespace ROLE_CHANGE {
        import category_18 = EVENT_CATEGORIES.ADMIN;
        export { category_18 as category };
        import severity_18 = SEVERITY_LEVELS.WARNING;
        export { severity_18 as severity };
    }
    namespace PERMISSION_CHANGE {
        import category_19 = EVENT_CATEGORIES.ADMIN;
        export { category_19 as category };
        import severity_19 = SEVERITY_LEVELS.WARNING;
        export { severity_19 as severity };
    }
    namespace CONFIG_CHANGE {
        import category_20 = EVENT_CATEGORIES.ADMIN;
        export { category_20 as category };
        import severity_20 = SEVERITY_LEVELS.WARNING;
        export { severity_20 as severity };
    }
    namespace ACCESS_DENIED {
        import category_21 = EVENT_CATEGORIES.SECURITY;
        export { category_21 as category };
        import severity_21 = SEVERITY_LEVELS.WARNING;
        export { severity_21 as severity };
    }
    namespace RATE_LIMIT_EXCEEDED {
        import category_22 = EVENT_CATEGORIES.SECURITY;
        export { category_22 as category };
        import severity_22 = SEVERITY_LEVELS.WARNING;
        export { severity_22 as severity };
    }
    namespace SUSPICIOUS_ACTIVITY {
        import category_23 = EVENT_CATEGORIES.SECURITY;
        export { category_23 as category };
        import severity_23 = SEVERITY_LEVELS.ERROR;
        export { severity_23 as severity };
    }
    namespace BRUTE_FORCE_DETECTED {
        import category_24 = EVENT_CATEGORIES.SECURITY;
        export { category_24 as category };
        import severity_24 = SEVERITY_LEVELS.CRITICAL;
        export { severity_24 as severity };
    }
    namespace SQL_INJECTION_ATTEMPT {
        import category_25 = EVENT_CATEGORIES.SECURITY;
        export { category_25 as category };
        import severity_25 = SEVERITY_LEVELS.CRITICAL;
        export { severity_25 as severity };
    }
    namespace XSS_ATTEMPT {
        import category_26 = EVENT_CATEGORIES.SECURITY;
        export { category_26 as category };
        import severity_26 = SEVERITY_LEVELS.CRITICAL;
        export { severity_26 as severity };
    }
    namespace SYSTEM_START {
        import category_27 = EVENT_CATEGORIES.SYSTEM;
        export { category_27 as category };
        import severity_27 = SEVERITY_LEVELS.INFO;
        export { severity_27 as severity };
    }
    namespace SYSTEM_STOP {
        import category_28 = EVENT_CATEGORIES.SYSTEM;
        export { category_28 as category };
        import severity_28 = SEVERITY_LEVELS.INFO;
        export { severity_28 as severity };
    }
    namespace BACKUP_CREATED {
        import category_29 = EVENT_CATEGORIES.SYSTEM;
        export { category_29 as category };
        import severity_29 = SEVERITY_LEVELS.INFO;
        export { severity_29 as severity };
    }
    namespace BACKUP_RESTORED {
        import category_30 = EVENT_CATEGORIES.SYSTEM;
        export { category_30 as category };
        import severity_30 = SEVERITY_LEVELS.WARNING;
        export { severity_30 as severity };
    }
    namespace MIGRATION_EXECUTED {
        import category_31 = EVENT_CATEGORIES.SYSTEM;
        export { category_31 as category };
        import severity_31 = SEVERITY_LEVELS.WARNING;
        export { severity_31 as severity };
    }
    namespace GDPR_REQUEST {
        import category_32 = EVENT_CATEGORIES.COMPLIANCE;
        export { category_32 as category };
        import severity_32 = SEVERITY_LEVELS.INFO;
        export { severity_32 as severity };
    }
    namespace DATA_RETENTION_CLEANUP {
        import category_33 = EVENT_CATEGORIES.COMPLIANCE;
        export { category_33 as category };
        import severity_33 = SEVERITY_LEVELS.INFO;
        export { severity_33 as severity };
    }
    namespace CONSENT_GIVEN {
        import category_34 = EVENT_CATEGORIES.COMPLIANCE;
        export { category_34 as category };
        import severity_34 = SEVERITY_LEVELS.INFO;
        export { severity_34 as severity };
    }
    namespace CONSENT_REVOKED {
        import category_35 = EVENT_CATEGORIES.COMPLIANCE;
        export { category_35 as category };
        import severity_35 = SEVERITY_LEVELS.WARNING;
        export { severity_35 as severity };
    }
}
export namespace EVENT_CATEGORIES {
    let AUTH: string;
    let DATA: string;
    let ADMIN: string;
    let SECURITY: string;
    let SYSTEM: string;
    let EXPORT: string;
    let COMPLIANCE: string;
}
export namespace SEVERITY_LEVELS {
    let INFO: string;
    let WARNING: string;
    let ERROR: string;
    let CRITICAL: string;
}
export declare let batchQueue: any[];
export declare let batchSize: number;
export declare let flushInterval: number;
export declare let flushTimer: NodeJS.Timeout;
export declare function initialize(): Promise<void>;
export declare function log(options: any): Promise<string>;
export declare function logDataAccess(userId: any, resourceType: any, resourceId: any, operation: any, details?: {}): Promise<string>;
export declare function logAuth(action: any, userId: any, ip: any, details?: {}): Promise<string>;
export declare function logSecurity(action: any, ip: any, details?: {}): Promise<string>;
export declare function search(filters?: {}): Promise<{
    data: any;
    pagination: {
        page: any;
        limit: any;
        total: any;
        totalPages: number;
    };
}>;
export declare function getUserActivity(userId: any, days?: number): Promise<{
    userId: any;
    period: string;
    totalEvents: any;
    byDay: {};
}>;
export declare function getStats(days?: number): Promise<{
    period: string;
    total: any;
    byCategory: {};
    bySeverity: {};
    trend: any;
}>;
export declare function exportLogs(options?: {}): Promise<any>;
export declare function verifyIntegrity(startDate: any, endDate: any): Promise<{
    verified: any;
    issues: number;
    integrity: string;
    details: {
        eventId: any;
        timestamp: any;
        issue: string;
    }[];
}>;
export declare function cleanup(retentionDays?: number): Promise<{
    deleted: any;
}>;
export declare function _generateEventId(): string;
export declare function _sanitizeDetails(details: any): any;
export declare function _hashIP(ip: any): string;
export declare function _truncateUserAgent(userAgent: any): any;
export declare function _calculateChecksum(event: any): string;
export declare function _flushBatch(): Promise<void>;
export declare function _toCSV(rows: any): string;
export declare function shutdown(): Promise<void>;
//# sourceMappingURL=AuditLogService.d.ts.map
/**
 * Express middleware to automatically log requests
 */
export function middleware(req: any, res: any, next: any): void;
/**
 * Create audit log entry
 *
 * @param {Object} entry - Audit log entry
 * @param {string} entry.user_id - User performing action
 * @param {string} entry.action - Action performed (CREATE, READ, UPDATE, DELETE)
 * @param {string} entry.resource - Resource type (usuarios, estudiantes, etc)
 * @param {string} entry.resource_id - Resource ID
 * @param {string} entry.ip_address - IP address of requester
 * @param {Object} entry.changes - Changes made (for UPDATE/DELETE)
 * @param {string} entry.user_agent - Browser user agent
 */
export function createAuditLog(entry: {
    user_id: string;
    action: string;
    resource: string;
    resource_id: string;
    ip_address: string;
    changes: any;
    user_agent: string;
}): Promise<void>;
/**
 * Verify integrity of audit log chain
 *
 * @returns {Object} { valid: boolean, tamperedIndex: number|null }
 */
export function verifyAuditLogIntegrity(): any;
/**
 * Log login event
 */
export function logLogin(userId: any, ipAddress: any, success?: boolean): Promise<void>;
/**
 * Log logout event
 */
export function logLogout(userId: any, ipAddress: any): Promise<void>;
/**
 * Log permission change
 */
export function logPermissionChange(adminUserId: any, targetUserId: any, oldRole: any, newRole: any, ipAddress: any): Promise<void>;
/**
 * Log data export
 */
export function logDataExport(userId: any, resourceType: any, recordCount: any, ipAddress: any): Promise<void>;
/**
 * Get audit logs for a specific user
 */
export function getAuditLogsByUser(userId: any, limit?: number): Promise<any>;
/**
 * Get audit logs for a specific resource
 */
export function getAuditLogsByResource(resource: any, resourceId: any, limit?: number): Promise<any>;
/**
 * Get audit logs within date range
 */
export function getAuditLogsByDateRange(startDate: any, endDate: any, limit?: number): Promise<any>;
/**
 * Delete audit logs older than 7 years (compliance retention)
 */
export function cleanupOldLogs(): Promise<any>;
export namespace AUDIT_ACTIONS {
    let CREATE: string;
    let READ: string;
    let UPDATE: string;
    let DELETE: string;
    let LOGIN: string;
    let LOGOUT: string;
    let PERMISSION_CHANGE: string;
    let DATA_EXPORT: string;
    let CONFIG_CHANGE: string;
}
export const RETENTION_DAYS: number;
//# sourceMappingURL=audit-logger.d.ts.map
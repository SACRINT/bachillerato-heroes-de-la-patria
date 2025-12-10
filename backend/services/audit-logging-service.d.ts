export namespace AuditEventTypes {
    let USER_LOGIN: string;
    let USER_LOGOUT: string;
    let USER_LOGIN_FAILED: string;
    let PASSWORD_CHANGED: string;
    let PASSWORD_RESET: string;
    let USER_CREATED: string;
    let USER_UPDATED: string;
    let USER_DELETED: string;
    let USER_ROLE_CHANGED: string;
    let TENANT_CREATED: string;
    let TENANT_UPDATED: string;
    let TENANT_DEACTIVATED: string;
    let TENANT_REACTIVATED: string;
    let TENANT_CONFIG_CHANGED: string;
    let STUDENT_CREATED: string;
    let STUDENT_UPDATED: string;
    let STUDENT_DELETED: string;
    let GRADE_CREATED: string;
    let GRADE_UPDATED: string;
    let GRADE_DELETED: string;
    let DATA_EXPORTED: string;
    let DATA_IMPORTED: string;
    let GDPR_REQUEST: string;
    let PERMISSION_CHANGED: string;
    let ACCESS_DENIED: string;
    let SUSPICIOUS_ACTIVITY: string;
}
export namespace AuditSeverity {
    let LOW: string;
    let MEDIUM: string;
    let HIGH: string;
    let CRITICAL: string;
}
/**
 * Registrar un evento de auditoría
 *
 * @param {object} options - Opciones del log
 * @returns {object} - Log creado
 */
export declare function log(options: object): object;
/**
 * Log de inicio de sesión exitoso
 */
export declare function logLogin(user: any, req: any): Promise<any>;
/**
 * Log de inicio de sesión fallido
 */
export declare function logLoginFailed(email: any, req: any, reason?: string): Promise<any>;
/**
 * Log de creación de usuario
 */
export declare function logUserCreated(newUser: any, createdBy: any, tenantId: any): Promise<any>;
/**
 * Log de actualización de usuario
 */
export declare function logUserUpdated(userId: any, oldData: any, newData: any, updatedBy: any, tenantId: any): Promise<any>;
/**
 * Log de eliminación de usuario
 */
export declare function logUserDeleted(deletedUser: any, deletedBy: any, tenantId: any): Promise<any>;
/**
 * Log de cambio de rol y enviar alerta si es crítico.
 */
export declare function logRoleChanged(userId: any, oldRole: any, newRole: any, changedBy: any, tenantId: any): Promise<any>;
/**
 * Log de creación de tenant
 */
export declare function logTenantCreated(tenant: any, createdBy: any): Promise<any>;
/**
 * Log de acceso denegado (403 Forbidden)
 */
export declare function logAccessDenied(user: any, resource: any, req: any): Promise<any>;
/**
 * Log de exportación de datos (GDPR)
 */
export declare function logDataExported(userId: any, dataType: any, tenantId: any, req: any): Promise<any>;
/**
 * Consultar logs de auditoría
 */
export declare function queryLogs(filters?: {}): Promise<any>;
/**
 * Obtener diferencias entre dos objetos (para cambios)
 */
export declare function getDiff(oldData: any, newData: any): {};
//# sourceMappingURL=audit-logging-service.d.ts.map
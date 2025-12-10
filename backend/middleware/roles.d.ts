export namespace ROLES {
    let SUPER_ADMIN: string;
    let ADMIN: string;
    let EDITOR: string;
    let VIEWER: string;
    let TEACHER: string;
    let STUDENT: string;
    let PARENT: string;
}
export namespace PERMISSIONS {
    let NEWS_CREATE: string;
    let NEWS_READ: string;
    let NEWS_UPDATE: string;
    let NEWS_DELETE: string;
    let NEWS_PUBLISH: string;
    let EVENTS_CREATE: string;
    let EVENTS_READ: string;
    let EVENTS_UPDATE: string;
    let EVENTS_DELETE: string;
    let EVENTS_PUBLISH: string;
    let NOTICES_CREATE: string;
    let NOTICES_READ: string;
    let NOTICES_UPDATE: string;
    let NOTICES_DELETE: string;
    let ANNOUNCEMENTS_CREATE: string;
    let ANNOUNCEMENTS_READ: string;
    let ANNOUNCEMENTS_UPDATE: string;
    let ANNOUNCEMENTS_DELETE: string;
    let USERS_CREATE: string;
    let USERS_READ: string;
    let USERS_UPDATE: string;
    let USERS_DELETE: string;
    let USERS_MANAGE_ROLES: string;
    let ANALYTICS_VIEW: string;
    let ANALYTICS_EXPORT: string;
    let SETTINGS_VIEW: string;
    let SETTINGS_UPDATE: string;
    let FILES_UPLOAD: string;
    let FILES_DELETE: string;
    let APPROVALS_VIEW: string;
    let APPROVALS_APPROVE: string;
    let APPROVALS_REJECT: string;
    let CONTACTS_VIEW: string;
    let CONTACTS_RESPOND: string;
    let COMPLAINTS_VIEW: string;
    let COMPLAINTS_RESPOND: string;
    let SYSTEM_BACKUP: string;
    let SYSTEM_RESTORE: string;
    let SYSTEM_LOGS: string;
}
export const ROLE_PERMISSIONS: {
    [ROLES.SUPER_ADMIN]: string[];
    [ROLES.ADMIN]: string[];
    [ROLES.EDITOR]: string[];
    [ROLES.VIEWER]: string[];
    [ROLES.TEACHER]: string[];
    [ROLES.STUDENT]: string[];
    [ROLES.PARENT]: string[];
};
/**
 * Middleware: Verificar si el usuario está autenticado
 */
export function requireAuth(req: any, res: any, next: any): any;
/**
 * Middleware: Verificar si el usuario tiene un rol específico
 */
export function requireRole(...allowedRoles: any[]): (req: any, res: any, next: any) => any;
/**
 * Middleware: Verificar si el usuario tiene un permiso específico
 */
export function requirePermission(...requiredPermissions: any[]): (req: any, res: any, next: any) => any;
/**
 * Middleware: Verificar si el usuario tiene TODOS los permisos especificados
 */
export function requireAllPermissions(...requiredPermissions: any[]): (req: any, res: any, next: any) => any;
/**
 * Middleware: Solo el propietario del recurso o admin puede acceder
 */
export function requireOwnerOrAdmin(resourceUserIdField?: string): (req: any, res: any, next: any) => any;
/**
 * Helper: Verificar si un usuario tiene un permiso (para uso en lógica)
 */
export function hasPermission(userRole: any, permission: any): boolean;
/**
 * Helper: Obtener todos los permisos de un rol
 */
export function getPermissionsForRole(role: any): string[];
/**
 * Helper: Verificar si un rol es superior a otro
 */
export function isRoleSuperior(role1: any, role2: any): boolean;
//# sourceMappingURL=roles.d.ts.map
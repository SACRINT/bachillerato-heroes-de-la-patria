/**
 * Middleware para verificar JWT token
 */
export function authenticateToken(req: any, res: any, next: any): Promise<any>;
/**
 * Middleware para verificar roles específicos
 */
export function requireRole(allowedRoles: any): (req: any, res: any, next: any) => any;
/**
 * Middleware para verificar permisos específicos
 */
export function requirePermission(requiredPermissions: any): (req: any, res: any, next: any) => any;
export function requireAdmin(req: any, res: any, next: any): any;
export function requireSuperAdmin(req: any, res: any, next: any): any;
export function requireTeacher(req: any, res: any, next: any): any;
export function requireStudent(req: any, res: any, next: any): any;
export function requireParent(req: any, res: any, next: any): any;
/**
 * Middleware para verificar acceso propio o superior
 * Permite acceso si es el propio usuario o tiene rol superior
 */
export function requireSelfOrAdmin(req: any, res: any, next: any): any;
/**
 * Middleware opcional de autenticación (para rutas públicas con contenido adicional para usuarios autenticados)
 */
export function optionalAuth(req: any, res: any, next: any): Promise<any>;
//# sourceMappingURL=auth.d.ts.map
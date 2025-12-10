/**
 * Resuelve tenant desde request y valida que exista y esté activo
 */
export function resolveTenant(req: any): Promise<{
    id: any;
    nombre: any;
    config: any;
    status: any;
}>;
/**
 * Middleware para resolver tenant antes de ejecutar ruta
 */
export function requireActiveTenant(req: any, res: any, next: any): void;
/**
 * Valida que usuario pertenece al tenant actual
 */
export function validateUserBelongsToTenant(req: any): boolean;
//# sourceMappingURL=tenant-resolver.d.ts.map
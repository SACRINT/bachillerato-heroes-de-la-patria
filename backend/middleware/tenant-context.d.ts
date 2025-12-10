/**
 * Middleware principal de Tenant Context
 */
export function tenantContext(req: any, res: any, next: any): Promise<void>;
/**
 * Middleware para REQUERIR tenant válido (usar en rutas protegidas)
 */
export function requireTenant(req: any, res: any, next: any): any;
/**
 * Middleware para validar que usuario pertenece al tenant del request
 */
export function validateUserTenant(req: any, res: any, next: any): any;
/**
 * Limpia cache de tenant (útil cuando se actualiza configuración)
 */
export function clearTenantCache(tenantId?: any): void;
/**
 * Endpoint para limpiar cache (solo admin)
 */
export function createCacheClearEndpoint(): (req: any, res: any) => Promise<void>;
/**
 * Detecta tenant_id desde múltiples fuentes
 */
export function detectTenantId(req: any): any;
/**
 * Obtiene configuración de tenant desde BD (con cache)
 */
export function getTenantConfig(tenantId: any): Promise<any>;
//# sourceMappingURL=tenant-context.d.ts.map
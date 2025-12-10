/**
 * Middleware principal de contexto de tenant
 */
export function tenantContextMiddleware(req: any, res: any, next: any): Promise<any>;
/**
 * Middleware para requerir tenant
 */
export function requireTenant(req: any, res: any, next: any): any;
/**
 * Middleware para super admin (sin restricción de tenant)
 */
export function superAdminBypass(req: any, res: any, next: any): any;
/**
 * Helper para obtener tenant_id en queries
 * @param {Object} req - Request
 * @returns {number|null} Tenant ID
 */
export function getTenantId(req: any): number | null;
/**
 * Obtener identificador de tenant desde request
 * @param {Object} req - Request
 * @returns {string|null} Identificador
 */
export function getTenantIdentifier(req: any): string | null;
/**
 * Helper para agregar filtro de tenant a query
 * @param {string} query - Query SQL
 * @param {Object} req - Request
 * @param {string} alias - Alias de tabla (opcional)
 * @returns {string} Query con filtro
 */
export function addTenantFilter(query: string, req: any, alias?: string): string;
/**
 * Limpiar cache de tenant
 * @param {string} identifier - Identificador
 */
export function clearTenantCache(identifier: string): void;
/**
 * Obtener estadísticas del cache
 * @returns {Object} Stats
 */
export function getCacheStats(): any;
/**
 * Middleware para audit logging
 */
export function tenantAuditLog(action: any): (req: any, res: any, next: any) => Promise<void>;
//# sourceMappingURL=tenant-context-enhanced.d.ts.map
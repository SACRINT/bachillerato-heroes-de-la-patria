/**
 * Middleware principal de tenant context
 * Estrategias de detección (en orden de prioridad):
 * 1. Header X-Tenant-ID (API keys)
 * 2. Subdomain (ej: school1.bge.edu.mx)
 * 3. JWT claims (req.user.tenant_id)
 * 4. Domain mapping (ej: escuela.com → tenant_id)
 */
export function tenantContextAdvanced(req: any, res: any, next: any): Promise<any>;
/**
 * Middleware para liberar el cliente de PostgreSQL al finalizar el request
 */
export function releaseTenantContext(req: any, res: any, next: any): void;
/**
 * Middleware para rutas públicas (sin tenant requerido)
 * Útil para /health, /metrics, documentación, etc.
 */
export function optionalTenantContext(req: any, res: any, next: any): void;
/**
 * Extraer subdomain de un hostname
 * Ejemplos:
 * - school1.bge.edu.mx → school1
 * - www.bge.edu.mx → www
 * - localhost → null
 */
export function extractSubdomain(hostname: any): any;
/**
 * Obtener tenant por subdomain
 */
export function getTenantBySubdomain(subdomain: any): Promise<any>;
/**
 * Obtener tenant por domain completo
 */
export function getTenantByDomain(domain: any): Promise<any>;
/**
 * Obtener tenant por ID
 */
export function getTenantById(tenantId: any): Promise<any>;
//# sourceMappingURL=tenant-context-advanced.d.ts.map
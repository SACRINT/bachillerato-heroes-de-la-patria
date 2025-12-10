/**
 * Obtiene pool para tenant específico
 * Por ahora retorna pool compartido (todos los tenants usan RLS en mismo DB)
 */
export function getTenantPool(tenantId: any): any;
/**
 * Ejecuta query con tenant context
 */
export function queryWithTenant(tenantId: any, sql: any, params?: any[]): Promise<any>;
/**
 * Ejecuta transacción con tenant context
 */
export function transactionWithTenant(tenantId: any, callback: any): Promise<any>;
/**
 * Pool compartido (default para arquitectura RLS)
 */
export const sharedPool: any;
/**
 * Cierra todos los pools (llamar al shutdown de la app)
 */
export function closeAllPools(): Promise<void>;
//# sourceMappingURL=multi-tenant-pool.d.ts.map
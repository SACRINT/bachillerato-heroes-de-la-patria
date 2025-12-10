/**
 * 🏢 TENANT DAO - TypeScript
 * Data Access Object para gestión de tenants
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface TenantRow {
    id: string;
    nombre: string;
    subdomain: string;
    dominio?: string;
    status: 'active' | 'inactive' | 'pending';
    config_json: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export interface TenantStats {
    students: number;
    users: number;
    news: number;
}
declare class TenantDAO {
    static getById(tenantId: string): Promise<TenantRow | undefined>;
    static updateConfig(tenantId: string, configJson: Record<string, any>): Promise<TenantRow | undefined>;
    static checkExists(id: string, subdomain: string): Promise<boolean>;
    static create(id: string, nombre: string, subdomain: string, dominio: string | null, status: string, configJson: Record<string, any>): Promise<TenantRow>;
    static list(status: string | null, limit: number, offset: number): Promise<TenantRow[]>;
    static updateStatus(tenantId: string, newStatus: string): Promise<TenantRow | undefined>;
    static getStats(tenantId: string): Promise<TenantStats>;
}
export default TenantDAO;
//# sourceMappingURL=tenant.dao.d.ts.map
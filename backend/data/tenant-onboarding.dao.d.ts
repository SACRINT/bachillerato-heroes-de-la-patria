/**
 * 🏗️ TENANT ONBOARDING DAO - TypeScript
 * Data Access Object para onboarding de tenants
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface TenantData {
    tenantId: number;
    name: string;
    subdomain: string;
    domain?: string;
    plan: string;
    config: any;
}
export interface AdminData {
    userId: number;
    uuid: string;
    email: string;
    passwordHash: string;
    username: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
}
export interface TenantCreationResult {
    tenant: any;
    admin: any;
}
declare class TenantOnboardingDAO {
    static checkSubdomainExists(subdomain: string): Promise<boolean>;
    static checkDomainExists(domain: string): Promise<boolean>;
    static checkEmailExists(email: string): Promise<boolean>;
    static createTenantWithAdmin(client: any, tenantData: TenantData, adminData: AdminData, seedData: boolean): Promise<TenantCreationResult>;
    static updateStatus(tenantId: number, status: string): Promise<any>;
    static updateConfig(tenantId: number, newConfig: any): Promise<any>;
    static getConnection(): Promise<any>;
}
export default TenantOnboardingDAO;
//# sourceMappingURL=tenant-onboarding.dao.d.ts.map
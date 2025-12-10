declare const _exports: TenantConfigService;
export = _exports;
declare class TenantConfigService {
    getConfig(tenantId: any): Promise<any>;
    getConfigJSON(tenantId: any): Promise<any>;
    updateConfig(tenantId: any, newConfig: any): Promise<any>;
    updateConfigValue(tenantId: any, path: any, value: any): Promise<any>;
    createTenant(tenantData: any): Promise<any>;
    listTenants(filters?: {}): Promise<any>;
    updateStatus(tenantId: any, newStatus: any): Promise<any>;
    deleteTenant(tenantId: any): Promise<any>;
    validateConfig(config: any): boolean;
    invalidateCache(tenantId: any): Promise<void>;
    getTenantStats(tenantId: any): Promise<{
        tenant_id: any;
        total_students: any;
        total_users: any;
        total_news: any;
        generated_at: string;
    }>;
}
//# sourceMappingURL=tenant-config-service.d.ts.map
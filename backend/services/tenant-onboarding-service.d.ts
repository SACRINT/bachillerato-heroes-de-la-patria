declare const _exports: TenantOnboardingService;
export = _exports;
declare class TenantOnboardingService {
    createTenant(data: any): Promise<{
        tenant: {
            id: any;
            name: any;
            subdomain: any;
            domain: any;
            plan: any;
            config: any;
        };
        admin: {
            id: any;
            email: any;
            role: any;
        };
    }>;
    parseFullName(fullName: any): any[];
    sendWelcomeEmail(admin: any, tenant: any): Promise<void>;
    deactivateTenant(tenantId: any): Promise<any>;
    reactivateTenant(tenantId: any): Promise<any>;
    updateTenantConfig(tenantId: any, newConfig: any): Promise<any>;
}
//# sourceMappingURL=tenant-onboarding-service.d.ts.map
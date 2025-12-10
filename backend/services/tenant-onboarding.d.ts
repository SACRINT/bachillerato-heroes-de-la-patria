/**
 * Crea un nuevo tenant completo (tenant + usuario admin)
 */
export function onboardNewTenant(data: any): Promise<{
    success: boolean;
    tenant: {
        id: any;
        nombre: any;
        subdomain: any;
        dominio: any;
    };
    admin: {
        email: any;
        userId: any;
    };
    next_steps: string[];
}>;
/**
 * Valida disponibilidad de subdomain
 */
export function checkSubdomainAvailability(subdomain: any): Promise<{
    available: boolean;
    subdomain: any;
    suggested: string;
}>;
/**
 * Elimina un tenant completamente (soft delete)
 */
export function offboardTenant(tenantId: any): Promise<{
    success: boolean;
    tenant_id: any;
    status: string;
    message: string;
}>;
//# sourceMappingURL=tenant-onboarding.d.ts.map
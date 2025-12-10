/**
 * 🎛️ SUPER ADMIN SERVICE - TypeScript
 * Servicio para Panel de Super-Administrador SaaS
 * FASE 5 - Dashboard Multi-Tenant
 * Creado: 07 Diciembre 2025
 */
import { SubscriptionPlan, TenantSubscription } from '../data/subscriptions.dao';
export interface DashboardStats {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    totalStudents: number;
    totalTeachers: number;
    totalUsers: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    growthRate: number;
}
export interface TenantSummary {
    id: number;
    school_name: string;
    domain: string;
    status: string;
    plan_name: string;
    subscription_status: string;
    student_count: number;
    teacher_count: number;
    created_at: Date;
    last_activity: Date | null;
}
export interface RevenueData {
    month: string;
    revenue: number;
    payment_count: number;
}
export interface GrowthData {
    month: string;
    new_tenants: number;
    cumulative_tenants: number;
}
declare class SuperAdminService {
    /**
     * Obtener estadísticas globales del dashboard
     */
    getDashboardStats(): Promise<DashboardStats>;
    /**
     * Listar todos los tenants con resumen
     */
    listTenantsWithSummary(options?: {
        status?: string;
        planId?: number;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        tenants: TenantSummary[];
        total: number;
    }>;
    /**
     * Obtener detalles completos de un tenant
     */
    getTenantDetails(tenantId: number): Promise<any>;
    /**
     * Datos de ingresos para gráficos
     */
    getRevenueChartData(months?: number): Promise<RevenueData[]>;
    /**
     * Datos de crecimiento para gráficos
     */
    getGrowthChartData(months?: number): Promise<GrowthData[]>;
    /**
     * Estadísticas de suscripciones por plan
     */
    getSubscriptionsByPlan(): Promise<any[]>;
    /**
     * Asignar plan a tenant
     */
    assignPlanToTenant(tenantId: number, planId: number, options?: {
        trialDays?: number;
        paymentMethod?: string;
    }): Promise<TenantSubscription>;
    /**
     * Cancelar suscripción de tenant
     */
    cancelTenantSubscription(tenantId: number): Promise<TenantSubscription | null>;
    /**
     * Obtener tenants con suscripciones próximas a expirar
     */
    getExpiringSubscriptions(days?: number): Promise<TenantSubscription[]>;
    /**
     * Obtener planes disponibles
     */
    getPlans(): Promise<SubscriptionPlan[]>;
    /**
     * Crear nuevo plan de suscripción
     */
    createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
    /**
     * Actualizar plan existente
     */
    updatePlan(planId: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null>;
}
declare const superAdminService: SuperAdminService;
export default superAdminService;
export { SuperAdminService };
//# sourceMappingURL=super-admin.service.d.ts.map
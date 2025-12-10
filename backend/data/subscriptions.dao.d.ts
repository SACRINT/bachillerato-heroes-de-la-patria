/**
 * 📊 SUBSCRIPTIONS DAO - TypeScript
 * Data Access Object para gestión de suscripciones SaaS
 * FASE 5 - Super Admin Dashboard
 * Creado: 07 Diciembre 2025
 */
export interface SubscriptionPlan {
    id: number;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    currency: string;
    max_students: number;
    max_teachers: number;
    max_admins: number;
    max_storage_gb: number;
    features: Record<string, any>;
    is_active: boolean;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
}
export interface TenantSubscription {
    id: number;
    tenant_id: number;
    plan_id: number;
    status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
    start_date: Date;
    end_date: Date | null;
    trial_ends_at: Date | null;
    current_period_start: Date | null;
    current_period_end: Date | null;
    cancelled_at: Date | null;
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    payment_method: string | null;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
    plan_name?: string;
    tenant_name?: string;
}
export interface SubscriptionPayment {
    id: number;
    subscription_id: number;
    tenant_id: number;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_method: string | null;
    stripe_payment_id: string | null;
    invoice_number: string | null;
    invoice_url: string | null;
    paid_at: Date | null;
    metadata: Record<string, any>;
    created_at: Date;
}
export interface TenantUsageMetric {
    id: number;
    tenant_id: number;
    metric_date: Date;
    active_users: number;
    total_students: number;
    total_teachers: number;
    total_logins: number;
    api_calls: number;
    storage_used_mb: number;
    iacoins_spent: number;
    iacoins_earned: number;
}
export interface CreateSubscriptionInput {
    tenant_id: number;
    plan_id: number;
    status?: string;
    trial_ends_at?: Date;
    payment_method?: string;
    stripe_customer_id?: string;
}
declare class SubscriptionsDAO {
    static getAllPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]>;
    static getPlanById(planId: number): Promise<SubscriptionPlan | null>;
    static getPlanByName(name: string): Promise<SubscriptionPlan | null>;
    static createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
    static updatePlan(planId: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null>;
    static getTenantSubscription(tenantId: number): Promise<TenantSubscription | null>;
    static getAllSubscriptions(filters?: {
        status?: string;
        planId?: number;
    }): Promise<TenantSubscription[]>;
    static createSubscription(data: CreateSubscriptionInput): Promise<TenantSubscription>;
    static updateSubscription(tenantId: number, data: Partial<TenantSubscription>): Promise<TenantSubscription | null>;
    static cancelSubscription(tenantId: number): Promise<TenantSubscription | null>;
    static recordPayment(data: Partial<SubscriptionPayment>): Promise<SubscriptionPayment>;
    static getTenantPayments(tenantId: number, limit?: number): Promise<SubscriptionPayment[]>;
    static recordUsageMetric(tenantId: number, metrics: Partial<TenantUsageMetric>): Promise<TenantUsageMetric>;
    static getTenantMetrics(tenantId: number, days?: number): Promise<TenantUsageMetric[]>;
    static getGlobalMetrics(days?: number): Promise<any>;
    static getSubscriptionStats(): Promise<any>;
    static getRevenueStats(months?: number): Promise<any[]>;
    static getTenantsGrowth(months?: number): Promise<any[]>;
}
export default SubscriptionsDAO;
//# sourceMappingURL=subscriptions.dao.d.ts.map
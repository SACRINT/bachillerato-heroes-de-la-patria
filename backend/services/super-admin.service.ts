/**
 * 🎛️ SUPER ADMIN SERVICE - TypeScript
 * Servicio para Panel de Super-Administrador SaaS
 * FASE 5 - Dashboard Multi-Tenant
 * Creado: 07 Diciembre 2025
 */

import SubscriptionsDAO, {
    SubscriptionPlan,
    TenantSubscription,
    CreateSubscriptionInput
} from '../data/subscriptions.dao';
import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

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

// =====================================================
// SUPER ADMIN SERVICE CLASS
// =====================================================

class SuperAdminService {

    /**
     * Obtener estadísticas globales del dashboard
     */
    async getDashboardStats(): Promise<DashboardStats> {
        // Contar tenants por status
        const tenantStats = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active') as active,
                COUNT(*) FILTER (WHERE status = 'trial') as trial
            FROM tenants
        `);

        // Contar usuarios globales
        const userStats = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE role = 'estudiante') as students,
                COUNT(*) FILTER (WHERE role = 'docente') as teachers,
                COUNT(*) as total
            FROM usuarios
        `);

        // Ingresos del mes actual
        const revenueStats = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN paid_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly,
                COALESCE(SUM(CASE WHEN paid_at >= DATE_TRUNC('year', CURRENT_DATE) THEN amount ELSE 0 END), 0) as yearly
            FROM subscription_payments
            WHERE status = 'completed'
        `);

        // Calcular tasa de crecimiento (comparando con mes anterior)
        const growthStats = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as this_month,
                COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                    AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as last_month
            FROM tenants
        `);

        const thisMonth = parseInt(growthStats.rows[0].this_month) || 0;
        const lastMonth = parseInt(growthStats.rows[0].last_month) || 1;
        const growthRate = ((thisMonth - lastMonth) / lastMonth) * 100;

        return {
            totalTenants: parseInt(tenantStats.rows[0].total) || 0,
            activeTenants: parseInt(tenantStats.rows[0].active) || 0,
            trialTenants: parseInt(tenantStats.rows[0].trial) || 0,
            totalStudents: parseInt(userStats.rows[0].students) || 0,
            totalTeachers: parseInt(userStats.rows[0].teachers) || 0,
            totalUsers: parseInt(userStats.rows[0].total) || 0,
            monthlyRevenue: parseFloat(revenueStats.rows[0].monthly) || 0,
            yearlyRevenue: parseFloat(revenueStats.rows[0].yearly) || 0,
            growthRate: Math.round(growthRate * 10) / 10
        };
    }

    /**
     * Listar todos los tenants con resumen
     */
    async listTenantsWithSummary(options: {
        status?: string;
        planId?: number;
        search?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ tenants: TenantSummary[]; total: number }> {
        const { status, planId, search, limit = 50, offset = 0 } = options;

        let query = `
            SELECT 
                t.id, t.school_name, t.domain, t.status, t.created_at,
                sp.name as plan_name,
                ts.status as subscription_status,
                (SELECT COUNT(*) FROM usuarios u WHERE u.tenant_id = t.id AND u.role = 'estudiante') as student_count,
                (SELECT COUNT(*) FROM usuarios u WHERE u.tenant_id = t.id AND u.role = 'docente') as teacher_count,
                (SELECT MAX(last_login) FROM usuarios u WHERE u.tenant_id = t.id) as last_activity
            FROM tenants t
            LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
            LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let idx = 1;

        if (status) {
            query += ` AND t.status = $${idx++}`;
            params.push(status);
        }
        if (planId) {
            query += ` AND ts.plan_id = $${idx++}`;
            params.push(planId);
        }
        if (search) {
            query += ` AND (t.school_name ILIKE $${idx} OR t.domain ILIKE $${idx})`;
            params.push(`%${search}%`);
            idx++;
        }

        // Contar total
        const countResult = await pool.query(
            query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM'),
            params
        );
        const total = parseInt(countResult.rows[0].count) || 0;

        // Agregar paginación
        query += ` ORDER BY t.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return { tenants: result.rows, total };
    }

    /**
     * Obtener detalles completos de un tenant
     */
    async getTenantDetails(tenantId: number): Promise<any> {
        // Info básica del tenant
        const tenant = await pool.query(
            'SELECT * FROM tenants WHERE id = $1',
            [tenantId]
        );

        if (!tenant.rows[0]) {
            throw new Error('Tenant no encontrado');
        }

        // Suscripción
        const subscription = await SubscriptionsDAO.getTenantSubscription(tenantId);

        // Estadísticas de usuarios
        const userStats = await pool.query(`
            SELECT 
                role, COUNT(*) as count
            FROM usuarios
            WHERE tenant_id = $1
            GROUP BY role
        `, [tenantId]);

        // Últimos pagos
        const payments = await SubscriptionsDAO.getTenantPayments(tenantId, 5);

        // Métricas de uso
        const metrics = await SubscriptionsDAO.getTenantMetrics(tenantId, 30);

        return {
            tenant: tenant.rows[0],
            subscription,
            userStats: userStats.rows,
            payments,
            metrics
        };
    }

    /**
     * Datos de ingresos para gráficos
     */
    async getRevenueChartData(months: number = 12): Promise<RevenueData[]> {
        const data = await SubscriptionsDAO.getRevenueStats(months);
        return data.map(row => ({
            month: row.month ? new Date(row.month).toISOString().slice(0, 7) : '',
            revenue: parseFloat(row.revenue) || 0,
            payment_count: parseInt(row.payment_count) || 0
        }));
    }

    /**
     * Datos de crecimiento para gráficos
     */
    async getGrowthChartData(months: number = 12): Promise<GrowthData[]> {
        const data = await SubscriptionsDAO.getTenantsGrowth(months);

        let cumulative = 0;
        return data.reverse().map(row => {
            cumulative += parseInt(row.new_tenants) || 0;
            return {
                month: row.month ? new Date(row.month).toISOString().slice(0, 7) : '',
                new_tenants: parseInt(row.new_tenants) || 0,
                cumulative_tenants: cumulative
            };
        }).reverse();
    }

    /**
     * Estadísticas de suscripciones por plan
     */
    async getSubscriptionsByPlan(): Promise<any[]> {
        return SubscriptionsDAO.getSubscriptionStats();
    }

    /**
     * Asignar plan a tenant
     */
    async assignPlanToTenant(tenantId: number, planId: number, options: {
        trialDays?: number;
        paymentMethod?: string;
    } = {}): Promise<TenantSubscription> {
        const existing = await SubscriptionsDAO.getTenantSubscription(tenantId);

        if (existing) {
            // Actualizar suscripción existente
            return (await SubscriptionsDAO.updateSubscription(tenantId, {
                plan_id: planId,
                status: 'active'
            }))!;
        } else {
            // Crear nueva suscripción
            const trialEnds = options.trialDays
                ? new Date(Date.now() + options.trialDays * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 días default

            return SubscriptionsDAO.createSubscription({
                tenant_id: tenantId,
                plan_id: planId,
                status: 'trial',
                trial_ends_at: trialEnds,
                payment_method: options.paymentMethod
            });
        }
    }

    /**
     * Cancelar suscripción de tenant
     */
    async cancelTenantSubscription(tenantId: number): Promise<TenantSubscription | null> {
        return SubscriptionsDAO.cancelSubscription(tenantId);
    }

    /**
     * Obtener tenants con suscripciones próximas a expirar
     */
    async getExpiringSubscriptions(days: number = 7): Promise<TenantSubscription[]> {
        const result = await pool.query(`
            SELECT ts.*, sp.name as plan_name, t.school_name as tenant_name
            FROM tenant_subscriptions ts
            JOIN subscription_plans sp ON ts.plan_id = sp.id
            JOIN tenants t ON ts.tenant_id = t.id
            WHERE ts.status = 'trial' 
            AND ts.trial_ends_at <= CURRENT_TIMESTAMP + INTERVAL '${days} days'
            AND ts.trial_ends_at > CURRENT_TIMESTAMP
            ORDER BY ts.trial_ends_at ASC
        `);
        return result.rows;
    }

    /**
     * Obtener planes disponibles
     */
    async getPlans(): Promise<SubscriptionPlan[]> {
        return SubscriptionsDAO.getAllPlans(true);
    }

    /**
     * Crear nuevo plan de suscripción
     */
    async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
        return SubscriptionsDAO.createPlan(data);
    }

    /**
     * Actualizar plan existente
     */
    async updatePlan(planId: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
        return SubscriptionsDAO.updatePlan(planId, data);
    }
}

// =====================================================
// EXPORTS
// =====================================================

const superAdminService = new SuperAdminService();

export default superAdminService;
export { SuperAdminService };

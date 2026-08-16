"use strict";
/**
 * 🎛️ SUPER ADMIN SERVICE - TypeScript
 * Servicio para Panel de Super-Administrador SaaS
 * FASE 5 - Dashboard Multi-Tenant
 * Creado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const subscriptions_dao_1 = __importDefault(require('../data/subscriptions.dao.js'));
const database_1 = require('../config/database.js');
// =====================================================
// SUPER ADMIN SERVICE CLASS
// =====================================================
class SuperAdminService {
    /**
     * Obtener estadísticas globales del dashboard
     */
    async getDashboardStats() {
        // Contar tenants por status
        const tenantStats = await database_1.pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active') as active,
                COUNT(*) FILTER (WHERE status = 'trial') as trial
            FROM tenants
        `);
        // Contar usuarios globales
        const userStats = await database_1.pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE role = 'estudiante') as students,
                COUNT(*) FILTER (WHERE role = 'docente') as teachers,
                COUNT(*) as total
            FROM usuarios
        `);
        // Ingresos del mes actual
        const revenueStats = await database_1.pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN paid_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly,
                COALESCE(SUM(CASE WHEN paid_at >= DATE_TRUNC('year', CURRENT_DATE) THEN amount ELSE 0 END), 0) as yearly
            FROM subscription_payments
            WHERE status = 'completed'
        `);
        // Calcular tasa de crecimiento (comparando con mes anterior)
        const growthStats = await database_1.pool.query(`
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
    async listTenantsWithSummary(options = {}) {
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
        const params = [];
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
        const countResult = await database_1.pool.query(query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM'), params);
        const total = parseInt(countResult.rows[0].count) || 0;
        // Agregar paginación
        query += ` ORDER BY t.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(limit, offset);
        const result = await database_1.pool.query(query, params);
        return { tenants: result.rows, total };
    }
    /**
     * Obtener detalles completos de un tenant
     */
    async getTenantDetails(tenantId) {
        // Info básica del tenant
        const tenant = await database_1.pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (!tenant.rows[0]) {
            throw new Error('Tenant no encontrado');
        }
        // Suscripción
        const subscription = await subscriptions_dao_1.default.getTenantSubscription(tenantId);
        // Estadísticas de usuarios
        const userStats = await database_1.pool.query(`
            SELECT 
                role, COUNT(*) as count
            FROM usuarios
            WHERE tenant_id = $1
            GROUP BY role
        `, [tenantId]);
        // Últimos pagos
        const payments = await subscriptions_dao_1.default.getTenantPayments(tenantId, 5);
        // Métricas de uso
        const metrics = await subscriptions_dao_1.default.getTenantMetrics(tenantId, 30);
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
    async getRevenueChartData(months = 12) {
        const data = await subscriptions_dao_1.default.getRevenueStats(months);
        return data.map(row => ({
            month: row.month ? new Date(row.month).toISOString().slice(0, 7) : '',
            revenue: parseFloat(row.revenue) || 0,
            payment_count: parseInt(row.payment_count) || 0
        }));
    }
    /**
     * Datos de crecimiento para gráficos
     */
    async getGrowthChartData(months = 12) {
        const data = await subscriptions_dao_1.default.getTenantsGrowth(months);
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
    async getSubscriptionsByPlan() {
        return subscriptions_dao_1.default.getSubscriptionStats();
    }
    /**
     * Asignar plan a tenant
     */
    async assignPlanToTenant(tenantId, planId, options = {}) {
        const existing = await subscriptions_dao_1.default.getTenantSubscription(tenantId);
        if (existing) {
            // Actualizar suscripción existente
            return (await subscriptions_dao_1.default.updateSubscription(tenantId, {
                plan_id: planId,
                status: 'active'
            }));
        }
        else {
            // Crear nueva suscripción
            const trialEnds = options.trialDays
                ? new Date(Date.now() + options.trialDays * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 días default
            return subscriptions_dao_1.default.createSubscription({
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
    async cancelTenantSubscription(tenantId) {
        return subscriptions_dao_1.default.cancelSubscription(tenantId);
    }
    /**
     * Obtener tenants con suscripciones próximas a expirar
     */
    async getExpiringSubscriptions(days = 7) {
        const result = await database_1.pool.query(`
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
    async getPlans() {
        return subscriptions_dao_1.default.getAllPlans(true);
    }
    /**
     * Crear nuevo plan de suscripción
     */
    async createPlan(data) {
        return subscriptions_dao_1.default.createPlan(data);
    }
    /**
     * Actualizar plan existente
     */
    async updatePlan(planId, data) {
        return subscriptions_dao_1.default.updatePlan(planId, data);
    }
}
exports.SuperAdminService = SuperAdminService;
// =====================================================
// EXPORTS
// =====================================================
const superAdminService = new SuperAdminService();
exports.default = superAdminService;
//# sourceMappingURL=super-admin.service.js.map
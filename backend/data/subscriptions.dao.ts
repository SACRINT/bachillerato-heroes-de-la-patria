/**
 * 📊 SUBSCRIPTIONS DAO - TypeScript
 * Data Access Object para gestión de suscripciones SaaS
 * FASE 5 - Super Admin Dashboard
 * Creado: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

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
    // Joined fields
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

// =====================================================
// SUBSCRIPTIONS DAO CLASS
// =====================================================

class SubscriptionsDAO {

    // ==================== PLANES ====================

    static async getAllPlans(activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
        const query = activeOnly
            ? 'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY sort_order'
            : 'SELECT * FROM subscription_plans ORDER BY sort_order';
        const result = await pool.query(query);
        return result.rows;
    }

    static async getPlanById(planId: number): Promise<SubscriptionPlan | null> {
        const result = await pool.query(
            'SELECT * FROM subscription_plans WHERE id = $1',
            [planId]
        );
        return result.rows[0] || null;
    }

    static async getPlanByName(name: string): Promise<SubscriptionPlan | null> {
        const result = await pool.query(
            'SELECT * FROM subscription_plans WHERE name = $1',
            [name]
        );
        return result.rows[0] || null;
    }

    static async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
        const result = await pool.query(`
            INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, currency, 
                max_students, max_teachers, max_admins, max_storage_gb, features, is_active, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [
            data.name, data.description, data.price_monthly, data.price_yearly, data.currency || 'MXN',
            data.max_students, data.max_teachers, data.max_admins, data.max_storage_gb,
            JSON.stringify(data.features || {}), data.is_active ?? true, data.sort_order || 0
        ]);
        return result.rows[0];
    }

    static async updatePlan(planId: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
        if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
        if (data.price_monthly !== undefined) { fields.push(`price_monthly = $${idx++}`); values.push(data.price_monthly); }
        if (data.price_yearly !== undefined) { fields.push(`price_yearly = $${idx++}`); values.push(data.price_yearly); }
        if (data.max_students !== undefined) { fields.push(`max_students = $${idx++}`); values.push(data.max_students); }
        if (data.max_teachers !== undefined) { fields.push(`max_teachers = $${idx++}`); values.push(data.max_teachers); }
        if (data.features !== undefined) { fields.push(`features = $${idx++}`); values.push(JSON.stringify(data.features)); }
        if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(data.is_active); }

        if (fields.length === 0) return this.getPlanById(planId);

        values.push(planId);
        const result = await pool.query(
            `UPDATE subscription_plans SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    // ==================== SUSCRIPCIONES DE TENANTS ====================

    static async getTenantSubscription(tenantId: number): Promise<TenantSubscription | null> {
        const result = await pool.query(`
            SELECT ts.*, sp.name as plan_name, t.school_name as tenant_name
            FROM tenant_subscriptions ts
            JOIN subscription_plans sp ON ts.plan_id = sp.id
            JOIN tenants t ON ts.tenant_id = t.id
            WHERE ts.tenant_id = $1
        `, [tenantId]);
        return result.rows[0] || null;
    }

    static async getAllSubscriptions(filters: { status?: string; planId?: number } = {}): Promise<TenantSubscription[]> {
        let query = `
            SELECT ts.*, sp.name as plan_name, t.school_name as tenant_name
            FROM tenant_subscriptions ts
            JOIN subscription_plans sp ON ts.plan_id = sp.id
            JOIN tenants t ON ts.tenant_id = t.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let idx = 1;

        if (filters.status) {
            query += ` AND ts.status = $${idx++}`;
            params.push(filters.status);
        }
        if (filters.planId) {
            query += ` AND ts.plan_id = $${idx++}`;
            params.push(filters.planId);
        }

        query += ' ORDER BY ts.created_at DESC';
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async createSubscription(data: CreateSubscriptionInput): Promise<TenantSubscription> {
        const trialDays = 14;
        const trialEnds = data.trial_ends_at || new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

        const result = await pool.query(`
            INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, trial_ends_at, payment_method, stripe_customer_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            data.tenant_id, data.plan_id, data.status || 'trial',
            trialEnds, data.payment_method || null, data.stripe_customer_id || null
        ]);
        return result.rows[0];
    }

    static async updateSubscription(tenantId: number, data: Partial<TenantSubscription>): Promise<TenantSubscription | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (data.plan_id !== undefined) { fields.push(`plan_id = $${idx++}`); values.push(data.plan_id); }
        if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
        if (data.end_date !== undefined) { fields.push(`end_date = $${idx++}`); values.push(data.end_date); }
        if (data.cancelled_at !== undefined) { fields.push(`cancelled_at = $${idx++}`); values.push(data.cancelled_at); }
        if (data.stripe_subscription_id !== undefined) { fields.push(`stripe_subscription_id = $${idx++}`); values.push(data.stripe_subscription_id); }
        if (data.payment_method !== undefined) { fields.push(`payment_method = $${idx++}`); values.push(data.payment_method); }

        if (fields.length === 0) return this.getTenantSubscription(tenantId);

        values.push(tenantId);
        const result = await pool.query(
            `UPDATE tenant_subscriptions SET ${fields.join(', ')} WHERE tenant_id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    static async cancelSubscription(tenantId: number): Promise<TenantSubscription | null> {
        const result = await pool.query(`
            UPDATE tenant_subscriptions 
            SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP 
            WHERE tenant_id = $1 
            RETURNING *
        `, [tenantId]);
        return result.rows[0] || null;
    }

    // ==================== PAGOS ====================

    static async recordPayment(data: Partial<SubscriptionPayment>): Promise<SubscriptionPayment> {
        const result = await pool.query(`
            INSERT INTO subscription_payments 
            (subscription_id, tenant_id, amount, currency, status, payment_method, stripe_payment_id, invoice_number, paid_at, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            data.subscription_id, data.tenant_id, data.amount, data.currency || 'MXN',
            data.status || 'pending', data.payment_method, data.stripe_payment_id,
            data.invoice_number, data.paid_at, JSON.stringify(data.metadata || {})
        ]);
        return result.rows[0];
    }

    static async getTenantPayments(tenantId: number, limit: number = 20): Promise<SubscriptionPayment[]> {
        const result = await pool.query(
            'SELECT * FROM subscription_payments WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2',
            [tenantId, limit]
        );
        return result.rows;
    }

    // ==================== MÉTRICAS ====================

    static async recordUsageMetric(tenantId: number, metrics: Partial<TenantUsageMetric>): Promise<TenantUsageMetric> {
        const today = new Date().toISOString().split('T')[0];
        const result = await pool.query(`
            INSERT INTO tenant_usage_metrics (tenant_id, metric_date, active_users, total_students, total_teachers, 
                total_logins, api_calls, storage_used_mb, iacoins_spent, iacoins_earned)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (tenant_id, metric_date) 
            DO UPDATE SET 
                active_users = EXCLUDED.active_users,
                total_students = EXCLUDED.total_students,
                total_teachers = EXCLUDED.total_teachers,
                total_logins = tenant_usage_metrics.total_logins + EXCLUDED.total_logins,
                api_calls = tenant_usage_metrics.api_calls + EXCLUDED.api_calls,
                storage_used_mb = EXCLUDED.storage_used_mb,
                iacoins_spent = tenant_usage_metrics.iacoins_spent + EXCLUDED.iacoins_spent,
                iacoins_earned = tenant_usage_metrics.iacoins_earned + EXCLUDED.iacoins_earned
            RETURNING *
        `, [
            tenantId, today, metrics.active_users || 0, metrics.total_students || 0,
            metrics.total_teachers || 0, metrics.total_logins || 0, metrics.api_calls || 0,
            metrics.storage_used_mb || 0, metrics.iacoins_spent || 0, metrics.iacoins_earned || 0
        ]);
        return result.rows[0];
    }

    static async getTenantMetrics(tenantId: number, days: number = 30): Promise<TenantUsageMetric[]> {
        const numDays = Number(days) || 30;
        const result = await pool.query(`
            SELECT * FROM tenant_usage_metrics 
            WHERE tenant_id = $1 AND metric_date >= CURRENT_DATE - make_interval(days => $2)
            ORDER BY metric_date DESC
        `, [tenantId, numDays]);
        return result.rows;
    }

    static async getGlobalMetrics(days: number = 30): Promise<any> {
        const numDays = Number(days) || 30;
        const result = await pool.query(`
            SELECT 
                SUM(active_users) as total_active_users,
                SUM(total_students) as total_students,
                SUM(total_teachers) as total_teachers,
                SUM(total_logins) as total_logins,
                SUM(api_calls) as total_api_calls,
                SUM(iacoins_spent) as total_iacoins_spent,
                SUM(iacoins_earned) as total_iacoins_earned
            FROM tenant_usage_metrics
            WHERE metric_date >= CURRENT_DATE - make_interval(days => $1)
        `, [numDays]);
        return result.rows[0];
    }

    // ==================== ESTADÍSTICAS PARA DASHBOARD ====================

    static async getSubscriptionStats(): Promise<any> {
        const result = await pool.query(`
            SELECT 
                sp.name as plan_name,
                COUNT(ts.id) as subscriber_count,
                SUM(CASE WHEN ts.status = 'active' THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN ts.status = 'trial' THEN 1 ELSE 0 END) as trial_count,
                sp.price_monthly
            FROM subscription_plans sp
            LEFT JOIN tenant_subscriptions ts ON sp.id = ts.plan_id
            GROUP BY sp.id, sp.name, sp.price_monthly, sp.sort_order
            ORDER BY sp.sort_order
        `);
        return result.rows;
    }

    static async getRevenueStats(months: number = 12): Promise<any[]> {
        const numMonths = Number(months) || 12;
        const result = await pool.query(`
            SELECT 
                DATE_TRUNC('month', paid_at) as month,
                SUM(amount) as revenue,
                COUNT(*) as payment_count
            FROM subscription_payments
            WHERE status = 'completed' 
            AND paid_at >= CURRENT_DATE - make_interval(months => $1)
            GROUP BY DATE_TRUNC('month', paid_at)
            ORDER BY month DESC
        `, [numMonths]);
        return result.rows;
    }

    static async getTenantsGrowth(months: number = 12): Promise<any[]> {
        const numMonths = Number(months) || 12;
        const result = await pool.query(`
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as new_tenants
            FROM tenants
            WHERE created_at >= CURRENT_DATE - make_interval(months => $1)
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC
        `, [numMonths]);
        return result.rows;
    }
}

export default SubscriptionsDAO;
module.exports = SubscriptionsDAO;

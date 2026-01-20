/**
 * Multi-Tenant SaaS Service
 * Sistema completo de multi-tenancy con onboarding, suscripciones y facturación
 */

import { executeQuery } from '../config/database';
import StripeIntegrationService from './stripe-integration.service';

// ============================================
// TENANT MANAGEMENT SERVICE
// ============================================

export interface Tenant {
    id?: number;
    nombre_escuela: string;
    slug: string; // URL-friendly identifier
    email_admin: string;
    telefono: string;
    direccion: string;

    // Branding
    logo_url?: string;
    color_primario?: string;
    color_secundario?: string;
    favicon_url?: string;

    // Configuración
    dominio_personalizado?: string;
    subdominio: string; // escuela.heroespatria.edu.mx
    max_estudiantes: number;
    max_docentes: number;

    // Status
    status: 'trial' | 'active' | 'suspended' | 'cancelled';
    fecha_registro: Date;
    fecha_inicio_trial: Date;
    fecha_fin_trial: Date;
}

class TenantService {
    /**
     * Onboarding de nueva escuela
     */
    async onboardSchool(data: {
        nombre_escuela: string;
        email_admin: string;
        telefono: string;
        direccion: string;
        plan_id: number;
    }): Promise<any> {
        // Generar slug único
        const slug = this.generateSlug(data.nombre_escuela);
        const subdominio = slug;

        // Verificar disponibilidad
        const existing = await executeQuery(
            'SELECT id FROM tenants WHERE slug = $1 OR subdominio = $2',
            [slug, subdominio]
        ) as any[];

        if (existing.length > 0) {
            throw new Error('Nombre de escuela ya existe');
        }

        // Obtener configuración del plan
        const plan = await executeQuery('SELECT * FROM subscription_plans WHERE id = $1', [data.plan_id]) as any[];
        if (!plan || plan.length === 0) throw new Error('Plan no encontrado');

        // Crear tenant
        const trialDays = 30;
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialDays);

        const tenant = await executeQuery(`
            INSERT INTO tenants (
                nombre_escuela, slug, subdominio, email_admin, telefono, direccion,
                max_estudiantes, max_docentes, status, 
                fecha_registro, fecha_inicio_trial, fecha_fin_trial
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'trial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $9)
            RETURNING *
        `, [
            data.nombre_escuela,
            slug,
            subdominio,
            data.email_admin,
            data.telefono,
            data.direccion,
            plan[0].max_estudiantes,
            plan[0].max_docentes,
            trialEnd
        ]) as any[];

        // Crear usuario super-admin para el tenant
        await this.createTenantAdmin(tenant[0].id, data.email_admin);

        // Crear suscripción en estado trial
        await executeQuery(`
            INSERT INTO tenant_subscriptions (
                tenant_id, plan_id, status, fecha_inicio, fecha_fin
            ) VALUES ($1, $2, 'trial', CURRENT_TIMESTAMP, $3)
        `, [tenant[0].id, data.plan_id, trialEnd]);

        // Enviar email de bienvenida
        await this.sendWelcomeEmail(tenant[0]);

        return {
            tenant: tenant[0],
            credentials: {
                url: `https://${subdominio}.heroespatria.edu.mx`,
                trial_days: trialDays
            }
        };
    }

    /**
     * Personalizar branding del tenant
     */
    async updateBranding(tenantId: number, branding: {
        logo_url?: string;
        color_primario?: string;
        color_secundario?: string;
        favicon_url?: string;
        dominio_personalizado?: string;
    }): Promise<any> {
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (branding.logo_url) {
            updates.push(`logo_url = $${paramIndex}`);
            params.push(branding.logo_url);
            paramIndex++;
        }
        if (branding.color_primario) {
            updates.push(`color_primario = $${paramIndex}`);
            params.push(branding.color_primario);
            paramIndex++;
        }
        if (branding.color_secundario) {
            updates.push(`color_secundario = $${paramIndex}`);
            params.push(branding.color_secundario);
            paramIndex++;
        }
        if (branding.favicon_url) {
            updates.push(`favicon_url = $${paramIndex}`);
            params.push(branding.favicon_url);
            paramIndex++;
        }
        if (branding.dominio_personalizado) {
            updates.push(`dominio_personalizado = $${paramIndex}`);
            params.push(branding.dominio_personalizado);
            paramIndex++;
        }

        params.push(tenantId);

        const result = await executeQuery(`
            UPDATE tenants
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `, params) as any[];

        return result[0];
    }

    /**
     * Obtener configuración del tenant para frontend
     */
    async getTenantConfig(identifier: string): Promise<any> {
        // Buscar por slug, subdominio o dominio personalizado
        const tenant = await executeQuery(`
            SELECT * FROM tenants
            WHERE slug = $1 OR subdominio = $1 OR dominio_personalizado = $1
        `, [identifier]) as any[];

        if (!tenant || tenant.length === 0) {
            throw new Error('Escuela no encontrada');
        }

        return {
            nombre: tenant[0].nombre_escuela,
            logo: tenant[0].logo_url,
            colores: {
                primario: tenant[0].color_primario || '#1e40af',
                secundario: tenant[0].color_secundario || '#3b82f6'
            },
            favicon: tenant[0].favicon_url,
            status: tenant[0].status
        };
    }

    /**
     * Crear admin inicial del tenant
     */
    private async createTenantAdmin(tenantId: number, email: string): Promise<void> {
        const tempPassword = this.generateTempPassword();

        await executeQuery(`
            INSERT INTO usuarios (tenant_id, email, password, role, email_verified, created_at)
            VALUES ($1, $2, $3, 'tenant_admin', false, CURRENT_TIMESTAMP)
        `, [tenantId, email, tempPassword]); // En producción, hashear password

        // Enviar email con credenciales temporales
        console.log(`Credenciales temporales para ${email}: ${tempPassword}`);
    }

    private generateSlug(nombre: string): string {
        return nombre
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private generateTempPassword(): string {
        return Math.random().toString(36).slice(-10);
    }

    private async sendWelcomeEmail(tenant: any): Promise<void> {
        // TODO: Implementar envío de email
        console.log(`Bienvenida enviada a ${tenant.email_admin}`);
    }
}

// ============================================
// SUBSCRIPTION PLANS SERVICE
// ============================================

export interface SubscriptionPlan {
    id?: number;
    nombre: string;
    descripcion: string;
    precio_mensual: number;
    precio_anual: number;
    max_estudiantes: number;
    max_docentes: number;
    features: string[];
    activo: boolean;
}

class SubscriptionPlansService {
    async getPlans(): Promise<SubscriptionPlan[]> {
        return await executeQuery(`
            SELECT * FROM subscription_plans WHERE activo = true ORDER BY precio_mensual ASC
        `, []) as SubscriptionPlan[];
    }

    async subscribeTenant(tenantId: number, planId: number, billingCycle: 'monthly' | 'annual'): Promise<any> {
        const plan = await executeQuery('SELECT * FROM subscription_plans WHERE id = $1', [planId]) as any[];
        if (!plan || plan.length === 0) throw new Error('Plan no encontrado');

        const amount = billingCycle === 'monthly' ? plan[0].precio_mensual : plan[0].precio_anual;
        const endDate = new Date();
        if (billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        // Crear sesión de pago con Stripe
        const payment = await StripeIntegrationService.createCheckoutSession({
            type: 'inscripcion', // Reutilizamos el tipo
            amount,
            description: `Suscripción ${plan[0].nombre} - ${billingCycle}`,
            metadata: {
                tenant_id: tenantId,
                plan_id: planId,
                billing_cycle: billingCycle,
                tipo: 'tenant_subscription'
            },
            success_url: `${process.env.FRONTEND_URL}/admin/subscription/success`,
            cancel_url: `${process.env.FRONTEND_URL}/admin/subscription/cancel`
        });

        // Actualizar suscripción
        await executeQuery(`
            UPDATE tenant_subscriptions
            SET plan_id = =$1, billing_cycle = $2, status = 'pending_payment'
            WHERE tenant_id = $3
        `, [planId, billingCycle, tenantId]);

        return payment;
    }
}

// ============================================
// USAGE TRACKING SERVICE
// ============================================

class UsageTrackingService {
    async trackUsage(tenantId: number, metric: string, value: number): Promise<void> {
        await executeQuery(`
            INSERT INTO usage_metrics (tenant_id, metric, value, fecha)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [tenantId, metric, value]);
    }

    async getTenantUsage(tenantId: number, period: 'day' | 'month' | 'year'): Promise<any> {
        let dateFilter = '';
        if (period === 'day') dateFilter = "AND fecha >= CURRENT_DATE";
        else if (period === 'month') dateFilter = "AND fecha >= DATE_TRUNC('month', CURRENT_DATE)";
        else dateFilter = "AND fecha >= DATE_TRUNC('year', CURRENT_DATE)";

        const metrics = await executeQuery(`
            SELECT 
                metric,
                SUM(value) as total,
                AVG(value) as promedio,
                MAX(value) as pico
            FROM usage_metrics
            WHERE tenant_id = $1 ${dateFilter}
            GROUP BY metric
        `, [tenantId]) as any[];

        // Obtener conteos actuales
        const [students, teachers, storage] = await Promise.all([
            executeQuery('SELECT COUNT(*) as total FROM estudiantes WHERE tenant_id = $1', [tenantId]),
            executeQuery('SELECT COUNT(*) as total FROM docentes WHERE tenant_id = $1', [tenantId]),
            executeQuery('SELECT COALESCE(SUM(tamano_bytes), 0) as total FROM documentos_inscripcion di JOIN solicitudes_inscripcion si ON di.solicitud_id = si.id WHERE si.tenant_id = $1', [tenantId])
        ]);

        return {
            estudiantes_activos: (students as any[])[0]?.total || 0,
            docentes_activos: (teachers as any[])[0]?.total || 0,
            almacenamiento_usado: (storage as any[])[0]?.total || 0,
            metricas_periodo: metrics
        };
    }

    async checkLimits(tenantId: number): Promise<any> {
        const tenant = await executeQuery('SELECT * FROM tenants WHERE id = $1', [tenantId]) as any[];
        const usage = await this.getTenantUsage(tenantId, 'month');

        return {
            estudiantes: {
                actual: usage.estudiantes_activos,
                limite: tenant[0].max_estudiantes,
                porcentaje: (usage.estudiantes_activos / tenant[0].max_estudiantes) * 100
            },
            docentes: {
                actual: usage.docentes_activos,
                limite: tenant[0].max_docentes,
                porcentaje: (usage.docentes_activos / tenant[0].max_docentes) * 100
            }
        };
    }
}

// ============================================
// BILLING SERVICE
// ============================================

class BillingService {
    async generateInvoice(tenantId: number, subscriptionId: number): Promise<any> {
        const subscription = await executeQuery(`
            SELECT ts.*, sp.nombre as plan_nombre, sp.precio_mensual, sp.precio_anual
            FROM tenant_subscriptions ts
            JOIN subscription_plans sp ON ts.plan_id = sp.id
            WHERE ts.id = $1 AND ts.tenant_id = $2
        `, [subscriptionId, tenantId]) as any[];

        if (!subscription || subscription.length === 0) {
            throw new Error('Suscripción no encontrada');
        }

        const sub = subscription[0];
        const amount = sub.billing_cycle === 'monthly' ? sub.precio_mensual : sub.precio_anual;

        // Crear factura
        const invoice = await executeQuery(`
            INSERT INTO tenant_invoices (
                tenant_id, subscription_id, monto, concepto,
                fecha_emision, fecha_vencimiento, status
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '15 days', 'pendiente')
            RETURNING *
        `, [
            tenantId,
            subscriptionId,
            amount,
            `Suscripción ${sub.plan_nombre} - ${sub.billing_cycle}`
        ]) as any[];

        // Enviar email con factura
        await this.sendInvoiceEmail(invoice[0]);

        return invoice[0];
    }

    async processPayment(invoiceId: number): Promise<void> {
        await executeQuery(`
            UPDATE tenant_invoices
            SET status = 'pagada', fecha_pago = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [invoiceId]);
    }

    async getTenantInvoices(tenantId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM tenant_invoices
            WHERE tenant_id = $1
            ORDER BY fecha_emision DESC
        `, [tenantId]) as any[];
    }

    private async sendInvoiceEmail(invoice: any): Promise<void> {
        console.log(`Factura ${invoice.id} enviada`);
    }
}

// ============================================
// SUPER ADMIN SERVICE
// ============================================

class SuperAdminService {
    async getDashboardStats(): Promise<any> {
        const [tenants, subscriptions, revenue, usage] = await Promise.all([
            executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as activos,
                    COUNT(CASE WHEN status = 'trial' THEN 1 END) as en_trial,
                    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspendidos
                FROM tenants
            `, []),
            executeQuery(`
                SELECT 
                    sp.nombre as plan,
                    COUNT(*) as escuelas
                FROM tenant_subscriptions ts
                JOIN subscription_plans sp ON ts.plan_id = sp.id
                WHERE ts.status = 'active'
                GROUP BY sp.nombre
            `, []),
            executeQuery(`
                SELECT 
                    SUM(monto) as total,
                    COUNT(*) as facturas_pagadas
                FROM tenant_invoices
                WHERE status = 'pagada'
            `, []),
            executeQuery(`
                SELECT 
                    SUM((SELECT COUNT(*) FROM estudiantes WHERE tenant_id = t.id)) as total_estudiantes,
                    SUM((SELECT COUNT(*) FROM docentes WHERE tenant_id = t.id)) as total_docentes
                FROM tenants t
                WHERE status = 'active'
            `, [])
        ]);

        return {
            tenants: (tenants as any[])[0],
            suscripciones_por_plan: subscriptions,
            ingresos: (revenue as any[])[0],
            uso_global: (usage as any[])[0]
        };
    }

    async getAllTenants(filters?: { status?: string }): Promise<any[]> {
        let query = `
            SELECT 
                t.*,
                ts.status as subscription_status,
                sp.nombre as plan_nombre,
                (SELECT COUNT(*) FROM estudiantes WHERE tenant_id = t.id) as total_estudiantes,
                (SELECT COUNT(*) FROM docentes WHERE tenant_id = t.id) as total_docentes
            FROM tenants t
            LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
            LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters?.status) {
            query += ' AND t.status = $1';
            params.push(filters.status);
        }

        query += ' ORDER BY t.fecha_registro DESC';

        return await executeQuery(query, params) as any[];
    }

    async suspendTenant(tenantId: number, reason: string): Promise<void> {
        await executeQuery(`
            UPDATE tenants
            SET status = 'suspended', suspension_reason = $2
            WHERE id = $1
        `, [tenantId, reason]);
    }

    async activateTenant(tenantId: number): Promise<void> {
        await executeQuery(`
            UPDATE tenants
            SET status = 'active', suspension_reason = NULL
            WHERE id = $1
        `, [tenantId]);
    }
}

// Export instances
export const tenantService = new TenantService();
export const subscriptionPlansService = new SubscriptionPlansService();
export const usageTrackingService = new UsageTrackingService();
export const billingService = new BillingService();
export const superAdminService = new SuperAdminService();

"use strict";
/**
 * Multi-Tenant SaaS Service
 * Sistema completo de multi-tenancy con onboarding, suscripciones y facturación
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminService = exports.billingService = exports.usageTrackingService = exports.subscriptionPlansService = exports.tenantService = void 0;
const database_1 = require("../config/database");
const stripe_integration_service_1 = __importDefault(require("./stripe-integration.service"));
class TenantService {
    /**
     * Onboarding de nueva escuela
     */
    async onboardSchool(data) {
        // Generar slug único
        const slug = this.generateSlug(data.nombre_escuela);
        const subdominio = slug;
        // Verificar disponibilidad
        const existing = await (0, database_1.executeQuery)('SELECT id FROM tenants WHERE slug = $1 OR subdominio = $2', [slug, subdominio]);
        if (existing.length > 0) {
            throw new Error('Nombre de escuela ya existe');
        }
        // Obtener configuración del plan
        const plan = await (0, database_1.executeQuery)('SELECT * FROM subscription_plans WHERE id = $1', [data.plan_id]);
        if (!plan || plan.length === 0)
            throw new Error('Plan no encontrado');
        // Crear tenant
        const trialDays = 30;
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        const tenant = await (0, database_1.executeQuery)(`
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
        ]);
        // Crear usuario super-admin para el tenant
        await this.createTenantAdmin(tenant[0].id, data.email_admin);
        // Crear suscripción en estado trial
        await (0, database_1.executeQuery)(`
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
    async updateBranding(tenantId, branding) {
        const updates = [];
        const params = [];
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
        const result = await (0, database_1.executeQuery)(`
            UPDATE tenants
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `, params);
        return result[0];
    }
    /**
     * Obtener configuración del tenant para frontend
     */
    async getTenantConfig(identifier) {
        // Buscar por slug, subdominio o dominio personalizado
        const tenant = await (0, database_1.executeQuery)(`
            SELECT * FROM tenants
            WHERE slug = $1 OR subdominio = $1 OR dominio_personalizado = $1
        `, [identifier]);
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
    async createTenantAdmin(tenantId, email) {
        const tempPassword = this.generateTempPassword();
        await (0, database_1.executeQuery)(`
            INSERT INTO usuarios (tenant_id, email, password, role, email_verified, created_at)
            VALUES ($1, $2, $3, 'tenant_admin', false, CURRENT_TIMESTAMP)
        `, [tenantId, email, tempPassword]); // En producción, hashear password
        // Enviar email con credenciales temporales
        console.log(`Credenciales temporales para ${email}: ${tempPassword}`);
    }
    generateSlug(nombre) {
        return nombre
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    generateTempPassword() {
        return Math.random().toString(36).slice(-10);
    }
    async sendWelcomeEmail(tenant) {
        // TODO: Implementar envío de email
        console.log(`Bienvenida enviada a ${tenant.email_admin}`);
    }
}
class SubscriptionPlansService {
    async getPlans() {
        return await (0, database_1.executeQuery)(`
            SELECT * FROM subscription_plans WHERE activo = true ORDER BY precio_mensual ASC
        `, []);
    }
    async subscribeTenant(tenantId, planId, billingCycle) {
        const plan = await (0, database_1.executeQuery)('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
        if (!plan || plan.length === 0)
            throw new Error('Plan no encontrado');
        const amount = billingCycle === 'monthly' ? plan[0].precio_mensual : plan[0].precio_anual;
        const endDate = new Date();
        if (billingCycle === 'monthly')
            endDate.setMonth(endDate.getMonth() + 1);
        else
            endDate.setFullYear(endDate.getFullYear() + 1);
        // Crear sesión de pago con Stripe
        const payment = await stripe_integration_service_1.default.createCheckoutSession({
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
        await (0, database_1.executeQuery)(`
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
    async trackUsage(tenantId, metric, value) {
        await (0, database_1.executeQuery)(`
            INSERT INTO usage_metrics (tenant_id, metric, value, fecha)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [tenantId, metric, value]);
    }
    async getTenantUsage(tenantId, period) {
        var _a, _b, _c;
        let dateFilter = '';
        if (period === 'day')
            dateFilter = "AND fecha >= CURRENT_DATE";
        else if (period === 'month')
            dateFilter = "AND fecha >= DATE_TRUNC('month', CURRENT_DATE)";
        else
            dateFilter = "AND fecha >= DATE_TRUNC('year', CURRENT_DATE)";
        const metrics = await (0, database_1.executeQuery)(`
            SELECT 
                metric,
                SUM(value) as total,
                AVG(value) as promedio,
                MAX(value) as pico
            FROM usage_metrics
            WHERE tenant_id = $1 ${dateFilter}
            GROUP BY metric
        `, [tenantId]);
        // Obtener conteos actuales
        const [students, teachers, storage] = await Promise.all([
            (0, database_1.executeQuery)('SELECT COUNT(*) as total FROM estudiantes WHERE tenant_id = $1', [tenantId]),
            (0, database_1.executeQuery)('SELECT COUNT(*) as total FROM docentes WHERE tenant_id = $1', [tenantId]),
            (0, database_1.executeQuery)('SELECT COALESCE(SUM(tamano_bytes), 0) as total FROM documentos_inscripcion di JOIN solicitudes_inscripcion si ON di.solicitud_id = si.id WHERE si.tenant_id = $1', [tenantId])
        ]);
        return {
            estudiantes_activos: ((_a = students[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            docentes_activos: ((_b = teachers[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
            almacenamiento_usado: ((_c = storage[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
            metricas_periodo: metrics
        };
    }
    async checkLimits(tenantId) {
        const tenant = await (0, database_1.executeQuery)('SELECT * FROM tenants WHERE id = $1', [tenantId]);
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
    async generateInvoice(tenantId, subscriptionId) {
        const subscription = await (0, database_1.executeQuery)(`
            SELECT ts.*, sp.nombre as plan_nombre, sp.precio_mensual, sp.precio_anual
            FROM tenant_subscriptions ts
            JOIN subscription_plans sp ON ts.plan_id = sp.id
            WHERE ts.id = $1 AND ts.tenant_id = $2
        `, [subscriptionId, tenantId]);
        if (!subscription || subscription.length === 0) {
            throw new Error('Suscripción no encontrada');
        }
        const sub = subscription[0];
        const amount = sub.billing_cycle === 'monthly' ? sub.precio_mensual : sub.precio_anual;
        // Crear factura
        const invoice = await (0, database_1.executeQuery)(`
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
        ]);
        // Enviar email con factura
        await this.sendInvoiceEmail(invoice[0]);
        return invoice[0];
    }
    async processPayment(invoiceId) {
        await (0, database_1.executeQuery)(`
            UPDATE tenant_invoices
            SET status = 'pagada', fecha_pago = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [invoiceId]);
    }
    async getTenantInvoices(tenantId) {
        return await (0, database_1.executeQuery)(`
            SELECT * FROM tenant_invoices
            WHERE tenant_id = $1
            ORDER BY fecha_emision DESC
        `, [tenantId]);
    }
    async sendInvoiceEmail(invoice) {
        console.log(`Factura ${invoice.id} enviada`);
    }
}
// ============================================
// SUPER ADMIN SERVICE
// ============================================
class SuperAdminService {
    async getDashboardStats() {
        const [tenants, subscriptions, revenue, usage] = await Promise.all([
            (0, database_1.executeQuery)(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as activos,
                    COUNT(CASE WHEN status = 'trial' THEN 1 END) as en_trial,
                    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspendidos
                FROM tenants
            `, []),
            (0, database_1.executeQuery)(`
                SELECT 
                    sp.nombre as plan,
                    COUNT(*) as escuelas
                FROM tenant_subscriptions ts
                JOIN subscription_plans sp ON ts.plan_id = sp.id
                WHERE ts.status = 'active'
                GROUP BY sp.nombre
            `, []),
            (0, database_1.executeQuery)(`
                SELECT 
                    SUM(monto) as total,
                    COUNT(*) as facturas_pagadas
                FROM tenant_invoices
                WHERE status = 'pagada'
            `, []),
            (0, database_1.executeQuery)(`
                SELECT 
                    SUM((SELECT COUNT(*) FROM estudiantes WHERE tenant_id = t.id)) as total_estudiantes,
                    SUM((SELECT COUNT(*) FROM docentes WHERE tenant_id = t.id)) as total_docentes
                FROM tenants t
                WHERE status = 'active'
            `, [])
        ]);
        return {
            tenants: tenants[0],
            suscripciones_por_plan: subscriptions,
            ingresos: revenue[0],
            uso_global: usage[0]
        };
    }
    async getAllTenants(filters) {
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
        const params = [];
        if (filters === null || filters === void 0 ? void 0 : filters.status) {
            query += ' AND t.status = $1';
            params.push(filters.status);
        }
        query += ' ORDER BY t.fecha_registro DESC';
        return await (0, database_1.executeQuery)(query, params);
    }
    async suspendTenant(tenantId, reason) {
        await (0, database_1.executeQuery)(`
            UPDATE tenants
            SET status = 'suspended', suspension_reason = $2
            WHERE id = $1
        `, [tenantId, reason]);
    }
    async activateTenant(tenantId) {
        await (0, database_1.executeQuery)(`
            UPDATE tenants
            SET status = 'active', suspension_reason = NULL
            WHERE id = $1
        `, [tenantId]);
    }
}
// Export instances
exports.tenantService = new TenantService();
exports.subscriptionPlansService = new SubscriptionPlansService();
exports.usageTrackingService = new UsageTrackingService();
exports.billingService = new BillingService();
exports.superAdminService = new SuperAdminService();

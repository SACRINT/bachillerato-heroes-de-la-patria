/**
 * 🎛️ SUPER ADMIN DASHBOARD ROUTES
 * Endpoints para el Panel de Super-Administrador SaaS
 * FASE 5 - Dashboard Multi-Tenant
 * Creado: 07 Diciembre 2025
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// Importar servicio (usará la versión compilada)
let superAdminService;
try {
    superAdminService = require('../dist/services/super-admin.service').default;
} catch (e) {
    superAdminService = require('../services/super-admin.service').default;
}

// Todos los endpoints requieren autenticación de super-admin
router.use(authenticateToken);
router.use(requireRole('super_admin'));

// =====================================================
// DASHBOARD ENDPOINTS
// =====================================================

/**
 * GET /api/super-admin/dashboard
 * Obtener estadísticas globales del dashboard
 */
router.get('/dashboard', async (req, res) => {
    try {
        const stats = await superAdminService.getDashboardStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error en dashboard:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas del dashboard',
            message: error.message
        });
    }
});

/**
 * GET /api/super-admin/tenants
 * Listar todos los tenants con resumen
 */
router.get('/tenants', async (req, res) => {
    try {
        const { status, planId, search, limit, offset } = req.query;

        const result = await superAdminService.listTenantsWithSummary({
            status,
            planId: planId ? parseInt(planId) : undefined,
            search,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        res.json({
            success: true,
            data: result.tenants,
            pagination: {
                total: result.total,
                limit: parseInt(limit) || 50,
                offset: parseInt(offset) || 0
            }
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error listando tenants:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error listando tenants',
            message: error.message
        });
    }
});

/**
 * GET /api/super-admin/tenants/:id
 * Obtener detalles completos de un tenant
 */
router.get('/tenants/:id', async (req, res) => {
    try {
        const tenantId = parseInt(req.params.id);
        const details = await superAdminService.getTenantDetails(tenantId);

        res.json({
            success: true,
            data: details
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error obteniendo tenant:', error.message);
        res.status(error.message === 'Tenant no encontrado' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
});

// =====================================================
// CHARTS DATA ENDPOINTS
// =====================================================

/**
 * GET /api/super-admin/charts/revenue
 * Datos de ingresos para gráficos
 */
router.get('/charts/revenue', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const data = await superAdminService.getRevenueChartData(months);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error en revenue chart:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo datos de ingresos'
        });
    }
});

/**
 * GET /api/super-admin/charts/growth
 * Datos de crecimiento de tenants
 */
router.get('/charts/growth', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const data = await superAdminService.getGrowthChartData(months);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error en growth chart:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo datos de crecimiento'
        });
    }
});

/**
 * GET /api/super-admin/charts/subscriptions
 * Estadísticas de suscripciones por plan
 */
router.get('/charts/subscriptions', async (req, res) => {
    try {
        const data = await superAdminService.getSubscriptionsByPlan();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error en subscriptions chart:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas de suscripciones'
        });
    }
});

// =====================================================
// SUBSCRIPTION MANAGEMENT ENDPOINTS
// =====================================================

/**
 * GET /api/super-admin/plans
 * Listar planes de suscripción
 */
router.get('/plans', async (req, res) => {
    try {
        const plans = await superAdminService.getPlans();

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error listando planes:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error listando planes'
        });
    }
});

/**
 * POST /api/super-admin/plans
 * Crear nuevo plan de suscripción
 */
router.post('/plans', async (req, res) => {
    try {
        const plan = await superAdminService.createPlan(req.body);

        res.status(201).json({
            success: true,
            data: plan,
            message: 'Plan creado exitosamente'
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error creando plan:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error creando plan',
            message: error.message
        });
    }
});

/**
 * PUT /api/super-admin/plans/:id
 * Actualizar plan existente
 */
router.put('/plans/:id', async (req, res) => {
    try {
        const planId = parseInt(req.params.id);
        const plan = await superAdminService.updatePlan(planId, req.body);

        if (!plan) {
            return res.status(404).json({
                success: false,
                error: 'Plan no encontrado'
            });
        }

        res.json({
            success: true,
            data: plan,
            message: 'Plan actualizado exitosamente'
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error actualizando plan:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error actualizando plan',
            message: error.message
        });
    }
});

/**
 * POST /api/super-admin/tenants/:id/subscription
 * Asignar plan a un tenant
 */
router.post('/tenants/:id/subscription', async (req, res) => {
    try {
        const tenantId = parseInt(req.params.id);
        const { planId, trialDays, paymentMethod } = req.body;

        const subscription = await superAdminService.assignPlanToTenant(
            tenantId,
            planId,
            { trialDays, paymentMethod }
        );

        res.json({
            success: true,
            data: subscription,
            message: 'Suscripción asignada exitosamente'
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error asignando suscripción:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error asignando suscripción',
            message: error.message
        });
    }
});

/**
 * DELETE /api/super-admin/tenants/:id/subscription
 * Cancelar suscripción de un tenant
 */
router.delete('/tenants/:id/subscription', async (req, res) => {
    try {
        const tenantId = parseInt(req.params.id);
        const subscription = await superAdminService.cancelTenantSubscription(tenantId);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: 'Suscripción no encontrada'
            });
        }

        res.json({
            success: true,
            data: subscription,
            message: 'Suscripción cancelada'
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error cancelando suscripción:', error.message);
        res.status(400).json({
            success: false,
            error: 'Error cancelando suscripción'
        });
    }
});

/**
 * GET /api/super-admin/subscriptions/expiring
 * Obtener suscripciones próximas a expirar
 */
router.get('/subscriptions/expiring', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const subscriptions = await superAdminService.getExpiringSubscriptions(days);

        res.json({
            success: true,
            data: subscriptions,
            count: subscriptions.length
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error obteniendo suscripciones:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo suscripciones próximas a expirar'
        });
    }
});

module.exports = router;

/**
 * 🎛️ SUPER ADMIN DASHBOARD ROUTES - TypeScript
 * Endpoints para el Panel de Super-Administrador SaaS
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router: Router = express.Router();

// Importar servicio (usará la versión compilada)
let superAdminService: any;
try {
    // @ts-ignore
    superAdminService = require('../dist/services/super-admin.service').default;
} catch (e) {
    // @ts-ignore
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
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await superAdminService.getDashboardStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error en dashboard:', (error as Error).message);
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas del dashboard', message: (error as Error).message });
    }
});

/**
 * GET /api/super-admin/tenants
 */
router.get('/tenants', async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, planId, search, limit, offset } = req.query;

        const result = await superAdminService.listTenantsWithSummary({
            status,
            planId: planId ? parseInt(planId as string) : undefined,
            search,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0
        });

        res.json({
            success: true,
            data: result.tenants,
            pagination: {
                total: result.total,
                limit: parseInt(limit as string) || 50,
                offset: parseInt(offset as string) || 0
            }
        });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error listando tenants:', (error as Error).message);
        res.status(500).json({ success: false, error: 'Error listando tenants', message: (error as Error).message });
    }
});

/**
 * GET /api/super-admin/tenants/:id
 */
router.get('/tenants/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = parseInt(req.params.id);
        const details = await superAdminService.getTenantDetails(tenantId);
        res.json({ success: true, data: details });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error obteniendo tenant:', (error as Error).message);
        const code = (error as Error).message === 'Tenant no encontrado' ? 404 : 500;
        res.status(code).json({ success: false, error: (error as Error).message });
    }
});

// =====================================================
// CHARTS DATA ENDPOINTS
// =====================================================

router.get('/charts/revenue', async (req: Request, res: Response): Promise<void> => {
    try {
        const months = parseInt(req.query.months as string) || 12;
        const data = await superAdminService.getRevenueChartData(months);
        res.json({ success: true, data });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error en revenue chart:', (error as Error).message);
        res.status(500).json({ success: false, error: 'Error obteniendo datos de ingresos' });
    }
});

router.get('/charts/growth', async (req: Request, res: Response): Promise<void> => {
    try {
        const months = parseInt(req.query.months as string) || 12;
        const data = await superAdminService.getGrowthChartData(months);
        res.json({ success: true, data });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error en growth chart:', (error as Error).message);
        res.status(500).json({ success: false, error: 'Error obteniendo datos de crecimiento' });
    }
});

router.get('/charts/subscriptions', async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await superAdminService.getSubscriptionsByPlan();
        res.json({ success: true, data });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error en subscriptions chart:', (error as Error).message);
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas de suscripciones' });
    }
});

// =====================================================
// SUBSCRIPTION MANAGEMENT ENDPOINTS
// =====================================================

router.get('/plans', async (req: Request, res: Response): Promise<void> => {
    try {
        const plans = await superAdminService.getPlans();
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error listando planes:', (error as Error).message);
        res.status(500).json({ success: false, error: 'Error listando planes' });
    }
});

router.post('/plans', async (req: Request, res: Response): Promise<void> => {
    try {
        const plan = await superAdminService.createPlan(req.body);
        res.status(201).json({ success: true, data: plan, message: 'Plan creado exitosamente' });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error creando plan:', (error as Error).message);
        res.status(400).json({ success: false, error: 'Error creando plan', message: (error as Error).message });
    }
});

router.put('/plans/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const planId = parseInt(req.params.id);
        const plan = await superAdminService.updatePlan(planId, req.body);
        if (!plan) { res.status(404).json({ success: false, error: 'Plan no encontrado' }); return; }
        res.json({ success: true, data: plan, message: 'Plan actualizado exitosamente' });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error actualizando plan:', (error as Error).message);
        res.status(400).json({ success: false, error: 'Error actualizando plan', message: (error as Error).message });
    }
});

router.post('/tenants/:id/subscription', async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = parseInt(req.params.id);
        const { planId, trialDays, paymentMethod } = req.body;
        const subscription = await superAdminService.assignPlanToTenant(tenantId, planId, { trialDays, paymentMethod });
        res.json({ success: true, data: subscription, message: 'Suscripción asignada exitosamente' });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error asignando suscripción:', (error as Error).message);
        res.status(400).json({ success: false, error: 'Error asignando suscripción', message: (error as Error).message });
    }
});

router.delete('/tenants/:id/subscription', async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = parseInt(req.params.id);
        const subscription = await superAdminService.cancelTenantSubscription(tenantId);
        if (!subscription) { res.status(404).json({ success: false, error: 'Suscripción no encontrada' }); return; }
        res.json({ success: true, data: subscription, message: 'Suscripción cancelada' });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error cancelando suscripción:', (error as Error).message);
        res.status(400).json({ success: false, error: 'Error cancelando suscripción' });
    }
});

router.get('/subscriptions/expiring', async (req: Request, res: Response): Promise<void> => {
    try {
        const days = parseInt(req.query.days as string) || 7;
        const subscriptions = await superAdminService.getExpiringSubscriptions(days);
        res.json({ success: true, data: subscriptions, count: subscriptions.length });
    } catch (error) {
        console.error('[SUPER-ADMIN] Error obteniendo suscripciones:', (error as Error).message);
        res.status(500).json({ success: false, error: 'Error obteniendo suscripciones próximas a expirar' });
    }
});

export default router;

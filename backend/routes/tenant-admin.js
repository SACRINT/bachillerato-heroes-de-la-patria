/**
 * 🏢 TENANT ADMIN ROUTES
 * Endpoints para gestión de tenants desde admin dashboard
 * Semana 5 - Multi-tenancy Avanzado - Tarea 9
 */

const express = require('express');
const router = express.Router();
const tenantConfigService = require('../services/tenant-config-service.js');
const tenantOnboarding = require('../services/tenant-onboarding.js');
const { authenticate, requireRole } = require('../middleware/auth.js');

// Todos los endpoints requieren autenticación de super-admin
router.use(authenticate);
router.use(requireRole('super-admin'));

/**
 * GET /api/tenant-admin/list
 * Lista todos los tenants (solo super-admin)
 */
router.get('/list', async (req, res) => {
    try {
        const { status, limit, offset } = req.query;

        const tenants = await tenantConfigService.listTenants({
            status,
            limit: parseInt(limit) || 100,
            offset: parseInt(offset) || 0
        });

        res.json({
            success: true,
            count: tenants.length,
            tenants
        });

    } catch (error) {
        res.status(500).json({
            error: 'Error listando tenants',
            message: error.message
        });
    }
});

/**
 * POST /api/tenant-admin/create
 * Crea un nuevo tenant con onboarding completo
 */
router.post('/create', async (req, res) => {
    try {
        const result = await tenantOnboarding.onboardNewTenant(req.body);

        res.status(201).json(result);

    } catch (error) {
        res.status(400).json({
            error: 'Error creando tenant',
            message: error.message
        });
    }
});

/**
 * GET /api/tenant-admin/:tenantId/stats
 * Obtiene estadísticas de un tenant
 */
router.get('/:tenantId/stats', async (req, res) => {
    try {
        const { tenantId } = req.params;

        const stats = await tenantConfigService.getTenantStats(tenantId);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        res.status(500).json({
            error: 'Error obteniendo stats',
            message: error.message
        });
    }
});

/**
 * PUT /api/tenant-admin/:tenantId/status
 * Actualiza status de un tenant (activo/inactivo/suspendido)
 */
router.put('/:tenantId/status', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { status } = req.body;

        const tenant = await tenantConfigService.updateStatus(tenantId, status);

        res.json({
            success: true,
            tenant
        });

    } catch (error) {
        res.status(400).json({
            error: 'Error actualizando status',
            message: error.message
        });
    }
});

/**
 * DELETE /api/tenant-admin/:tenantId
 * Elimina un tenant (soft delete)
 */
router.delete('/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;

        const result = await tenantOnboarding.offboardTenant(tenantId);

        res.json(result);

    } catch (error) {
        res.status(400).json({
            error: 'Error eliminando tenant',
            message: error.message
        });
    }
});

/**
 * POST /api/tenant-admin/check-subdomain
 * Verifica disponibilidad de subdomain
 */
router.post('/check-subdomain', async (req, res) => {
    try {
        const { subdomain } = req.body;

        const result = await tenantOnboarding.checkSubdomainAvailability(subdomain);

        res.json(result);

    } catch (error) {
        res.status(500).json({
            error: 'Error verificando subdomain',
            message: error.message
        });
    }
});

module.exports = router;

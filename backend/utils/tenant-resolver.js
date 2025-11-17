/**
 * 🏢 TENANT RESOLVER
 * Helpers para resolver y validar tenants
 * Semana 5 - Multi-tenancy Avanzado - Tarea 6
 */

const tenantConfigService = require('../services/tenant-config-service');

/**
 * Resuelve tenant desde request y valida que exista y esté activo
 */
async function resolveTenant(req) {
    if (!req.tenant || !req.tenant.id) {
        throw new Error('Tenant no detectado en request');
    }

    const tenantId = req.tenant.id;

    // Obtener configuración completa del tenant
    const config = await tenantConfigService.getConfig(tenantId);

    if (config.status !== 'activo') {
        throw new Error(`Tenant inactivo: ${tenantId}`);
    }

    return {
        id: config.id,
        nombre: config.nombre,
        config: config.config_json,
        status: config.status
    };
}

/**
 * Middleware para resolver tenant antes de ejecutar ruta
 */
function requireActiveTenant(req, res, next) {
    resolveTenant(req)
        .then(() => next())
        .catch(error => {
            res.status(400).json({
                error: 'Tenant inválido',
                message: error.message
            });
        });
}

/**
 * Valida que usuario pertenece al tenant actual
 */
function validateUserBelongsToTenant(req) {
    if (!req.user) {
        throw new Error('Usuario no autenticado');
    }

    if (!req.tenant) {
        throw new Error('Tenant no detectado');
    }

    if (req.user.tenant_id !== req.tenant.id) {
        throw new Error(`Usuario pertenece a tenant '${req.user.tenant_id}' pero request es para '${req.tenant.id}'`);
    }

    return true;
}

module.exports = {
    resolveTenant,
    requireActiveTenant,
    validateUserBelongsToTenant
};

/**
 * 🏢 TENANT CONFIGURATION SERVICE - v2.0.0
 * Refactorizado: 04 Diciembre 2025
 */

const TenantDAO = require('../data/tenant.dao.js');

const redis = { get: async () => null, set: async () => true, del: async () => true };
const CACHE_PREFIX = 'tenant:config:';
const CACHE_TTL = 3600;
const DEFAULT_CONFIG = {
    school_name: 'BGE Héroes de la Patria', school_short_name: 'BGE', school_type: 'Bachillerato General por Competencias',
    colors: { primary: '#1e40af', secondary: '#dc2626', accent: '#f59e0b' }, logo_url: '/images/logo.png',
    features: { calendar: true, grades: true, attendance: true, messaging: true, reports: true },
    limits: { max_students: 1000, max_teachers: 100, max_storage_mb: 5000 }
};

class TenantConfigService {
    async getConfig(tenantId) {
        try {
            const cacheKey = `${CACHE_PREFIX}${tenantId}`;
            const cached = await redis.get(cacheKey);
            if (cached) { console.log(`[TENANT-CONFIG] Cache HIT: ${tenantId}`); return JSON.parse(cached); }
            console.log(`[TENANT-CONFIG] Cache MISS: ${tenantId}`);
            const tenant = await TenantDAO.getById(tenantId);
            if (!tenant) throw new Error(`Tenant no encontrado: ${tenantId}`);
            if (typeof tenant.config_json === 'string') tenant.config_json = JSON.parse(tenant.config_json);
            tenant.config_json = { ...DEFAULT_CONFIG, ...tenant.config_json };
            await redis.set(cacheKey, JSON.stringify(tenant), CACHE_TTL);
            return tenant;
        } catch (error) { console.error(`[TENANT-CONFIG] Error: ${error.message}`); throw error; }
    }

    async getConfigJSON(tenantId) { const tenant = await this.getConfig(tenantId); return tenant.config_json || DEFAULT_CONFIG; }

    async updateConfig(tenantId, newConfig) {
        try {
            this.validateConfig(newConfig);
            const result = await TenantDAO.updateConfig(tenantId, newConfig);
            if (!result) throw new Error(`Tenant no encontrado: ${tenantId}`);
            await this.invalidateCache(tenantId);
            console.log(`[TENANT-CONFIG] Config actualizada: ${tenantId}`);
            return result;
        } catch (error) { console.error(`[TENANT-CONFIG] Error actualizando: ${error.message}`); throw error; }
    }

    async updateConfigValue(tenantId, path, value) {
        try {
            const currentConfig = await this.getConfigJSON(tenantId);
            const keys = path.split('.'); let target = currentConfig;
            for (let i = 0; i < keys.length - 1; i++) { if (!target[keys[i]] || typeof target[keys[i]] !== 'object') target[keys[i]] = {}; target = target[keys[i]]; }
            target[keys[keys.length - 1]] = value;
            return await this.updateConfig(tenantId, currentConfig);
        } catch (error) { console.error(`[TENANT-CONFIG] Error actualizando ${path}: ${error.message}`); throw error; }
    }

    async createTenant(tenantData) {
        try {
            const { id, nombre, subdomain, dominio, config } = tenantData;
            if (!id || !nombre || !subdomain) throw new Error('Faltan campos requeridos: id, nombre, subdomain');
            if (await TenantDAO.checkExists(id, subdomain)) throw new Error(`Tenant ya existe: ${id} o subdomain ${subdomain}`);
            const finalConfig = { ...DEFAULT_CONFIG, ...(config || {}) }; this.validateConfig(finalConfig);
            const result = await TenantDAO.create(id, nombre, subdomain, dominio || `${subdomain}.bge.edu.mx`, 'activo', finalConfig);
            console.log(`[TENANT-CONFIG] Tenant creado: ${id}`);
            return result;
        } catch (error) { console.error(`[TENANT-CONFIG] Error creando tenant: ${error.message}`); throw error; }
    }

    async listTenants(filters = {}) {
        try {
            const { status, limit = 100, offset = 0 } = filters;
            const tenants = await TenantDAO.list(status, limit, offset);
            return tenants.map(t => { if (typeof t.config_json === 'string') t.config_json = JSON.parse(t.config_json); return t; });
        } catch (error) { console.error(`[TENANT-CONFIG] Error listando: ${error.message}`); throw error; }
    }

    async updateStatus(tenantId, newStatus) {
        try {
            const validStatuses = ['activo', 'inactivo', 'suspendido'];
            if (!validStatuses.includes(newStatus)) throw new Error(`Status inválido. Debe ser: ${validStatuses.join(', ')}`);
            const result = await TenantDAO.updateStatus(tenantId, newStatus);
            if (!result) throw new Error(`Tenant no encontrado: ${tenantId}`);
            await this.invalidateCache(tenantId);
            console.log(`[TENANT-CONFIG] Status actualizado: ${tenantId} → ${newStatus}`);
            return result;
        } catch (error) { console.error(`[TENANT-CONFIG] Error actualizando status: ${error.message}`); throw error; }
    }

    async deleteTenant(tenantId) {
        if (tenantId === 'default') throw new Error('No se puede eliminar el tenant default');
        console.log(`[TENANT-CONFIG] Tenant eliminado (soft delete): ${tenantId}`);
        return this.updateStatus(tenantId, 'inactivo');
    }

    validateConfig(config) {
        const required = ['school_name', 'school_short_name'];
        for (const field of required) if (!config[field]) throw new Error(`Campo requerido faltante: ${field}`);
        if (config.colors) {
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;
            if (config.colors.primary && !hexPattern.test(config.colors.primary)) throw new Error(`Color primary inválido: ${config.colors.primary}`);
            if (config.colors.secondary && !hexPattern.test(config.colors.secondary)) throw new Error(`Color secondary inválido: ${config.colors.secondary}`);
        }
        if (config.limits) {
            if (config.limits.max_students && config.limits.max_students < 1) throw new Error('max_students debe ser mayor a 0');
            if (config.limits.max_teachers && config.limits.max_teachers < 1) throw new Error('max_teachers debe ser mayor a 0');
        }
        return true;
    }

    async invalidateCache(tenantId) { try { await redis.del(`${CACHE_PREFIX}${tenantId}`); console.log(`[TENANT-CONFIG] Cache invalidado: ${tenantId}`); } catch (e) { console.error(`[TENANT-CONFIG] Error invalidando cache: ${e.message}`); } }

    async getTenantStats(tenantId) {
        try {
            const stats = await TenantDAO.getStats(tenantId);
            return { tenant_id: tenantId, total_students: stats.students, total_users: stats.users, total_news: stats.news, generated_at: new Date().toISOString() };
        } catch (error) { console.error(`[TENANT-CONFIG] Error obteniendo stats: ${error.message}`); throw error; }
    }
}

module.exports = new TenantConfigService();

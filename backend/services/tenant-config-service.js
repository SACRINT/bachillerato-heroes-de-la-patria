/**
 * 🏢 TENANT CONFIGURATION SERVICE
 * Gestiona configuraciones de tenants con cache Redis
 * Semana 5 - Multi-tenancy Avanzado - Tarea 3
 *
 * Funcionalidades:
 * - Obtener configuración de tenant (cache-first)
 * - Actualizar configuración (con invalidación de cache)
 * - Crear nuevo tenant
 * - Listar todos los tenants
 * - Validar configuración
 */

const pool = require('../config/database');
// ⏸️ COMENTADO - FASE 30.5 INTENTO-5: Redis no disponible en local
// const { redis } = require('../middleware/redis-cache'); // Usar el redis ya configurado

// Mock Redis para desarrollo local
const redis = {
    get: async () => null,
    set: async () => true,
    del: async () => true,
};

/**
 * Constantes de configuración
 */
const CACHE_PREFIX = 'tenant:config:';
const CACHE_TTL = 3600; // 1 hora en segundos
const DEFAULT_CONFIG = {
    school_name: 'BGE Héroes de la Patria',
    school_short_name: 'BGE',
    school_type: 'Bachillerato General por Competencias',
    colors: {
        primary: '#1e40af',
        secondary: '#dc2626',
        accent: '#f59e0b'
    },
    logo_url: '/images/logo.png',
    features: {
        calendar: true,
        grades: true,
        attendance: true,
        messaging: true,
        reports: true
    },
    limits: {
        max_students: 1000,
        max_teachers: 100,
        max_storage_mb: 5000
    }
};

class TenantConfigService {
    /**
     * Obtiene configuración de tenant (cache-first strategy)
     */
    async getConfig(tenantId) {
        try {
            // 1. Intentar obtener de cache Redis
            const cacheKey = `${CACHE_PREFIX}${tenantId}`;
            const cached = await redis.get(cacheKey);

            if (cached) {
                console.log(`[TENANT-CONFIG] Cache HIT para tenant: ${tenantId}`);
                return JSON.parse(cached);
            }

            console.log(`[TENANT-CONFIG] Cache MISS para tenant: ${tenantId}`);

            // 2. Obtener de base de datos
            const result = await pool.query(
                `SELECT
                    id,
                    nombre,
                    subdomain,
                    dominio,
                    status,
                    config_json,
                    created_at,
                    updated_at
                 FROM tenants
                 WHERE id = $1 OR subdomain = $1
                 LIMIT 1`,
                [tenantId]
            );

            if (result.rows.length === 0) {
                throw new Error(`Tenant no encontrado: ${tenantId}`);
            }

            const tenant = result.rows[0];

            // Parsear config_json si es string
            if (typeof tenant.config_json === 'string') {
                tenant.config_json = JSON.parse(tenant.config_json);
            }

            // Merge con configuración default
            tenant.config_json = {
                ...DEFAULT_CONFIG,
                ...tenant.config_json
            };

            // 3. Guardar en cache
            await redis.set(cacheKey, JSON.stringify(tenant), CACHE_TTL);

            return tenant;

        } catch (error) {
            console.error(`[TENANT-CONFIG] Error obteniendo config de ${tenantId}:`, error.message);
            throw error;
        }
    }

    /**
     * Obtiene solo la configuración JSON del tenant
     */
    async getConfigJSON(tenantId) {
        const tenant = await this.getConfig(tenantId);
        return tenant.config_json || DEFAULT_CONFIG;
    }

    /**
     * Actualiza configuración de tenant
     */
    async updateConfig(tenantId, newConfig) {
        try {
            // Validar configuración
            this.validateConfig(newConfig);

            // Actualizar en BD
            const result = await pool.query(
                `UPDATE tenants
                 SET config_json = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 OR subdomain = $2
                 RETURNING *`,
                [JSON.stringify(newConfig), tenantId]
            );

            if (result.rows.length === 0) {
                throw new Error(`Tenant no encontrado: ${tenantId}`);
            }

            // Invalidar cache
            await this.invalidateCache(tenantId);

            console.log(`[TENANT-CONFIG] Config actualizada para tenant: ${tenantId}`);

            return result.rows[0];

        } catch (error) {
            console.error(`[TENANT-CONFIG] Error actualizando config de ${tenantId}:`, error.message);
            throw error;
        }
    }

    /**
     * Actualiza un valor específico de configuración (partial update)
     */
    async updateConfigValue(tenantId, path, value) {
        try {
            // Obtener config actual
            const currentConfig = await this.getConfigJSON(tenantId);

            // Actualizar valor usando path (ejemplo: 'colors.primary')
            const keys = path.split('.');
            let target = currentConfig;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                target = target[key];
            }

            target[keys[keys.length - 1]] = value;

            // Actualizar config completa
            return await this.updateConfig(tenantId, currentConfig);

        } catch (error) {
            console.error(`[TENANT-CONFIG] Error actualizando ${path} de ${tenantId}:`, error.message);
            throw error;
        }
    }

    /**
     * Crea un nuevo tenant
     */
    async createTenant(tenantData) {
        try {
            const {
                id,
                nombre,
                subdomain,
                dominio,
                config
            } = tenantData;

            // Validaciones
            if (!id || !nombre || !subdomain) {
                throw new Error('Faltan campos requeridos: id, nombre, subdomain');
            }

            // Validar que el tenant no exista
            const existing = await pool.query(
                'SELECT id FROM tenants WHERE id = $1 OR subdomain = $2',
                [id, subdomain]
            );

            if (existing.rows.length > 0) {
                throw new Error(`Tenant ya existe: ${id} o subdomain ${subdomain}`);
            }

            // Validar configuración
            const finalConfig = {
                ...DEFAULT_CONFIG,
                ...(config || {})
            };

            this.validateConfig(finalConfig);

            // Crear tenant
            const result = await pool.query(
                `INSERT INTO tenants (id, nombre, subdomain, dominio, status, config_json)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    id,
                    nombre,
                    subdomain,
                    dominio || `${subdomain}.bge.edu.mx`,
                    'activo',
                    JSON.stringify(finalConfig)
                ]
            );

            console.log(`[TENANT-CONFIG] Tenant creado: ${id}`);

            return result.rows[0];

        } catch (error) {
            console.error(`[TENANT-CONFIG] Error creando tenant:`, error.message);
            throw error;
        }
    }

    /**
     * Lista todos los tenants
     */
    async listTenants(filters = {}) {
        try {
            const { status, limit = 100, offset = 0 } = filters;

            let query = 'SELECT * FROM tenants';
            const params = [];

            if (status) {
                query += ' WHERE status = $1';
                params.push(status);
            }

            query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
            params.push(limit, offset);

            const result = await pool.query(query, params);

            return result.rows.map(tenant => {
                if (typeof tenant.config_json === 'string') {
                    tenant.config_json = JSON.parse(tenant.config_json);
                }
                return tenant;
            });

        } catch (error) {
            console.error(`[TENANT-CONFIG] Error listando tenants:`, error.message);
            throw error;
        }
    }

    /**
     * Actualiza status de tenant (activo/inactivo/suspendido)
     */
    async updateStatus(tenantId, newStatus) {
        try {
            const validStatuses = ['activo', 'inactivo', 'suspendido'];

            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Status inválido. Debe ser: ${validStatuses.join(', ')}`);
            }

            const result = await pool.query(
                `UPDATE tenants
                 SET status = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 OR subdomain = $2
                 RETURNING *`,
                [newStatus, tenantId]
            );

            if (result.rows.length === 0) {
                throw new Error(`Tenant no encontrado: ${tenantId}`);
            }

            // Invalidar cache
            await this.invalidateCache(tenantId);

            console.log(`[TENANT-CONFIG] Status de ${tenantId} actualizado a: ${newStatus}`);

            return result.rows[0];

        } catch (error) {
            console.error(`[TENANT-CONFIG] Error actualizando status de ${tenantId}:`, error.message);
            throw error;
        }
    }

    /**
     * Elimina tenant (soft delete - marca como inactivo)
     */
    async deleteTenant(tenantId) {
        try {
            // No permitir eliminar tenant 'default'
            if (tenantId === 'default') {
                throw new Error('No se puede eliminar el tenant default');
            }

            // Soft delete: cambiar status a 'inactivo'
            const result = await this.updateStatus(tenantId, 'inactivo');

            console.log(`[TENANT-CONFIG] Tenant eliminado (soft delete): ${tenantId}`);

            return result;

        } catch (error) {
            console.error(`[TENANT-CONFIG] Error eliminando tenant ${tenantId}:`, error.message);
            throw error;
        }
    }

    /**
     * Valida configuración de tenant
     */
    validateConfig(config) {
        const required = ['school_name', 'school_short_name'];

        for (const field of required) {
            if (!config[field]) {
                throw new Error(`Campo requerido faltante en config: ${field}`);
            }
        }

        // Validar colores (deben ser hex válidos)
        if (config.colors) {
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;

            if (config.colors.primary && !hexPattern.test(config.colors.primary)) {
                throw new Error(`Color primary inválido: ${config.colors.primary}`);
            }

            if (config.colors.secondary && !hexPattern.test(config.colors.secondary)) {
                throw new Error(`Color secondary inválido: ${config.colors.secondary}`);
            }
        }

        // Validar límites
        if (config.limits) {
            if (config.limits.max_students && config.limits.max_students < 1) {
                throw new Error('max_students debe ser mayor a 0');
            }

            if (config.limits.max_teachers && config.limits.max_teachers < 1) {
                throw new Error('max_teachers debe ser mayor a 0');
            }
        }

        return true;
    }

    /**
     * Invalida cache de tenant
     */
    async invalidateCache(tenantId) {
        try {
            const cacheKey = `${CACHE_PREFIX}${tenantId}`;
            await redis.del(cacheKey);
            console.log(`[TENANT-CONFIG] Cache invalidado para tenant: ${tenantId}`);
        } catch (error) {
            console.error(`[TENANT-CONFIG] Error invalidando cache de ${tenantId}:`, error.message);
        }
    }

    /**
     * Obtiene estadísticas de un tenant
     */
    async getTenantStats(tenantId) {
        try {
            // Contar estudiantes
            const studentsResult = await pool.query(
                'SELECT COUNT(*) FROM estudiantes WHERE tenant_id = $1',
                [tenantId]
            );

            // Contar usuarios
            const usersResult = await pool.query(
                'SELECT COUNT(*) FROM usuarios WHERE tenant_id = $1',
                [tenantId]
            );

            // Contar noticias
            const newsResult = await pool.query(
                'SELECT COUNT(*) FROM noticias WHERE tenant_id = $1',
                [tenantId]
            );

            return {
                tenant_id: tenantId,
                total_students: parseInt(studentsResult.rows[0].count),
                total_users: parseInt(usersResult.rows[0].count),
                total_news: parseInt(newsResult.rows[0].count),
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error(`[TENANT-CONFIG] Error obteniendo stats de ${tenantId}:`, error.message);
            throw error;
        }
    }
}

// Exportar instancia singleton
module.exports = new TenantConfigService();

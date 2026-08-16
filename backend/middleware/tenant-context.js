/**
 * 🏢 TENANT CONTEXT MIDDLEWARE
 * Detecta y configura el contexto de tenant para cada request
 * Semana 5 - Multi-tenancy Avanzado - Tarea 1
 *
 * Estrategias de detección:
 * 1. Subdomain (tenant1.example.com → tenant1)
 * 2. Header X-Tenant-ID
 * 3. JWT payload (tenant_id claim)
 * 4. Query param (?tenant=tenant1)
 */

const { pool } = require('../config/database.js');
const { getTenantByDomain } = require('../data/database-access.js'); // ✅ Importar función fail-safe

/**
 * Cache de configuraciones de tenant (en memoria)
 * En producción usar Redis
 */
const tenantCache = new Map();
const CACHE_TTL = 3600000; // 1 hora

/**
 * Detecta tenant_id desde múltiples fuentes
 */
function detectTenantId(req) {
    // Estrategia 1: Header X-Tenant-ID (más confiable)
    if (req.headers['x-tenant-id']) {
        return req.headers['x-tenant-id'];
    }

    // Estrategia 2: Subdomain
    const hostname = req.hostname || req.get('host')?.split(':')[0];
    if (hostname && hostname !== 'localhost' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        const parts = hostname.split('.');
        // Si hay subdomain (ejemplo: tenant1.bge.edu.mx)
        if (parts.length > 2) {
            const subdomain = parts[0];
            // Excluir subdomains comunes que NO son tenants
            if (!['www', 'api', 'admin', 'dev', 'staging'].includes(subdomain)) {
                return subdomain;
            }
        }
    }

    // Estrategia 3: JWT payload (si el usuario está autenticado)
    if (req.user && req.user.tenant_id) {
        return req.user.tenant_id;
    }

    // Estrategia 4: Query parameter (solo para testing/debugging)
    if (req.query.tenant && process.env.NODE_ENV !== 'production') {
        return req.query.tenant;
    }

    // Default: 'default' tenant (para instalaciones single-tenant)
    return 'default';
}

/**
 * Obtiene configuración de tenant desde BD (con cache)
 */
async function getTenantConfig(tenantId) {
    // Check cache primero
    const cached = tenantCache.get(tenantId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }

    try {
        // Query a BD
        const result = await pool.query(
            `SELECT
                id,
                nombre,
                dominio,
                subdomain,
                status,
                config_json,
                created_at
             FROM tenants
             WHERE id::text = $1 OR subdomain = $1 OR dominio = $1
             LIMIT 1`,
            [tenantId]
        );

        if (result.rows.length === 0) {
            // Tenant no existe, devolver configuración default
            console.warn(`[TENANT-CONTEXT] Tenant no encontrado: ${tenantId}, usando 'default'`);

            // Intentar obtener tenant 'default'
            const defaultResult = await pool.query(
                `SELECT * FROM tenants WHERE id::text = 'default' OR subdomain = 'default' LIMIT 1`
            );

            if (defaultResult.rows.length === 0) {
                // Si tampoco existe 'default', crear configuración básica
                return {
                    id: 'default',
                    nombre: 'BGE Héroes de la Patria',
                    dominio: 'localhost',
                    subdomain: 'default',
                    status: 'activo',
                    config_json: {
                        school_name: 'BGE Héroes de la Patria',
                        school_short_name: 'BGE',
                        school_type: 'Bachillerato General por Competencias',
                        colors: {
                            primary: '#1e40af',
                            secondary: '#dc2626'
                        }
                    }
                };
            }

            const tenant = defaultResult.rows[0];
            tenant.config_json = tenant.config_json || {};

            // Cache tenant 'default'
            tenantCache.set('default', {
                data: tenant,
                timestamp: Date.now()
            });

            return tenant;
        }

        const tenant = result.rows[0];

        // Parsear config_json si es string
        if (typeof tenant.config_json === 'string') {
            tenant.config_json = JSON.parse(tenant.config_json);
        }

        // Validar status
        if (tenant.status !== 'activo') {
            throw new Error(`Tenant inactivo: ${tenantId}`);
        }

        // Cache el tenant
        tenantCache.set(tenantId, {
            data: tenant,
            timestamp: Date.now()
        });

        return tenant;

    } catch (error) {
        console.error(`[TENANT-CONTEXT] Error obteniendo config de tenant ${tenantId}:`, error.message);

        // Fallback a configuración default hardcoded
        return {
            id: 'default',
            nombre: 'BGE Héroes de la Patria',
            dominio: 'localhost',
            subdomain: 'default',
            status: 'activo',
            config_json: {
                school_name: 'BGE Héroes de la Patria',
                school_short_name: 'BGE',
                school_type: 'Bachillerato General por Competencias'
            }
        };
    }
}

/**
 * Configura PostgreSQL Row-Level Security context
 */
async function setRLSContext(tenantId) {
    try {
        // ✅ CORREGIDO: Usar set_config() en lugar de SET LOCAL $1
        // PostgreSQL no soporta parámetros en SET LOCAL, usa set_config() en su lugar
        await pool.query(
            `SELECT set_config($1, $2, false)`,
            ['app.current_tenant_id', String(tenantId)]
        );
        return true;
    } catch (error) {
        console.error(`[TENANT-CONTEXT] Error configurando RLS context:`, error.message);
        return false;
    }
}

/**
 * Middleware principal de Tenant Context
 */
async function tenantContext(req, res, next) {
    try {
        // 1. Detectar tenant_id
        const tenantId = detectTenantId(req);

        // 2. Obtener configuración del tenant
        const tenantConfig = await getTenantConfig(tenantId);

        // 3. Configurar RLS context en PostgreSQL (para esta transacción)
        // Nota: Solo funciona si la conexión se usa en una transacción
        // En queries individuales, pasar tenant_id como parámetro
        await setRLSContext(tenantConfig.id);

        // 4. Agregar contexto de tenant al request
        req.tenant = {
            id: tenantConfig.id,
            nombre: tenantConfig.nombre,
            dominio: tenantConfig.dominio,
            subdomain: tenantConfig.subdomain,
            config: tenantConfig.config_json || {},

            // Helper method para obtener valores de config
            getConfig: function (key, defaultValue = null) {
                const keys = key.split('.');
                let value = this.config;

                for (const k of keys) {
                    if (value && typeof value === 'object' && k in value) {
                        value = value[k];
                    } else {
                        return defaultValue;
                    }
                }

                return value !== undefined ? value : defaultValue;
            }
        };

        // 5. Log de detección (solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[TENANT-CONTEXT] Tenant detectado: ${tenantConfig.id} (${tenantConfig.nombre})`);
        }

        // 6. Continuar con siguiente middleware
        next();

    } catch (error) {
        console.error('[TENANT-CONTEXT] Error en middleware:', error);

        // En caso de error, usar tenant 'default' para no romper la app
        req.tenant = {
            id: 'default',
            nombre: 'BGE Héroes de la Patria',
            dominio: 'localhost',
            subdomain: 'default',
            config: {},
            getConfig: (key, defaultValue = null) => defaultValue
        };

        next();
    }
}

/**
 * Middleware para REQUERIR tenant válido (usar en rutas protegidas)
 */
function requireTenant(req, res, next) {
    if (!req.tenant || !req.tenant.id) {
        return res.status(400).json({
            error: 'Tenant no detectado',
            message: 'No se pudo identificar el tenant. Incluya header X-Tenant-ID o use subdomain.'
        });
    }

    if (req.tenant.id === 'default' && process.env.REQUIRE_EXPLICIT_TENANT === 'true') {
        return res.status(400).json({
            error: 'Tenant requerido',
            message: 'Esta instalación requiere un tenant explícito. No se puede usar tenant "default".'
        });
    }

    next();
}

/**
 * Middleware para validar que usuario pertenece al tenant del request
 */
function validateUserTenant(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'No autenticado',
            message: 'Se requiere autenticación para validar tenant'
        });
    }

    if (!req.tenant) {
        return res.status(400).json({
            error: 'Tenant no detectado'
        });
    }

    // Verificar que el usuario pertenece al tenant del request
    if (req.user.tenant_id && req.user.tenant_id !== req.tenant.id) {
        return res.status(403).json({
            error: 'Tenant no autorizado',
            message: `Usuario pertenece a tenant '${req.user.tenant_id}' pero request es para '${req.tenant.id}'`
        });
    }

    next();
}

/**
 * Limpia cache de tenant (útil cuando se actualiza configuración)
 */
function clearTenantCache(tenantId = null) {
    if (tenantId) {
        tenantCache.delete(tenantId);
        console.log(`[TENANT-CONTEXT] Cache limpiado para tenant: ${tenantId}`);
    } else {
        tenantCache.clear();
        console.log(`[TENANT-CONTEXT] Cache completo limpiado`);
    }
}

/**
 * Endpoint para limpiar cache (solo admin)
 */
function createCacheClearEndpoint() {
    return async (req, res) => {
        const { tenant_id } = req.body;

        clearTenantCache(tenant_id);

        res.json({
            success: true,
            message: tenant_id
                ? `Cache limpiado para tenant: ${tenant_id}`
                : 'Cache completo limpiado'
        });
    };
}

module.exports = {
    tenantContext,
    requireTenant,
    validateUserTenant,
    clearTenantCache,
    createCacheClearEndpoint,
    detectTenantId,
    getTenantConfig
};

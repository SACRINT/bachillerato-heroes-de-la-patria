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
 */
const tenantCache = new Map();
const CACHE_TTL = 3600000; // 1 hora

/**
 * Detecta tenant_id desde múltiples fuentes
 */
function detectTenantId(req) {
    // Estrategia 1: Header X-Tenant-ID o X-Tenant (más confiable)
    if (req.headers['x-tenant-id']) {
        return req.headers['x-tenant-id'];
    }
    if (req.headers['x-tenant']) {
        return req.headers['x-tenant'];
    }

    // Estrategia 2: Subdomain / Host
    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
    if (hostHeader) {
        const cleanHost = hostHeader.split(':')[0];
        if (cleanHost && cleanHost !== 'localhost' && !cleanHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            const parts = cleanHost.split('.');
            if (parts.length >= 2) {
                const subdomain = parts[0];
                if (!['www', 'api', 'admin', 'dev', 'staging', 'bge-heroesdelapatria', 'bge-heroes-de-la-patria'].includes(subdomain) && !cleanHost.includes('vercel.app')) {
                    return subdomain;
                }
            }
        }
    }

    // Estrategia 3: JWT payload (si el usuario está autenticado)
    if (req.user && req.user.tenant_id) {
        return req.user.tenant_id;
    }

    // Estrategia 4: Query parameter (para testing/debugging o routing directo)
    if (req.query && (req.query.tenant || req.query.tenant_id)) {
        return req.query.tenant || req.query.tenant_id;
    }

    // Default: '1' tenant
    return 1;
}

/**
 * Obtiene configuración de tenant desde BD (con cache)
 */
async function getTenantConfig(tenantId) {
    const cacheKey = String(tenantId);
    // Check cache primero
    const cached = tenantCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }

    try {
        const isNumeric = !isNaN(Number(tenantId)) && Number(tenantId) > 0;
        let result;

        if (isNumeric) {
            result = await pool.query(
                `SELECT
                    id,
                    uuid,
                    school_name,
                    nombre,
                    domain,
                    dominio,
                    subdomain,
                    status,
                    config_json,
                    created_at
                 FROM tenants
                 WHERE id = $1 OR subdomain = $2 OR dominio = $2 OR domain = $2
                 LIMIT 1`,
                [Number(tenantId), String(tenantId)]
            );
        } else {
            result = await pool.query(
                `SELECT
                    id,
                    uuid,
                    school_name,
                    nombre,
                    domain,
                    dominio,
                    subdomain,
                    status,
                    config_json,
                    created_at
                 FROM tenants
                 WHERE subdomain = $1 OR dominio = $1 OR domain = $1 OR school_name ILIKE $1
                 LIMIT 1`,
                [String(tenantId)]
            );
        }

        if (result.rows.length === 0) {
            // Intentar obtener tenant por defecto (ID 1)
            const defaultResult = await pool.query(
                `SELECT * FROM tenants WHERE id = 1 LIMIT 1`
            );

            if (defaultResult.rows.length === 0) {
                // Si tampoco existe ID 1 en BD, crear configuración básica
                const basicConfig = {
                    id: 1,
                    nombre: 'Bachillerato General Estatal "Héroes de la Patria"',
                    school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
                    dominio: 'localhost',
                    domain: 'localhost',
                    subdomain: 'default',
                    status: 'activo',
                    config_json: {
                        school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
                        school_short_name: 'BGE',
                        school_type: 'Bachillerato General por Competencias',
                        colors: {
                            primary: '#1e40af',
                            secondary: '#dc2626'
                        }
                    }
                };

                tenantCache.set(cacheKey, {
                    data: basicConfig,
                    timestamp: Date.now()
                });

                return basicConfig;
            }

            const tenant = defaultResult.rows[0];
            tenant.config_json = tenant.config_json || {};
            tenant.nombre = tenant.nombre || tenant.school_name;
            tenant.school_name = tenant.school_name || tenant.nombre;
            tenant.dominio = tenant.dominio || tenant.domain;
            tenant.domain = tenant.domain || tenant.dominio;

            tenantCache.set(cacheKey, {
                data: tenant,
                timestamp: Date.now()
            });

            return tenant;
        }

        const tenant = result.rows[0];

        // Parsear config_json si es string
        if (typeof tenant.config_json === 'string') {
            try {
                tenant.config_json = JSON.parse(tenant.config_json);
            } catch (e) {
                tenant.config_json = {};
            }
        }

        tenant.nombre = tenant.nombre || tenant.school_name;
        tenant.school_name = tenant.school_name || tenant.nombre;
        tenant.dominio = tenant.dominio || tenant.domain;
        tenant.domain = tenant.domain || tenant.dominio;

        // Cache el tenant
        tenantCache.set(cacheKey, {
            data: tenant,
            timestamp: Date.now()
        });

        return tenant;

    } catch (error) {
        console.error(`[TENANT-CONTEXT] Error obteniendo config de tenant ${tenantId}:`, error.message);

        // Fallback a configuración default hardcoded
        return {
            id: 1,
            nombre: 'Bachillerato General Estatal "Héroes de la Patria"',
            school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
            dominio: 'localhost',
            domain: 'localhost',
            subdomain: 'default',
            status: 'activo',
            config_json: {
                school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
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

        // 3. Configurar RLS context en PostgreSQL
        await setRLSContext(tenantConfig.id);

        // 4. Agregar contexto de tenant al request
        req.tenant = {
            id: tenantConfig.id,
            nombre: tenantConfig.nombre || tenantConfig.school_name,
            school_name: tenantConfig.school_name || tenantConfig.nombre,
            dominio: tenantConfig.dominio || tenantConfig.domain,
            domain: tenantConfig.domain || tenantConfig.dominio,
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
            console.log(`[TENANT-CONTEXT] Tenant detectado: ${tenantConfig.id} (${tenantConfig.nombre || tenantConfig.school_name})`);
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

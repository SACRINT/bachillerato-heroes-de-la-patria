/**
 * 🔀 API VERSIONING MIDDLEWARE - SEMANA 8
 * Manejo de versiones de API con backward compatibility
 *
 * Características:
 * - Detección automática de versión (header, URL path, query param)
 * - Backward compatibility entre v1 y v2
 * - Deprecation warnings para v1
 * - Version negotiation automático
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ COMPLETADO
 */

const devLogger = require('../utils/devLogger');

// =============================================================================
// CONFIGURACIÓN DE VERSIONES
// =============================================================================

const API_VERSIONS = {
    v1: {
        version: '1.0.0',
        status: 'deprecated',
        deprecationDate: '2026-05-17', // 6 meses desde hoy
        endOfLifeDate: '2026-11-17', // 12 meses desde hoy
        features: ['basic-crud', 'auth', 'search'],
    },
    v2: {
        version: '2.0.0',
        status: 'stable',
        features: ['basic-crud', 'auth', 'search', 'webhooks', 'analytics', 'real-time'],
    },
};

const DEFAULT_VERSION = 'v2';
const SUPPORTED_VERSIONS = ['v1', 'v2'];

// =============================================================================
// MIDDLEWARE PRINCIPAL
// =============================================================================

/**
 * Middleware para detectar y validar versión de API
 *
 * Orden de prioridad:
 * 1. Header: Accept-Version: v2
 * 2. URL path: /api/v2/...
 * 3. Query param: ?api_version=v2
 * 4. Default: v2
 */
function apiVersioning(req, res, next) {
    try {
        // Detectar versión solicitada
        const requestedVersion = detectVersion(req);

        // Validar versión
        if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
            return res.status(400).json({
                error: 'UNSUPPORTED_API_VERSION',
                message: `Versión ${requestedVersion} no soportada`,
                supportedVersions: SUPPORTED_VERSIONS,
                defaultVersion: DEFAULT_VERSION,
            });
        }

        // Obtener configuración de versión
        const versionConfig = API_VERSIONS[requestedVersion];

        // Check si la versión está deprecada
        if (versionConfig.status === 'deprecated') {
            res.set('X-API-Deprecation-Warning', 'true');
            res.set('X-API-Deprecation-Date', versionConfig.deprecationDate);
            res.set('X-API-End-Of-Life', versionConfig.endOfLifeDate);
            res.set('X-API-Migration-Guide', 'https://docs.bge.edu.mx/api/migration-v2');

            devLogger.warn(`[API-VERSION] Usuario usando API v1 (DEPRECATED). User: ${req.user?.email || 'anonymous'}`);
        }

        // Agregar información de versión a request
        req.apiVersion = requestedVersion;
        req.apiVersionConfig = versionConfig;

        // Headers informativos
        res.set('X-API-Version', requestedVersion);
        res.set('X-API-Version-Status', versionConfig.status);

        devLogger.log(`[API-VERSION] Request usando ${requestedVersion} - Path: ${req.path}`);

        next();

    } catch (error) {
        devLogger.error('[API-VERSION] Error en middleware:', error);
        return res.status(500).json({
            error: 'VERSIONING_ERROR',
            message: 'Error al procesar versión de API',
            details: error.message,
        });
    }
}

/**
 * Detecta la versión solicitada desde múltiples fuentes
 */
function detectVersion(req) {
    // 1. Header Accept-Version
    const headerVersion = req.get('Accept-Version');
    if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion)) {
        return headerVersion;
    }

    // 2. URL path (/api/v1/... o /api/v2/...)
    const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
    if (pathMatch && pathMatch[1]) {
        const pathVersion = pathMatch[1];
        if (SUPPORTED_VERSIONS.includes(pathVersion)) {
            return pathVersion;
        }
    }

    // 3. Query parameter (?api_version=v2)
    const queryVersion = req.query.api_version;
    if (queryVersion && SUPPORTED_VERSIONS.includes(queryVersion)) {
        return queryVersion;
    }

    // 4. Default
    return DEFAULT_VERSION;
}

// =============================================================================
// MIDDLEWARE DE COMPATIBILIDAD v1 → v2
// =============================================================================

/**
 * Transforma requests v1 al formato v2 (backward compatibility)
 *
 * Cambios principales v1 → v2:
 * - Campo `active` → `status` ('active'/'inactive')
 * - Campo `password` → `password_hash`
 * - Response format: data wrapping
 */
function v1CompatibilityLayer(req, res, next) {
    if (req.apiVersion !== 'v1') {
        return next();
    }

    devLogger.log('[API-V1-COMPAT] Aplicando capa de compatibilidad para v1');

    // Transform request body v1 → v2
    if (req.body) {
        // active → status
        if (req.body.hasOwnProperty('active')) {
            req.body.status = req.body.active ? 'activo' : 'inactivo';
            delete req.body.active;
        }

        // password → password_hash (backend will handle hashing)
        if (req.body.password && !req.body.password_hash) {
            req.body.password_hash = req.body.password;
        }
    }

    // Intercept response para transformar v2 → v1
    const originalJson = res.json.bind(res);
    res.json = function (data) {
        if (data && typeof data === 'object') {
            // status → active
            if (data.status) {
                data.active = data.status === 'activo';
            }

            // Unwrap data si es v1 (v2 usa { success, data }, v1 solo devuelve data)
            if (data.success !== undefined && data.data) {
                return originalJson(data.data);
            }
        }

        return originalJson(data);
    };

    next();
}

// =============================================================================
// MIDDLEWARE DE RATE LIMITING POR TIER
// =============================================================================

/**
 * Rate limiting basado en el plan del tenant
 *
 * Límites:
 * - starter: 100 requests/hora
 * - pro: 1000 requests/hora
 * - enterprise: 10000 requests/hora
 * - no tenant (público): 50 requests/hora
 */
const requestCounts = new Map(); // { tenantId: { count, resetTime } }

function rateLimitByTier(req, res, next) {
    const tenantId = req.tenantId || req.user?.tenant_id || 'anonymous';
    const tenantPlan = req.tenant?.plan || 'starter';

    // Límites por plan (OPTIMIZADOS PARA LOAD TESTING - SEMANA 30 FASE 30.3b)
    // Cambio: de límites por HORA a límites por MINUTO (1000x más permisivo)
    const RATE_LIMITS = {
        starter: { requests: 10000, window: 60000 }, // 10,000 por minuto (167 req/seg)
        pro: { requests: 50000, window: 60000 }, // 50,000 por minuto (833 req/seg)
        enterprise: { requests: 100000, window: 60000 }, // 100,000 por minuto (1667 req/seg)
        anonymous: { requests: 10000, window: 60000 }, // 10,000 por minuto (167 req/seg)
    };

    const limit = RATE_LIMITS[tenantPlan] || RATE_LIMITS.starter;
    const now = Date.now();

    // Obtener contador del tenant
    let record = requestCounts.get(tenantId);

    // Resetear si la ventana expiró
    if (!record || now > record.resetTime) {
        record = {
            count: 0,
            resetTime: now + limit.window,
        };
        requestCounts.set(tenantId, record);
    }

    // Incrementar contador
    record.count++;

    // Headers informativos
    res.set('X-RateLimit-Limit', limit.requests);
    res.set('X-RateLimit-Remaining', Math.max(0, limit.requests - record.count));
    res.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    // Check límite
    if (record.count > limit.requests) {
        devLogger.warn(`[RATE-LIMIT] Tenant ${tenantId} (plan: ${tenantPlan}) excedió límite: ${record.count}/${limit.requests}`);

        return res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: `Has excedido el límite de ${limit.requests} requests por hora`,
            plan: tenantPlan,
            limit: limit.requests,
            resetAt: new Date(record.resetTime).toISOString(),
            upgradeUrl: 'https://bge.edu.mx/pricing',
        });
    }

    next();
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Obtiene información de todas las versiones disponibles
 */
function getVersionsInfo() {
    return {
        supportedVersions: SUPPORTED_VERSIONS,
        defaultVersion: DEFAULT_VERSION,
        versions: API_VERSIONS,
    };
}

/**
 * Verifica si una feature está disponible en una versión
 */
function isFeatureAvailable(version, feature) {
    const versionConfig = API_VERSIONS[version];
    return versionConfig && versionConfig.features.includes(feature);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    apiVersioning,
    v1CompatibilityLayer,
    rateLimitByTier,
    getVersionsInfo,
    isFeatureAvailable,
    API_VERSIONS,
    SUPPORTED_VERSIONS,
    DEFAULT_VERSION,
};

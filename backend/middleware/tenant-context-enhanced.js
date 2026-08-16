/**
 * 🏢 TENANT CONTEXT ENHANCED - v1.0.0
 * Middleware avanzado de contexto multi-tenant
 *
 * SEMANA 13-16 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Detección de tenant por dominio/subdomain
 * - Inyección de tenant_id en queries
 * - Cache de configuración de tenant
 * - Validación de tenant activo
 * - Audit logging por tenant
 */

const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

// Cache de tenants
const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Middleware principal de contexto de tenant
 */
async function tenantContextMiddleware(req, res, next) {
  try {
    // Obtener identificador de tenant
    const tenantIdentifier = getTenantIdentifier(req);

    if (!tenantIdentifier) {
      // Sin tenant = acceso público o default
      req.tenantId = null;
      req.tenantConfig = null;
      return next();
    }

    // Buscar tenant en cache o BD
    const tenant = await getTenant(tenantIdentifier);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Institución no encontrada'
      });
    }

    if (tenant.status !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'Institución no activa'
      });
    }

    // Inyectar contexto en request
    req.tenantId = tenant.id;
    req.tenantConfig = tenant.config_json || {};
    req.tenantName = tenant.name;
    req.tenantDomain = tenant.domain;

    // Set PostgreSQL session variable para RLS
    await pool.query(`SET app.current_tenant = '${tenant.id}'`);

    devLogger.log(`[TenantContext] Tenant: ${tenant.name} (ID: ${tenant.id})`);

    next();
  } catch (error) {
    devLogger.error('[TenantContext] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error de configuración de tenant'
    });
  }
}

/**
 * Obtener identificador de tenant desde request
 * @param {Object} req - Request
 * @returns {string|null} Identificador
 */
function getTenantIdentifier(req) {
  // 1. Header personalizado
  if (req.headers['x-tenant-id']) {
    return req.headers['x-tenant-id'];
  }

  // 2. Subdominio
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    return subdomain;
  }

  // 3. Query param (para desarrollo)
  if (req.query.tenant) {
    return req.query.tenant;
  }

  // 4. Dominio completo
  return host.replace(/:\d+$/, ''); // Remover puerto
}

/**
 * Obtener tenant de cache o BD
 * @param {string} identifier - Identificador
 * @returns {Promise<Object|null>} Tenant
 */
async function getTenant(identifier) {
  // Verificar cache
  const cached = tenantCache.get(identifier);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Buscar en BD
  const result = await pool.query(`
    SELECT id, name, domain, status, config_json, logo_url, primary_color, created_at
    FROM tenants
    WHERE domain = $1 OR subdomain = $1 OR id::text = $1
    LIMIT 1
  `, [identifier]);

  if (result.rows.length === 0) {
    return null;
  }

  const tenant = result.rows[0];

  // Guardar en cache
  tenantCache.set(identifier, {
    data: tenant,
    timestamp: Date.now()
  });

  return tenant;
}

/**
 * Middleware para requerir tenant
 */
function requireTenant(req, res, next) {
  if (!req.tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere contexto de institución'
    });
  }
  next();
}

/**
 * Middleware para super admin (sin restricción de tenant)
 */
function superAdminBypass(req, res, next) {
  if (req.user && req.user.role === 'super_admin') {
    // Super admin puede acceder a cualquier tenant
    return next();
  }

  // Verificar que el usuario pertenece al tenant
  if (req.tenantId && req.user && req.user.tenant_id !== req.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'No tiene acceso a esta institución'
    });
  }

  next();
}

/**
 * Helper para obtener tenant_id en queries
 * @param {Object} req - Request
 * @returns {number|null} Tenant ID
 */
function getTenantId(req) {
  return req.tenantId || null;
}

/**
 * Helper para agregar filtro de tenant a query
 * @param {string} query - Query SQL
 * @param {Object} req - Request
 * @param {string} alias - Alias de tabla (opcional)
 * @returns {string} Query con filtro
 */
function addTenantFilter(query, req, alias = '') {
  if (!req.tenantId) return query;

  const prefix = alias ? `${alias}.` : '';
  const whereClause = query.toLowerCase().includes('where')
    ? ` AND ${prefix}tenant_id = ${req.tenantId}`
    : ` WHERE ${prefix}tenant_id = ${req.tenantId}`;

  // Insertar antes de ORDER BY, LIMIT, etc.
  const insertPoint = query.search(/\b(ORDER|LIMIT|GROUP|HAVING)\b/i);
  if (insertPoint > -1) {
    return query.slice(0, insertPoint) + whereClause + ' ' + query.slice(insertPoint);
  }

  return query + whereClause;
}

/**
 * Limpiar cache de tenant
 * @param {string} identifier - Identificador
 */
function clearTenantCache(identifier) {
  if (identifier) {
    tenantCache.delete(identifier);
  } else {
    tenantCache.clear();
  }
  devLogger.log('[TenantContext] Cache limpiado');
}

/**
 * Obtener estadísticas del cache
 * @returns {Object} Stats
 */
function getCacheStats() {
  return {
    size: tenantCache.size,
    entries: Array.from(tenantCache.keys())
  };
}

/**
 * Middleware para audit logging
 */
function tenantAuditLog(action) {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(body) {
      // Log después de la respuesta
      if (req.tenantId) {
        pool.query(`
          INSERT INTO tenant_audit_logs
          (tenant_id, user_id, action, resource, ip_address, user_agent, status_code, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          req.tenantId,
          req.user?.id || null,
          action,
          req.originalUrl,
          req.ip,
          req.headers['user-agent'],
          res.statusCode
        ]).catch(err => {
          devLogger.error('[TenantAudit] Error:', err.message);
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

module.exports = {
  tenantContextMiddleware,
  requireTenant,
  superAdminBypass,
  getTenantId,
  getTenantIdentifier,
  addTenantFilter,
  clearTenantCache,
  getCacheStats,
  tenantAuditLog
};

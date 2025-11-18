/**
 * 🏢 TENANT CONTEXT MIDDLEWARE - ADVANCED (SEMANA 13)
 * Establece el contexto de tenant para aislamiento multi-tenancy
 * con Row-Level Security (RLS) en PostgreSQL
 */

const pool = require('../config/database');
const logger = require('../utils/winston-logger');

/**
 * Middleware principal de tenant context
 * Estrategias de detección (en orden de prioridad):
 * 1. Header X-Tenant-ID (API keys)
 * 2. Subdomain (ej: school1.bge.edu.mx)
 * 3. JWT claims (req.user.tenant_id)
 * 4. Domain mapping (ej: escuela.com → tenant_id)
 */
async function tenantContextAdvanced(req, res, next) {
  let tenantId = null;
  let detectionStrategy = null;

  try {
    // Estrategia 1: Header X-Tenant-ID (usado por API keys)
    if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
      detectionStrategy = 'header';
      logger.debug('[TENANT-CONTEXT] Tenant detectado via header', { tenantId });
    }

    // Estrategia 2: Subdomain extraction (ej: school1.bge.edu.mx → school1)
    else if (req.hostname) {
      const subdomain = extractSubdomain(req.hostname);
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const tenant = await getTenantBySubdomain(subdomain);
        if (tenant) {
          tenantId = tenant.id;
          detectionStrategy = 'subdomain';
          logger.debug('[TENANT-CONTEXT] Tenant detectado via subdomain', {
            subdomain,
            tenantId,
          });
        }
      }
    }

    // Estrategia 3: JWT claims (desde middleware de autenticación)
    if (!tenantId && req.user?.tenant_id) {
      tenantId = req.user.tenant_id;
      detectionStrategy = 'jwt';
      logger.debug('[TENANT-CONTEXT] Tenant detectado via JWT', { tenantId });
    }

    // Estrategia 4: Domain mapping completo (ej: escuela.com → tenant_id)
    if (!tenantId && req.hostname) {
      const tenant = await getTenantByDomain(req.hostname);
      if (tenant) {
        tenantId = tenant.id;
        detectionStrategy = 'domain';
        logger.debug('[TENANT-CONTEXT] Tenant detectado via domain', {
          domain: req.hostname,
          tenantId,
        });
      }
    }

    // Si no se pudo detectar tenant, rechazar request (403 Forbidden)
    if (!tenantId) {
      logger.warn('[TENANT-CONTEXT] No se pudo identificar tenant', {
        hostname: req.hostname,
        headers: req.headers,
        user: req.user?.id,
      });
      return res.status(403).json({
        error: 'Tenant not identified',
        message: 'No se pudo determinar el tenant para esta solicitud',
      });
    }

    // Verificar que el tenant existe y está activo
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      logger.warn('[TENANT-CONTEXT] Tenant no encontrado', { tenantId });
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'El tenant especificado no existe',
      });
    }

    if (tenant.status !== 'active') {
      logger.warn('[TENANT-CONTEXT] Tenant inactivo', {
        tenantId,
        status: tenant.status,
      });
      return res.status(403).json({
        error: 'Tenant inactive',
        message: 'El tenant está desactivado. Contacte al administrador.',
      });
    }

    // Establecer tenant_id en la sesión de PostgreSQL (RLS)
    const client = await pool.connect();
    try {
      // Validar formato UUID antes de usar interpolación (seguridad crítica)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
        throw new Error('Invalid tenant ID format');
      }

      // PostgreSQL no permite placeholders en SET LOCAL, usar valor literal
      await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);

      // Si el usuario es super-admin, permitir ver todos los tenants
      const isSuperAdmin = req.user?.role === 'super_admin';
      if (isSuperAdmin) {
        await client.query('SET LOCAL app.is_super_admin = TRUE');
        logger.debug('[TENANT-CONTEXT] Super-admin mode activado', {
          userId: req.user.id,
        });
      }

      // Adjuntar información de tenant al request
      req.tenant = {
        id: tenantId,
        name: tenant.nombre,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        plan: tenant.plan,
        config: tenant.config_json || {},
        detectionStrategy,
      };

      // Adjuntar client de PostgreSQL al request (importante para RLS)
      req.dbClient = client;

      logger.info('[TENANT-CONTEXT] Contexto establecido exitosamente', {
        tenantId,
        tenantName: tenant.nombre,
        strategy: detectionStrategy,
        userId: req.user?.id,
        isSuperAdmin,
      });

      // Continuar con siguiente middleware
      next();
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    logger.error('[TENANT-CONTEXT] Error al establecer contexto', {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: 'Tenant context error',
      message: 'Error al establecer el contexto de tenant',
    });
  }
}

/**
 * Middleware para liberar el cliente de PostgreSQL al finalizar el request
 */
function releaseTenantContext(req, res, next) {
  res.on('finish', () => {
    if (req.dbClient) {
      req.dbClient.release();
      logger.debug('[TENANT-CONTEXT] Cliente PostgreSQL liberado');
    }
  });
  next();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extraer subdomain de un hostname
 * Ejemplos:
 * - school1.bge.edu.mx → school1
 * - www.bge.edu.mx → www
 * - localhost → null
 */
function extractSubdomain(hostname) {
  if (!hostname || hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

/**
 * Obtener tenant por subdomain
 */
async function getTenantBySubdomain(subdomain) {
  try {
    const result = await pool.query(
      'SELECT id, nombre, subdomain, domain, plan, status, config_json FROM tenants WHERE subdomain = $1 AND status = $2',
      [subdomain, 'active']
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('[TENANT-CONTEXT] Error al buscar tenant por subdomain', {
      subdomain,
      error: error.message,
    });
    return null;
  }
}

/**
 * Obtener tenant por domain completo
 */
async function getTenantByDomain(domain) {
  try {
    const result = await pool.query(
      'SELECT id, nombre, subdomain, domain, plan, status, config_json FROM tenants WHERE domain = $1 AND status = $2',
      [domain, 'active']
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('[TENANT-CONTEXT] Error al buscar tenant por domain', {
      domain,
      error: error.message,
    });
    return null;
  }
}

/**
 * Obtener tenant por ID
 */
async function getTenantById(tenantId) {
  try {
    const result = await pool.query(
      'SELECT id, nombre, subdomain, domain, plan, status, config_json FROM tenants WHERE id = $1',
      [tenantId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('[TENANT-CONTEXT] Error al buscar tenant por ID', {
      tenantId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Middleware para rutas públicas (sin tenant requerido)
 * Útil para /health, /metrics, documentación, etc.
 */
function optionalTenantContext(req, res, next) {
  // Intentar detectar tenant, pero no rechazar si falla
  tenantContextAdvanced(req, res, (err) => {
    if (err) {
      logger.debug('[TENANT-CONTEXT] Tenant opcional no detectado, continuando', {
        path: req.path,
      });
      // Ignorar error y continuar sin tenant
      next();
    } else {
      // Tenant detectado exitosamente
      next();
    }
  });
}

module.exports = {
  tenantContextAdvanced,
  releaseTenantContext,
  optionalTenantContext,
  extractSubdomain,
  getTenantBySubdomain,
  getTenantByDomain,
  getTenantById,
};

/**
 * 📋 AUDIT LOG SERVICE - v1.0.0
 * Servicio de auditoría para compliance BGE
 *
 * v5.1.0 Features
 * Fecha: 19 Noviembre 2025
 *
 * Compliance:
 * - GDPR Article 30 (Records of processing)
 * - FERPA (Educational records)
 * - SOC 2 Type II
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');
const crypto = require('crypto');

/**
 * Clase de error personalizada
 */
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

// Categorías de eventos
const EVENT_CATEGORIES = {
  AUTH: 'authentication',
  DATA: 'data_access',
  ADMIN: 'administration',
  SECURITY: 'security',
  SYSTEM: 'system',
  EXPORT: 'data_export',
  COMPLIANCE: 'compliance'
};

// Niveles de severidad
const SEVERITY_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Acciones auditables
const AUDIT_ACTIONS = {
  // Autenticación
  LOGIN_SUCCESS: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.INFO },
  LOGIN_FAILED: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.WARNING },
  LOGOUT: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.INFO },
  PASSWORD_CHANGE: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.INFO },
  PASSWORD_RESET: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.WARNING },
  MFA_ENABLED: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.INFO },
  MFA_DISABLED: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.WARNING },

  // Datos
  DATA_CREATE: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.INFO },
  DATA_READ: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.INFO },
  DATA_UPDATE: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.INFO },
  DATA_DELETE: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.WARNING },
  DATA_EXPORT: { category: EVENT_CATEGORIES.EXPORT, severity: SEVERITY_LEVELS.WARNING },
  DATA_IMPORT: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.WARNING },
  BULK_OPERATION: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.WARNING },

  // Administración
  USER_CREATE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.INFO },
  USER_UPDATE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.INFO },
  USER_DELETE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  USER_SUSPEND: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  ROLE_CHANGE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  PERMISSION_CHANGE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  CONFIG_CHANGE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },

  // Seguridad
  ACCESS_DENIED: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.WARNING },
  RATE_LIMIT_EXCEEDED: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.WARNING },
  SUSPICIOUS_ACTIVITY: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.ERROR },
  BRUTE_FORCE_DETECTED: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.CRITICAL },
  SQL_INJECTION_ATTEMPT: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.CRITICAL },
  XSS_ATTEMPT: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.CRITICAL },

  // Sistema
  SYSTEM_START: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.INFO },
  SYSTEM_STOP: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.INFO },
  BACKUP_CREATED: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.INFO },
  BACKUP_RESTORED: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.WARNING },
  MIGRATION_EXECUTED: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.WARNING },

  // Compliance
  GDPR_REQUEST: { category: EVENT_CATEGORIES.COMPLIANCE, severity: SEVERITY_LEVELS.INFO },
  DATA_RETENTION_CLEANUP: { category: EVENT_CATEGORIES.COMPLIANCE, severity: SEVERITY_LEVELS.INFO },
  CONSENT_GIVEN: { category: EVENT_CATEGORIES.COMPLIANCE, severity: SEVERITY_LEVELS.INFO },
  CONSENT_REVOKED: { category: EVENT_CATEGORIES.COMPLIANCE, severity: SEVERITY_LEVELS.WARNING }
};

class AuditLogService {
  constructor() {
    this.batchQueue = [];
    this.batchSize = 100;
    this.flushInterval = 5000; // 5 segundos
    this.flushTimer = null;
  }

  /**
   * Inicializar servicio
   */
  async initialize() {
    // Iniciar flush periódico
    this.flushTimer = setInterval(() => this._flushBatch(), this.flushInterval);
    devLogger.log('[AuditLog] Servicio inicializado');
  }

  /**
   * Registrar evento de auditoría
   * @param {Object} options - Opciones del evento
   * @returns {Promise<string>} ID del evento
   */
  async log(options) {
    const {
      action,
      userId = null,
      tenantId = null,
      resourceType = null,
      resourceId = null,
      details = {},
      ip = null,
      userAgent = null,
      sessionId = null
    } = options;

    // Validar acción
    const actionConfig = AUDIT_ACTIONS[action];
    if (!actionConfig) {
      devLogger.warn(`[AuditLog] Acción no reconocida: ${action}`);
    }

    const event = {
      id: this._generateEventId(),
      timestamp: new Date().toISOString(),
      action,
      category: actionConfig?.category || EVENT_CATEGORIES.SYSTEM,
      severity: actionConfig?.severity || SEVERITY_LEVELS.INFO,
      userId,
      tenantId,
      resourceType,
      resourceId,
      details: this._sanitizeDetails(details),
      ip: this._hashIP(ip),
      userAgent: this._truncateUserAgent(userAgent),
      sessionId,
      checksum: null
    };

    // Calcular checksum para integridad
    event.checksum = this._calculateChecksum(event);

    // Agregar a batch
    this.batchQueue.push(event);

    // Flush si alcanza el tamaño del batch
    if (this.batchQueue.length >= this.batchSize) {
      await this._flushBatch();
    }

    // Log inmediato para eventos críticos
    if (event.severity === SEVERITY_LEVELS.CRITICAL) {
      await this._persistEvent(event);
      devLogger.error(`[AuditLog] CRÍTICO: ${action}`, details);
    }

    return event.id;
  }

  /**
   * Registrar acceso a datos
   */
  async logDataAccess(userId, resourceType, resourceId, operation, details = {}) {
    const actionMap = {
      create: 'DATA_CREATE',
      read: 'DATA_READ',
      update: 'DATA_UPDATE',
      delete: 'DATA_DELETE'
    };

    return this.log({
      action: actionMap[operation] || 'DATA_READ',
      userId,
      resourceType,
      resourceId,
      details
    });
  }

  /**
   * Registrar evento de autenticación
   */
  async logAuth(action, userId, ip, details = {}) {
    return this.log({
      action,
      userId,
      ip,
      details
    });
  }

  /**
   * Registrar evento de seguridad
   */
  async logSecurity(action, ip, details = {}) {
    return this.log({
      action,
      ip,
      details
    });
  }

  /**
   * Buscar eventos de auditoría
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Resultados paginados
   */
  async search(filters = {}) {
    const {
      page = 1,
      limit = 50,
      action,
      category,
      severity,
      userId,
      tenantId,
      resourceType,
      resourceId,
      startDate,
      endDate,
      ip
    } = filters;

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(action);
    }

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(severity);
    }

    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (tenantId) {
      query += ` AND tenant_id = $${paramIndex++}`;
      params.push(tenantId);
    }

    if (resourceType) {
      query += ` AND resource_type = $${paramIndex++}`;
      params.push(resourceType);
    }

    if (resourceId) {
      query += ` AND resource_id = $${paramIndex++}`;
      params.push(resourceId);
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(endDate);
    }

    if (ip) {
      query += ` AND ip_hash = $${paramIndex++}`;
      params.push(this._hashIP(ip));
    }

    // Contar total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Agregar paginación y ordenamiento
    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener actividad de usuario
   * @param {number} userId - ID del usuario
   * @param {number} days - Días a consultar
   */
  async getUserActivity(userId, days = 30) {
    const query = `
      SELECT
        action,
        category,
        timestamp,
        resource_type,
        resource_id,
        details
      FROM audit_log
      WHERE user_id = $1
        AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
      LIMIT 1000
    `;

    const result = await pool.query(query, [userId]);

    // Agrupar por día
    const byDay = {};
    result.rows.forEach(row => {
      const day = row.timestamp.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(row);
    });

    return {
      userId,
      period: `${days} días`,
      totalEvents: result.rows.length,
      byDay
    };
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getStats(days = 30) {
    const query = `
      SELECT
        category,
        severity,
        COUNT(*) as count
      FROM audit_log
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY category, severity
      ORDER BY count DESC
    `;

    const result = await pool.query(query);

    // Eventos por categoría
    const byCategory = {};
    const bySeverity = {};

    result.rows.forEach(row => {
      if (!byCategory[row.category]) byCategory[row.category] = 0;
      byCategory[row.category] += parseInt(row.count);

      if (!bySeverity[row.severity]) bySeverity[row.severity] = 0;
      bySeverity[row.severity] += parseInt(row.count);
    });

    // Tendencia diaria
    const trendQuery = `
      SELECT
        DATE_TRUNC('day', timestamp) as day,
        COUNT(*) as count
      FROM audit_log
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('day', timestamp)
      ORDER BY day
    `;

    const trendResult = await pool.query(trendQuery);

    return {
      period: `${days} días`,
      total: result.rows.reduce((acc, r) => acc + parseInt(r.count), 0),
      byCategory,
      bySeverity,
      trend: trendResult.rows.map(r => ({
        day: r.day,
        count: parseInt(r.count)
      }))
    };
  }

  /**
   * Exportar logs para compliance
   * @param {Object} options - Opciones de exportación
   */
  async exportLogs(options = {}) {
    const { startDate, endDate, format = 'json' } = options;

    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ` AND timestamp >= $1`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ' ORDER BY timestamp';

    const result = await pool.query(query, params);

    // Registrar la exportación
    await this.log({
      action: 'DATA_EXPORT',
      details: {
        type: 'audit_logs',
        recordCount: result.rows.length,
        startDate,
        endDate
      }
    });

    if (format === 'json') {
      return result.rows;
    } else if (format === 'csv') {
      return this._toCSV(result.rows);
    }

    return result.rows;
  }

  /**
   * Verificar integridad de logs
   */
  async verifyIntegrity(startDate, endDate) {
    const query = `
      SELECT * FROM audit_log
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp
    `;

    const result = await pool.query(query, [startDate, endDate]);
    const issues = [];

    for (const event of result.rows) {
      const calculatedChecksum = this._calculateChecksum({
        id: event.id,
        timestamp: event.timestamp,
        action: event.action,
        category: event.category,
        severity: event.severity,
        userId: event.user_id,
        tenantId: event.tenant_id,
        resourceType: event.resource_type,
        resourceId: event.resource_id,
        details: event.details
      });

      if (calculatedChecksum !== event.checksum) {
        issues.push({
          eventId: event.id,
          timestamp: event.timestamp,
          issue: 'Checksum mismatch - posible manipulación'
        });
      }
    }

    return {
      verified: result.rows.length,
      issues: issues.length,
      integrity: issues.length === 0 ? 'PASS' : 'FAIL',
      details: issues
    };
  }

  /**
   * Limpiar logs antiguos (retention policy)
   * @param {number} retentionDays - Días de retención
   */
  async cleanup(retentionDays = 365) {
    const query = `
      DELETE FROM audit_log
      WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'
      RETURNING id
    `;

    const result = await pool.query(query);
    const deletedCount = result.rows.length;

    // Registrar la limpieza
    await this.log({
      action: 'DATA_RETENTION_CLEANUP',
      details: {
        deletedRecords: deletedCount,
        retentionDays
      }
    });

    devLogger.log(`[AuditLog] Limpieza completada: ${deletedCount} registros eliminados`);

    return { deleted: deletedCount };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  _generateEventId() {
    return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  _sanitizeDetails(details) {
    // Remover datos sensibles
    const sanitized = { ...details };
    const sensitiveKeys = ['password', 'token', 'secret', 'creditCard', 'ssn'];

    const sanitize = (obj) => {
      for (const key in obj) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };

    sanitize(sanitized);
    return sanitized;
  }

  _hashIP(ip) {
    if (!ip) return null;
    // Hash de IP para privacidad pero permitir búsquedas
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
  }

  _truncateUserAgent(userAgent) {
    if (!userAgent) return null;
    // Mantener solo información relevante
    return userAgent.substring(0, 255);
  }

  _calculateChecksum(event) {
    const data = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      action: event.action,
      userId: event.userId,
      details: event.details
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async _flushBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.batchSize);

    try {
      const values = batch.map(e => [
        e.id,
        e.timestamp,
        e.action,
        e.category,
        e.severity,
        e.userId,
        e.tenantId,
        e.resourceType,
        e.resourceId,
        JSON.stringify(e.details),
        e.ip,
        e.userAgent,
        e.sessionId,
        e.checksum
      ]);

      const placeholders = values.map((_, i) => {
        const base = i * 14;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14})`;
      });

      const query = `
        INSERT INTO audit_log (
          id, timestamp, action, category, severity, user_id, tenant_id,
          resource_type, resource_id, details, ip_hash, user_agent, session_id, checksum
        ) VALUES ${placeholders.join(', ')}
      `;

      await pool.query(query, values.flat());
    } catch (error) {
      devLogger.error('[AuditLog] Error en flush:', error.message);
      // Re-agregar a la cola para reintentar
      this.batchQueue.unshift(...batch);
    }
  }

  async _persistEvent(event) {
    const query = `
      INSERT INTO audit_log (
        id, timestamp, action, category, severity, user_id, tenant_id,
        resource_type, resource_id, details, ip_hash, user_agent, session_id, checksum
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;

    await pool.query(query, [
      event.id,
      event.timestamp,
      event.action,
      event.category,
      event.severity,
      event.userId,
      event.tenantId,
      event.resourceType,
      event.resourceId,
      JSON.stringify(event.details),
      event.ip,
      event.userAgent,
      event.sessionId,
      event.checksum
    ]);
  }

  _toCSV(rows) {
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map(h => {
        const val = row[h];
        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Detener servicio
   */
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this._flushBatch();
    devLogger.log('[AuditLog] Servicio detenido');
  }
}

module.exports = new AuditLogService();
module.exports.ServiceError = ServiceError;
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
module.exports.EVENT_CATEGORIES = EVENT_CATEGORIES;
module.exports.SEVERITY_LEVELS = SEVERITY_LEVELS;

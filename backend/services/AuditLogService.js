/**
 * 📋 AUDIT LOG SERVICE - v2.0.0
 * Servicio de auditoría para compliance BGE
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar AuditLogDAO
 * - Sin SQL directo en el servicio
 */

const AuditLogDAO = require('../data/audit-log.dao.js');
const devLogger = require('../utils/devLogger.js');
const crypto = require('crypto');

class ServiceError extends Error {
  constructor(message, statusCode = 500) { super(message); this.name = 'ServiceError'; this.statusCode = statusCode; }
}

const EVENT_CATEGORIES = { AUTH: 'authentication', DATA: 'data_access', ADMIN: 'administration', SECURITY: 'security', SYSTEM: 'system', EXPORT: 'data_export', COMPLIANCE: 'compliance' };
const SEVERITY_LEVELS = { INFO: 'info', WARNING: 'warning', ERROR: 'error', CRITICAL: 'critical' };

const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.INFO },
  LOGIN_FAILED: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.WARNING },
  LOGOUT: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.INFO },
  PASSWORD_CHANGE: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.INFO },
  PASSWORD_RESET: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.WARNING },
  MFA_ENABLED: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.INFO },
  MFA_DISABLED: { category: EVENT_CATEGORIES.AUTH, severity: SEVERITY_LEVELS.WARNING },
  DATA_CREATE: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.INFO },
  DATA_READ: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.INFO },
  DATA_UPDATE: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.INFO },
  DATA_DELETE: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.WARNING },
  DATA_EXPORT: { category: EVENT_CATEGORIES.EXPORT, severity: SEVERITY_LEVELS.WARNING },
  DATA_IMPORT: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.WARNING },
  BULK_OPERATION: { category: EVENT_CATEGORIES.DATA, severity: SEVERITY_LEVELS.WARNING },
  USER_CREATE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.INFO },
  USER_UPDATE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.INFO },
  USER_DELETE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  USER_SUSPEND: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  ROLE_CHANGE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  PERMISSION_CHANGE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  CONFIG_CHANGE: { category: EVENT_CATEGORIES.ADMIN, severity: SEVERITY_LEVELS.WARNING },
  ACCESS_DENIED: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.WARNING },
  RATE_LIMIT_EXCEEDED: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.WARNING },
  SUSPICIOUS_ACTIVITY: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.ERROR },
  BRUTE_FORCE_DETECTED: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.CRITICAL },
  SQL_INJECTION_ATTEMPT: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.CRITICAL },
  XSS_ATTEMPT: { category: EVENT_CATEGORIES.SECURITY, severity: SEVERITY_LEVELS.CRITICAL },
  SYSTEM_START: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.INFO },
  SYSTEM_STOP: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.INFO },
  BACKUP_CREATED: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.INFO },
  BACKUP_RESTORED: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.WARNING },
  MIGRATION_EXECUTED: { category: EVENT_CATEGORIES.SYSTEM, severity: SEVERITY_LEVELS.WARNING },
  GDPR_REQUEST: { category: EVENT_CATEGORIES.COMPLIANCE, severity: SEVERITY_LEVELS.INFO },
  DATA_RETENTION_CLEANUP: { category: EVENT_CATEGORIES.COMPLIANCE, severity: SEVERITY_LEVELS.INFO },
  CONSENT_GIVEN: { category: EVENT_CATEGORIES.COMPLIANCE, severity: SEVERITY_LEVELS.INFO },
  CONSENT_REVOKED: { category: EVENT_CATEGORIES.COMPLIANCE, severity: SEVERITY_LEVELS.WARNING }
};

class AuditLogService {
  constructor() {
    this.batchQueue = [];
    this.batchSize = 100;
    this.flushInterval = 5000;
    this.flushTimer = null;
  }

  async initialize() {
    this.flushTimer = setInterval(() => this._flushBatch(), this.flushInterval);
    devLogger.log('[AuditLog] Servicio inicializado');
  }

  async log(options) {
    const { action, userId = null, tenantId = null, resourceType = null, resourceId = null, details = {}, ip = null, userAgent = null, sessionId = null } = options;
    const actionConfig = AUDIT_ACTIONS[action];
    if (!actionConfig) devLogger.warn(`[AuditLog] Acción no reconocida: ${action}`);

    const event = {
      id: this._generateEventId(), timestamp: new Date().toISOString(), action,
      category: actionConfig?.category || EVENT_CATEGORIES.SYSTEM, severity: actionConfig?.severity || SEVERITY_LEVELS.INFO,
      userId, tenantId, resourceType, resourceId, details: this._sanitizeDetails(details),
      ip: this._hashIP(ip), userAgent: this._truncateUserAgent(userAgent), sessionId, checksum: null
    };
    event.checksum = this._calculateChecksum(event);

    this.batchQueue.push(event);
    if (this.batchQueue.length >= this.batchSize) await this._flushBatch();

    if (event.severity === SEVERITY_LEVELS.CRITICAL) {
      await AuditLogDAO.persistEvent(event);
      devLogger.error(`[AuditLog] CRÍTICO: ${action}`, details);
    }
    return event.id;
  }

  async logDataAccess(userId, resourceType, resourceId, operation, details = {}) {
    const actionMap = { create: 'DATA_CREATE', read: 'DATA_READ', update: 'DATA_UPDATE', delete: 'DATA_DELETE' };
    return this.log({ action: actionMap[operation] || 'DATA_READ', userId, resourceType, resourceId, details });
  }

  async logAuth(action, userId, ip, details = {}) { return this.log({ action, userId, ip, details }); }
  async logSecurity(action, ip, details = {}) { return this.log({ action, ip, details }); }

  async search(filters = {}) {
    const { page = 1, limit = 50, action, category, severity, userId, tenantId, resourceType, resourceId, startDate, endDate, ip } = filters;
    const offset = (page - 1) * limit;
    let whereClause = '1=1'; const params = [];

    if (action) { params.push(action); whereClause += ` AND action = $${params.length}`; }
    if (category) { params.push(category); whereClause += ` AND category = $${params.length}`; }
    if (severity) { params.push(severity); whereClause += ` AND severity = $${params.length}`; }
    if (userId) { params.push(userId); whereClause += ` AND user_id = $${params.length}`; }
    if (tenantId) { params.push(tenantId); whereClause += ` AND tenant_id = $${params.length}`; }
    if (resourceType) { params.push(resourceType); whereClause += ` AND resource_type = $${params.length}`; }
    if (resourceId) { params.push(resourceId); whereClause += ` AND resource_id = $${params.length}`; }
    if (startDate) { params.push(startDate); whereClause += ` AND timestamp >= $${params.length}`; }
    if (endDate) { params.push(endDate); whereClause += ` AND timestamp <= $${params.length}`; }
    if (ip) { params.push(this._hashIP(ip)); whereClause += ` AND ip_hash = $${params.length}`; }

    const { data, total } = await AuditLogDAO.search(whereClause, params, limit, offset);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getUserActivity(userId, days = 30) {
    const rows = await AuditLogDAO.getUserActivity(userId, days);
    const byDay = {};
    rows.forEach(row => { const day = row.timestamp.toISOString().split('T')[0]; if (!byDay[day]) byDay[day] = []; byDay[day].push(row); });
    return { userId, period: `${days} días`, totalEvents: rows.length, byDay };
  }

  async getStats(days = 30) {
    const rows = await AuditLogDAO.getStats(days);
    const byCategory = {}, bySeverity = {};
    rows.forEach(row => {
      byCategory[row.category] = (byCategory[row.category] || 0) + parseInt(row.count);
      bySeverity[row.severity] = (bySeverity[row.severity] || 0) + parseInt(row.count);
    });

    const trendRows = await AuditLogDAO.getTrend(days);
    return { period: `${days} días`, total: rows.reduce((acc, r) => acc + parseInt(r.count), 0), byCategory, bySeverity, trend: trendRows.map(r => ({ day: r.day, count: parseInt(r.count) })) };
  }

  async exportLogs(options = {}) {
    const { startDate, endDate, format = 'json' } = options;
    const rows = await AuditLogDAO.exportLogs(startDate, endDate);
    await this.log({ action: 'DATA_EXPORT', details: { type: 'audit_logs', recordCount: rows.length, startDate, endDate } });
    return format === 'csv' ? this._toCSV(rows) : rows;
  }

  async verifyIntegrity(startDate, endDate) {
    const rows = await AuditLogDAO.getLogsForIntegrity(startDate, endDate);
    const issues = [];
    for (const event of rows) {
      const calculated = this._calculateChecksum({ id: event.id, timestamp: event.timestamp, action: event.action, category: event.category, severity: event.severity, userId: event.user_id, tenantId: event.tenant_id, resourceType: event.resource_type, resourceId: event.resource_id, details: event.details });
      if (calculated !== event.checksum) issues.push({ eventId: event.id, timestamp: event.timestamp, issue: 'Checksum mismatch' });
    }
    return { verified: rows.length, issues: issues.length, integrity: issues.length === 0 ? 'PASS' : 'FAIL', details: issues };
  }

  async cleanup(retentionDays = 365) {
    const deletedCount = await AuditLogDAO.cleanup(retentionDays);
    await this.log({ action: 'DATA_RETENTION_CLEANUP', details: { deletedRecords: deletedCount, retentionDays } });
    devLogger.log(`[AuditLog] Limpieza completada: ${deletedCount} registros eliminados`);
    return { deleted: deletedCount };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  _generateEventId() { return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`; }

  _sanitizeDetails(details) {
    const sanitized = { ...details };
    const sensitiveKeys = ['password', 'token', 'secret', 'creditCard', 'ssn'];
    const sanitize = obj => { for (const key in obj) { if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) obj[key] = '[REDACTED]'; else if (typeof obj[key] === 'object' && obj[key] !== null) sanitize(obj[key]); } };
    sanitize(sanitized);
    return sanitized;
  }

  _hashIP(ip) { return ip ? crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16) : null; }
  _truncateUserAgent(userAgent) { return userAgent ? userAgent.substring(0, 255) : null; }
  _calculateChecksum(event) { return crypto.createHash('sha256').update(JSON.stringify({ id: event.id, timestamp: event.timestamp, action: event.action, userId: event.userId, details: event.details })).digest('hex'); }

  async _flushBatch() {
    if (this.batchQueue.length === 0) return;
    const batch = this.batchQueue.splice(0, this.batchSize);
    try { await AuditLogDAO.persistBatch(batch); } catch (error) { devLogger.error('[AuditLog] Error en flush:', error.message); this.batchQueue.unshift(...batch); }
  }

  _toCSV(rows) {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')];
    for (const row of rows) { const values = headers.map(h => { const val = row[h]; if (typeof val === 'object') return JSON.stringify(val); if (typeof val === 'string' && val.includes(',')) return `"${val}"`; return val; }); csvRows.push(values.join(',')); }
    return csvRows.join('\n');
  }

  async shutdown() { if (this.flushTimer) clearInterval(this.flushTimer); await this._flushBatch(); devLogger.log('[AuditLog] Servicio detenido'); }
}

module.exports = new AuditLogService();
module.exports.ServiceError = ServiceError;
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
module.exports.EVENT_CATEGORIES = EVENT_CATEGORIES;
module.exports.SEVERITY_LEVELS = SEVERITY_LEVELS;

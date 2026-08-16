/**
 * 📝 AUDIT SERVICE - v2.0.0
 * Sistema de auditoría y logging de acciones
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar AuditDAO
 */

const AuditDAO = require('../data/audit.dao.js');
const devLogger = require('../utils/devLogger.js');

class AuditService {
  constructor() {
    this.actions = { CREATE: 'create', READ: 'read', UPDATE: 'update', DELETE: 'delete', LOGIN: 'login', LOGOUT: 'logout', EXPORT: 'export', IMPORT: 'import' };
  }

  async log(params) {
    const { userId, action, entity, entityId, oldData, newData, ipAddress, userAgent, metadata } = params;
    try { return await AuditDAO.log(userId, action, entity, entityId, oldData, newData, ipAddress, userAgent, metadata); }
    catch (error) { devLogger.error('[Audit] Error al registrar:', error.message); return null; }
  }

  async getByUser(userId, options = {}) {
    const { page = 1, limit = 50, action, startDate, endDate } = options;
    const data = await AuditDAO.getByUser(userId, action, startDate, endDate, limit, (page - 1) * limit);
    return { success: true, data, pagination: { page, limit } };
  }

  async getByEntity(entity, entityId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const data = await AuditDAO.getByEntity(entity, entityId, limit, (page - 1) * limit);
    return { success: true, data };
  }

  async getStats(options = {}) {
    const { startDate, endDate } = options;
    const data = await AuditDAO.getStats(startDate, endDate);
    return { success: true, data };
  }

  async cleanup(daysToKeep = 90) {
    const count = await AuditDAO.cleanup(daysToKeep);
    devLogger.log(`[Audit] Limpiados ${count} registros antiguos`);
    return count;
  }

  middleware() {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        if (data && data.success && req.user) {
          this.log({ userId: req.user.id, action: this.getActionFromMethod(req.method), entity: this.getEntityFromPath(req.path), entityId: req.params.id, ipAddress: req.ip, userAgent: req.get('user-agent') });
        }
        return originalJson(data);
      };
      next();
    };
  }

  getActionFromMethod(method) { const map = { GET: this.actions.READ, POST: this.actions.CREATE, PUT: this.actions.UPDATE, PATCH: this.actions.UPDATE, DELETE: this.actions.DELETE }; return map[method] || 'unknown'; }
  getEntityFromPath(path) { const parts = path.split('/').filter(Boolean); return parts[1] || 'unknown'; }
}

module.exports = new AuditService();

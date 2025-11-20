/**
 * 📝 AUDIT SERVICE - SEMANA 7
 * Sistema de auditoría y logging de acciones
 *
 * Features:
 * - Log de todas las acciones CRUD
 * - Registro de cambios (before/after)
 * - Filtrado por usuario, fecha, acción
 * - Compliance GDPR
 * - Exportación de logs
 *
 * Fecha: 20 Noviembre 2025
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class AuditService {
  constructor() {
    this.actions = {
      CREATE: 'create',
      READ: 'read',
      UPDATE: 'update',
      DELETE: 'delete',
      LOGIN: 'login',
      LOGOUT: 'logout',
      EXPORT: 'export',
      IMPORT: 'import'
    };
  }

  async log(params) {
    const {
      userId,
      action,
      entity,
      entityId,
      oldData,
      newData,
      ipAddress,
      userAgent,
      metadata
    } = params;

    try {
      const result = await pool.query(`
        INSERT INTO audit_logs
        (user_id, action, entity, entity_id, old_data, new_data, ip_address, user_agent, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id
      `, [
        userId,
        action,
        entity,
        entityId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress,
        userAgent,
        metadata ? JSON.stringify(metadata) : null
      ]);

      return result.rows[0].id;
    } catch (error) {
      devLogger.error('[Audit] Error al registrar:', error.message);
      // No lanzar error para no interrumpir operación principal
      return null;
    }
  }

  async getByUser(userId, options = {}) {
    const { page = 1, limit = 50, action, startDate, endDate } = options;

    let query = `
      SELECT * FROM audit_logs
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 2;

    if (action) {
      query += ` AND action = $${paramCount++}`;
      params.push(action);
    }

    if (startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC`;
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, (page - 1) * limit);

    const result = await pool.query(query, params);

    return {
      success: true,
      data: result.rows,
      pagination: { page, limit }
    };
  }

  async getByEntity(entity, entityId, options = {}) {
    const { page = 1, limit = 50 } = options;

    const result = await pool.query(`
      SELECT * FROM audit_logs
      WHERE entity = $1 AND entity_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `, [entity, entityId, limit, (page - 1) * limit]);

    return {
      success: true,
      data: result.rows
    };
  }

  async getStats(options = {}) {
    const { startDate, endDate } = options;

    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await pool.query(`
      SELECT
        action,
        entity,
        COUNT(*) as count
      FROM audit_logs
      ${dateFilter}
      GROUP BY action, entity
      ORDER BY count DESC
    `, params);

    return {
      success: true,
      data: result.rows
    };
  }

  async cleanup(daysToKeep = 90) {
    const result = await pool.query(`
      DELETE FROM audit_logs
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `);

    devLogger.log(`[Audit] Limpiados ${result.rowCount} registros antiguos`);
    return result.rowCount;
  }

  // Middleware para Express
  middleware() {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        // Registrar acción si fue exitosa
        if (data && data.success && req.user) {
          const action = this.getActionFromMethod(req.method);
          const entity = this.getEntityFromPath(req.path);

          this.log({
            userId: req.user.id,
            action,
            entity,
            entityId: req.params.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });
        }

        return originalJson(data);
      };

      next();
    };
  }

  getActionFromMethod(method) {
    const map = {
      GET: this.actions.READ,
      POST: this.actions.CREATE,
      PUT: this.actions.UPDATE,
      PATCH: this.actions.UPDATE,
      DELETE: this.actions.DELETE
    };
    return map[method] || 'unknown';
  }

  getEntityFromPath(path) {
    const parts = path.split('/').filter(Boolean);
    return parts[1] || 'unknown'; // /api/entity/id
  }
}

module.exports = new AuditService();

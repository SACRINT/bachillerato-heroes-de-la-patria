/**
 * 🔔 NOTIFICATION API SERVICE - v1.0.0
 * Capa de servicios REST para gestión de notificaciones
 *
 * SEMANA 2 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - CRUD de notificaciones vía REST
 * - Filtrado y paginación
 * - Estadísticas y contadores
 * - Notificaciones masivas
 * - Programación de notificaciones
 *
 * Nota: Este servicio complementa notificationService.js (WebSocket)
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

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

class NotificationAPIService {

  /**
   * Obtener notificaciones con filtros
   * @param {Object} options - Filtros
   * @returns {Promise<Object>} Notificaciones y metadata
   */
  async getAll(options = {}) {
    const {
      userId,
      tipo,
      leida,
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    devLogger.log('[NotificationAPIService] Obteniendo notificaciones');

    try {
      let query = `
        SELECT n.*, u.nombre as usuario_nombre, u.email as usuario_email
        FROM notificaciones n
        LEFT JOIN usuarios u ON n.usuario_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (userId) {
        query += ` AND n.usuario_id = $${paramCount}`;
        params.push(userId);
        paramCount++;
      }

      if (tipo) {
        query += ` AND n.tipo = $${paramCount}`;
        params.push(tipo);
        paramCount++;
      }

      if (leida !== undefined) {
        query += ` AND n.leida = $${paramCount}`;
        params.push(leida);
        paramCount++;
      }

      // Count
      const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Sort and paginate
      const allowedSort = ['created_at', 'tipo', 'leida'];
      const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
      const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      query += ` ORDER BY n.${safeSortBy} ${safeSortOrder}`;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      return {
        success: true,
        data: result.rows.map(n => this._transformNotification(n)),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      devLogger.error('[NotificationAPIService] Error en getAll:', error.message);
      throw new ServiceError('Error al obtener notificaciones', 500);
    }
  }

  /**
   * Obtener notificaciones de un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} options - Opciones
   * @returns {Promise<Object>} Notificaciones del usuario
   */
  async getByUser(userId, options = {}) {
    if (!userId) {
      throw new ServiceError('ID de usuario requerido', 400);
    }

    return this.getAll({ ...options, userId });
  }

  /**
   * Obtener notificación por ID
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object>} Notificación
   */
  async getById(id) {
    if (!id || isNaN(id)) {
      throw new ServiceError('ID inválido', 400);
    }

    devLogger.log(`[NotificationAPIService] Obteniendo notificación ID: ${id}`);

    try {
      const result = await pool.query(`
        SELECT n.*, u.nombre as usuario_nombre
        FROM notificaciones n
        LEFT JOIN usuarios u ON n.usuario_id = u.id
        WHERE n.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        throw new ServiceError('Notificación no encontrada', 404);
      }

      return {
        success: true,
        data: this._transformNotification(result.rows[0])
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[NotificationAPIService] Error en getById:', error.message);
      throw new ServiceError('Error al obtener notificación', 500);
    }
  }

  /**
   * Crear notificación
   * @param {Object} data - Datos de la notificación
   * @returns {Promise<Object>} Notificación creada
   */
  async create(data) {
    const { usuario_id, tipo, titulo, mensaje, url, metadata } = data;

    if (!usuario_id) {
      throw new ServiceError('ID de usuario requerido', 400);
    }
    if (!titulo) {
      throw new ServiceError('Título requerido', 400);
    }
    if (!mensaje) {
      throw new ServiceError('Mensaje requerido', 400);
    }

    devLogger.log('[NotificationAPIService] Creando notificación');

    try {
      const result = await pool.query(`
        INSERT INTO notificaciones
        (usuario_id, tipo, titulo, mensaje, url, metadata, leida, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
        RETURNING *
      `, [
        usuario_id,
        tipo || 'info',
        titulo,
        mensaje,
        url,
        metadata ? JSON.stringify(metadata) : null
      ]);

      devLogger.log(`[NotificationAPIService] Notificación creada ID: ${result.rows[0].id}`);

      return {
        success: true,
        data: this._transformNotification(result.rows[0]),
        message: 'Notificación creada exitosamente'
      };
    } catch (error) {
      devLogger.error('[NotificationAPIService] Error en create:', error.message);
      throw new ServiceError('Error al crear notificación', 500);
    }
  }

  /**
   * Crear notificaciones masivas
   * @param {Array} userIds - IDs de usuarios
   * @param {Object} notification - Datos de la notificación
   * @returns {Promise<Object>} Resultado
   */
  async bulkCreate(userIds, notification) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ServiceError('Se requiere array de IDs de usuarios', 400);
    }

    const { tipo, titulo, mensaje, url, metadata } = notification;

    if (!titulo || !mensaje) {
      throw new ServiceError('Título y mensaje requeridos', 400);
    }

    devLogger.log(`[NotificationAPIService] Creando ${userIds.length} notificaciones masivas`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const values = userIds.map((userId, index) => {
        const offset = index * 6;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, false, NOW())`;
      });

      const params = userIds.flatMap(userId => [
        userId,
        tipo || 'info',
        titulo,
        mensaje,
        url || null,
        metadata ? JSON.stringify(metadata) : null
      ]);

      const result = await client.query(`
        INSERT INTO notificaciones
        (usuario_id, tipo, titulo, mensaje, url, metadata, leida, created_at)
        VALUES ${values.join(', ')}
        RETURNING id
      `, params);

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          created: result.rows.length,
          userIds
        },
        message: `${result.rows.length} notificaciones creadas`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      devLogger.error('[NotificationAPIService] Error en bulkCreate:', error.message);
      throw new ServiceError('Error al crear notificaciones masivas', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Marcar notificación como leída
   * @param {number} id - ID de la notificación
   * @param {number} userId - ID del usuario (para verificación)
   * @returns {Promise<Object>} Resultado
   */
  async markAsRead(id, userId) {
    if (!id) {
      throw new ServiceError('ID de notificación requerido', 400);
    }

    devLogger.log(`[NotificationAPIService] Marcando como leída: ${id}`);

    try {
      let query = 'UPDATE notificaciones SET leida = true, read_at = NOW() WHERE id = $1';
      const params = [id];

      if (userId) {
        query += ' AND usuario_id = $2';
        params.push(userId);
      }

      query += ' RETURNING *';

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        throw new ServiceError('Notificación no encontrada', 404);
      }

      return {
        success: true,
        data: this._transformNotification(result.rows[0]),
        message: 'Notificación marcada como leída'
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[NotificationAPIService] Error en markAsRead:', error.message);
      throw new ServiceError('Error al marcar notificación', 500);
    }
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado
   */
  async markAllAsRead(userId) {
    if (!userId) {
      throw new ServiceError('ID de usuario requerido', 400);
    }

    devLogger.log(`[NotificationAPIService] Marcando todas como leídas para usuario: ${userId}`);

    try {
      const result = await pool.query(`
        UPDATE notificaciones
        SET leida = true, read_at = NOW()
        WHERE usuario_id = $1 AND leida = false
      `, [userId]);

      return {
        success: true,
        data: {
          updated: result.rowCount
        },
        message: `${result.rowCount} notificaciones marcadas como leídas`
      };
    } catch (error) {
      devLogger.error('[NotificationAPIService] Error en markAllAsRead:', error.message);
      throw new ServiceError('Error al marcar notificaciones', 500);
    }
  }

  /**
   * Eliminar notificación
   * @param {number} id - ID de la notificación
   * @param {number} userId - ID del usuario (opcional, para verificación)
   * @returns {Promise<Object>} Resultado
   */
  async delete(id, userId) {
    if (!id) {
      throw new ServiceError('ID de notificación requerido', 400);
    }

    devLogger.log(`[NotificationAPIService] Eliminando notificación: ${id}`);

    try {
      let query = 'DELETE FROM notificaciones WHERE id = $1';
      const params = [id];

      if (userId) {
        query += ' AND usuario_id = $2';
        params.push(userId);
      }

      const result = await pool.query(query, params);

      if (result.rowCount === 0) {
        throw new ServiceError('Notificación no encontrada', 404);
      }

      return {
        success: true,
        message: 'Notificación eliminada exitosamente'
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[NotificationAPIService] Error en delete:', error.message);
      throw new ServiceError('Error al eliminar notificación', 500);
    }
  }

  /**
   * Eliminar notificaciones antiguas
   * @param {number} days - Días de antigüedad
   * @returns {Promise<Object>} Resultado
   */
  async deleteOld(days = 30) {
    devLogger.log(`[NotificationAPIService] Eliminando notificaciones más antiguas que ${days} días`);

    try {
      const result = await pool.query(`
        DELETE FROM notificaciones
        WHERE created_at < NOW() - INTERVAL '${days} days'
        AND leida = true
      `);

      return {
        success: true,
        data: {
          deleted: result.rowCount
        },
        message: `${result.rowCount} notificaciones antiguas eliminadas`
      };
    } catch (error) {
      devLogger.error('[NotificationAPIService] Error en deleteOld:', error.message);
      throw new ServiceError('Error al eliminar notificaciones antiguas', 500);
    }
  }

  /**
   * Obtener contador de notificaciones no leídas
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Contador
   */
  async getUnreadCount(userId) {
    if (!userId) {
      throw new ServiceError('ID de usuario requerido', 400);
    }

    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM notificaciones
        WHERE usuario_id = $1 AND leida = false
      `, [userId]);

      return {
        success: true,
        data: {
          count: parseInt(result.rows[0].count, 10)
        }
      };
    } catch (error) {
      devLogger.error('[NotificationAPIService] Error en getUnreadCount:', error.message);
      throw new ServiceError('Error al obtener contador', 500);
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   * @param {Object} options - Filtros
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats(options = {}) {
    const { userId, days = 30 } = options;

    devLogger.log('[NotificationAPIService] Obteniendo estadísticas');

    try {
      let whereClause = `created_at > NOW() - INTERVAL '${days} days'`;
      const params = [];

      if (userId) {
        whereClause += ` AND usuario_id = $1`;
        params.push(userId);
      }

      const stats = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE leida = true) as leidas,
          COUNT(*) FILTER (WHERE leida = false) as no_leidas,
          COUNT(DISTINCT usuario_id) as usuarios_unicos
        FROM notificaciones
        WHERE ${whereClause}
      `, params);

      const byType = await pool.query(`
        SELECT tipo, COUNT(*) as total
        FROM notificaciones
        WHERE ${whereClause}
        GROUP BY tipo
        ORDER BY total DESC
      `, params);

      const byDay = await pool.query(`
        SELECT DATE(created_at) as fecha, COUNT(*) as total
        FROM notificaciones
        WHERE ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY fecha DESC
        LIMIT 7
      `, params);

      return {
        success: true,
        data: {
          general: {
            total: parseInt(stats.rows[0].total, 10),
            leidas: parseInt(stats.rows[0].leidas, 10),
            noLeidas: parseInt(stats.rows[0].no_leidas, 10),
            usuariosUnicos: parseInt(stats.rows[0].usuarios_unicos, 10),
            tasaLectura: stats.rows[0].total > 0
              ? ((stats.rows[0].leidas / stats.rows[0].total) * 100).toFixed(1)
              : '0.0'
          },
          porTipo: byType.rows,
          porDia: byDay.rows
        }
      };
    } catch (error) {
      devLogger.error('[NotificationAPIService] Error en getStats:', error.message);
      throw new ServiceError('Error al obtener estadísticas', 500);
    }
  }

  /**
   * Transformar datos de notificación
   * @private
   */
  _transformNotification(notification) {
    if (!notification) return null;

    return {
      id: notification.id,
      usuarioId: notification.usuario_id,
      usuarioNombre: notification.usuario_nombre,
      tipo: notification.tipo,
      titulo: notification.titulo,
      mensaje: notification.mensaje,
      url: notification.url,
      metadata: notification.metadata,
      leida: notification.leida,
      readAt: notification.read_at,
      createdAt: notification.created_at
    };
  }
}

module.exports = new NotificationAPIService();
module.exports.ServiceError = ServiceError;

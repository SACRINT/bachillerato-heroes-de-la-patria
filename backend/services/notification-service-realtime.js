/**
 * 🔔 NOTIFICATION SERVICE REAL-TIME
 * Servicio de notificaciones con Socket.IO + BD + Push Notifications
 * Semana 15 - Real-Time Features Avanzado
 */

const pool = require('../config/database');
const logger = require('../utils/winston-logger');
const { sendNotificationToUser, broadcastToRole } = require('../socket/socket-server-advanced');

/**
 * Tipos de notificación
 */
const NotificationTypes = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  GRADE_ADDED: 'grade_added',
  ASSIGNMENT_DUE: 'assignment_due',
  MESSAGE_RECEIVED: 'message_received',
  ATTENDANCE_MARKED: 'attendance_marked',
  ANNOUNCEMENT: 'announcement',
};

class NotificationServiceRealTime {
  constructor(io = null) {
    this.io = io;
  }

  /**
   * Establecer instancia de Socket.IO
   */
  setIO(io) {
    this.io = io;
    logger.info('[NOTIFICATION-RT] Socket.IO instance configurada');
  }

  /**
   * Enviar notificación a usuario específico
   * - Guarda en BD
   * - Envía vía Socket.IO (real-time)
   * - Opcional: Push notification al móvil
   */
  async sendToUser(userId, tenantId, notification) {
    try {
      const {
        title,
        message,
        type = NotificationTypes.INFO,
        metadata = {},
        priority = 'normal', // 'low', 'normal', 'high', 'urgent'
        sendPush = false,
      } = notification;

      // Validaciones
      if (!userId || !tenantId || !title || !message) {
        throw new Error('userId, tenantId, title y message son requeridos');
      }

      // =========================================================================
      // 1. GUARDAR EN BASE DE DATOS
      // =========================================================================
      const result = await pool.query(
        `INSERT INTO notifications (
          user_id, tenant_id, title, message, type, metadata, priority,
          read, read_at, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NULL, NOW())
        RETURNING *`,
        [
          userId,
          tenantId,
          title,
          message,
          type,
          JSON.stringify(metadata),
          priority,
        ]
      );

      const savedNotification = result.rows[0];

      logger.info('[NOTIFICATION-RT] Notificación guardada en BD', {
        id: savedNotification.id,
        userId,
        tenantId,
        type,
      });

      // =========================================================================
      // 2. ENVIAR VÍA SOCKET.IO (REAL-TIME)
      // =========================================================================
      if (this.io) {
        sendNotificationToUser(this.io, tenantId, userId, {
          id: savedNotification.id,
          title,
          message,
          type,
          metadata,
          priority,
          createdAt: savedNotification.created_at,
        });

        logger.info('[NOTIFICATION-RT] Notificación enviada vía Socket.IO', {
          userId,
          type,
        });
      } else {
        logger.warn('[NOTIFICATION-RT] Socket.IO no disponible, solo guardada en BD');
      }

      // =========================================================================
      // 3. ENVIAR PUSH NOTIFICATION (OPCIONAL)
      // =========================================================================
      if (sendPush) {
        await this.sendPushNotification(userId, {
          title,
          message,
          type,
          metadata,
        });
      }

      return savedNotification;
    } catch (error) {
      logger.error('[NOTIFICATION-RT] Error al enviar notificación', {
        error: error.message,
        stack: error.stack,
        userId,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Broadcast notificación a todos los usuarios de un rol
   */
  async broadcastToRole(tenantId, role, notification) {
    try {
      const { title, message, type = NotificationTypes.ANNOUNCEMENT, metadata = {} } = notification;

      // Obtener usuarios del rol
      const users = await pool.query(
        'SELECT id FROM usuarios WHERE tenant_id = $1 AND role = $2 AND status = $3',
        [tenantId, role, 'activo']
      );

      // Enviar a cada usuario
      const promises = users.rows.map((user) =>
        this.sendToUser(user.id, tenantId, {
          title,
          message,
          type,
          metadata,
        })
      );

      await Promise.all(promises);

      // Broadcast vía Socket.IO
      if (this.io) {
        broadcastToRole(this.io, tenantId, role, 'notification', {
          title,
          message,
          type,
          metadata,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info('[NOTIFICATION-RT] Broadcast a rol completado', {
        tenantId,
        role,
        usersCount: users.rows.length,
      });

      return { sent: users.rows.length };
    } catch (error) {
      logger.error('[NOTIFICATION-RT] Error en broadcast', {
        error: error.message,
        tenantId,
        role,
      });
      throw error;
    }
  }

  /**
   * Broadcast a todos los usuarios del tenant
   */
  async broadcastToTenant(tenantId, notification) {
    try {
      const { title, message, type = NotificationTypes.ANNOUNCEMENT, metadata = {} } = notification;

      // Obtener todos los usuarios activos del tenant
      const users = await pool.query(
        'SELECT id FROM usuarios WHERE tenant_id = $1 AND status = $2',
        [tenantId, 'activo']
      );

      // Enviar a cada usuario
      const promises = users.rows.map((user) =>
        this.sendToUser(user.id, tenantId, {
          title,
          message,
          type,
          metadata,
        })
      );

      await Promise.all(promises);

      logger.info('[NOTIFICATION-RT] Broadcast a tenant completado', {
        tenantId,
        usersCount: users.rows.length,
      });

      return { sent: users.rows.length };
    } catch (error) {
      logger.error('[NOTIFICATION-RT] Error en broadcast tenant', {
        error: error.message,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId, userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET read = TRUE, read_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notificación no encontrada o no pertenece al usuario');
      }

      logger.info('[NOTIFICATION-RT] Notificación marcada como leída', {
        notificationId,
        userId,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('[NOTIFICATION-RT] Error al marcar como leída', {
        error: error.message,
        notificationId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId, tenantId) {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET read = TRUE, read_at = NOW()
         WHERE user_id = $1 AND tenant_id = $2 AND read = FALSE
         RETURNING id`,
        [userId, tenantId]
      );

      logger.info('[NOTIFICATION-RT] Todas las notificaciones marcadas como leídas', {
        userId,
        tenantId,
        count: result.rows.length,
      });

      return { marked: result.rows.length };
    } catch (error) {
      logger.error('[NOTIFICATION-RT] Error al marcar todas como leídas', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId, tenantId, options = {}) {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options;

      let query = `
        SELECT * FROM notifications
        WHERE user_id = $1 AND tenant_id = $2
      `;
      const params = [userId, tenantId];

      if (unreadOnly) {
        query += ' AND read = FALSE';
      }

      query += ' ORDER BY created_at DESC LIMIT $3 OFFSET $4';
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return result.rows;
    } catch (error) {
      logger.error('[NOTIFICATION-RT] Error al obtener notificaciones', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Contar notificaciones no leídas
   */
  async getUnreadCount(userId, tenantId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND tenant_id = $2 AND read = FALSE',
        [userId, tenantId]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('[NOTIFICATION-RT] Error al contar no leídas', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notificación no encontrada o no pertenece al usuario');
      }

      logger.info('[NOTIFICATION-RT] Notificación eliminada', {
        notificationId,
        userId,
      });

      return { deleted: true };
    } catch (error) {
      logger.error('[NOTIFICATION-RT] Error al eliminar notificación', {
        error: error.message,
        notificationId,
      });
      throw error;
    }
  }

  /**
   * Enviar push notification (stub para integración futura)
   */
  async sendPushNotification(userId, notification) {
    // TODO: Integrar con Firebase Cloud Messaging (FCM) o similar
    logger.debug('[NOTIFICATION-RT] Push notification no implementado', {
      userId,
      notification,
    });
  }

  /**
   * Helpers para notificaciones académicas específicas
   */

  async notifyGradeAdded(studentId, tenantId, gradeData) {
    return await this.sendToUser(studentId, tenantId, {
      title: 'Nueva Calificación',
      message: `Se agregó una calificación en ${gradeData.materia}: ${gradeData.calificacion}`,
      type: NotificationTypes.GRADE_ADDED,
      metadata: gradeData,
      priority: 'normal',
    });
  }

  async notifyAssignmentDue(studentId, tenantId, assignmentData) {
    return await this.sendToUser(studentId, tenantId, {
      title: 'Tarea Próxima a Vencer',
      message: `La tarea "${assignmentData.titulo}" vence en ${assignmentData.diasRestantes} días`,
      type: NotificationTypes.ASSIGNMENT_DUE,
      metadata: assignmentData,
      priority: 'high',
    });
  }

  async notifyAttendanceMarked(studentId, tenantId, attendanceData) {
    return await this.sendToUser(studentId, tenantId, {
      title: 'Asistencia Registrada',
      message: `Tu asistencia ha sido registrada: ${attendanceData.status}`,
      type: NotificationTypes.ATTENDANCE_MARKED,
      metadata: attendanceData,
      priority: 'low',
    });
  }
}

module.exports = new NotificationServiceRealTime();
module.exports.NotificationTypes = NotificationTypes;

/**
 * 🔌 SOCKET.IO SERVER ADVANCED - Multi-Tenant Real-Time
 * Sistema de comunicación en tiempo real con aislamiento por tenant
 * Semana 15 - Real-Time Features Avanzado
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/winston-logger');
const pool = require('../config/database');

// Almacenamiento de usuarios conectados (usar Redis en producción)
const connectedUsers = new Map(); // { userId: { socketId, tenantId, status } }
const activeRooms = new Map(); // { roomId: Set<userId> }

/**
 * Inicializar Socket.IO Server con Namespaces Multi-Tenant
 * @param {HttpServer} httpServer - Servidor HTTP de Express
 * @returns {Server} - Instancia de Socket.IO
 */
function initializeSocketIOAdvanced(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // =============================================================================
  // NAMESPACES MULTI-TENANT: /tenant-{tenantId}
  // =============================================================================

  io.of(/^\/tenant-.+$/).on('connection', async (socket) => {
    const namespace = socket.nsp.name;
    const tenantId = namespace.replace('/tenant-', '');

    logger.info('[SOCKET-ADV] Cliente conectado a namespace', {
      namespace,
      tenantId,
      socketId: socket.id,
    });

    try {
      // =========================================================================
      // AUTENTICACIÓN JWT
      // =========================================================================
      const token = socket.handshake.auth.token;

      if (!token) {
        socket.emit('error', { message: 'Token JWT requerido' });
        socket.disconnect();
        return;
      }

      // Verificar JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded.userId;
      const userTenantId = decoded.tenant_id;
      const userRole = decoded.role;

      // Verificar que el usuario pertenece al tenant del namespace
      if (userTenantId !== tenantId) {
        logger.warn('[SOCKET-ADV] Tenant mismatch', {
          userTenantId,
          namespaceTenantId: tenantId,
          userId,
        });
        socket.emit('error', { message: 'Acceso denegado al tenant' });
        socket.disconnect();
        return;
      }

      // Adjuntar datos del usuario al socket
      socket.userId = userId;
      socket.tenantId = tenantId;
      socket.userRole = userRole;

      logger.info('[SOCKET-ADV] Usuario autenticado', {
        userId,
        tenantId,
        role: userRole,
      });

      // =========================================================================
      // UNIRSE A ROOMS AUTOMÁTICAMENTE
      // =========================================================================

      // Room personal
      const userRoom = `user:${userId}`;
      socket.join(userRoom);

      // Room por rol
      const roleRoom = `role:${userRole}`;
      socket.join(roleRoom);

      // Registrar usuario conectado
      connectedUsers.set(userId, {
        socketId: socket.id,
        tenantId,
        status: 'online',
        connectedAt: new Date(),
      });

      // Notificar al usuario que está conectado
      socket.emit('connected', {
        userId,
        tenantId,
        message: 'Conectado exitosamente',
        timestamp: new Date().toISOString(),
      });

      // Broadcast a otros usuarios del tenant que alguien se conectó
      socket.to(namespace).emit('user-status-changed', {
        userId,
        status: 'online',
        timestamp: new Date().toISOString(),
      });

      // =========================================================================
      // EVENT: join-room (Unirse a una sala específica)
      // =========================================================================
      socket.on('join-room', (data) => {
        const { roomId, roomType } = data; // roomType: 'class', 'group', 'document'

        socket.join(roomId);

        // Registrar sala activa
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, new Set());
        }
        activeRooms.get(roomId).add(userId);

        logger.info('[SOCKET-ADV] Usuario unido a sala', {
          userId,
          roomId,
          roomType,
        });

        socket.emit('room-joined', {
          roomId,
          message: `Te has unido a la sala ${roomId}`,
        });

        // Notificar a otros usuarios de la sala
        socket.to(roomId).emit('user-joined-room', {
          roomId,
          userId,
          timestamp: new Date().toISOString(),
        });
      });

      // =========================================================================
      // EVENT: leave-room (Salir de una sala)
      // =========================================================================
      socket.on('leave-room', (data) => {
        const { roomId } = data;

        socket.leave(roomId);

        // Remover de sala activa
        if (activeRooms.has(roomId)) {
          activeRooms.get(roomId).delete(userId);
          if (activeRooms.get(roomId).size === 0) {
            activeRooms.delete(roomId);
          }
        }

        logger.info('[SOCKET-ADV] Usuario salió de sala', { userId, roomId });

        socket.to(roomId).emit('user-left-room', {
          roomId,
          userId,
          timestamp: new Date().toISOString(),
        });
      });

      // =========================================================================
      // EVENT: send-message (Enviar mensaje a sala)
      // =========================================================================
      socket.on('send-message', async (data) => {
        const { roomId, message, metadata } = data;

        try {
          // Guardar mensaje en BD
          const result = await pool.query(
            `INSERT INTO messages (room_id, user_id, tenant_id, message, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING *`,
            [roomId, userId, tenantId, message, JSON.stringify(metadata || {})]
          );

          const savedMessage = result.rows[0];

          // Broadcast a la sala
          io.of(namespace).to(roomId).emit('new-message', {
            id: savedMessage.id,
            roomId,
            userId,
            message,
            metadata,
            createdAt: savedMessage.created_at,
          });

          logger.info('[SOCKET-ADV] Mensaje enviado', { userId, roomId });
        } catch (error) {
          logger.error('[SOCKET-ADV] Error al enviar mensaje', {
            error: error.message,
            userId,
            roomId,
          });
          socket.emit('error', { message: 'Error al enviar mensaje' });
        }
      });

      // =========================================================================
      // EVENT: typing (Indicador de "está escribiendo...")
      // =========================================================================
      socket.on('typing', (data) => {
        const { roomId, isTyping } = data;

        socket.to(roomId).emit('user-typing', {
          roomId,
          userId,
          isTyping,
        });
      });

      // =========================================================================
      // EVENT: send-notification (Enviar notificación a usuario específico)
      // =========================================================================
      socket.on('send-notification', async (data) => {
        const { targetUserId, notification } = data;

        try {
          // Guardar notificación en BD
          await pool.query(
            `INSERT INTO notifications (user_id, tenant_id, title, message, type, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              targetUserId,
              tenantId,
              notification.title,
              notification.message,
              notification.type,
              JSON.stringify(notification.metadata || {}),
            ]
          );

          // Enviar notificación vía Socket.IO
          io.of(namespace).to(`user:${targetUserId}`).emit('notification', {
            ...notification,
            from: userId,
            timestamp: new Date().toISOString(),
          });

          logger.info('[SOCKET-ADV] Notificación enviada', {
            from: userId,
            to: targetUserId,
          });
        } catch (error) {
          logger.error('[SOCKET-ADV] Error al enviar notificación', {
            error: error.message,
          });
        }
      });

      // =========================================================================
      // EVENT: update-status (Actualizar estado: online, away, busy)
      // =========================================================================
      socket.on('update-status', (data) => {
        const { status } = data; // 'online', 'away', 'busy', 'offline'

        if (connectedUsers.has(userId)) {
          connectedUsers.get(userId).status = status;
        }

        // Broadcast a todos en el tenant
        socket.to(namespace).emit('user-status-changed', {
          userId,
          status,
          timestamp: new Date().toISOString(),
        });

        logger.info('[SOCKET-ADV] Estado actualizado', { userId, status });
      });

      // =========================================================================
      // EVENT: document-edit (Edición colaborativa)
      // =========================================================================
      socket.on('document-edit', async (data) => {
        const { documentId, operation, version, cursorPosition } = data;

        try {
          // Aplicar operación (Operational Transformation simplificado)
          const transformed = {
            documentId,
            operation,
            version: version + 1,
            userId,
            timestamp: new Date().toISOString(),
          };

          // Broadcast a otros usuarios del documento
          socket.to(`document:${documentId}`).emit('document-update', transformed);

          logger.info('[SOCKET-ADV] Documento editado', { userId, documentId });
        } catch (error) {
          logger.error('[SOCKET-ADV] Error en edición colaborativa', {
            error: error.message,
          });
        }
      });

      // =========================================================================
      // EVENT: disconnect (Usuario desconectado)
      // =========================================================================
      socket.on('disconnect', (reason) => {
        logger.info('[SOCKET-ADV] Usuario desconectado', {
          userId,
          tenantId,
          reason,
        });

        // Remover de usuarios conectados
        connectedUsers.delete(userId);

        // Broadcast a otros usuarios
        socket.to(namespace).emit('user-status-changed', {
          userId,
          status: 'offline',
          timestamp: new Date().toISOString(),
        });

        // Limpiar rooms activas
        activeRooms.forEach((users, roomId) => {
          if (users.has(userId)) {
            users.delete(userId);
            socket.to(roomId).emit('user-left-room', {
              roomId,
              userId,
              timestamp: new Date().toISOString(),
            });
          }
        });
      });
    } catch (error) {
      logger.error('[SOCKET-ADV] Error en conexión', {
        error: error.message,
        stack: error.stack,
        tenantId,
      });
      socket.emit('error', { message: 'Error de autenticación' });
      socket.disconnect();
    }
  });

  return io;
}

/**
 * Helper: Enviar notificación a usuario específico
 */
function sendNotificationToUser(io, tenantId, userId, notification) {
  const namespace = `/tenant-${tenantId}`;
  io.of(namespace).to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper: Broadcast a rol específico
 */
function broadcastToRole(io, tenantId, role, event, data) {
  const namespace = `/tenant-${tenantId}`;
  io.of(namespace).to(`role:${role}`).emit(event, data);
}

/**
 * Helper: Obtener usuarios conectados
 */
function getConnectedUsers() {
  return Array.from(connectedUsers.entries()).map(([userId, data]) => ({
    userId,
    ...data,
  }));
}

/**
 * Helper: Obtener usuarios en sala específica
 */
function getUsersInRoom(roomId) {
  return Array.from(activeRooms.get(roomId) || []);
}

module.exports = {
  initializeSocketIOAdvanced,
  sendNotificationToUser,
  broadcastToRole,
  getConnectedUsers,
  getUsersInRoom,
};

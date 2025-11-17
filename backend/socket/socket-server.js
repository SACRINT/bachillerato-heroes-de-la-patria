/**
 * 🔌 SOCKET.IO SERVER - Real-Time Communication
 * Sistema de notificaciones y mensajería en tiempo real
 * Semana 11-12 - Features Avanzadas
 */

const { Server } = require('socket.io');
const logger = require('../utils/winston-logger');

// Almacenamiento en memoria de usuarios conectados (en producción usar Redis)
const connectedUsers = new Map();

/**
 * Inicializar Socket.IO Server
 * @param {HttpServer} httpServer - Servidor HTTP de Express
 * @returns {Server} - Instancia de Socket.IO
 */
function initializeSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Aquí validarías el JWT token
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // socket.userId = decoded.userId;
      // socket.role = decoded.role;

      // Por ahora, permitir conexión
      next();
    } catch (error) {
      logger.logError(error, { context: 'Socket.IO Authentication' });
      next(new Error('Authentication error'));
    }
  });

  // Manejo de conexiones
  io.on('connection', (socket) => {
    logger.info(`[SOCKET] Usuario conectado: ${socket.id}`);

    // ========================================================================
    // GESTIÓN DE SALAS (ROOMS)
    // ========================================================================

    /**
     * Unirse a sala de usuario
     */
    socket.on('join-user-room', (userId) => {
      const room = `user:${userId}`;
      socket.join(room);
      connectedUsers.set(userId, socket.id);

      logger.info(`[SOCKET] Usuario ${userId} unido a room: ${room}`);

      // Notificar al usuario que está conectado
      socket.emit('connected', {
        userId,
        message: 'Conectado exitosamente',
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Unirse a sala de rol (admin, docente, estudiante)
     */
    socket.on('join-role-room', (role) => {
      const room = `role:${role}`;
      socket.join(room);

      logger.info(`[SOCKET] Socket ${socket.id} unido a room de rol: ${room}`);
    });

    /**
     * Unirse a sala de curso/clase
     */
    socket.on('join-class-room', (classId) => {
      const room = `class:${classId}`;
      socket.join(room);

      logger.info(`[SOCKET] Socket ${socket.id} unido a class room: ${room}`);

      // Notificar a otros miembros de la clase
      socket.to(room).emit('user-joined-class', {
        socketId: socket.id,
        classId,
        timestamp: new Date().toISOString(),
      });
    });

    // ========================================================================
    // NOTIFICACIONES
    // ========================================================================

    /**
     * Enviar notificación a usuario específico
     */
    socket.on('send-notification', (data) => {
      const { userId, notification } = data;
      const room = `user:${userId}`;

      io.to(room).emit('new-notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });

      logger.info(`[SOCKET] Notificación enviada a usuario ${userId}`, {
        type: notification.type,
      });
    });

    /**
     * Broadcast notificación a todos los usuarios de un rol
     */
    socket.on('broadcast-to-role', (data) => {
      const { role, notification } = data;
      const room = `role:${role}`;

      io.to(room).emit('new-notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });

      logger.info(`[SOCKET] Notificación broadcast a rol ${role}`, {
        type: notification.type,
      });
    });

    // ========================================================================
    // MENSAJERÍA EN TIEMPO REAL
    // ========================================================================

    /**
     * Enviar mensaje privado
     */
    socket.on('send-private-message', (data) => {
      const { recipientId, message } = data;
      const recipientSocketId = connectedUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new-private-message', {
          ...message,
          timestamp: new Date().toISOString(),
        });

        // Confirmar al remitente
        socket.emit('message-sent', {
          messageId: message.id,
          status: 'delivered',
        });
      } else {
        socket.emit('message-sent', {
          messageId: message.id,
          status: 'offline',
        });
      }
    });

    /**
     * Mensaje de grupo/clase
     */
    socket.on('send-class-message', (data) => {
      const { classId, message } = data;
      const room = `class:${classId}`;

      io.to(room).emit('new-class-message', {
        ...message,
        timestamp: new Date().toISOString(),
      });
    });

    // ========================================================================
    // PRESENCIA Y ESTADO
    // ========================================================================

    /**
     * Actualizar estado del usuario (online, away, busy)
     */
    socket.on('update-status', (data) => {
      const { userId, status } = data;
      const room = `user:${userId}`;

      // Broadcast nuevo estado a todos los que estén observando
      socket.broadcast.emit('user-status-changed', {
        userId,
        status,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Usuario está escribiendo (typing indicator)
     */
    socket.on('typing-start', (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit('user-typing', { userId });
    });

    socket.on('typing-stop', (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit('user-stopped-typing', { userId });
    });

    // ========================================================================
    // ACTUALIZACIONES EN VIVO
    // ========================================================================

    /**
     * Actualización de calificación
     */
    socket.on('grade-updated', (data) => {
      const { studentId, grade } = data;
      const room = `user:${studentId}`;

      io.to(room).emit('new-grade', {
        ...grade,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Nueva tarea asignada
     */
    socket.on('assignment-created', (data) => {
      const { classId, assignment } = data;
      const room = `class:${classId}`;

      io.to(room).emit('new-assignment', {
        ...assignment,
        timestamp: new Date().toISOString(),
      });
    });

    // ========================================================================
    // DESCONEXIÓN
    // ========================================================================

    socket.on('disconnect', (reason) => {
      logger.info(`[SOCKET] Usuario desconectado: ${socket.id}`, { reason });

      // Remover de usuarios conectados
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });

    // ========================================================================
    // MANEJO DE ERRORES
    // ========================================================================

    socket.on('error', (error) => {
      logger.logError(error, {
        context: 'Socket.IO Error',
        socketId: socket.id,
      });
    });
  });

  return io;
}

/**
 * Enviar notificación a usuario específico (helper function)
 * @param {Server} io - Instancia de Socket.IO
 * @param {string} userId - ID del usuario
 * @param {object} notification - Objeto de notificación
 */
function sendNotificationToUser(io, userId, notification) {
  const room = `user:${userId}`;
  io.to(room).emit('new-notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast notificación a rol
 * @param {Server} io - Instancia de Socket.IO
 * @param {string} role - Rol (admin, docente, estudiante)
 * @param {object} notification - Objeto de notificación
 */
function broadcastToRole(io, role, notification) {
  const room = `role:${role}`;
  io.to(room).emit('new-notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Obtener usuarios conectados
 * @returns {Array} - Lista de usuarios conectados
 */
function getConnectedUsers() {
  return Array.from(connectedUsers.keys());
}

module.exports = {
  initializeSocketIO,
  sendNotificationToUser,
  broadcastToRole,
  getConnectedUsers,
};

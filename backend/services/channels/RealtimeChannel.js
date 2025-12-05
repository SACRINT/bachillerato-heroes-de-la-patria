/**
 * 🔔 REALTIME CHANNEL - Canal de Notificaciones en Tiempo Real
 * 
 * Patrón: Channel Adapter
 * Responsabilidad: Gestionar conexiones WebSocket/Socket.IO para notificaciones
 * 
 * Este módulo encapsula TODA la lógica de tiempo real, permitiendo que
 * NotificationService sea independiente del mecanismo de transporte.
 * 
 * Fecha: 04 Diciembre 2025
 */

const devLogger = require('../../utils/devLogger');

class RealtimeChannel {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> Set<socketId>
        this.initialized = false;
    }

    /**
     * Inicializa el canal con una instancia de Socket.IO
     * @param {SocketIO.Server} io - Instancia de Socket.IO
     */
    initialize(io) {
        if (this.initialized) {
            devLogger.warn('[RealtimeChannel] Ya inicializado, ignorando...');
            return;
        }

        this.io = io;
        this.initialized = true;
        this._setupConnectionHandlers();
        devLogger.log('[RealtimeChannel] ✅ Canal inicializado');
    }

    /**
     * Configura los handlers de conexión/desconexión
     * @private
     */
    _setupConnectionHandlers() {
        if (!this.io) return;

        this.io.on('connection', (socket) => {
            devLogger.log(`[RealtimeChannel] Nueva conexión: ${socket.id}`);

            // Autenticación del socket
            socket.on('authenticate', (data) => {
                this._handleAuthenticate(socket, data);
            });

            // Desconexión
            socket.on('disconnect', () => {
                this._handleDisconnect(socket);
            });
        });
    }

    /**
     * Maneja autenticación de un socket
     * @private
     */
    _handleAuthenticate(socket, data) {
        const userId = data?.userId;
        if (!userId) {
            socket.emit('auth_error', { message: 'userId requerido' });
            return;
        }

        // Registrar conexión
        socket.userId = userId;

        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socket.id);

        // Unir a sala personal
        socket.join(`user:${userId}`);

        socket.emit('authenticated', { success: true });
        devLogger.log(`[RealtimeChannel] Usuario ${userId} autenticado`);
    }

    /**
     * Maneja desconexión de un socket
     * @private
     */
    _handleDisconnect(socket) {
        const userId = socket.userId;
        if (userId && this.userSockets.has(userId)) {
            this.userSockets.get(userId).delete(socket.id);

            // Limpiar si no hay más conexiones
            if (this.userSockets.get(userId).size === 0) {
                this.userSockets.delete(userId);
            }
        }
        devLogger.log(`[RealtimeChannel] Socket desconectado: ${socket.id}`);
    }

    // ==========================================
    // MÉTODOS PÚBLICOS DE ENVÍO
    // ==========================================

    /**
     * Envía notificación a un usuario específico
     * @param {string|number} userId - ID del usuario
     * @param {Object} notification - Datos de la notificación
     * @returns {boolean} - true si se envió, false si usuario no conectado
     */
    sendToUser(userId, notification) {
        if (!this.initialized || !this.io) {
            devLogger.warn('[RealtimeChannel] Canal no inicializado');
            return false;
        }

        const userIdStr = String(userId);

        // Emitir a la sala del usuario
        this.io.to(`user:${userIdStr}`).emit('notification', {
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
        });

        const isOnline = this.isUserOnline(userId);
        devLogger.log(`[RealtimeChannel] Notificación enviada a usuario ${userId} (online: ${isOnline})`);

        return isOnline;
    }

    /**
     * Envía notificación a múltiples usuarios
     * @param {Array<string|number>} userIds - IDs de usuarios
     * @param {Object} notification - Datos de la notificación
     * @returns {Object} - Estadísticas de envío
     */
    sendToUsers(userIds, notification) {
        const stats = { sent: 0, offline: 0 };

        userIds.forEach(userId => {
            if (this.sendToUser(userId, notification)) {
                stats.sent++;
            } else {
                stats.offline++;
            }
        });

        return stats;
    }

    /**
     * Broadcast a todos los usuarios conectados
     * @param {Object} notification - Datos de la notificación
     * @param {Array} excludeUserIds - IDs a excluir del broadcast
     */
    broadcast(notification, excludeUserIds = []) {
        if (!this.initialized || !this.io) {
            devLogger.warn('[RealtimeChannel] Canal no inicializado');
            return;
        }

        const excludeSet = new Set(excludeUserIds.map(String));

        this.userSockets.forEach((sockets, userId) => {
            if (!excludeSet.has(userId)) {
                this.sendToUser(userId, notification);
            }
        });

        devLogger.log(`[RealtimeChannel] Broadcast enviado a ${this.userSockets.size} usuarios`);
    }

    /**
     * Envía notificación a un rol específico
     * @param {string} role - Nombre del rol (admin, teacher, student, parent)
     * @param {Object} notification - Datos de la notificación
     */
    sendToRole(role, notification) {
        if (!this.initialized || !this.io) return;

        this.io.to(`role:${role}`).emit('notification', {
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
        });

        devLogger.log(`[RealtimeChannel] Notificación enviada a rol: ${role}`);
    }

    // ==========================================
    // MÉTODOS DE ESTADO
    // ==========================================

    /**
     * Verifica si un usuario está conectado
     * @param {string|number} userId - ID del usuario
     * @returns {boolean}
     */
    isUserOnline(userId) {
        const userIdStr = String(userId);
        return this.userSockets.has(userIdStr) &&
            this.userSockets.get(userIdStr).size > 0;
    }

    /**
     * Obtiene la lista de usuarios conectados
     * @returns {Array<string>}
     */
    getOnlineUsers() {
        return Array.from(this.userSockets.keys());
    }

    /**
     * Obtiene estadísticas del canal
     * @returns {Object}
     */
    getStats() {
        let totalConnections = 0;
        this.userSockets.forEach(sockets => {
            totalConnections += sockets.size;
        });

        return {
            initialized: this.initialized,
            onlineUsers: this.userSockets.size,
            totalConnections,
            users: this.getOnlineUsers()
        };
    }

    /**
     * Destruye el canal y limpia recursos
     */
    destroy() {
        if (this.io) {
            this.io.close();
        }
        this.userSockets.clear();
        this.initialized = false;
        devLogger.log('[RealtimeChannel] Canal destruido');
    }
}

// Singleton
const realtimeChannel = new RealtimeChannel();

module.exports = realtimeChannel;
module.exports.RealtimeChannel = RealtimeChannel;

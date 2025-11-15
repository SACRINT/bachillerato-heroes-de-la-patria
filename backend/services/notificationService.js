/**
 * REAL-TIME NOTIFICATION SERVICE
 * BGE Héroes de la Patria
 * Sistema de Notificaciones en Tiempo Real con WebSockets
 * Fecha: 19 de Octubre, 2025
 */

const WebSocket = require('ws');
const devLogger = require('../utils/devLogger');
const EventEmitter = require('events');
const pool = require('../config/database');

// GDPR Logging - Debug condicional y sanitización
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');


class NotificationService extends EventEmitter {
    constructor(server) {
        super();
        this.wss = null;
        this.clients = new Map(); // userId => WebSocket[]
        this.rooms = new Map(); // roomId => Set<WebSocket>

        if (server) {
            this.init(server);
        }
    }

    /**
     * Inicializar WebSocket Server
     */
    init(server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/ws/notifications'
        });

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        devLogger.log('✅ WebSocket Notification Service inicializado');
    }

    /**
     * Manejar nueva conexión WebSocket
     */
    handleConnection(ws, req) {
        devLogger.log(`🔌 Nueva conexión WebSocket desde ${req.socket.remoteAddress}`);

        // Configurar ping-pong para mantener conexión viva
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Manejar mensajes del cliente
        ws.on('message', (message) => {
            this.handleMessage(ws, message);
        });

        // Manejar cierre de conexión
        ws.on('close', () => {
            this.handleDisconnection(ws);
        });

        // Manejar errores
        ws.on('error', (error) => {
            devLogger.error('❌ WebSocket error:', error);
        });

        // Enviar confirmación de conexión
        this.sendToClient(ws, {
            type: 'connection',
            status: 'connected',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Manejar mensajes del cliente
     */
    async handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'auth':
                    await this.authenticateClient(ws, data);
                    break;

                case 'join_room':
                    this.joinRoom(ws, data.roomId);
                    break;

                case 'leave_room':
                    this.leaveRoom(ws, data.roomId);
                    break;

                case 'mark_read':
                    await this.markNotificationAsRead(data.notificationId, data.userId);
                    break;

                case 'ping':
                    this.sendToClient(ws, { type: 'pong' });
                    break;

                default:
                    devLogger.warn(`Tipo de mensaje desconocido: ${data.type}`);
            }
        } catch (error) {
            devLogger.error('Error procesando mensaje:', error);
            this.sendToClient(ws, {
                type: 'error',
                message: 'Error procesando mensaje'
            });
        }
    }

    /**
     * Autenticar cliente WebSocket
     */
    async authenticateClient(ws, data) {
        const { userId, token } = data;

        // TODO: Validar token JWT aquí
        // Por ahora, aceptamos cualquier userId

        ws.userId = userId;

        // Agregar cliente a la lista de conexiones del usuario
        if (!this.clients.has(userId)) {
            this.clients.set(userId, []);
        }
        this.clients.get(userId).push(ws);

        // Enviar notificaciones pendientes
        await this.sendPendingNotifications(ws, userId);

        this.sendToClient(ws, {
            type: 'auth',
            status: 'authenticated',
            userId
        });

        devLogger.log(`✅ Cliente autenticado: User ${userId}`);
    }

    /**
     * Unirse a una sala (room)
     */
    joinRoom(ws, roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }

        this.rooms.get(roomId).add(ws);
        ws.roomId = roomId;

        this.sendToClient(ws, {
            type: 'room_joined',
            roomId
        });

        devLogger.log(`👥 Cliente unido a sala: ${roomId}`);
    }

    /**
     * Salir de una sala
     */
    leaveRoom(ws, roomId) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).delete(ws);
        }

        this.sendToClient(ws, {
            type: 'room_left',
            roomId
        });
    }

    /**
     * Enviar notificación a un usuario específico
     */
    async notifyUser(userId, notification) {
        // Guardar en base de datos
        const savedNotification = await this.saveNotification(userId, notification);

        // Enviar en tiempo real si el usuario está conectado
        const userClients = this.clients.get(userId);
        if (userClients && userClients.length > 0) {
            userClients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    this.sendToClient(ws, {
                        type: 'notification',
                        data: savedNotification
                    });
                }
            });

            devLogger.log(`📨 Notificación enviada a User ${userId}`);
        } else {
            devLogger.log(`💾 Notificación guardada para User ${userId} (offline)`);
        }

        return savedNotification;
    }

    /**
     * Broadcast a múltiples usuarios
     */
    async notifyMultipleUsers(userIds, notification) {
        const promises = userIds.map(userId =>
            this.notifyUser(userId, notification)
        );

        return Promise.all(promises);
    }

    /**
     * Broadcast a una sala
     */
    broadcastToRoom(roomId, notification) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                this.sendToClient(ws, {
                    type: 'room_notification',
                    roomId,
                    data: notification
                });
            }
        });

        devLogger.log(`📢 Broadcast a sala ${roomId}: ${room.size} clientes`);
    }

    /**
     * Broadcast global a todos los usuarios conectados
     */
    broadcastToAll(notification) {
        this.wss.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                this.sendToClient(ws, {
                    type: 'broadcast',
                    data: notification
                });
            }
        });

        devLogger.log(`📡 Broadcast global: ${this.wss.clients.size} clientes`);
    }

    /**
     * Guardar notificación en base de datos
     */
    async saveNotification(userId, notification) {
        const query = `
            INSERT INTO notificaciones (
                user_id, tipo, titulo, mensaje, url, metadata, leida
            ) VALUES ($1, $2, $3, $4, $5, $6, false)
            RETURNING *
        `;

        const values = [
            userId,
            notification.type || 'info',
            notification.title,
            notification.message,
            notification.url || null,
            JSON.stringify(notification.metadata || {}),
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Obtener notificaciones pendientes de un usuario
     */
    async getPendingNotifications(userId, limit = 50) {
        const query = `
            SELECT * FROM notificaciones
            WHERE user_id = $1 AND leida = false
            ORDER BY created_at DESC
            LIMIT $2
        `;

        const result = await pool.query(query, [userId, limit]);
        return result.rows;
    }

    /**
     * Enviar notificaciones pendientes al cliente
     */
    async sendPendingNotifications(ws, userId) {
        const notifications = await this.getPendingNotifications(userId);

        if (notifications.length > 0) {
            this.sendToClient(ws, {
                type: 'pending_notifications',
                count: notifications.length,
                data: notifications
            });

            devLogger.log(`📬 Enviadas ${notifications.length} notificaciones pendientes a User ${userId}`);
        }
    }

    /**
     * Marcar notificación como leída
     */
    async markNotificationAsRead(notificationId, userId) {
        const query = `
            UPDATE notificaciones
            SET leida = true, read_at = NOW()
            WHERE id = $1 AND user_id = $2
        `;

        await pool.query(query, [notificationId, userId]);
        devLogger.log(`✅ Notificación ${notificationId} marcada como leída`);
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    async markAllAsRead(userId) {
        const query = `
            UPDATE notificaciones
            SET leida = true, read_at = NOW()
            WHERE user_id = $1 AND leida = false
        `;

        const result = await pool.query(query, [userId]);
        return result.rowCount;
    }

    /**
     * Enviar mensaje a un cliente específico
     */
    sendToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    /**
     * Manejar desconexión de cliente
     */
    handleDisconnection(ws) {
        // Remover de la lista de clientes
        if (ws.userId) {
            const userClients = this.clients.get(ws.userId);
            if (userClients) {
                const index = userClients.indexOf(ws);
                if (index > -1) {
                    userClients.splice(index, 1);
                }

                if (userClients.length === 0) {
                    this.clients.delete(ws.userId);
                }
            }
        }

        // Remover de salas
        this.rooms.forEach((clients, roomId) => {
            clients.delete(ws);
        });

        devLogger.log(`🔌 Cliente desconectado: User ${ws.userId || 'unknown'}`);
    }

    /**
     * Iniciar heartbeat para detectar conexiones muertas
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach(ws => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // Cada 30 segundos
    }

    /**
     * Obtener estadísticas del servicio
     */
    getStats() {
        return {
            totalConnections: this.wss ? this.wss.clients.size : 0,
            uniqueUsers: this.clients.size,
            activeRooms: this.rooms.size,
            roomDetails: Array.from(this.rooms.entries()).map(([roomId, clients]) => ({
                roomId,
                clients: clients.size
            }))
        };
    }

    /**
     * Destruir servicio
     */
    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        if (this.wss) {
            this.wss.close();
        }

        this.clients.clear();
        this.rooms.clear();

        devLogger.log('🗑️ NotificationService destruido');
    }
}

module.exports = NotificationService;

/**
 * 🌐 SERVICIO WEBSOCKET - Sistema de Notificaciones en Tiempo Real
 * Gestiona conexiones WebSocket para comunicación bidireccional instantánea
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../middleware/logger');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map();
        this.rooms = new Map();
        this.messageQueue = new Map();
        this.presenceTracker = new Map();
        this.heartbeatInterval = null;
    }

    /**
     * Inicializar servidor WebSocket
     */
    initialize(server) {
        try {
            console.log('🌐 [WEBSOCKET] Inicializando servidor WebSocket...');

            this.wss = new WebSocket.Server({ server, path: '/ws' });

            this.wss.on('connection', (ws, req) => {
                this.handleConnection(ws, req);
            });

            this.startHeartbeat();
            console.log('✅ [WEBSOCKET] Servidor WebSocket inicializado correctamente');

            return true;
        } catch (error) {
            console.error('❌ [WEBSOCKET] Error inicializando servidor:', error);
            return false;
        }
    }

    /**
     * Manejar nueva conexión WebSocket
     */
    handleConnection(ws, req) {
        const clientId = uuidv4();
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ip = req.socket.remoteAddress;

        console.log(`🔗 [WEBSOCKET] Nueva conexión: ${clientId} desde ${ip}`);

        const clientInfo = {
            id: clientId,
            ws: ws,
            userId: null,
            userType: null,
            rooms: new Set(),
            lastPing: Date.now(),
            connectedAt: new Date(),
            userAgent: userAgent,
            ip: ip,
            isAlive: true
        };

        this.clients.set(clientId, clientInfo);

        // Configurar eventos del WebSocket
        ws.on('message', (message) => {
            this.handleMessage(clientId, message);
        });

        ws.on('close', (code, reason) => {
            this.handleDisconnection(clientId, code, reason);
        });

        ws.on('error', (error) => {
            console.error(`❌ [WEBSOCKET] Error en cliente ${clientId}:`, error);
        });

        ws.on('pong', () => {
            if (this.clients.has(clientId)) {
                this.clients.get(clientId).isAlive = true;
                this.clients.get(clientId).lastPing = Date.now();
            }
        });

        // Enviar mensaje de bienvenida
        this.sendToClient(clientId, {
            type: 'connection_established',
            clientId: clientId,
            serverTime: new Date().toISOString(),
            features: ['notifications', 'presence', 'rooms', 'messaging']
        });
    }

    /**
     * Manejar mensajes entrantes de clientes
     */
    handleMessage(clientId, message) {
        try {
            const data = JSON.parse(message);
            const client = this.clients.get(clientId);

            if (!client) {
                console.warn(`⚠️ [WEBSOCKET] Cliente ${clientId} no encontrado`);
                return;
            }

            console.log(`📨 [WEBSOCKET] Mensaje de ${clientId}:`, data.type);

            switch (data.type) {
                case 'auth':
                    this.handleAuth(clientId, data);
                    break;

                case 'join_room':
                    this.handleJoinRoom(clientId, data);
                    break;

                case 'leave_room':
                    this.handleLeaveRoom(clientId, data);
                    break;

                case 'send_message':
                    this.handleSendMessage(clientId, data);
                    break;

                case 'update_presence':
                    this.handleUpdatePresence(clientId, data);
                    break;

                case 'ping':
                    this.handlePing(clientId, data);
                    break;

                case 'get_online_users':
                    this.handleGetOnlineUsers(clientId, data);
                    break;

                default:
                    console.warn(`⚠️ [WEBSOCKET] Tipo de mensaje desconocido: ${data.type}`);
                    this.sendToClient(clientId, {
                        type: 'error',
                        message: 'Tipo de mensaje no soportado',
                        originalType: data.type
                    });
            }
        } catch (error) {
            console.error(`❌ [WEBSOCKET] Error procesando mensaje de ${clientId}:`, error);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Error procesando mensaje',
                error: error.message
            });
        }
    }

    /**
     * Manejar autenticación de cliente
     */
    handleAuth(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { userId, userType, token } = data;

        // TODO: Validar token de autenticación aquí
        // Por ahora, aceptamos cualquier autenticación

        client.userId = userId;
        client.userType = userType;

        console.log(`🔐 [WEBSOCKET] Cliente ${clientId} autenticado como ${userType}: ${userId}`);

        // Unirse a sala personal
        this.joinRoom(clientId, `user_${userId}`);

        // Unirse a sala por tipo de usuario
        this.joinRoom(clientId, `type_${userType}`);

        // Actualizar presencia
        this.updatePresence(userId, {
            status: 'online',
            lastSeen: new Date(),
            clientId: clientId
        });

        // Enviar confirmación
        this.sendToClient(clientId, {
            type: 'auth_success',
            userId: userId,
            userType: userType,
            rooms: Array.from(client.rooms)
        });

        // Enviar mensajes en cola si los hay
        this.deliverQueuedMessages(userId);
    }

    /**
     * Unir cliente a una sala
     */
    handleJoinRoom(clientId, data) {
        const { room } = data;
        this.joinRoom(clientId, room);

        this.sendToClient(clientId, {
            type: 'room_joined',
            room: room
        });
    }

    /**
     * Sacar cliente de una sala
     */
    handleLeaveRoom(clientId, data) {
        const { room } = data;
        this.leaveRoom(clientId, room);

        this.sendToClient(clientId, {
            type: 'room_left',
            room: room
        });
    }

    /**
     * Manejar envío de mensaje a sala
     */
    handleSendMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client || !client.userId) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Cliente no autenticado'
            });
            return;
        }

        const { room, message, messageType = 'text' } = data;

        const messageData = {
            type: 'message',
            messageId: uuidv4(),
            from: client.userId,
            fromType: client.userType,
            room: room,
            message: message,
            messageType: messageType,
            timestamp: new Date().toISOString()
        };

        // Enviar a todos los clientes en la sala
        this.broadcastToRoom(room, messageData, clientId);

        // Confirmar envío al remitente
        this.sendToClient(clientId, {
            type: 'message_sent',
            messageId: messageData.messageId,
            timestamp: messageData.timestamp
        });
    }

    /**
     * Actualizar presencia de usuario
     */
    handleUpdatePresence(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client || !client.userId) return;

        const { status, customMessage } = data;

        this.updatePresence(client.userId, {
            status: status,
            customMessage: customMessage,
            lastSeen: new Date(),
            clientId: clientId
        });

        // Notificar a otros usuarios en las mismas salas
        client.rooms.forEach(room => {
            this.broadcastToRoom(room, {
                type: 'presence_update',
                userId: client.userId,
                status: status,
                customMessage: customMessage
            }, clientId);
        });
    }

    /**
     * Manejar ping de cliente
     */
    handlePing(clientId, data) {
        this.sendToClient(clientId, {
            type: 'pong',
            timestamp: new Date().toISOString(),
            clientId: clientId
        });
    }

    /**
     * Obtener usuarios en línea
     */
    handleGetOnlineUsers(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { room } = data;
        const onlineUsers = this.getOnlineUsersInRoom(room);

        this.sendToClient(clientId, {
            type: 'online_users',
            room: room,
            users: onlineUsers
        });
    }

    /**
     * Unir cliente a sala
     */
    joinRoom(clientId, room) {
        const client = this.clients.get(clientId);
        if (!client) return false;

        client.rooms.add(room);

        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
        }
        this.rooms.get(room).add(clientId);

        console.log(`🏠 [WEBSOCKET] Cliente ${clientId} se unió a sala: ${room}`);
        return true;
    }

    /**
     * Sacar cliente de sala
     */
    leaveRoom(clientId, room) {
        const client = this.clients.get(clientId);
        if (!client) return false;

        client.rooms.delete(room);

        if (this.rooms.has(room)) {
            this.rooms.get(room).delete(clientId);

            // Eliminar sala si está vacía
            if (this.rooms.get(room).size === 0) {
                this.rooms.delete(room);
            }
        }

        console.log(`🚪 [WEBSOCKET] Cliente ${clientId} salió de sala: ${room}`);
        return true;
    }

    /**
     * Enviar mensaje a cliente específico
     */
    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            client.ws.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`❌ [WEBSOCKET] Error enviando a cliente ${clientId}:`, error);
            return false;
        }
    }

    /**
     * Enviar mensaje a usuario específico
     */
    sendToUser(userId, data) {
        let sent = false;

        this.clients.forEach((client, clientId) => {
            if (client.userId === userId) {
                if (this.sendToClient(clientId, data)) {
                    sent = true;
                }
            }
        });

        // Si no se pudo enviar, encolar mensaje
        if (!sent) {
            this.queueMessage(userId, data);
        }

        return sent;
    }

    /**
     * Difundir mensaje a todos los clientes en una sala
     */
    broadcastToRoom(room, data, excludeClientId = null) {
        if (!this.rooms.has(room)) return 0;

        let sentCount = 0;
        const roomClients = this.rooms.get(room);

        roomClients.forEach(clientId => {
            if (clientId !== excludeClientId) {
                if (this.sendToClient(clientId, data)) {
                    sentCount++;
                }
            }
        });

        return sentCount;
    }

    /**
     * Difundir a todos los clientes conectados
     */
    broadcast(data, excludeClientId = null) {
        let sentCount = 0;

        this.clients.forEach((client, clientId) => {
            if (clientId !== excludeClientId) {
                if (this.sendToClient(clientId, data)) {
                    sentCount++;
                }
            }
        });

        return sentCount;
    }

    /**
     * Encolar mensaje para entrega posterior
     */
    queueMessage(userId, data) {
        if (!this.messageQueue.has(userId)) {
            this.messageQueue.set(userId, []);
        }

        this.messageQueue.get(userId).push({
            ...data,
            queuedAt: new Date().toISOString()
        });

        console.log(`📮 [WEBSOCKET] Mensaje encolado para usuario: ${userId}`);
    }

    /**
     * Entregar mensajes en cola
     */
    deliverQueuedMessages(userId) {
        if (!this.messageQueue.has(userId)) return;

        const messages = this.messageQueue.get(userId);
        console.log(`📬 [WEBSOCKET] Entregando ${messages.length} mensajes en cola para: ${userId}`);

        messages.forEach(message => {
            this.sendToUser(userId, message);
        });

        this.messageQueue.delete(userId);
    }

    /**
     * Actualizar presencia de usuario
     */
    updatePresence(userId, presenceData) {
        this.presenceTracker.set(userId, {
            ...presenceData,
            updatedAt: new Date()
        });
    }

    /**
     * Obtener usuarios en línea en una sala
     */
    getOnlineUsersInRoom(room) {
        if (!this.rooms.has(room)) return [];

        const onlineUsers = [];
        const roomClients = this.rooms.get(room);

        roomClients.forEach(clientId => {
            const client = this.clients.get(clientId);
            if (client && client.userId) {
                const presence = this.presenceTracker.get(client.userId);
                onlineUsers.push({
                    userId: client.userId,
                    userType: client.userType,
                    connectedAt: client.connectedAt,
                    presence: presence || { status: 'online' }
                });
            }
        });

        return onlineUsers;
    }

    /**
     * Manejar desconexión de cliente
     */
    handleDisconnection(clientId, code, reason) {
        const client = this.clients.get(clientId);
        if (!client) return;

        console.log(`🔌 [WEBSOCKET] Cliente ${clientId} desconectado - Código: ${code}`);

        // Salir de todas las salas
        client.rooms.forEach(room => {
            this.leaveRoom(clientId, room);
        });

        // Actualizar presencia si estaba autenticado
        if (client.userId) {
            this.updatePresence(client.userId, {
                status: 'offline',
                lastSeen: new Date(),
                clientId: null
            });

            // Notificar desconexión a otras salas
            client.rooms.forEach(room => {
                this.broadcastToRoom(room, {
                    type: 'presence_update',
                    userId: client.userId,
                    status: 'offline'
                });
            });
        }

        // Eliminar cliente
        this.clients.delete(clientId);
    }

    /**
     * Iniciar heartbeat para mantener conexiones vivas
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.clients.forEach((client, clientId) => {
                if (!client.isAlive) {
                    console.log(`💔 [WEBSOCKET] Cliente ${clientId} sin respuesta - Terminando conexión`);
                    client.ws.terminate();
                    return;
                }

                client.isAlive = false;
                client.ws.ping();
            });
        }, 30000); // Cada 30 segundos

        console.log('💓 [WEBSOCKET] Sistema de heartbeat iniciado');
    }

    /**
     * Detener servicio WebSocket
     */
    shutdown() {
        console.log('🛑 [WEBSOCKET] Cerrando servidor WebSocket...');

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        if (this.wss) {
            this.wss.clients.forEach(ws => {
                ws.close(1000, 'Server shutdown');
            });
            this.wss.close();
        }

        this.clients.clear();
        this.rooms.clear();
        this.messageQueue.clear();
        this.presenceTracker.clear();

        console.log('✅ [WEBSOCKET] Servidor WebSocket cerrado');
    }

    /**
     * Obtener estadísticas del servicio
     */
    getStats() {
        return {
            connectedClients: this.clients.size,
            authenticatedUsers: Array.from(this.clients.values()).filter(c => c.userId).length,
            activeRooms: this.rooms.size,
            queuedMessages: this.messageQueue.size,
            presenceEntries: this.presenceTracker.size
        };
    }
}

// Singleton
let webSocketServiceInstance = null;

function getWebSocketService() {
    if (!webSocketServiceInstance) {
        webSocketServiceInstance = new WebSocketService();
    }
    return webSocketServiceInstance;
}

module.exports = {
    WebSocketService,
    getWebSocketService
};
/**
 * 🔔 SOCKET.IO SERVICE - SEMANA 5
 * Servicio centralizado de notificaciones en tiempo real
 *
 * Características:
 * - Broadcasting a usuarios/roles específicos
 * - Rooms por tenant/grupo/rol
 * - Presence detection (usuarios online)
 * - Autenticación JWT en handshake
 * - Event history con Redis
 * - Reconnection handling
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { redis } = require('./cache-service');

class SocketService {
    constructor(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.onlineUsers = new Map();  // userId -> Set of socketIds
        this.userRooms = new Map();    // userId -> Set of rooms

        this.setupMiddleware();
        this.setupEventHandlers();

        console.log('[Socket.IO] Servicio inicializado');
    }

    /**
     * Middleware de autenticación JWT
     */
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (token === 'METAVERSE_GUEST_TOKEN') {
                    socket.userId = 'guest_' + socket.id.substr(0, 5);
                    socket.userRole = 'guest';
                    socket.userEmail = 'guest@metaverse';
                    socket.tenantId = 'public';
                    console.log(`[Socket.IO] Guest access granted: ${socket.userId}`);
                    return next();
                }

                if (!token) {
                    return next(new Error('Authentication error: Token required'));
                }

                // Verificar JWT
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // ... (resto del código)
            } catch (error) {
                // ...
            }
        });
    }

    /**
     * Setup de event handlers
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);

            // Event listeners
            socket.on('join_room', (room) => this.handleJoinRoom(socket, room));
            socket.on('leave_room', (room) => this.handleLeaveRoom(socket, room));
            socket.on('send_notification', (data) => this.handleSendNotification(socket, data));
            socket.on('typing', (data) => this.handleTyping(socket, data));
            socket.on('stop_typing', (data) => this.handleStopTyping(socket, data));
            socket.on('disconnect', () => this.handleDisconnect(socket));

            // 🌐 METAVERSE EVENTS (Semana 6 - Multiplayer)
            socket.on('metaverse:join', (data) => this.handleMetaverseJoin(socket, data));
            socket.on('metaverse:move', (data) => this.handleMetaverseMove(socket, data));

            // 💬 CHAT EVENTS (Semana 7 - UI & Interaction)
            socket.on('chat:send', (data) => this.handleChatSend(socket, data));
        });
    }

    /**
     * Metaverse Chat: Enviar mensaje
     */
    handleChatSend(socket, data) {
        const { text, senderName } = data;

        // Sanitizar texto (básico)
        const cleanText = text?.substring(0, 200).trim();
        if (!cleanText) return;

        console.log(`[Metaverse Chat] ${senderName}: ${cleanText}`);

        // Retransmitir a todos en la sala del metaverso
        socket.to('metaverse_global').emit('chat:message', {
            senderId: socket.userId,
            senderName: senderName || socket.userId,
            text: cleanText,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Metaverse: Join World
     */
    handleMetaverseJoin(socket, data) {
        const room = 'metaverse_global';
        socket.join(room);
        console.log(`[Metaverse] Player ${socket.userId} joined world at`, data.position);

        // Avisar a otros jugadores
        socket.to(room).emit('metaverse:player_joined', {
            id: socket.userId,
            position: data.position,
            color: data.color // Color del avatar
        });

        // Nota: En una implementación completa, aquí enviaríamos el estado actual del mundo (getState)
    }

    /**
     * Metaverse: Movement Sync (High Frequency)
     */
    handleMetaverseMove(socket, data) {
        // Retransmitir usando volátil (si se pierde un paquete no importa, el siguiente lo corrige)
        // Optimizacion: Solo enviar ID + Pos + Rot
        socket.to('metaverse_global').volatile.emit('metaverse:player_moved', {
            id: socket.userId,
            position: data.position,
            rotation: data.rotation,
            animation: data.animation
        });
    }

    /**
     * Manejo de nueva conexión
     */
    handleConnection(socket) {
        const { userId, userRole, userEmail, tenantId } = socket;

        console.log(`[Socket.IO] Conexión: ${userEmail} (${socket.id})`);

        // Agregar a mapa de usuarios online
        if (!this.onlineUsers.has(userId)) {
            this.onlineUsers.set(userId, new Set());
        }
        this.onlineUsers.get(userId).add(socket.id);

        // Auto-join a rooms por rol y tenant
        this.autoJoinRooms(socket);

        // Emitir evento de usuario online
        this.emitUserPresence(userId, 'online');

        // Enviar historial de notificaciones recientes
        this.sendRecentNotifications(socket);

        // Enviar lista de usuarios online (para presencia)
        this.sendOnlineUsers(socket);
    }

    /**
     * Auto-join a rooms relevantes
     */
    autoJoinRooms(socket) {
        const { userId, userRole, tenantId } = socket;

        // Room por tenant
        const tenantRoom = `tenant:${tenantId}`;
        socket.join(tenantRoom);

        // Room por rol
        const roleRoom = `role:${userRole}`;
        socket.join(roleRoom);

        // Room personal
        const userRoom = `user:${userId}`;
        socket.join(userRoom);

        // Trackear rooms del usuario
        if (!this.userRooms.has(userId)) {
            this.userRooms.set(userId, new Set());
        }
        this.userRooms.get(userId).add(tenantRoom);
        this.userRooms.get(userId).add(roleRoom);
        this.userRooms.get(userId).add(userRoom);

        console.log(`[Socket.IO] ${socket.userEmail} joined rooms: ${tenantRoom}, ${roleRoom}, ${userRoom}`);
    }

    /**
     * Join a room específico
     */
    handleJoinRoom(socket, room) {
        socket.join(room);

        if (!this.userRooms.has(socket.userId)) {
            this.userRooms.set(socket.userId, new Set());
        }
        this.userRooms.get(socket.userId).add(room);

        console.log(`[Socket.IO] ${socket.userEmail} joined room: ${room}`);

        socket.emit('room_joined', { room });
    }

    /**
     * Leave room
     */
    handleLeaveRoom(socket, room) {
        socket.leave(room);

        if (this.userRooms.has(socket.userId)) {
            this.userRooms.get(socket.userId).delete(room);
        }

        console.log(`[Socket.IO] ${socket.userEmail} left room: ${room}`);

        socket.emit('room_left', { room });
    }

    /**
     * Enviar notificación personalizada
     */
    async handleSendNotification(socket, data) {
        const { to, type, message, metadata } = data;

        // Validar permisos (solo admins pueden enviar a todos)
        if (to === 'all' && socket.userRole !== 'admin') {
            socket.emit('error', { message: 'Unauthorized: Only admins can broadcast to all' });
            return;
        }

        const notification = {
            id: `notif_${Date.now()}`,
            from: {
                userId: socket.userId,
                email: socket.userEmail,
                role: socket.userRole
            },
            type,
            message,
            metadata,
            timestamp: new Date().toISOString()
        };

        // Guardar en Redis para historial
        await this.saveNotificationToHistory(notification);

        // Emitir según target
        if (to === 'all') {
            this.io.emit('notification', notification);
        } else if (to.startsWith('role:')) {
            this.io.to(to).emit('notification', notification);
        } else if (to.startsWith('user:')) {
            this.io.to(to).emit('notification', notification);
        } else {
            socket.emit('error', { message: 'Invalid target' });
        }

        console.log(`[Socket.IO] Notification sent from ${socket.userEmail} to ${to}: ${type}`);
    }

    /**
     * Typing indicator
     */
    handleTyping(socket, data) {
        const { room } = data;
        socket.to(room).emit('user_typing', {
            userId: socket.userId,
            email: socket.userEmail,
            room
        });
    }

    /**
     * Stop typing indicator
     */
    handleStopTyping(socket, data) {
        const { room } = data;
        socket.to(room).emit('user_stopped_typing', {
            userId: socket.userId,
            room
        });
    }

    /**
     * Manejo de desconexión
     */
    handleDisconnect(socket) {
        const { userId, userEmail } = socket;

        console.log(`[Socket.IO] Desconexión: ${userEmail} (${socket.id})`);

        // Remover de online users
        if (this.onlineUsers.has(userId)) {
            this.onlineUsers.get(userId).delete(socket.id);

            // Si no quedan sockets del usuario, marcarlo como offline
            if (this.onlineUsers.get(userId).size === 0) {
                this.onlineUsers.delete(userId);
                this.userRooms.delete(userId);
                this.emitUserPresence(userId, 'offline');
            }
        }
    }

    /**
     * Emitir presencia de usuario
     */
    emitUserPresence(userId, status) {
        this.io.emit('user_presence', {
            userId,
            status,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Enviar historial reciente de notificaciones
     */
    async sendRecentNotifications(socket) {
        try {
            // Obtener últimas 50 notificaciones de Redis
            const notifications = await redis.lrange('notifications:recent', 0, 49);

            if (notifications && notifications.length > 0) {
                const parsed = notifications.map(n => JSON.parse(n));
                socket.emit('notifications_history', parsed);
            }
        } catch (error) {
            console.error('[Socket.IO] Error loading notification history:', error);
        }
    }

    /**
     * Enviar lista de usuarios online
     */
    sendOnlineUsers(socket) {
        const onlineUserIds = Array.from(this.onlineUsers.keys());
        socket.emit('online_users', onlineUserIds);
    }

    /**
     * Guardar notificación en historial (Redis)
     */
    async saveNotificationToHistory(notification) {
        try {
            // Guardar en lista de Redis (máximo 100 notificaciones)
            await redis.lpush('notifications:recent', JSON.stringify(notification));
            await redis.ltrim('notifications:recent', 0, 99);

            // TTL de 7 días
            await redis.expire('notifications:recent', 60 * 60 * 24 * 7);
        } catch (error) {
            console.error('[Socket.IO] Error saving notification to history:', error);
        }
    }

    // ============================================
    // API PÚBLICA PARA EMITIR EVENTOS
    // ============================================

    /**
     * Enviar notificación a usuario específico
     */
    async sendToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
        console.log(`[Socket.IO] Sent ${event} to user:${userId}`);
    }

    /**
     * Enviar notificación a rol específico
     */
    async sendToRole(role, event, data) {
        this.io.to(`role:${role}`).emit(event, data);
        console.log(`[Socket.IO] Sent ${event} to role:${role}`);
    }

    /**
     * Broadcast a todos los usuarios
     */
    async broadcastToAll(event, data) {
        this.io.emit(event, data);
        console.log(`[Socket.IO] Broadcast ${event} to all users`);
    }

    /**
     * Enviar a tenant específico
     */
    async sendToTenant(tenantId, event, data) {
        this.io.to(`tenant:${tenantId}`).emit(event, data);
        console.log(`[Socket.IO] Sent ${event} to tenant:${tenantId}`);
    }

    /**
     * Obtener usuarios online
     */
    getOnlineUsers() {
        return Array.from(this.onlineUsers.keys());
    }

    /**
     * Verificar si usuario está online
     */
    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }

    /**
     * Obtener count de usuarios online
     */
    getOnlineCount() {
        return this.onlineUsers.size;
    }
}

module.exports = SocketService;

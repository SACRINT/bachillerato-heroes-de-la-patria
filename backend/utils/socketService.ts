/**
 * 🔌 SOCKET.IO SERVICE - Real-time Communication
 * Sistema de comunicación en tiempo real para mensajería y notificaciones
 * Creado: 19 Enero 2026
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

const debugLog = require('./debug-logger');

// Types
interface UserSocket {
    socketId: string;
    userId: number;
    userRole: string;
    userName: string;
}

interface ChatMessage {
    conversation_id: string;
    sender_id: number;
    sender_role: string;
    sender_name: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'image' | 'file' | 'system';
    attachments?: any[];
}

interface Notification {
    id: string;
    user_id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    action_url?: string;
    created_at: Date;
}

class SocketService {
    private io: Server | null = null;
    private connectedUsers: Map<number, UserSocket[]> = new Map();

    /**
     * Initialize Socket.io server
     */
    initialize(httpServer: HttpServer): Server {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            path: '/socket.io',
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.setupMiddleware();
        this.setupEventHandlers();

        debugLog.log('SOCKET', '✅ Socket.io server initialized');
        return this.io;
    }

    /**
     * Setup authentication middleware
     */
    private setupMiddleware(): void {
        if (!this.io) return;

        this.io.use((socket: Socket, next) => {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: Token required'));
            }

            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bge-secret-key-2025');

                socket.data.user = {
                    id: decoded.id,
                    role: decoded.role,
                    name: decoded.name || decoded.email,
                    email: decoded.email
                };

                next();
            } catch (error) {
                next(new Error('Authentication error: Invalid token'));
            }
        });
    }

    /**
     * Setup socket event handlers
     */
    private setupEventHandlers(): void {
        if (!this.io) return;

        this.io.on('connection', (socket: Socket) => {
            const user = socket.data.user;
            debugLog.log('SOCKET', `🔗 User connected: ${user.name} (${user.role})`);

            // Register user connection
            this.registerUser(socket, user);

            // Join user to their personal room
            socket.join(`user:${user.id}`);
            socket.join(`role:${user.role}`);

            // === CHAT EVENTS ===

            // Join conversation
            socket.on('chat:join', (conversationId: string) => {
                socket.join(`conversation:${conversationId}`);
                debugLog.log('SOCKET', `User ${user.id} joined conversation ${conversationId}`);
            });

            // Leave conversation
            socket.on('chat:leave', (conversationId: string) => {
                socket.leave(`conversation:${conversationId}`);
                debugLog.log('SOCKET', `User ${user.id} left conversation ${conversationId}`);
            });

            // Send message
            socket.on('chat:message', async (message: ChatMessage) => {
                try {
                    // Add sender info
                    message.sender_id = user.id;
                    message.sender_role = user.role;
                    message.sender_name = user.name;
                    message.timestamp = new Date();

                    // Broadcast to conversation participants
                    this.io?.to(`conversation:${message.conversation_id}`).emit('chat:message', message);

                    // Save to database (async)
                    this.saveMessage(message);

                    debugLog.log('SOCKET', `Message sent in conversation ${message.conversation_id}`);
                } catch (error) {
                    socket.emit('chat:error', { message: 'Error sending message' });
                }
            });

            // Typing indicator
            socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean }) => {
                socket.to(`conversation:${data.conversationId}`).emit('chat:typing', {
                    userId: user.id,
                    userName: user.name,
                    isTyping: data.isTyping
                });
            });

            // === NOTIFICATION EVENTS ===

            // Mark notification as read
            socket.on('notification:read', async (notificationId: string) => {
                try {
                    await this.markNotificationRead(user.id, notificationId);
                    socket.emit('notification:read:confirmed', { id: notificationId });
                } catch (error) {
                    socket.emit('notification:error', { message: 'Error marking notification' });
                }
            });

            // === PRESENCE EVENTS ===

            // Update status
            socket.on('presence:status', (status: 'online' | 'away' | 'busy' | 'offline') => {
                this.io?.emit('presence:update', {
                    userId: user.id,
                    userName: user.name,
                    status,
                    updatedAt: new Date()
                });
            });

            // === DISCONNECT ===
            socket.on('disconnect', (reason) => {
                this.unregisterUser(socket, user);
                debugLog.log('SOCKET', `🔌 User disconnected: ${user.name} (${reason})`);
            });
        });
    }

    /**
     * Register user connection
     */
    private registerUser(socket: Socket, user: any): void {
        const userSocket: UserSocket = {
            socketId: socket.id,
            userId: user.id,
            userRole: user.role,
            userName: user.name
        };

        const userSockets = this.connectedUsers.get(user.id) || [];
        userSockets.push(userSocket);
        this.connectedUsers.set(user.id, userSockets);

        // Broadcast presence
        this.io?.emit('presence:update', {
            userId: user.id,
            userName: user.name,
            status: 'online',
            updatedAt: new Date()
        });
    }

    /**
     * Unregister user connection
     */
    private unregisterUser(socket: Socket, user: any): void {
        const userSockets = this.connectedUsers.get(user.id) || [];
        const filtered = userSockets.filter(s => s.socketId !== socket.id);

        if (filtered.length > 0) {
            this.connectedUsers.set(user.id, filtered);
        } else {
            this.connectedUsers.delete(user.id);
            // User fully offline
            this.io?.emit('presence:update', {
                userId: user.id,
                userName: user.name,
                status: 'offline',
                updatedAt: new Date()
            });
        }
    }

    /**
     * Save message to database
     */
    private async saveMessage(message: ChatMessage): Promise<void> {
        try {
            const { executeQuery } = require('../config/database');
            await executeQuery(`
                INSERT INTO messages (conversation_id, sender_id, sender_role, sender_name, content, message_type, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                message.conversation_id,
                message.sender_id,
                message.sender_role,
                message.sender_name,
                message.content,
                message.type,
                message.timestamp
            ]);
        } catch (error) {
            debugLog.error('SOCKET', 'Error saving message to database', error);
        }
    }

    /**
     * Mark notification as read
     */
    private async markNotificationRead(userId: number, notificationId: string): Promise<void> {
        const { executeQuery } = require('../config/database');
        await executeQuery(`
            UPDATE notificaciones_usuario 
            SET leida = true, fecha_lectura = CURRENT_TIMESTAMP
            WHERE id = $1 AND usuario_id = $2
        `, [notificationId, userId]);
    }

    // === PUBLIC METHODS ===

    /**
     * Send notification to specific user
     */
    sendNotificationToUser(userId: number, notification: Partial<Notification>): void {
        if (!this.io) return;

        const fullNotification: Notification = {
            id: notification.id || Date.now().toString(),
            user_id: userId,
            title: notification.title || 'Notificación',
            message: notification.message || '',
            type: notification.type || 'info',
            priority: notification.priority || 'normal',
            action_url: notification.action_url,
            created_at: new Date()
        };

        this.io.to(`user:${userId}`).emit('notification:new', fullNotification);
        debugLog.log('SOCKET', `Notification sent to user ${userId}: ${fullNotification.title}`);
    }

    /**
     * Send notification to role group
     */
    sendNotificationToRole(role: string, notification: Partial<Notification>): void {
        if (!this.io) return;

        const fullNotification = {
            ...notification,
            id: notification.id || Date.now().toString(),
            created_at: new Date()
        };

        this.io.to(`role:${role}`).emit('notification:new', fullNotification);
        debugLog.log('SOCKET', `Notification sent to role ${role}: ${notification.title}`);
    }

    /**
     * Broadcast to all connected users
     */
    broadcast(event: string, data: any): void {
        if (!this.io) return;
        this.io.emit(event, data);
    }

    /**
     * Send message to conversation
     */
    sendToConversation(conversationId: string, event: string, data: any): void {
        if (!this.io) return;
        this.io.to(`conversation:${conversationId}`).emit(event, data);
    }

    /**
     * Get online users count
     */
    getOnlineUsersCount(): number {
        return this.connectedUsers.size;
    }

    /**
     * Get online users by role
     */
    getOnlineUsersByRole(role: string): UserSocket[] {
        const result: UserSocket[] = [];
        this.connectedUsers.forEach(sockets => {
            sockets.forEach(socket => {
                if (socket.userRole === role) {
                    result.push(socket);
                }
            });
        });
        return result;
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId: number): boolean {
        return this.connectedUsers.has(userId);
    }

    /**
     * Get IO instance
     */
    getIO(): Server | null {
        return this.io;
    }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
module.exports = socketService;

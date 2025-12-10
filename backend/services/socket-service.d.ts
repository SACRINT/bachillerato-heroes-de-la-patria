export = SocketService;
declare class SocketService {
    constructor(httpServer: any);
    io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    onlineUsers: Map<any, any>;
    userRooms: Map<any, any>;
    /**
     * Middleware de autenticación JWT
     */
    setupMiddleware(): void;
    /**
     * Setup de event handlers
     */
    setupEventHandlers(): void;
    /**
     * Manejo de nueva conexión
     */
    handleConnection(socket: any): void;
    /**
     * Auto-join a rooms relevantes
     */
    autoJoinRooms(socket: any): void;
    /**
     * Join a room específico
     */
    handleJoinRoom(socket: any, room: any): void;
    /**
     * Leave room
     */
    handleLeaveRoom(socket: any, room: any): void;
    /**
     * Enviar notificación personalizada
     */
    handleSendNotification(socket: any, data: any): Promise<void>;
    /**
     * Typing indicator
     */
    handleTyping(socket: any, data: any): void;
    /**
     * Stop typing indicator
     */
    handleStopTyping(socket: any, data: any): void;
    /**
     * Manejo de desconexión
     */
    handleDisconnect(socket: any): void;
    /**
     * Emitir presencia de usuario
     */
    emitUserPresence(userId: any, status: any): void;
    /**
     * Enviar historial reciente de notificaciones
     */
    sendRecentNotifications(socket: any): Promise<void>;
    /**
     * Enviar lista de usuarios online
     */
    sendOnlineUsers(socket: any): void;
    /**
     * Guardar notificación en historial (Redis)
     */
    saveNotificationToHistory(notification: any): Promise<void>;
    /**
     * Enviar notificación a usuario específico
     */
    sendToUser(userId: any, event: any, data: any): Promise<void>;
    /**
     * Enviar notificación a rol específico
     */
    sendToRole(role: any, event: any, data: any): Promise<void>;
    /**
     * Broadcast a todos los usuarios
     */
    broadcastToAll(event: any, data: any): Promise<void>;
    /**
     * Enviar a tenant específico
     */
    sendToTenant(tenantId: any, event: any, data: any): Promise<void>;
    /**
     * Obtener usuarios online
     */
    getOnlineUsers(): any[];
    /**
     * Verificar si usuario está online
     */
    isUserOnline(userId: any): boolean;
    /**
     * Obtener count de usuarios online
     */
    getOnlineCount(): number;
}
import { Server } from "socket.io";
//# sourceMappingURL=socket-service.d.ts.map
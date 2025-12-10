export class WebSocketService {
    wss: any;
    clients: Map<any, any>;
    rooms: Map<any, any>;
    messageQueue: Map<any, any>;
    presenceTracker: Map<any, any>;
    heartbeatInterval: NodeJS.Timeout;
    /**
     * Inicializar servidor WebSocket
     */
    initialize(server: any): boolean;
    /**
     * Manejar nueva conexión WebSocket
     */
    handleConnection(ws: any, req: any): void;
    /**
     * Manejar mensajes entrantes de clientes
     */
    handleMessage(clientId: any, message: any): void;
    /**
     * Manejar autenticación de cliente
     */
    handleAuth(clientId: any, data: any): void;
    /**
     * Unir cliente a una sala
     */
    handleJoinRoom(clientId: any, data: any): void;
    /**
     * Sacar cliente de una sala
     */
    handleLeaveRoom(clientId: any, data: any): void;
    /**
     * Manejar envío de mensaje a sala
     */
    handleSendMessage(clientId: any, data: any): void;
    /**
     * Actualizar presencia de usuario
     */
    handleUpdatePresence(clientId: any, data: any): void;
    /**
     * Manejar ping de cliente
     */
    handlePing(clientId: any, data: any): void;
    /**
     * Obtener usuarios en línea
     */
    handleGetOnlineUsers(clientId: any, data: any): void;
    /**
     * Unir cliente a sala
     */
    joinRoom(clientId: any, room: any): boolean;
    /**
     * Sacar cliente de sala
     */
    leaveRoom(clientId: any, room: any): boolean;
    /**
     * Enviar mensaje a cliente específico
     */
    sendToClient(clientId: any, data: any): boolean;
    /**
     * Enviar mensaje a usuario específico
     */
    sendToUser(userId: any, data: any): boolean;
    /**
     * Difundir mensaje a todos los clientes en una sala
     */
    broadcastToRoom(room: any, data: any, excludeClientId?: any): number;
    /**
     * Difundir a todos los clientes conectados
     */
    broadcast(data: any, excludeClientId?: any): number;
    /**
     * Encolar mensaje para entrega posterior
     */
    queueMessage(userId: any, data: any): void;
    /**
     * Entregar mensajes en cola
     */
    deliverQueuedMessages(userId: any): void;
    /**
     * Actualizar presencia de usuario
     */
    updatePresence(userId: any, presenceData: any): void;
    /**
     * Obtener usuarios en línea en una sala
     */
    getOnlineUsersInRoom(room: any): any[];
    /**
     * Manejar desconexión de cliente
     */
    handleDisconnection(clientId: any, code: any, reason: any): void;
    /**
     * Iniciar heartbeat para mantener conexiones vivas
     */
    startHeartbeat(): void;
    /**
     * Detener servicio WebSocket
     */
    shutdown(): void;
    /**
     * Obtener estadísticas del servicio
     */
    getStats(): {
        connectedClients: number;
        authenticatedUsers: number;
        activeRooms: number;
        queuedMessages: number;
        presenceEntries: number;
    };
}
export function getWebSocketService(): any;
//# sourceMappingURL=webSocketService.d.ts.map
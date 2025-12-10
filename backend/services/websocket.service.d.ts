/**
 * 🔄 WEBSOCKET SERVICE - TypeScript Version
 * Servicio de WebSocket para comunicación en tiempo real
 * Migrado: 07 Diciembre 2025
 */
import { EventEmitter } from 'events';
interface WebSocketClient {
    id: string;
    userId: number | null;
    socket: any;
    rooms: Set<string>;
    metadata: Record<string, any>;
    connectedAt: Date;
}
interface BroadcastOptions {
    exclude?: string[];
    room?: string;
}
interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: Date;
    sender?: string;
}
declare class WebSocketService extends EventEmitter {
    private clients;
    private rooms;
    private io;
    constructor();
    /**
     * Inicializar con servidor Socket.IO
     */
    initialize(io: any): void;
    /**
     * Registrar cliente conectado
     */
    registerClient(clientId: string, socket: any, userId?: number | null): WebSocketClient;
    /**
     * Desconectar cliente
     */
    disconnectClient(clientId: string): void;
    /**
     * Unir cliente a room
     */
    joinRoom(clientId: string, room: string): boolean;
    /**
     * Salir de room
     */
    leaveRoom(clientId: string, room: string): boolean;
    /**
     * Enviar mensaje a cliente específico
     */
    sendToClient(clientId: string, event: string, data: any): boolean;
    /**
     * Enviar mensaje a room
     */
    sendToRoom(room: string, event: string, data: any, exclude?: string[]): number;
    /**
     * Broadcast a todos los clientes
     */
    broadcast(event: string, data: any, options?: BroadcastOptions): number;
    /**
     * Obtener clientes en room
     */
    getRoomClients(room: string): string[];
    /**
     * Obtener estadísticas
     */
    getStats(): {
        clients: number;
        rooms: number;
        roomSizes: Record<string, number>;
    };
}
declare const webSocketService: WebSocketService;
export default webSocketService;
export { WebSocketService, WebSocketClient, WebSocketMessage };
//# sourceMappingURL=websocket.service.d.ts.map
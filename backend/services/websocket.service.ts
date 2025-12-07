/**
 * 🔄 WEBSOCKET SERVICE - TypeScript Version
 * Servicio de WebSocket para comunicación en tiempo real
 * Migrado: 07 Diciembre 2025
 */

import { EventEmitter } from 'events';

// ==================== INTERFACES ====================

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

// ==================== WEBSOCKET SERVICE ====================

class WebSocketService extends EventEmitter {
    private clients: Map<string, WebSocketClient>;
    private rooms: Map<string, Set<string>>;
    private io: any;

    constructor() {
        super();
        this.clients = new Map();
        this.rooms = new Map();
        this.io = null;
    }

    /**
     * Inicializar con servidor Socket.IO
     */
    initialize(io: any): void {
        this.io = io;
        console.log('[WS] WebSocket service inicializado');
    }

    /**
     * Registrar cliente conectado
     */
    registerClient(clientId: string, socket: any, userId: number | null = null): WebSocketClient {
        const client: WebSocketClient = {
            id: clientId,
            userId,
            socket,
            rooms: new Set(),
            metadata: {},
            connectedAt: new Date()
        };

        this.clients.set(clientId, client);
        this.emit('client:connected', client);
        console.log(`[WS] Cliente ${clientId} conectado. Total: ${this.clients.size}`);

        return client;
    }

    /**
     * Desconectar cliente
     */
    disconnectClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            // Remover de todas las rooms
            for (const room of client.rooms) {
                this.leaveRoom(clientId, room);
            }
            this.clients.delete(clientId);
            this.emit('client:disconnected', client);
            console.log(`[WS] Cliente ${clientId} desconectado. Total: ${this.clients.size}`);
        }
    }

    /**
     * Unir cliente a room
     */
    joinRoom(clientId: string, room: string): boolean {
        const client = this.clients.get(clientId);
        if (!client) return false;

        client.rooms.add(room);

        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
        }
        this.rooms.get(room)!.add(clientId);

        if (client.socket && client.socket.join) {
            client.socket.join(room);
        }

        console.log(`[WS] Cliente ${clientId} unido a room ${room}`);
        return true;
    }

    /**
     * Salir de room
     */
    leaveRoom(clientId: string, room: string): boolean {
        const client = this.clients.get(clientId);
        if (!client) return false;

        client.rooms.delete(room);

        const roomClients = this.rooms.get(room);
        if (roomClients) {
            roomClients.delete(clientId);
            if (roomClients.size === 0) {
                this.rooms.delete(room);
            }
        }

        if (client.socket && client.socket.leave) {
            client.socket.leave(room);
        }

        return true;
    }

    /**
     * Enviar mensaje a cliente específico
     */
    sendToClient(clientId: string, event: string, data: any): boolean {
        const client = this.clients.get(clientId);
        if (!client || !client.socket) return false;

        const message: WebSocketMessage = {
            type: event,
            payload: data,
            timestamp: new Date()
        };

        client.socket.emit(event, message);
        return true;
    }

    /**
     * Enviar mensaje a room
     */
    sendToRoom(room: string, event: string, data: any, exclude: string[] = []): number {
        const roomClients = this.rooms.get(room);
        if (!roomClients) return 0;

        let sent = 0;
        for (const clientId of roomClients) {
            if (!exclude.includes(clientId)) {
                if (this.sendToClient(clientId, event, data)) {
                    sent++;
                }
            }
        }

        return sent;
    }

    /**
     * Broadcast a todos los clientes
     */
    broadcast(event: string, data: any, options: BroadcastOptions = {}): number {
        const { exclude = [], room } = options;

        if (room) {
            return this.sendToRoom(room, event, data, exclude);
        }

        let sent = 0;
        for (const [clientId, client] of this.clients) {
            if (!exclude.includes(clientId)) {
                if (this.sendToClient(clientId, event, data)) {
                    sent++;
                }
            }
        }

        return sent;
    }

    /**
     * Obtener clientes en room
     */
    getRoomClients(room: string): string[] {
        const roomClients = this.rooms.get(room);
        return roomClients ? Array.from(roomClients) : [];
    }

    /**
     * Obtener estadísticas
     */
    getStats(): { clients: number; rooms: number; roomSizes: Record<string, number> } {
        const roomSizes: Record<string, number> = {};
        for (const [room, clients] of this.rooms) {
            roomSizes[room] = clients.size;
        }

        return {
            clients: this.clients.size,
            rooms: this.rooms.size,
            roomSizes
        };
    }
}

// ==================== EXPORTS ====================

const webSocketService = new WebSocketService();

export default webSocketService;
export { WebSocketService, WebSocketClient, WebSocketMessage };

"use strict";
/**
 * 🔄 WEBSOCKET SERVICE - TypeScript Version
 * Servicio de WebSocket para comunicación en tiempo real
 * Migrado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const events_1 = require("events");
// ==================== WEBSOCKET SERVICE ====================
class WebSocketService extends events_1.EventEmitter {
    constructor() {
        super();
        this.clients = new Map();
        this.rooms = new Map();
        this.io = null;
    }
    /**
     * Inicializar con servidor Socket.IO
     */
    initialize(io) {
        this.io = io;
        console.log('[WS] WebSocket service inicializado');
    }
    /**
     * Registrar cliente conectado
     */
    registerClient(clientId, socket, userId = null) {
        const client = {
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
    disconnectClient(clientId) {
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
    joinRoom(clientId, room) {
        const client = this.clients.get(clientId);
        if (!client)
            return false;
        client.rooms.add(room);
        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
        }
        this.rooms.get(room).add(clientId);
        if (client.socket && client.socket.join) {
            client.socket.join(room);
        }
        console.log(`[WS] Cliente ${clientId} unido a room ${room}`);
        return true;
    }
    /**
     * Salir de room
     */
    leaveRoom(clientId, room) {
        const client = this.clients.get(clientId);
        if (!client)
            return false;
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
    sendToClient(clientId, event, data) {
        const client = this.clients.get(clientId);
        if (!client || !client.socket)
            return false;
        const message = {
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
    sendToRoom(room, event, data, exclude = []) {
        const roomClients = this.rooms.get(room);
        if (!roomClients)
            return 0;
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
    broadcast(event, data, options = {}) {
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
    getRoomClients(room) {
        const roomClients = this.rooms.get(room);
        return roomClients ? Array.from(roomClients) : [];
    }
    /**
     * Obtener estadísticas
     */
    getStats() {
        const roomSizes = {};
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
exports.WebSocketService = WebSocketService;
// ==================== EXPORTS ====================
const webSocketService = new WebSocketService();
exports.default = webSocketService;
//# sourceMappingURL=websocket.service.js.map
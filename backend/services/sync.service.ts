/**
 * 🔄 SYNC SERVICE - TypeScript Version
 * Sincronización cross-platform entre Web, iOS y Android
 * Refactorizado: 07 Diciembre 2025
 */

import WebSocket from 'ws';
const SyncDAO = require('../data/sync.dao');

// ============================================
// INTERFACES
// ============================================

export interface SyncMessage {
    type: 'AUTH' | 'SYNC_REQUEST' | 'DELTA_UPDATE' | string;
    payload?: any;
}

export interface AuthPayload {
    userId: number;
    token: string;
}

export interface SyncRequestPayload {
    userId: number;
    lastSyncTimestamp: number;
}

export interface DeltaUpdatePayload {
    userId: number;
    entity: string;
    entityId: number | string;
    action: 'create' | 'update' | 'delete';
    data: Record<string, any>;
}

export interface SyncChange {
    entity: string;
    entityId: number | string;
    action: string;
    data: Record<string, any>;
    timestamp: number;
}

// Extended WebSocket interface with userId
type ExtendedWebSocket = WebSocket & {
    userId?: number;
};

// ============================================
// SYNC SERVICE CLASS
// ============================================

class SyncService {
    private wss: WebSocket.Server | null;
    private clients: Map<number, ExtendedWebSocket>;

    constructor() {
        this.wss = null;
        this.clients = new Map();
    }

    initializeWebSocketServer(server: any): void {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws: ExtendedWebSocket, req: any) => {
            console.log('[SYNC] New WebSocket connection');

            ws.on('message', (message: WebSocket.Data) => {
                this.handleMessage(ws, message.toString());
            });

            ws.on('close', () => {
                this.removeClient(ws);
            });
        });

        console.log('[SYNC] WebSocket server initialized');
    }

    handleMessage(ws: ExtendedWebSocket, message: string): void {
        try {
            const { type, payload } = JSON.parse(message) as SyncMessage;

            switch (type) {
                case 'AUTH':
                    this.authenticateClient(ws, payload.userId, payload.token);
                    break;
                case 'SYNC_REQUEST':
                    this.handleSyncRequest(ws, payload);
                    break;
                case 'DELTA_UPDATE':
                    this.handleDeltaUpdate(ws, payload);
                    break;
                default:
                    console.warn('[SYNC] Unknown message type:', type);
            }
        } catch (error: any) {
            console.error('[SYNC] Message handling error:', error);
        }
    }

    authenticateClient(ws: ExtendedWebSocket, userId: number, token: string): void {
        this.clients.set(userId, ws);
        ws.userId = userId;
        ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId }));
        console.log(`[SYNC] Client authenticated: ${userId}`);
    }

    async handleSyncRequest(ws: ExtendedWebSocket, payload: SyncRequestPayload): Promise<void> {
        try {
            const { userId, lastSyncTimestamp } = payload;
            const changes = await SyncDAO.getChangesSince(userId, lastSyncTimestamp);
            ws.send(JSON.stringify({
                type: 'SYNC_RESPONSE',
                changes,
                timestamp: Date.now()
            }));
        } catch (error: any) {
            console.error('[SYNC] Sync request error:', error);
        }
    }

    async handleDeltaUpdate(ws: ExtendedWebSocket, payload: DeltaUpdatePayload): Promise<void> {
        try {
            const { userId, entity, entityId, action, data } = payload;
            const timestamp = Date.now();

            await SyncDAO.applyChange(userId, entity, entityId, action, data, timestamp);

            this.broadcastToUser(userId, {
                type: 'DELTA_UPDATE',
                entity,
                entityId,
                action,
                data,
                timestamp
            });
        } catch (error: any) {
            console.error('[SYNC] Delta update error:', error);
        }
    }

    async getChangesSince(userId: number, timestamp: number): Promise<SyncChange[]> {
        return SyncDAO.getChangesSince(userId, timestamp);
    }

    async applyChange(
        userId: number,
        entity: string,
        entityId: number | string,
        action: string,
        data: Record<string, any>
    ): Promise<void> {
        await SyncDAO.applyChange(userId, entity, entityId, action, data, Date.now());
    }

    broadcastToUser(userId: number, message: Record<string, any>): void {
        this.clients.forEach((ws, clientUserId) => {
            if (clientUserId === userId && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }

    removeClient(ws: ExtendedWebSocket): void {
        if (ws.userId) {
            this.clients.delete(ws.userId);
            console.log(`[SYNC] Client disconnected: ${ws.userId}`);
        }
    }
}

// ============================================
// EXPORTS
// ============================================

const syncService = new SyncService();

export { SyncService };
export default syncService;

module.exports = syncService;
module.exports.SyncService = SyncService;

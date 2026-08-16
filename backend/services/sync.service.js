"use strict";
/**
 * 🔄 SYNC SERVICE - TypeScript Version
 * Sincronización cross-platform entre Web, iOS y Android
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const ws_1 = __importDefault(require("ws"));
const SyncDAO = require('../data/sync.dao.js');
// ============================================
// SYNC SERVICE CLASS
// ============================================
class SyncService {
    constructor() {
        this.wss = null;
        this.clients = new Map();
    }
    initializeWebSocketServer(server) {
        this.wss = new ws_1.default.Server({ server });
        this.wss.on('connection', (ws, req) => {
            console.log('[SYNC] New WebSocket connection');
            ws.on('message', (message) => {
                this.handleMessage(ws, message.toString());
            });
            ws.on('close', () => {
                this.removeClient(ws);
            });
        });
        console.log('[SYNC] WebSocket server initialized');
    }
    handleMessage(ws, message) {
        try {
            const { type, payload } = JSON.parse(message);
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
        }
        catch (error) {
            console.error('[SYNC] Message handling error:', error);
        }
    }
    authenticateClient(ws, userId, token) {
        this.clients.set(userId, ws);
        ws.userId = userId;
        ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId }));
        console.log(`[SYNC] Client authenticated: ${userId}`);
    }
    async handleSyncRequest(ws, payload) {
        try {
            const { userId, lastSyncTimestamp } = payload;
            const changes = await SyncDAO.getChangesSince(userId, lastSyncTimestamp);
            ws.send(JSON.stringify({
                type: 'SYNC_RESPONSE',
                changes,
                timestamp: Date.now()
            }));
        }
        catch (error) {
            console.error('[SYNC] Sync request error:', error);
        }
    }
    async handleDeltaUpdate(ws, payload) {
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
        }
        catch (error) {
            console.error('[SYNC] Delta update error:', error);
        }
    }
    async getChangesSince(userId, timestamp) {
        return SyncDAO.getChangesSince(userId, timestamp);
    }
    async applyChange(userId, entity, entityId, action, data) {
        await SyncDAO.applyChange(userId, entity, entityId, action, data, Date.now());
    }
    broadcastToUser(userId, message) {
        this.clients.forEach((ws, clientUserId) => {
            if (clientUserId === userId && ws.readyState === ws_1.default.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
    removeClient(ws) {
        if (ws.userId) {
            this.clients.delete(ws.userId);
            console.log(`[SYNC] Client disconnected: ${ws.userId}`);
        }
    }
}
exports.SyncService = SyncService;
// ============================================
// EXPORTS
// ============================================
const syncService = new SyncService();
exports.default = syncService;
module.exports = syncService;
module.exports.SyncService = SyncService;
//# sourceMappingURL=sync.service.js.map
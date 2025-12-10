/**
 * 🔄 SYNC SERVICE - TypeScript Version
 * Sincronización cross-platform entre Web, iOS y Android
 * Refactorizado: 07 Diciembre 2025
 */
import WebSocket from 'ws';
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
type ExtendedWebSocket = WebSocket & {
    userId?: number;
};
declare class SyncService {
    private wss;
    private clients;
    constructor();
    initializeWebSocketServer(server: any): void;
    handleMessage(ws: ExtendedWebSocket, message: string): void;
    authenticateClient(ws: ExtendedWebSocket, userId: number, token: string): void;
    handleSyncRequest(ws: ExtendedWebSocket, payload: SyncRequestPayload): Promise<void>;
    handleDeltaUpdate(ws: ExtendedWebSocket, payload: DeltaUpdatePayload): Promise<void>;
    getChangesSince(userId: number, timestamp: number): Promise<SyncChange[]>;
    applyChange(userId: number, entity: string, entityId: number | string, action: string, data: Record<string, any>): Promise<void>;
    broadcastToUser(userId: number, message: Record<string, any>): void;
    removeClient(ws: ExtendedWebSocket): void;
}
declare const syncService: SyncService;
export { SyncService };
export default syncService;
//# sourceMappingURL=sync.service.d.ts.map
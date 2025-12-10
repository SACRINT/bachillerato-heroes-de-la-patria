declare const _exports: SyncService;
export = _exports;
declare class SyncService {
    wss: any;
    clients: Map<any, any>;
    initializeWebSocketServer(server: any): void;
    handleMessage(ws: any, message: any): void;
    authenticateClient(ws: any, userId: any, token: any): void;
    handleSyncRequest(ws: any, payload: any): Promise<void>;
    handleDeltaUpdate(ws: any, payload: any): Promise<void>;
    getChangesSince(userId: any, timestamp: any): Promise<any>;
    applyChange(userId: any, entity: any, entityId: any, action: any, data: any): Promise<void>;
    broadcastToUser(userId: any, message: any): void;
    removeClient(ws: any): void;
}
//# sourceMappingURL=SyncService.d.ts.map
import { RoomManager } from './RoomManager';
import { COLLAB_CONFIG, ServiceError } from './config';

interface DocumentDAO {
    loadDocument(documentId: string): Promise<any>;
    persistDocument(documentId: string, state: any): Promise<any>;
}

const collaborationDAO = require('../../data/collaboration.dao') as DocumentDAO;

export class DocumentManager {
    private autoSaveIntervals = new Map<string, NodeJS.Timeout>();

    constructor(private roomManager: RoomManager) { }

    async createDocumentSession(options: any) {
        const room = await this.roomManager.createRoom({
            ...options,
            type: 'document',
            settings: {
                ...options.settings,
                documentId: options.documentId,
                autoSave: true
            }
        });

        const documentState = await this._loadDocument(options.documentId);
        const activeRoom = this.roomManager.activeRooms.get(room.roomId);
        if (activeRoom) {
            activeRoom.documentState = documentState;
        }

        this._startAutoSave(room.roomId);

        return room;
    }

    async applyOperation(roomId: string, participantId: string, operation: any) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) {
            throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }

        const { type, position, content, length } = operation;

        if (!room.documentState) {
            room.documentState = { content: '', version: 0 };
        }

        let newContent = room.documentState.content;

        switch (type) {
            case 'insert':
                newContent = newContent.slice(0, position) + content + newContent.slice(position);
                break;
            case 'delete':
                newContent = newContent.slice(0, position) + newContent.slice(position + length);
                break;
            case 'replace':
                newContent = newContent.slice(0, position) + content + newContent.slice(position + length);
                break;
        }

        room.documentState.content = newContent;
        room.documentState.version++;
        room.documentState.lastModified = new Date();
        room.documentState.lastModifiedBy = participantId;

        return {
            version: room.documentState.version,
            operation,
            participantId
        };
    }

    getDocumentState(roomId: string) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.documentState) {
            return null;
        }

        return {
            content: room.documentState.content,
            version: room.documentState.version,
            lastModified: room.documentState.lastModified
        };
    }

    async saveDocument(roomId: string) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.documentState) return;

        const documentId = room.settings.documentId;
        await this._persistDocument(documentId, room.documentState);

        console.log(`[COLLAB] Documento guardado: ${documentId}`);
    }

    stopAutoSave(roomId: string) {
        const interval = this.autoSaveIntervals.get(roomId);
        if (interval) {
            clearInterval(interval);
            this.autoSaveIntervals.delete(roomId);
        }
    }

    private async _loadDocument(documentId: string) {
        try {
            return await collaborationDAO.loadDocument(documentId);
        } catch (error) {
            console.error('[COLLAB] Error cargando documento:', error);
            return { content: '', version: 0 };
        }
    }

    private async _persistDocument(documentId: string, state: any) {
        await collaborationDAO.persistDocument(documentId, state);
    }

    private _startAutoSave(roomId: string) {
        const interval = setInterval(async () => {
            await this.saveDocument(roomId);
        }, COLLAB_CONFIG.documents.autoSaveInterval);

        this.autoSaveIntervals.set(roomId, interval);
    }
}

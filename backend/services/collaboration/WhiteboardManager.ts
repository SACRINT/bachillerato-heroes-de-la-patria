import * as crypto from 'crypto';
import { RoomManager } from './RoomManager';

export class WhiteboardManager {
    constructor(private roomManager: RoomManager) { }

    async createWhiteboardSession(options: any) {
        return this.roomManager.createRoom({
            ...options,
            type: 'whiteboard',
            settings: {
                ...options.settings,
                canvasWidth: options.canvasWidth || 1920,
                canvasHeight: options.canvasHeight || 1080
            }
        });
    }

    addElement(roomId: string, participantId: string, element: any) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) return null;

        if (!room.whiteboardElements) {
            room.whiteboardElements = [];
        }

        const newElement = {
            id: crypto.randomUUID(),
            ...element,
            createdBy: participantId,
            createdAt: new Date()
        };

        room.whiteboardElements.push(newElement);

        return newElement;
    }

    updateElement(roomId: string, elementId: string, updates: any) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.whiteboardElements) return null;

        const element = room.whiteboardElements.find(e => e.id === elementId);
        if (!element) return null;

        Object.assign(element, updates, { updatedAt: new Date() });

        return element;
    }

    removeElement(roomId: string, elementId: string) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.whiteboardElements) return;

        room.whiteboardElements = room.whiteboardElements.filter(e => e.id !== elementId);
    }

    getElements(roomId: string) {
        const room = this.roomManager.activeRooms.get(roomId);
        return room?.whiteboardElements || [];
    }

    clearWhiteboard(roomId: string) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (room) {
            room.whiteboardElements = [];
        }
    }
}

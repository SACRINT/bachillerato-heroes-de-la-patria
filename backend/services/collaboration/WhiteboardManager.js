"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhiteboardManager = void 0;
const crypto = __importStar(require("crypto"));
class WhiteboardManager {
    constructor(roomManager) {
        this.roomManager = roomManager;
    }
    async createWhiteboardSession(options) {
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
    addElement(roomId, participantId, element) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room)
            return null;
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
    updateElement(roomId, elementId, updates) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.whiteboardElements)
            return null;
        const element = room.whiteboardElements.find(e => e.id === elementId);
        if (!element)
            return null;
        Object.assign(element, updates, { updatedAt: new Date() });
        return element;
    }
    removeElement(roomId, elementId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.whiteboardElements)
            return;
        room.whiteboardElements = room.whiteboardElements.filter(e => e.id !== elementId);
    }
    getElements(roomId) {
        const room = this.roomManager.activeRooms.get(roomId);
        return room?.whiteboardElements || [];
    }
    clearWhiteboard(roomId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (room) {
            room.whiteboardElements = [];
        }
    }
}
exports.WhiteboardManager = WhiteboardManager;

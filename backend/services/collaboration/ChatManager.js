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
exports.ChatManager = void 0;
const crypto = __importStar(require("crypto"));
const config_1 = require("./config");
const collaborationDAO = require('../../data/collaboration.dao');
class ChatManager {
    constructor(roomManager) {
        this.roomManager = roomManager;
    }
    async sendMessage(roomId, participantId, content, options = {}) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) {
            throw new config_1.ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }
        const participant = room.participants.get(participantId);
        if (!participant) {
            throw new config_1.ServiceError('Participante no encontrado', 'PARTICIPANT_NOT_FOUND', 404);
        }
        if (content.length > config_1.COLLAB_CONFIG.chat.maxMessageLength) {
            throw new config_1.ServiceError('Mensaje muy largo', 'MESSAGE_TOO_LONG', 400);
        }
        const message = {
            id: crypto.randomUUID(),
            roomId,
            participantId,
            userId: participant.odafiUserId,
            content,
            type: options.type || 'text',
            replyTo: options.replyTo || null,
            timestamp: new Date(),
            edited: false
        };
        // Add to memory
        room.messages.push(message);
        if (room.messages.length > config_1.COLLAB_CONFIG.chat.maxHistorySize) {
            room.messages.shift();
        }
        // Persist
        await this._persistMessage(message);
        return message;
    }
    async getChatHistory(roomId, options = {}) {
        const { limit = 50, before = null } = options;
        const room = this.roomManager.activeRooms.get(roomId);
        // Serve from memory if available
        if (room && room.messages.length > 0) {
            let messages = room.messages;
            if (before) {
                const index = messages.findIndex(m => m.id === before);
                if (index > 0) {
                    messages = messages.slice(Math.max(0, index - limit), index);
                }
            }
            else {
                messages = messages.slice(-limit);
            }
            return messages;
        }
        // Load from DB
        try {
            return await collaborationDAO.getChatHistory(roomId, { limit, before });
        }
        catch (error) {
            console.error('[COLLAB] Error obteniendo chat:', error);
            return [];
        }
    }
    async editMessage(roomId, messageId, newContent) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (room) {
            const message = room.messages.find(m => m.id === messageId);
            if (message) {
                message.content = newContent;
                message.edited = true;
                message.editedAt = new Date();
            }
        }
        await collaborationDAO.editChatMessage(roomId, messageId, newContent);
        return { messageId, edited: true };
    }
    async deleteMessage(roomId, messageId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (room) {
            room.messages = room.messages.filter(m => m.id !== messageId);
        }
        await collaborationDAO.deleteChatMessage(roomId, messageId);
        return { messageId, deleted: true };
    }
    async _persistMessage(message) {
        await collaborationDAO.persistChatMessage(message);
    }
}
exports.ChatManager = ChatManager;

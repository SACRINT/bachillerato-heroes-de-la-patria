import * as crypto from 'crypto';
import { RoomManager } from './RoomManager';
import { COLLAB_CONFIG, ServiceError } from './config';

interface ChatDAO {
    persistChatMessage(message: any): Promise<any>;
    getChatHistory(roomId: string, options: any): Promise<any[]>;
    editChatMessage(roomId: string, messageId: string, content: string): Promise<any>;
    deleteChatMessage(roomId: string, messageId: string): Promise<any>;
}

const collaborationDAO = require('../../data/collaboration.dao') as ChatDAO;

export interface ChatMessage {
    id: string;
    roomId: string;
    participantId: string;
    userId: number | string;
    content: string;
    type: 'text' | 'file' | 'system';
    replyTo: string | null;
    timestamp: Date;
    edited: boolean;
    editedAt?: Date;
}

export class ChatManager {
    constructor(private roomManager: RoomManager) { }

    async sendMessage(roomId: string, participantId: string, content: string, options: any = {}) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) {
            throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }

        const participant = room.participants.get(participantId);
        if (!participant) {
            throw new ServiceError('Participante no encontrado', 'PARTICIPANT_NOT_FOUND', 404);
        }

        if (content.length > COLLAB_CONFIG.chat.maxMessageLength) {
            throw new ServiceError('Mensaje muy largo', 'MESSAGE_TOO_LONG', 400);
        }

        const message: ChatMessage = {
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
        if (room.messages.length > COLLAB_CONFIG.chat.maxHistorySize) {
            room.messages.shift();
        }

        // Persist
        await this._persistMessage(message);

        return message;
    }

    async getChatHistory(roomId: string, options: any = {}) {
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
            } else {
                messages = messages.slice(-limit);
            }

            return messages;
        }

        // Load from DB
        try {
            return await collaborationDAO.getChatHistory(roomId, { limit, before });
        } catch (error) {
            console.error('[COLLAB] Error obteniendo chat:', error);
            return [];
        }
    }

    async editMessage(roomId: string, messageId: string, newContent: string) {
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

    async deleteMessage(roomId: string, messageId: string) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (room) {
            room.messages = room.messages.filter(m => m.id !== messageId);
        }

        await collaborationDAO.deleteChatMessage(roomId, messageId);

        return { messageId, deleted: true };
    }

    private async _persistMessage(message: ChatMessage) {
        await collaborationDAO.persistChatMessage(message);
    }
}

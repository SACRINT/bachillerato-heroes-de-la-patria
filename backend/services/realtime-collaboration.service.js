"use strict";
/**
 * 🎥 REAL-TIME COLLABORATION SERVICE - TypeScript Version
 * Servicio de colaboración en tiempo real con video conferencing
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationServiceError = exports.DocumentCollaborationManager = exports.ChatManager = exports.VideoConferenceManager = exports.RoomManager = exports.RealTimeCollaborationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const { Pool } = require('pg');
const devLogger = require('../utils/devLogger.js');
// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    rooms: {
        maxParticipants: 20,
        defaultDuration: 3600000, // 1 hour
        types: ['video', 'audio', 'chat', 'document']
    },
    video: {
        defaultQuality: 'medium',
        maxBitrate: 2500000
    },
    documents: {
        maxSize: 10 * 1024 * 1024, // 10MB
        autoSaveInterval: 30000 // 30 seconds
    }
};
// ============================================
// SERVICE ERROR CLASS
// ============================================
class CollaborationServiceError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.CollaborationServiceError = CollaborationServiceError;
// ============================================
// ROOM MANAGER
// ============================================
class RoomManager {
    constructor(pool) {
        this.pool = pool;
        this.activeRooms = new Map();
    }
    async createRoom(options) {
        const roomId = this._generateRoomId();
        const accessCode = options.isPrivate ? this._generateAccessCode() : undefined;
        const room = {
            id: roomId,
            name: options.name,
            type: options.type,
            hostId: options.hostId,
            accessCode,
            maxParticipants: options.maxParticipants || CONFIG.rooms.maxParticipants,
            isPrivate: options.isPrivate || false,
            status: 'waiting',
            participants: [],
            createdAt: new Date()
        };
        // Persist to database
        await this.pool.query(`
            INSERT INTO collaboration_rooms (
                id, name, type, host_id, access_code, max_participants,
                is_private, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [room.id, room.name, room.type, room.hostId, room.accessCode,
            room.maxParticipants, room.isPrivate, room.status]);
        this.activeRooms.set(roomId, room);
        devLogger.log(`[COLLAB] Room created: ${roomId}`);
        return room;
    }
    async joinRoom(roomId, userId, options = {}) {
        let room = this.activeRooms.get(roomId);
        if (!room) {
            room = await this._loadRoom(roomId);
            if (!room) {
                throw new CollaborationServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
            }
        }
        if (room.participants.length >= room.maxParticipants) {
            throw new CollaborationServiceError('Sala llena', 'ROOM_FULL', 403);
        }
        const participant = {
            id: crypto_1.default.randomBytes(8).toString('hex'),
            odafiUserId: userId,
            displayName: options.displayName || `Usuario ${userId}`,
            role: room.hostId === userId ? 'host' : 'participant',
            joinedAt: new Date(),
            mediaState: {
                audioEnabled: false,
                videoEnabled: false,
                screenShareEnabled: false
            }
        };
        room.participants.push(participant);
        if (room.status === 'waiting') {
            room.status = 'active';
            await this._updateRoomStatus(roomId, 'active');
        }
        await this._logParticipant(roomId, userId, 'join');
        devLogger.log(`[COLLAB] User ${userId} joined room ${roomId}`);
        return participant;
    }
    async leaveRoom(roomId, participantId) {
        const room = this.activeRooms.get(roomId);
        if (!room)
            return;
        const index = room.participants.findIndex(p => p.id === participantId);
        if (index !== -1) {
            const participant = room.participants[index];
            participant.leftAt = new Date();
            room.participants.splice(index, 1);
            await this._logParticipant(roomId, participant.odafiUserId, 'leave');
        }
        if (room.participants.length === 0) {
            await this.closeRoom(roomId);
        }
    }
    async closeRoom(roomId) {
        const room = this.activeRooms.get(roomId);
        if (room) {
            room.status = 'ended';
            room.endedAt = new Date();
        }
        await this._updateRoomStatus(roomId, 'ended');
        this.activeRooms.delete(roomId);
        devLogger.log(`[COLLAB] Room closed: ${roomId}`);
    }
    async getRoomInfo(roomId) {
        let room = this.activeRooms.get(roomId);
        if (room)
            return room;
        return await this._loadRoom(roomId);
    }
    async getUserRooms(userId) {
        const result = await this.pool.query(`
            SELECT * FROM collaboration_rooms
            WHERE host_id = $1 AND status != 'ended'
            ORDER BY created_at DESC
        `, [userId]);
        return result.rows;
    }
    _generateRoomId() {
        return `room_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`;
    }
    _generateAccessCode() {
        return crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    }
    async _loadRoom(roomId) {
        const result = await this.pool.query('SELECT * FROM collaboration_rooms WHERE id = $1', [roomId]);
        if (result.rows.length === 0)
            return null;
        const data = result.rows[0];
        const room = {
            id: data.id,
            name: data.name,
            type: data.type,
            hostId: data.host_id,
            accessCode: data.access_code,
            maxParticipants: data.max_participants,
            isPrivate: data.is_private,
            status: data.status,
            participants: [],
            createdAt: data.created_at,
            endedAt: data.ended_at
        };
        this.activeRooms.set(roomId, room);
        return room;
    }
    async _updateRoomStatus(roomId, status) {
        await this.pool.query('UPDATE collaboration_rooms SET status = $2, updated_at = NOW() WHERE id = $1', [roomId, status]);
    }
    async _logParticipant(roomId, userId, action) {
        await this.pool.query(`
            INSERT INTO room_participant_logs (room_id, user_id, action, created_at)
            VALUES ($1, $2, $3, NOW())
        `, [roomId, userId, action]);
    }
}
exports.RoomManager = RoomManager;
// ============================================
// VIDEO CONFERENCE MANAGER
// ============================================
class VideoConferenceManager {
    constructor(roomManager) {
        this.roomManager = roomManager;
    }
    async createConference(options) {
        return await this.roomManager.createRoom({
            ...options,
            type: 'video'
        });
    }
    getWebRTCConfig() {
        return {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        };
    }
    async handleSignaling(roomId, participantId, signal) {
        const room = await this.roomManager.getRoomInfo(roomId);
        if (!room) {
            throw new CollaborationServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }
        // In a real implementation, this would forward the signal to the target participant
        devLogger.log(`[COLLAB] Signal ${signal.type} from ${participantId} in room ${roomId}`);
    }
    async updateMediaState(roomId, participantId, mediaState) {
        const room = await this.roomManager.getRoomInfo(roomId);
        if (!room)
            return;
        const participant = room.participants.find(p => p.id === participantId);
        if (participant) {
            participant.mediaState = { ...participant.mediaState, ...mediaState };
        }
    }
    async getParticipants(roomId) {
        const room = await this.roomManager.getRoomInfo(roomId);
        return room?.participants || [];
    }
}
exports.VideoConferenceManager = VideoConferenceManager;
// ============================================
// CHAT MANAGER
// ============================================
class ChatManager {
    constructor(roomManager, pool) {
        this.roomManager = roomManager;
        this.pool = pool;
    }
    async sendMessage(roomId, senderId, content, type = 'text') {
        const room = await this.roomManager.getRoomInfo(roomId);
        if (!room) {
            throw new CollaborationServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }
        const participant = room.participants.find(p => p.odafiUserId === senderId);
        const message = {
            id: `msg_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`,
            roomId,
            senderId,
            senderName: participant?.displayName || `Usuario ${senderId}`,
            content,
            type: type,
            timestamp: new Date()
        };
        await this._persistMessage(message);
        return message;
    }
    async getChatHistory(roomId, options = {}) {
        const { limit = 50, before } = options;
        let query = 'SELECT * FROM room_messages WHERE room_id = $1';
        const params = [roomId];
        if (before) {
            params.push(before);
            query += ` AND created_at < $${params.length}`;
        }
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        const result = await this.pool.query(query, params);
        return result.rows.reverse();
    }
    async editMessage(roomId, messageId, newContent) {
        await this.pool.query(`
            UPDATE room_messages SET content = $3, edited = true, updated_at = NOW()
            WHERE room_id = $1 AND id = $2
        `, [roomId, messageId, newContent]);
    }
    async deleteMessage(roomId, messageId) {
        await this.pool.query(`
            UPDATE room_messages SET deleted = true, updated_at = NOW()
            WHERE room_id = $1 AND id = $2
        `, [roomId, messageId]);
    }
    async _persistMessage(message) {
        await this.pool.query(`
            INSERT INTO room_messages (id, room_id, sender_id, sender_name, content, type, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [message.id, message.roomId, message.senderId, message.senderName,
            message.content, message.type, message.timestamp]);
    }
}
exports.ChatManager = ChatManager;
// ============================================
// DOCUMENT COLLABORATION MANAGER  
// ============================================
class DocumentCollaborationManager {
    constructor(roomManager, pool) {
        this.roomManager = roomManager;
        this.pool = pool;
        this.documentStates = new Map();
    }
    async createDocument(roomId, creatorId) {
        const docId = `doc_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`;
        const docState = {
            id: docId,
            roomId,
            content: '',
            version: 1,
            lastModifiedBy: creatorId,
            lastModifiedAt: new Date(),
            cursors: {}
        };
        await this.pool.query(`
            INSERT INTO collaboration_documents (id, room_id, content, version, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
        `, [docId, roomId, '', 1, creatorId]);
        this.documentStates.set(docId, docState);
        return docState;
    }
    async applyChanges(docId, userId, changes) {
        const docState = this.documentStates.get(docId);
        if (!docState) {
            throw new CollaborationServiceError('Documento no encontrado', 'DOC_NOT_FOUND', 404);
        }
        docState.content = changes.content;
        docState.version++;
        docState.lastModifiedBy = userId;
        docState.lastModifiedAt = new Date();
        // Persist periodically (debounced in real implementation)
        await this._persistDocument(docState);
        return docState;
    }
    async updateCursor(docId, userId, position) {
        const docState = this.documentStates.get(docId);
        if (docState) {
            docState.cursors[userId] = {
                userId,
                line: position.line,
                column: position.column,
                color: this._getUserColor(userId)
            };
        }
    }
    async getDocument(docId) {
        let docState = this.documentStates.get(docId);
        if (docState)
            return docState;
        const result = await this.pool.query('SELECT * FROM collaboration_documents WHERE id = $1', [docId]);
        if (result.rows.length === 0)
            return null;
        const data = result.rows[0];
        docState = {
            id: data.id,
            roomId: data.room_id,
            content: data.content,
            version: data.version,
            lastModifiedBy: data.last_modified_by || data.created_by,
            lastModifiedAt: data.updated_at || data.created_at,
            cursors: {}
        };
        this.documentStates.set(docId, docState);
        return docState;
    }
    async _persistDocument(docState) {
        await this.pool.query(`
            UPDATE collaboration_documents
            SET content = $2, version = $3, last_modified_by = $4, updated_at = NOW()
            WHERE id = $1
        `, [docState.id, docState.content, docState.version, docState.lastModifiedBy]);
    }
    _getUserColor(userId) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        return colors[userId % colors.length];
    }
}
exports.DocumentCollaborationManager = DocumentCollaborationManager;
// ============================================
// REAL-TIME COLLABORATION SERVICE
// ============================================
class RealTimeCollaborationService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        this.rooms = new RoomManager(this.pool);
        this.video = new VideoConferenceManager(this.rooms);
        this.chat = new ChatManager(this.rooms, this.pool);
        this.documents = new DocumentCollaborationManager(this.rooms, this.pool);
        devLogger.log('[COLLAB] Real-Time Collaboration Service initialized');
    }
    async healthCheck() {
        return {
            status: 'healthy',
            components: {
                rooms: true,
                video: true,
                chat: true,
                documents: true
            }
        };
    }
}
exports.RealTimeCollaborationService = RealTimeCollaborationService;
// ============================================
// EXPORTS
// ============================================
const realTimeCollaborationService = new RealTimeCollaborationService();
exports.default = realTimeCollaborationService;
module.exports = realTimeCollaborationService;
module.exports.RealTimeCollaborationService = RealTimeCollaborationService;
module.exports.RoomManager = RoomManager;
//# sourceMappingURL=realtime-collaboration.service.js.map
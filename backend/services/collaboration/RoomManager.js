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
exports.RoomManager = void 0;
const crypto = __importStar(require("crypto"));
const config_1 = require("./config");
const collaborationDAO = require('../../data/collaboration.dao');
class RoomManager {
    constructor() {
        this.activeRooms = new Map();
    }
    async createRoom(options) {
        const { type, name, hostId, scheduledStart, duration = config_1.COLLAB_CONFIG.rooms.defaultDuration, maxParticipants = config_1.COLLAB_CONFIG.rooms.maxParticipants, settings = {} } = options;
        const roomId = this._generateRoomId();
        const accessCode = this._generateAccessCode();
        try {
            const room = await collaborationDAO.createRoom({
                roomId, type, name, hostId, accessCode,
                scheduledStart, duration, maxParticipants, settings
            });
            // Initialize in memory
            this.activeRooms.set(roomId, {
                ...room,
                participants: new Map(),
                messages: [],
                documentState: null
            });
            console.log(`[COLLAB] Sala creada: ${roomId} (${type})`);
            return {
                roomId,
                accessCode,
                joinUrl: `/collaboration/join/${roomId}`,
                ...room
            };
        }
        catch (error) {
            console.error('[COLLAB] Error creando sala:', error);
            throw new config_1.ServiceError('Error al crear sala', 'ROOM_CREATE_ERROR');
        }
    }
    async joinRoom(roomId, userId, options = {}) {
        let activeRoom = this.activeRooms.get(roomId);
        if (!activeRoom) {
            const loaded = await this._loadRoom(roomId);
            if (!loaded) {
                throw new config_1.ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
            }
            activeRoom = this.activeRooms.get(roomId);
        }
        if (activeRoom.participants.size >= activeRoom.max_participants) {
            throw new config_1.ServiceError('Sala llena', 'ROOM_FULL', 403);
        }
        if (activeRoom.settings.requireAccessCode && options.accessCode !== activeRoom.access_code) {
            throw new config_1.ServiceError('Código de acceso inválido', 'INVALID_ACCESS_CODE', 403);
        }
        const participantId = crypto.randomUUID();
        const participant = {
            id: participantId,
            odafiUserId: userId,
            joinedAt: new Date(),
            role: userId === activeRoom.host_id ? 'host' : 'participant',
            mediaState: {
                video: options.video !== false,
                audio: options.audio !== false,
                screen: false
            }
        };
        activeRoom.participants.set(participantId, participant);
        await this._logParticipant(roomId, userId, 'join');
        if (activeRoom.status === 'created') {
            await this._updateRoomStatus(roomId, 'active');
            activeRoom.status = 'active';
        }
        console.log(`[COLLAB] Usuario ${userId} unido a sala ${roomId}`);
        return {
            participantId,
            role: participant.role,
            participants: Array.from(activeRoom.participants.values()).map(p => ({
                id: p.id,
                role: p.role,
                mediaState: p.mediaState
            })),
            settings: activeRoom.settings,
            iceServers: config_1.COLLAB_CONFIG.webrtc.iceServers
        };
    }
    async leaveRoom(roomId, participantId) {
        const room = this.activeRooms.get(roomId);
        if (!room)
            return;
        const participant = room.participants.get(participantId);
        if (!participant)
            return;
        room.participants.delete(participantId);
        await this._logParticipant(roomId, participant.odafiUserId, 'leave');
        if (room.participants.size === 0) {
            await this.closeRoom(roomId);
        }
        console.log(`[COLLAB] Participante ${participantId} salió de sala ${roomId}`);
    }
    async closeRoom(roomId) {
        const room = this.activeRooms.get(roomId);
        if (!room)
            return;
        await this._updateRoomStatus(roomId, 'closed');
        this.activeRooms.delete(roomId);
        console.log(`[COLLAB] Sala ${roomId} cerrada`);
    }
    async getRoomInfo(roomId) {
        let room = this.activeRooms.get(roomId);
        if (!room) {
            const loaded = await this._loadRoom(roomId);
            if (loaded)
                room = loaded;
        }
        if (!room) {
            throw new config_1.ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }
        return {
            roomId: room.room_id,
            type: room.type,
            name: room.name,
            status: room.status,
            participantCount: room.participants ? room.participants.size : 0,
            maxParticipants: room.max_participants,
            scheduledStart: room.scheduled_start,
            settings: room.settings
        };
    }
    async getUserRooms(userId) {
        try {
            return await collaborationDAO.getUserRooms(userId);
        }
        catch (error) {
            console.error('[COLLAB] Error obteniendo salas:', error);
            return [];
        }
    }
    _generateRoomId() {
        return `room_${crypto.randomBytes(8).toString('hex')}`;
    }
    _generateAccessCode() {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    async _loadRoom(roomId) {
        try {
            const room = await collaborationDAO.getRoomById(roomId);
            if (!room)
                return null;
            room.settings = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;
            const activeRoom = {
                ...room,
                participants: new Map(),
                messages: [],
                documentState: null
            };
            this.activeRooms.set(roomId, activeRoom);
            return activeRoom;
        }
        catch (error) {
            console.error('[COLLAB] Error cargando sala:', error);
            return null;
        }
    }
    async _updateRoomStatus(roomId, status) {
        try {
            await collaborationDAO.updateRoomStatus(roomId, status);
        }
        catch (error) {
            console.error('[COLLAB] Error actualizando status:', error);
        }
    }
    async _logParticipant(roomId, userId, action) {
        if (action === 'join') {
            await collaborationDAO.logParticipantJoin(roomId, userId);
        }
        else {
            await collaborationDAO.logParticipantLeave(roomId, userId);
        }
    }
}
exports.RoomManager = RoomManager;

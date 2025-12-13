import * as crypto from 'crypto';
import { COLLAB_CONFIG, ServiceError } from './config';

// Interface provisional DAO
interface CollaborationDAO {
    createRoom(data: any): Promise<any>;
    getRoomById(roomId: string): Promise<any>;
    getUserRooms(userId: number | string): Promise<any[]>;
    updateRoomStatus(roomId: string, status: string): Promise<any>;
    logParticipantJoin(roomId: string, userId: number | string): Promise<any>;
    logParticipantLeave(roomId: string, userId: number | string): Promise<any>;
}

const collaborationDAO = require('../../data/collaboration.dao') as CollaborationDAO;

export interface Participant {
    id: string;
    odafiUserId: number | string;
    joinedAt: Date;
    role: 'host' | 'participant';
    mediaState: {
        video: boolean;
        audio: boolean;
        screen: boolean;
    };
}

export interface RoomSettings {
    requireAccessCode?: boolean;
    videoEnabled?: boolean;
    audioEnabled?: boolean;
    screenShareEnabled?: boolean;
    recordingEnabled?: boolean;
    waitingRoom?: boolean;
    documentId?: string;
    autoSave?: boolean;
    canvasWidth?: number;
    canvasHeight?: number;
    [key: string]: any;
}

export interface ActiveRoom {
    room_id: string;
    type: string;
    name: string;
    host_id: number | string;
    access_code: string;
    scheduled_start?: Date;
    duration_ms?: number;
    max_participants: number;
    settings: RoomSettings;
    status: string;
    created_at?: Date;

    // In-memory state
    participants: Map<string, Participant>;
    messages: any[];
    documentState: any | null;
    whiteboardElements?: any[];
}

export class RoomManager {
    public activeRooms = new Map<string, ActiveRoom>();

    async createRoom(options: any) {
        const {
            type,
            name,
            hostId,
            scheduledStart,
            duration = COLLAB_CONFIG.rooms.defaultDuration,
            maxParticipants = COLLAB_CONFIG.rooms.maxParticipants,
            settings = {}
        } = options;

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
        } catch (error) {
            console.error('[COLLAB] Error creando sala:', error);
            throw new ServiceError('Error al crear sala', 'ROOM_CREATE_ERROR');
        }
    }

    async joinRoom(roomId: string, userId: number | string, options: any = {}) {
        let activeRoom = this.activeRooms.get(roomId);

        if (!activeRoom) {
            const loaded = await this._loadRoom(roomId);
            if (!loaded) {
                throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
            }
            activeRoom = this.activeRooms.get(roomId)!;
        }

        if (activeRoom.participants.size >= activeRoom.max_participants) {
            throw new ServiceError('Sala llena', 'ROOM_FULL', 403);
        }

        if (activeRoom.settings.requireAccessCode && options.accessCode !== activeRoom.access_code) {
            throw new ServiceError('Código de acceso inválido', 'INVALID_ACCESS_CODE', 403);
        }

        const participantId = crypto.randomUUID();
        const participant: Participant = {
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
            iceServers: COLLAB_CONFIG.webrtc.iceServers
        };
    }

    async leaveRoom(roomId: string, participantId: string) {
        const room = this.activeRooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(participantId);
        if (!participant) return;

        room.participants.delete(participantId);
        await this._logParticipant(roomId, participant.odafiUserId, 'leave');

        if (room.participants.size === 0) {
            await this.closeRoom(roomId);
        }

        console.log(`[COLLAB] Participante ${participantId} salió de sala ${roomId}`);
    }

    async closeRoom(roomId: string) {
        const room = this.activeRooms.get(roomId);
        if (!room) return;

        await this._updateRoomStatus(roomId, 'closed');
        this.activeRooms.delete(roomId);

        console.log(`[COLLAB] Sala ${roomId} cerrada`);
    }

    async getRoomInfo(roomId: string) {
        let room = this.activeRooms.get(roomId);

        if (!room) {
            const loaded = await this._loadRoom(roomId);
            if (loaded) room = loaded;
        }

        if (!room) {
            throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
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

    async getUserRooms(userId: number | string) {
        try {
            return await collaborationDAO.getUserRooms(userId);
        } catch (error) {
            console.error('[COLLAB] Error obteniendo salas:', error);
            return [];
        }
    }

    private _generateRoomId() {
        return `room_${crypto.randomBytes(8).toString('hex')}`;
    }

    private _generateAccessCode() {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    }

    private async _loadRoom(roomId: string): Promise<ActiveRoom | null> {
        try {
            const room = await collaborationDAO.getRoomById(roomId);
            if (!room) return null;

            room.settings = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;

            const activeRoom: ActiveRoom = {
                ...room,
                participants: new Map(),
                messages: [],
                documentState: null
            };

            this.activeRooms.set(roomId, activeRoom);
            return activeRoom;
        } catch (error) {
            console.error('[COLLAB] Error cargando sala:', error);
            return null;
        }
    }

    private async _updateRoomStatus(roomId: string, status: string) {
        try {
            await collaborationDAO.updateRoomStatus(roomId, status);
        } catch (error) {
            console.error('[COLLAB] Error actualizando status:', error);
        }
    }

    private async _logParticipant(roomId: string, userId: number | string, action: 'join' | 'leave') {
        if (action === 'join') {
            await collaborationDAO.logParticipantJoin(roomId, userId);
        } else {
            await collaborationDAO.logParticipantLeave(roomId, userId);
        }
    }
}

import { RoomManager } from './RoomManager';
import { COLLAB_CONFIG, ServiceError } from './config';

export class VideoConferenceManager {
    constructor(private roomManager: RoomManager) { }

    async createConference(options: any) {
        return this.roomManager.createRoom({
            ...options,
            type: 'video',
            settings: {
                ...options.settings,
                videoEnabled: true,
                audioEnabled: true,
                screenShareEnabled: true,
                recordingEnabled: COLLAB_CONFIG.rooms.recordingEnabled,
                waitingRoom: options.waitingRoom || false
            }
        });
    }

    getWebRTCConfig() {
        return {
            iceServers: COLLAB_CONFIG.webrtc.iceServers,
            iceCandidatePoolSize: COLLAB_CONFIG.webrtc.iceCandidatePoolSize
        };
    }

    async handleSignaling(roomId: string, participantId: string, signal: any) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) {
            throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }

        const { type, data, targetParticipantId } = signal;

        return {
            type,
            data,
            fromParticipantId: participantId,
            toParticipantId: targetParticipantId
        };
    }

    async updateMediaState(roomId: string, participantId: string, mediaState: any) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(participantId);
        if (!participant) return;

        participant.mediaState = { ...participant.mediaState, ...mediaState };

        return {
            participantId,
            mediaState: participant.mediaState
        };
    }

    getParticipants(roomId: string) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) return [];

        return Array.from(room.participants.values()).map(p => ({
            id: p.id,
            odafiUserId: p.odafiUserId,
            role: p.role,
            mediaState: p.mediaState,
            joinedAt: p.joinedAt
        }));
    }
}

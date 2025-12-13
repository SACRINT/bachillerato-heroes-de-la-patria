"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoConferenceManager = void 0;
const config_1 = require("./config");
class VideoConferenceManager {
    constructor(roomManager) {
        this.roomManager = roomManager;
    }
    async createConference(options) {
        return this.roomManager.createRoom({
            ...options,
            type: 'video',
            settings: {
                ...options.settings,
                videoEnabled: true,
                audioEnabled: true,
                screenShareEnabled: true,
                recordingEnabled: config_1.COLLAB_CONFIG.rooms.recordingEnabled,
                waitingRoom: options.waitingRoom || false
            }
        });
    }
    getWebRTCConfig() {
        return {
            iceServers: config_1.COLLAB_CONFIG.webrtc.iceServers,
            iceCandidatePoolSize: config_1.COLLAB_CONFIG.webrtc.iceCandidatePoolSize
        };
    }
    async handleSignaling(roomId, participantId, signal) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) {
            throw new config_1.ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }
        const { type, data, targetParticipantId } = signal;
        return {
            type,
            data,
            fromParticipantId: participantId,
            toParticipantId: targetParticipantId
        };
    }
    async updateMediaState(roomId, participantId, mediaState) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room)
            return;
        const participant = room.participants.get(participantId);
        if (!participant)
            return;
        participant.mediaState = { ...participant.mediaState, ...mediaState };
        return {
            participantId,
            mediaState: participant.mediaState
        };
    }
    getParticipants(roomId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room)
            return [];
        return Array.from(room.participants.values()).map(p => ({
            id: p.id,
            odafiUserId: p.odafiUserId,
            role: p.role,
            mediaState: p.mediaState,
            joinedAt: p.joinedAt
        }));
    }
}
exports.VideoConferenceManager = VideoConferenceManager;

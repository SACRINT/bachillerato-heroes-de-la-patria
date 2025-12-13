"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = exports.COLLAB_CONFIG = void 0;
exports.COLLAB_CONFIG = {
    // WebRTC configuration
    webrtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    },
    // Room configuration
    rooms: {
        maxParticipants: 50,
        defaultDuration: 60 * 60 * 1000, // 1 hour
        recordingEnabled: false
    },
    // Chat configuration
    chat: {
        maxMessageLength: 2000,
        maxHistorySize: 1000
    },
    // Document collaboration
    documents: {
        maxSize: 10 * 1024 * 1024, // 10MB
        autoSaveInterval: 30000 // 30 seconds
    }
};
class ServiceError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.ServiceError = ServiceError;

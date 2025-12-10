/**
 * 🎥 REAL-TIME COLLABORATION SERVICE - TypeScript Version
 * Servicio de colaboración en tiempo real con video conferencing
 * Refactorizado: 07 Diciembre 2025
 */
export interface RoomOptions {
    name: string;
    type: 'video' | 'audio' | 'chat' | 'document';
    hostId: number;
    maxParticipants?: number;
    isPrivate?: boolean;
    scheduledAt?: Date;
}
export interface Room {
    id: string;
    name: string;
    type: string;
    hostId: number;
    accessCode?: string;
    maxParticipants: number;
    isPrivate: boolean;
    status: 'waiting' | 'active' | 'ended';
    participants: Participant[];
    createdAt: Date;
    endedAt?: Date;
}
export interface Participant {
    id: string;
    odafiUserId: number;
    displayName: string;
    role: 'host' | 'co-host' | 'participant';
    joinedAt: Date;
    leftAt?: Date;
    mediaState: MediaState;
}
export interface MediaState {
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenShareEnabled: boolean;
}
export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: number;
    senderName: string;
    content: string;
    type: 'text' | 'file' | 'system';
    timestamp: Date;
    edited?: boolean;
    deleted?: boolean;
}
export interface DocumentState {
    id: string;
    roomId: string;
    content: string;
    version: number;
    lastModifiedBy: number;
    lastModifiedAt: Date;
    cursors: Record<number, CursorPosition>;
}
export interface CursorPosition {
    userId: number;
    line: number;
    column: number;
    color: string;
}
export interface WebRTCSignal {
    type: 'offer' | 'answer' | 'ice-candidate';
    payload: any;
    fromParticipantId: string;
    toParticipantId?: string;
}
export interface ServiceError extends Error {
    code: string;
    statusCode: number;
}
declare class CollaborationServiceError extends Error implements ServiceError {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
declare class RoomManager {
    private pool;
    private activeRooms;
    constructor(pool: any);
    createRoom(options: RoomOptions): Promise<Room>;
    joinRoom(roomId: string, userId: number, options?: {
        displayName?: string;
        role?: string;
    }): Promise<Participant>;
    leaveRoom(roomId: string, participantId: string): Promise<void>;
    closeRoom(roomId: string): Promise<void>;
    getRoomInfo(roomId: string): Promise<Room | null>;
    getUserRooms(userId: number): Promise<Room[]>;
    private _generateRoomId;
    private _generateAccessCode;
    private _loadRoom;
    private _updateRoomStatus;
    private _logParticipant;
}
declare class VideoConferenceManager {
    private roomManager;
    constructor(roomManager: RoomManager);
    createConference(options: RoomOptions): Promise<Room>;
    getWebRTCConfig(): any;
    handleSignaling(roomId: string, participantId: string, signal: WebRTCSignal): Promise<void>;
    updateMediaState(roomId: string, participantId: string, mediaState: Partial<MediaState>): Promise<void>;
    getParticipants(roomId: string): Promise<Participant[]>;
}
declare class ChatManager {
    private roomManager;
    private pool;
    constructor(roomManager: RoomManager, pool: any);
    sendMessage(roomId: string, senderId: number, content: string, type?: string): Promise<ChatMessage>;
    getChatHistory(roomId: string, options?: {
        limit?: number;
        before?: Date;
    }): Promise<ChatMessage[]>;
    editMessage(roomId: string, messageId: string, newContent: string): Promise<void>;
    deleteMessage(roomId: string, messageId: string): Promise<void>;
    private _persistMessage;
}
declare class DocumentCollaborationManager {
    private roomManager;
    private pool;
    private documentStates;
    constructor(roomManager: RoomManager, pool: any);
    createDocument(roomId: string, creatorId: number): Promise<DocumentState>;
    applyChanges(docId: string, userId: number, changes: {
        content: string;
    }): Promise<DocumentState>;
    updateCursor(docId: string, userId: number, position: {
        line: number;
        column: number;
    }): Promise<void>;
    getDocument(docId: string): Promise<DocumentState | null>;
    private _persistDocument;
    private _getUserColor;
}
declare class RealTimeCollaborationService {
    private pool;
    rooms: RoomManager;
    video: VideoConferenceManager;
    chat: ChatManager;
    documents: DocumentCollaborationManager;
    constructor();
    healthCheck(): Promise<{
        status: string;
        components: Record<string, boolean>;
    }>;
}
declare const realTimeCollaborationService: RealTimeCollaborationService;
export { RealTimeCollaborationService, RoomManager, VideoConferenceManager, ChatManager, DocumentCollaborationManager, CollaborationServiceError };
export default realTimeCollaborationService;
//# sourceMappingURL=realtime-collaboration.service.d.ts.map
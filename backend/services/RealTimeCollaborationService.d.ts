export class RealTimeCollaborationService {
    pool: any;
    roomManager: RoomManager;
    videoConference: VideoConferenceManager;
    chat: ChatManager;
    documentCollab: DocumentCollaborationManager;
    whiteboard: WhiteboardManager;
    initialized: boolean;
    /**
     * Inicializa el servicio
     */
    initialize(pool: any): Promise<void>;
    createVideoConference(options: any): Promise<any>;
    joinVideoConference(roomId: any, userId: any, options: any): Promise<{
        participantId: `${string}-${string}-${string}-${string}-${string}`;
        role: string;
        participants: {
            id: any;
            role: any;
            mediaState: any;
        }[];
        settings: any;
        iceServers: {
            urls: string;
        }[];
    }>;
    leaveVideoConference(roomId: any, participantId: any): Promise<void>;
    getWebRTCConfig(): {
        iceServers: {
            urls: string;
        }[];
        iceCandidatePoolSize: number;
    };
    handleSignaling(roomId: any, participantId: any, signal: any): Promise<{
        type: any;
        data: any;
        fromParticipantId: any;
        toParticipantId: any;
    }>;
    updateMediaState(roomId: any, participantId: any, mediaState: any): Promise<{
        participantId: any;
        mediaState: any;
    }>;
    sendChatMessage(roomId: any, participantId: any, content: any, options: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        roomId: any;
        participantId: any;
        userId: any;
        content: any;
        type: any;
        replyTo: any;
        timestamp: Date;
        edited: boolean;
    }>;
    getChatHistory(roomId: any, options: any): Promise<any>;
    editChatMessage(roomId: any, messageId: any, newContent: any): Promise<{
        messageId: any;
        edited: boolean;
    }>;
    deleteChatMessage(roomId: any, messageId: any): Promise<{
        messageId: any;
        deleted: boolean;
    }>;
    createDocumentSession(options: any): Promise<any>;
    applyDocumentOperation(roomId: any, participantId: any, operation: any): Promise<{
        version: any;
        operation: any;
        participantId: any;
    }>;
    getDocumentState(roomId: any): {
        content: any;
        version: any;
        lastModified: any;
    };
    saveDocument(roomId: any): Promise<void>;
    createWhiteboardSession(options: any): Promise<any>;
    addWhiteboardElement(roomId: any, participantId: any, element: any): any;
    updateWhiteboardElement(roomId: any, elementId: any, updates: any): any;
    removeWhiteboardElement(roomId: any, elementId: any): void;
    getWhiteboardElements(roomId: any): any;
    clearWhiteboard(roomId: any): void;
    getRoomInfo(roomId: any): Promise<{
        roomId: any;
        type: any;
        name: any;
        status: any;
        participantCount: any;
        maxParticipants: any;
        scheduledStart: any;
        settings: any;
    }>;
    getUserRooms(userId: any): Promise<any>;
    closeRoom(roomId: any): Promise<void>;
    getParticipants(roomId: any): {
        id: any;
        odafiUserId: any;
        role: any;
        mediaState: any;
        joinedAt: any;
    }[];
}
export const collaborationService: RealTimeCollaborationService;
export class ServiceError extends Error {
    constructor(message: any, code: any, statusCode?: number);
    code: any;
    statusCode: number;
}
declare class RoomManager {
    constructor(pool: any);
    pool: any;
    activeRooms: Map<any, any>;
    /**
     * Crea una sala de colaboración
     */
    createRoom(options: any): Promise<any>;
    /**
     * Une a un participante a una sala
     */
    joinRoom(roomId: any, userId: any, options?: {}): Promise<{
        participantId: `${string}-${string}-${string}-${string}-${string}`;
        role: string;
        participants: {
            id: any;
            role: any;
            mediaState: any;
        }[];
        settings: any;
        iceServers: {
            urls: string;
        }[];
    }>;
    /**
     * Remueve un participante de la sala
     */
    leaveRoom(roomId: any, participantId: any): Promise<void>;
    /**
     * Cierra una sala
     */
    closeRoom(roomId: any): Promise<void>;
    /**
     * Obtiene información de una sala
     */
    getRoomInfo(roomId: any): Promise<{
        roomId: any;
        type: any;
        name: any;
        status: any;
        participantCount: any;
        maxParticipants: any;
        scheduledStart: any;
        settings: any;
    }>;
    /**
     * Lista salas activas para un usuario
     */
    getUserRooms(userId: any): Promise<any>;
    _generateRoomId(): string;
    _generateAccessCode(): string;
    _loadRoom(roomId: any): Promise<any>;
    _updateRoomStatus(roomId: any, status: any): Promise<void>;
    _logParticipant(roomId: any, odafiUserId: any, action: any): Promise<void>;
}
declare class VideoConferenceManager {
    constructor(roomManager: any);
    roomManager: any;
    peerConnections: Map<any, any>;
    /**
     * Crea una conferencia de video
     */
    createConference(options: any): Promise<any>;
    /**
     * Obtiene configuración SDP para WebRTC
     */
    getWebRTCConfig(): {
        iceServers: {
            urls: string;
        }[];
        iceCandidatePoolSize: number;
    };
    /**
     * Procesa señalización WebRTC
     */
    handleSignaling(roomId: any, participantId: any, signal: any): Promise<{
        type: any;
        data: any;
        fromParticipantId: any;
        toParticipantId: any;
    }>;
    /**
     * Actualiza estado de media de participante
     */
    updateMediaState(roomId: any, participantId: any, mediaState: any): Promise<{
        participantId: any;
        mediaState: any;
    }>;
    /**
     * Lista participantes en conferencia
     */
    getParticipants(roomId: any): {
        id: any;
        odafiUserId: any;
        role: any;
        mediaState: any;
        joinedAt: any;
    }[];
}
declare class ChatManager {
    constructor(roomManager: any, pool: any);
    roomManager: any;
    pool: any;
    /**
     * Envía mensaje a sala
     */
    sendMessage(roomId: any, participantId: any, content: any, options?: {}): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        roomId: any;
        participantId: any;
        userId: any;
        content: any;
        type: any;
        replyTo: any;
        timestamp: Date;
        edited: boolean;
    }>;
    /**
     * Obtiene historial de chat
     */
    getChatHistory(roomId: any, options?: {}): Promise<any>;
    /**
     * Edita un mensaje
     */
    editMessage(roomId: any, messageId: any, newContent: any): Promise<{
        messageId: any;
        edited: boolean;
    }>;
    /**
     * Elimina un mensaje
     */
    deleteMessage(roomId: any, messageId: any): Promise<{
        messageId: any;
        deleted: boolean;
    }>;
    _persistMessage(message: any): Promise<void>;
}
declare class DocumentCollaborationManager {
    constructor(roomManager: any, pool: any);
    roomManager: any;
    pool: any;
    autoSaveIntervals: Map<any, any>;
    /**
     * Crea sesión de colaboración de documento
     */
    createDocumentSession(options: any): Promise<any>;
    /**
     * Aplica operación al documento
     */
    applyOperation(roomId: any, participantId: any, operation: any): Promise<{
        version: any;
        operation: any;
        participantId: any;
    }>;
    /**
     * Obtiene estado actual del documento
     */
    getDocumentState(roomId: any): {
        content: any;
        version: any;
        lastModified: any;
    };
    /**
     * Guarda documento manualmente
     */
    saveDocument(roomId: any): Promise<void>;
    _loadDocument(documentId: any): Promise<any>;
    _persistDocument(documentId: any, state: any): Promise<void>;
    _startAutoSave(roomId: any): void;
    stopAutoSave(roomId: any): void;
}
declare class WhiteboardManager {
    constructor(roomManager: any);
    roomManager: any;
    /**
     * Crea sesión de pizarra
     */
    createWhiteboardSession(options: any): Promise<any>;
    /**
     * Agrega elemento a la pizarra
     */
    addElement(roomId: any, participantId: any, element: any): any;
    /**
     * Actualiza elemento de la pizarra
     */
    updateElement(roomId: any, elementId: any, updates: any): any;
    /**
     * Elimina elemento de la pizarra
     */
    removeElement(roomId: any, elementId: any): void;
    /**
     * Obtiene todos los elementos de la pizarra
     */
    getElements(roomId: any): any;
    /**
     * Limpia la pizarra
     */
    clearWhiteboard(roomId: any): void;
}
export {};
//# sourceMappingURL=RealTimeCollaborationService.d.ts.map
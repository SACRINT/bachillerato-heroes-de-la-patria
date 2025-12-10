/**
 * 🤝 COLLABORATION DAO - TypeScript
 * Capa de acceso a datos para sistema de colaboración en tiempo real
 * Incluye: salas, participantes, chat, documentos colaborativos
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface CollaborationRoom {
    room_id: string;
    type: string;
    name: string;
    host_id: number;
    access_code?: string;
    scheduled_start?: Date;
    duration_ms?: number;
    max_participants: number;
    settings: any;
    status: string;
    created_at: Date;
    updated_at?: Date;
    participant_count?: number;
}
export interface ChatMessage {
    id: string;
    room_id: string;
    participant_id: string;
    user_id: number;
    content: string;
    type: string;
    reply_to?: string;
    timestamp: Date;
    edited?: boolean;
    edited_at?: Date;
}
export interface CollabDocument {
    content: string;
    version: number;
}
export interface RoomOptions {
    roomId: string;
    type: string;
    name: string;
    hostId: number;
    accessCode?: string;
    scheduledStart?: Date;
    duration?: number;
    maxParticipants: number;
    settings: any;
}
export interface ChatHistoryOptions {
    limit?: number;
    before?: string | Date;
}
export interface ChatMessageInput {
    id: string;
    roomId: string;
    participantId: string;
    userId: number;
    content: string;
    type: string;
    replyTo?: string;
    timestamp: Date;
}
declare class CollaborationDAO {
    static createRoom(roomData: RoomOptions): Promise<CollaborationRoom>;
    static getRoomById(roomId: string): Promise<CollaborationRoom | null>;
    static getUserRooms(userId: number): Promise<CollaborationRoom[]>;
    static updateRoomStatus(roomId: string, status: string): Promise<void>;
    static logParticipantJoin(roomId: string, userId: number): Promise<void>;
    static logParticipantLeave(roomId: string, userId: number): Promise<void>;
    static persistChatMessage(message: ChatMessageInput): Promise<void>;
    static getChatHistory(roomId: string, options?: ChatHistoryOptions): Promise<ChatMessage[]>;
    static editChatMessage(roomId: string, messageId: string, newContent: string): Promise<void>;
    static deleteChatMessage(roomId: string, messageId: string): Promise<void>;
    static loadDocument(documentId: string): Promise<CollabDocument>;
    static persistDocument(documentId: string, state: {
        content: string;
        version: number;
    }): Promise<void>;
}
export default CollaborationDAO;
//# sourceMappingURL=collaboration.dao.d.ts.map
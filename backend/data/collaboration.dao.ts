/**
 * 🤝 COLLABORATION DAO - TypeScript
 * Capa de acceso a datos para sistema de colaboración en tiempo real
 * Incluye: salas, participantes, chat, documentos colaborativos
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

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
    participant_count?: number; // Calculated field
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
    before?: string | Date; // Using timestamp or ID depending on logic? Logic seems to use timestamp from message with ID.
    // The SQL implementation takes an ID 'before' but selects timestamp from it.
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

// =====================================================
// COLLABORATION DAO CLASS
// =====================================================

class CollaborationDAO {

    // ============================================
    // ROOM QUERIES
    // ============================================

    static async createRoom(roomData: RoomOptions): Promise<CollaborationRoom> {
        const { roomId, type, name, hostId, accessCode, scheduledStart, duration, maxParticipants, settings } = roomData;

        const query = `
            INSERT INTO collaboration_rooms (
                room_id, type, name, host_id, access_code,
                scheduled_start, duration_ms, max_participants,
                settings, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'created', NOW())
            RETURNING *
        `;

        const values = [
            roomId, type, name, hostId, accessCode,
            scheduledStart, duration, maxParticipants,
            JSON.stringify(settings)
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getRoomById(roomId: string): Promise<CollaborationRoom | null> {
        const query = 'SELECT * FROM collaboration_rooms WHERE room_id = $1';
        const result = await pool.query(query, [roomId]);
        return result.rows[0] || null;
    }

    static async getUserRooms(userId: number): Promise<CollaborationRoom[]> {
        const query = `
            SELECT r.*,
                   (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id AND left_at IS NULL) as participant_count
            FROM collaboration_rooms r
            WHERE r.host_id = $1 AND r.status IN ('created', 'active')
            ORDER BY r.created_at DESC
            LIMIT 20
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    static async updateRoomStatus(roomId: string, status: string): Promise<void> {
        const query = 'UPDATE collaboration_rooms SET status = $1, updated_at = NOW() WHERE room_id = $2';
        await pool.query(query, [status, roomId]);
    }

    // ============================================
    // PARTICIPANT QUERIES
    // ============================================

    static async logParticipantJoin(roomId: string, userId: number): Promise<void> {
        const query = `
            INSERT INTO room_participants (room_id, user_id, joined_at)
            VALUES ($1, $2, NOW())
        `;
        try {
            await pool.query(query, [roomId, userId]);
        } catch (e) {
            // Ignore implicit errors like duplicate join logs if applicable, or just generic error suppression as per original code
        }
    }

    static async logParticipantLeave(roomId: string, userId: number): Promise<void> {
        const query = `
            UPDATE room_participants
            SET left_at = NOW()
            WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
        `;
        try {
            await pool.query(query, [roomId, userId]);
        } catch (e) {
            // Ignore errors
        }
    }

    // ============================================
    // CHAT QUERIES
    // ============================================

    static async persistChatMessage(message: ChatMessageInput): Promise<void> {
        const query = `
            INSERT INTO chat_messages (
                id, room_id, participant_id, user_id, content, type, reply_to, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        try {
            await pool.query(query, [
                message.id, message.roomId, message.participantId,
                message.userId, message.content, message.type,
                message.replyTo, message.timestamp
            ]);
        } catch (err) {
            console.error('[COLLAB-DAO] Error persistiendo mensaje:', err);
        }
    }

    static async getChatHistory(roomId: string, options: ChatHistoryOptions = {}): Promise<ChatMessage[]> {
        const { limit = 50, before = null } = options;

        let query = `SELECT * FROM chat_messages WHERE room_id = $1`;
        const values: any[] = [roomId];

        if (before) {
            query += ` AND timestamp < (SELECT timestamp FROM chat_messages WHERE id = $2)`;
            values.push(before);
        }

        query += ` ORDER BY timestamp DESC LIMIT $${values.length + 1}`;
        values.push(limit);

        const result = await pool.query(query, values);
        return result.rows.reverse();
    }

    static async editChatMessage(roomId: string, messageId: string, newContent: string): Promise<void> {
        const query = `
            UPDATE chat_messages
            SET content = $1, edited = true, edited_at = NOW()
            WHERE id = $2 AND room_id = $3
        `;
        try {
            await pool.query(query, [newContent, messageId, roomId]);
        } catch (e) { }
    }

    static async deleteChatMessage(roomId: string, messageId: string): Promise<void> {
        const query = 'DELETE FROM chat_messages WHERE id = $1 AND room_id = $2';
        try {
            await pool.query(query, [messageId, roomId]);
        } catch (e) { }
    }

    // ============================================
    // DOCUMENT QUERIES
    // ============================================

    static async loadDocument(documentId: string): Promise<CollabDocument> {
        const query = 'SELECT content, version FROM collaborative_documents WHERE id = $1';
        const result = await pool.query(query, [documentId]);

        if (result.rows.length > 0) {
            return {
                content: result.rows[0].content || '',
                version: result.rows[0].version || 0
            };
        }

        return { content: '', version: 0 };
    }

    static async persistDocument(documentId: string, state: { content: string; version: number }): Promise<void> {
        const query = `
            INSERT INTO collaborative_documents (id, content, version, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (id) DO UPDATE SET
                content = EXCLUDED.content,
                version = EXCLUDED.version,
                updated_at = NOW()
        `;
        try {
            await pool.query(query, [documentId, state.content, state.version]);
        } catch (err) {
            console.error('[COLLAB-DAO] Error guardando documento:', err);
        }
    }
}

export default CollaborationDAO;
module.exports = CollaborationDAO;

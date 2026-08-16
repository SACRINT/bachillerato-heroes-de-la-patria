const { pool } = require('../config/database.js');
const { debugLog } = require('../utils/debug-logger.js');

class MessagingDAO {

    /**
     * Verifica si la vista necesaria existe
     */
    async verifyViewExists() {
        const query = `
            SELECT EXISTS (
                SELECT FROM information_schema.views 
                WHERE table_schema = 'public' 
                AND table_name = 'v_user_conversations'
            ) as view_exists
        `;
        const res = await pool.query(query);
        return res.rows[0].view_exists;
    }

    /**
     * Obtiene conversaciones de un usuario con paginación
     */
    async getUserConversations(userId, role, filters = {}) {
        const { type, archived, limit, offset } = filters;

        let query = `
            SELECT * FROM v_user_conversations
            WHERE user_id = $1 AND user_role = $2
        `;
        const params = [userId, role];
        let paramIndex = 3;

        if (type) {
            query += ` AND conversation_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (archived !== undefined) {
            query += ` AND is_archived = $${paramIndex}`;
            params.push(archived === 'true');
            paramIndex++;
        }

        query += ` ORDER BY
            CASE WHEN pinned THEN 0 ELSE 1 END,
            last_message_at DESC NULLS LAST
        `;

        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const res = await pool.query(query, params);

        // Count total
        const countQuery = `
            SELECT COUNT(*) as total FROM v_user_conversations
            WHERE user_id = $1 AND user_role = $2
        `;
        const countRes = await pool.query(countQuery, [userId, role]);
        const total = parseInt(countRes.rows[0].total);

        return {
            conversations: res.rows,
            total
        };
    }

    /**
     * Verifica si un usuario es participante
     */
    async isParticipant(client, conversationId, userId, userRole) {
        // Soporta cliente transaccional o pool directo
        const db = client || pool;
        const result = await db.query(`
            SELECT id FROM conversation_participants
            WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3 AND left_at IS NULL
        `, [conversationId, userId, userRole]);

        return result.rows.length > 0;
    }

    /**
     * Crea una nueva conversación (Transaccional)
     * Debe ser llamado dentro de una transacción gestionada externamente si es parte de un flujo mayor,
     * o se le debe pasar un cliente.
     */
    async createConversation(client, { title, type, creatorId, creatorRole }) {
        const insertConvQuery = `
            INSERT INTO conversations (title, conversation_type, creator_id, creator_role)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const res = await client.query(insertConvQuery, [title, type, creatorId, creatorRole]);
        return res.rows[0];
    }

    /**
     * Agrega un participante (Transaccional)
     */
    async addParticipant(client, conversationId, participant) {
        const query = `
            INSERT INTO conversation_participants 
            (conversation_id, user_id, user_role, user_name, user_email, is_admin)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (conversation_id, user_id, user_role) DO NOTHING
        `;
        await client.query(query, [
            conversationId,
            participant.user_id,
            participant.user_role,
            participant.user_name,
            participant.user_email,
            participant.is_admin || false
        ]);
    }

    /**
     * Agrega un mensaje (Transaccional)
     */
    async addMessage(client, { conversationId, senderId, senderRole, senderName, type, content, replyToId }) {
        const query = `
            INSERT INTO messages (conversation_id, sender_id, sender_role, sender_name, message_type, content, reply_to_message_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const res = await client.query(query, [
            conversationId, senderId, senderRole, senderName, type, content, replyToId
        ]);
        return res.rows[0];
    }
}

module.exports = new MessagingDAO();

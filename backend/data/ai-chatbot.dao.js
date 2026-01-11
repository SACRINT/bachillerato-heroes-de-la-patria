"use strict";
/**
 * 💬 AI CHATBOT DAO
 * Data Access Object for Chatbot system (FAQs, History, Analytics)
 * Migrated logic from openai-service.js to DAO pattern.
 *
 * Updated: Jan 2026
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");

class AIChatbotDAO {

    // ============================================
    // FAQ MANAGEMENT
    // ============================================

    /**
     * Create a new FAQ entry
     */
    static async createFAQ(faqData) {
        const { pregunta, respuesta, categoria, idioma = 'es', activo = true } = faqData;
        const query = `
            INSERT INTO faqs_chatbot (
                pregunta, respuesta, categoria, idioma, activo, created_at
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        const rows = await (0, database_1.executeQuery)(query, [pregunta, respuesta, categoria, idioma, activo]);
        return rows[0];
    }

    /**
     * Update an existing FAQ entry
     */
    static async updateFAQ(faqId, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (['pregunta', 'respuesta', 'categoria', 'idioma', 'activo'].includes(key)) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(faqId);
        const query = `
            UPDATE faqs_chatbot
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const rows = await (0, database_1.executeQuery)(query, values);
        return rows[0] || null;
    }

    /**
     * Delete an FAQ entry
     */
    static async deleteFaq(id) {
        const query = 'DELETE FROM faqs_chatbot WHERE id = $1 RETURNING *';
        const rows = await (0, database_1.executeQuery)(query, [id]);
        return rows[0] || null;
    }

    /**
     * Get all FAQs with filters
     */
    static async getAllFAQs(filters = {}) {
        const { categoria, idioma, activo, search } = filters;
        let query = 'SELECT * FROM faqs_chatbot WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (categoria) {
            query += ` AND categoria = $${paramIndex}`;
            params.push(categoria);
            paramIndex++;
        }

        if (idioma) {
            query += ` AND idioma = $${paramIndex}`;
            params.push(idioma);
            paramIndex++;
        }

        if (activo !== undefined) {
            query += ` AND activo = $${paramIndex}`;
            params.push(activo);
            paramIndex++;
        }

        if (search) {
            query += ` AND (pregunta ILIKE $${paramIndex} OR respuesta ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';
        return await (0, database_1.executeQuery)(query, params);
    }

    /**
     * Search relevant FAQs using Full Text Search
     */
    static async searchRelevantFAQs(queryText, limit = 5) {
        const query = `
            SELECT
                pregunta,
                respuesta,
                categoria,
                ts_rank(
                    to_tsvector('spanish', pregunta || ' ' || respuesta),
                    plainto_tsquery('spanish', $1)
                ) AS rank
            FROM faqs_chatbot
            WHERE to_tsvector('spanish', pregunta || ' ' || respuesta)
                @@ plainto_tsquery('spanish', $1)
            ORDER BY rank DESC
            LIMIT $2
        `;
        return await (0, database_1.executeQuery)(query, [queryText, limit]);
    }

    /**
     * Simple keyword search for fallback response
     */
    static async searchFallbackResponse(keywordsStub, keywords) {
        // Since we can't easily pass ANY array for ILIKE in this specific helper without changing logic too much,
        // let's assume we want at least one match.
        // The original logic was: WHERE LOWER(pregunta) LIKE ANY($1)
        // PostgreSQL ANY expects an array.

        const query = `
            SELECT respuesta 
            FROM faqs_chatbot
            WHERE LOWER(pregunta) LIKE ANY($1)
            LIMIT 1
        `;
        const rows = await (0, database_1.executeQuery)(query, [keywords]);
        return rows[0] ? rows[0].respuesta : null;
    }

    // ============================================
    // HISTORY MANAGEMENT
    // ============================================

    /**
     * Save a chat message to history
     */
    static async saveChatMessage(userId, userMessage, assistantMessage, tokensUsed) {
        const query = `
            INSERT INTO chat_history (
                user_id, user_message, assistant_message, tokens_used, created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING id
        `;
        const rows = await (0, database_1.executeQuery)(query, [userId, userMessage, assistantMessage, tokensUsed]);
        return rows[0];
    }

    /**
     * Get chat history for a user
     */
    static async getChatHistory(userId, limit = 10) {
        const query = `
            SELECT
                user_message,
                assistant_message,
                created_at
            FROM chat_history
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `;
        return await (0, database_1.executeQuery)(query, [userId, limit]);
    }

    /**
     * Delete chat history for a user
     */
    static async deleteChatHistory(userId) {
        // Note: DELETE ... RETURNING returns deleted rows.
        // We want count, but executeQuery returns rows.
        const query = 'DELETE FROM chat_history WHERE user_id = $1 RETURNING id';
        const rows = await (0, database_1.executeQuery)(query, [userId]);
        return rows.length;
    }

    // ============================================
    // ANALYTICS
    // ============================================

    /**
     * Get analytics for chatbot usage
     */
    static async getChatbotAnalytics(filters = {}) {
        const { dateFrom, dateTo, userId } = filters;
        let whereClause = '1=1';
        const params = [];
        let paramIndex = 1;

        if (dateFrom) {
            whereClause += ` AND created_at >= $${paramIndex}`;
            params.push(dateFrom);
            paramIndex++;
        }

        if (dateTo) {
            whereClause += ` AND created_at <= $${paramIndex}`;
            params.push(dateTo);
            paramIndex++;
        }

        if (userId) {
            whereClause += ` AND user_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }

        const query = `
            SELECT
                COUNT(*) AS total_messages,
                COUNT(DISTINCT user_id) AS unique_users,
                SUM(tokens_used) AS total_tokens,
                AVG(tokens_used) AS avg_tokens_per_message,
                MAX(created_at) AS last_message_at
            FROM chat_history
            WHERE ${whereClause}
        `;

        const rows = await (0, database_1.executeQuery)(query, params);
        return rows[0];
    }
}

exports.default = AIChatbotDAO;
module.exports = AIChatbotDAO;
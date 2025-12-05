/**
 * 🤖 TUTOR SESSION DAO
 * Gestión de sesiones de tutoría y mensajes
 */

const { executeQuery } = require('../config/database');

class TutorSessionDAO {

    /**
     * Crear nueva sesión
     */
    static async create(data) {
        const query = `
            INSERT INTO tutor_sessions (
                user_id, subject, topic, subtopic, session_type,
                difficulty_level, target_duration, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
            RETURNING *
        `;

        const params = [
            data.user_id,
            data.subject,
            data.topic,
            data.subtopic,
            data.session_type || 'lesson',
            data.difficulty_level,
            data.target_duration || 15
        ];

        const result = await executeQuery(query, params);
        return result[0];
    }

    /**
     * Obtener sesión por ID
     */
    static async findById(id) {
        const query = `SELECT * FROM tutor_sessions WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    /**
     * Agregar mensaje a la sesión
     */
    static async addMessage(sessionId, message) {
        // message debe ser objeto { role, content, timestamp }
        const query = `
            UPDATE tutor_sessions
            SET messages = COALESCE(messages, '[]'::jsonb) || $1::jsonb,
                message_count = COALESCE(message_count, 0) + 1
            WHERE id = $2
            RETURNING *
        `;

        const result = await executeQuery(query, [JSON.stringify([message]), sessionId]);
        return result[0];
    }

    /**
     * Finalizar sesión
     */
    static async complete(sessionId, results) {
        const query = `
            UPDATE tutor_sessions
            SET status = 'completed',
                actual_duration = $1,
                quiz_score = $2,
                understanding_level = $3,
                was_helpful = $4,
                feedback_text = $5,
                ai_provider = $6,
                ai_model = $7,
                tokens_used = $8,
                iacoins_spent = $9,
                xp_earned = $10,
                coins_earned = $11,
                ended_at = NOW()
            WHERE id = $12
            RETURNING *
        `;

        const params = [
            results.actual_duration,
            results.quiz_score,
            results.understanding_level,
            results.was_helpful,
            results.feedback_text,
            results.ai_provider,
            results.ai_model,
            results.tokens_used,
            results.iacoins_spent,
            results.xp_earned,
            results.coins_earned,
            sessionId
        ];

        const result = await executeQuery(query, params);
        return result[0];
    }

    /**
     * Obtener historial de sesiones
     */
    static async getHistory(userId, filters = {}, limit = 20, offset = 0) {
        let query = `SELECT * FROM tutor_sessions WHERE user_id = $1`;
        const params = [userId];
        let paramIndex = 2;

        if (filters.subject) {
            query += ` AND subject = $${paramIndex++}`;
            params.push(filters.subject);
        }

        if (filters.status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }

        query += ` ORDER BY started_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Obtener estadísticas para dificultad adaptativa
     */
    static async getStatsForAdaptiveDifficulty(userId, subject) {
        const query = `
            SELECT
                AVG(quiz_score) as avg_score,
                COUNT(*) as session_count
            FROM tutor_sessions
            WHERE user_id = $1 AND subject = $2 AND status = 'completed' AND quiz_score IS NOT NULL
        `;
        const result = await executeQuery(query, [userId, subject]);
        return result[0];
    }
}

module.exports = TutorSessionDAO;

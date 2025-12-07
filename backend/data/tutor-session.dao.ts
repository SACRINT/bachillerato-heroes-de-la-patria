/**
 * 🤖 TUTOR SESSION DAO - TypeScript
 * Gestión de sesiones de tutoría y mensajes
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface TutorSession {
    id: number;
    user_id: number;
    subject: string;
    topic: string;
    subtopic: string | null;
    session_type: string;
    difficulty_level: string;
    target_duration: number;
    status: string;
    actual_duration?: number;
    quiz_score?: number;
    understanding_level?: number;
    was_helpful?: boolean;
    feedback_text?: string;
    ai_provider?: string;
    ai_model?: string;
    tokens_used?: number;
    iacoins_spent?: number;
    xp_earned?: number;
    coins_earned?: number;
    messages?: any; // JSON
    message_count?: number;
    started_at: Date;
    ended_at?: Date;
}

export interface CreateSessionInput {
    user_id: number;
    subject: string;
    topic: string;
    subtopic?: string;
    session_type?: string;
    difficulty_level: string;
    target_duration?: number;
}

export interface SessionMessage {
    role: string;
    content: string;
    timestamp: Date;
}

export interface SessionResults {
    actual_duration: number;
    quiz_score: number;
    understanding_level: number;
    was_helpful: boolean;
    feedback_text: string;
    ai_provider: string;
    ai_model: string;
    tokens_used: number;
    iacoins_spent: number;
    xp_earned: number;
    coins_earned: number;
}

export interface SessionFilter {
    subject?: string;
    status?: string;
}

export interface AdaptiveDifficultyStats {
    avg_score: number;
    session_count: number;
}

// =====================================================
// TUTOR SESSION DAO CLASS
// =====================================================

class TutorSessionDAO {

    /**
     * Crear nueva sesión
     */
    static async create(data: CreateSessionInput): Promise<TutorSession> {
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
            data.subtopic || null,
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
    static async findById(id: number): Promise<TutorSession | null> {
        const query = `SELECT * FROM tutor_sessions WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    /**
     * Agregar mensaje a la sesión
     */
    static async addMessage(sessionId: number, message: SessionMessage): Promise<TutorSession> {
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
    static async complete(sessionId: number, results: SessionResults): Promise<TutorSession> {
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
    static async getHistory(userId: number, filters: SessionFilter = {}, limit: number = 20, offset: number = 0): Promise<TutorSession[]> {
        let query = `SELECT * FROM tutor_sessions WHERE user_id = $1`;
        const params: any[] = [userId];
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
    static async getStatsForAdaptiveDifficulty(userId: number, subject: string): Promise<AdaptiveDifficultyStats | null> {
        const query = `
            SELECT
                AVG(quiz_score) as avg_score,
                COUNT(*) as session_count
            FROM tutor_sessions
            WHERE user_id = $1 AND subject = $2 AND status = 'completed' AND quiz_score IS NOT NULL
        `;
        const result = await executeQuery(query, [userId, subject]);
        if (!result[0]) return null;

        return {
            avg_score: parseFloat(result[0].avg_score) || 0,
            session_count: parseInt(result[0].session_count) || 0
        };
    }
}

export default TutorSessionDAO;
module.exports = TutorSessionDAO;

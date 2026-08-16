const { executeQuery } = require('../config/database.js');

class MicrolearningService {

    /**
     * Obtiene la siguiente lección recomendada para el usuario
     * Prioriza lecciones no vistas del mismo topic o random si no hay contexto
     */
    async getNextLesson(userId, topicId = null) {
        let query = `
            SELECT l.* 
            FROM micro_lessons l
            LEFT JOIN micro_lesson_progress p ON l.id = p.lesson_id AND p.user_id = $1
            WHERE p.id IS NULL
        `;
        const params = [userId];

        if (topicId) {
            query += ` AND l.topic_id = $2`;
            params.push(topicId);
        }

        // Ordenar por complejidad o aleatorio (simple heuristic)
        query += ` ORDER BY l.id ASC LIMIT 1`;

        const res = await executeQuery(query, params);

        if (res.length === 0) {
            // Si no hay nuevas, devolver alguna aleatoria ya vista o null
            // Un fallback simple
            return null;
        }

        return res[0];
    }

    /**
     * Obtiene una lista de lecciones para "Swipe Learning" (Feed)
     */
    async getLessonFeed(userId, limit = 5) {
        // Trae un mix de lecciones nuevas
        const query = `
            SELECT l.* 
            FROM micro_lessons l
            LEFT JOIN micro_lesson_progress p ON l.id = p.lesson_id AND p.user_id = $1
            WHERE p.id IS NULL
            ORDER BY RANDOM()
            LIMIT $2
        `;
        return await executeQuery(query, [userId, limit]);
    }

    /**
     * Registra o actualiza el progreso
     */
    async updateProgress(userId, lessonId, status, progressVal, timeSpent) {
        // Upsert progress
        const existing = await executeQuery(
            'SELECT id FROM micro_lesson_progress WHERE user_id = $1 AND lesson_id = $2',
            [userId, lessonId]
        );

        if (existing.length > 0) {
            await executeQuery(`
                UPDATE micro_lesson_progress 
                SET status = $1, progress_percent = $2, time_spent_seconds = time_spent_seconds + $3, last_accessed_at = NOW(),
                completed_at = (CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END)
                WHERE user_id = $4 AND lesson_id = $5
            `, [status, progressVal, timeSpent, userId, lessonId]);
        } else {
            await executeQuery(`
                INSERT INTO micro_lesson_progress 
                (user_id, lesson_id, status, progress_percent, time_spent_seconds, last_accessed_at, completed_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), (CASE WHEN $3 = 'completed' THEN NOW() ELSE NULL END))
            `, [userId, lessonId, status, progressVal, timeSpent]);
        }
        return { success: true };
    }
}

module.exports = new MicrolearningService();

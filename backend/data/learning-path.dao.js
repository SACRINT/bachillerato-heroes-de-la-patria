/**
 * 🛣️ LEARNING PATH DAO
 * Gestión de rutas de aprendizaje
 */

const { executeQuery } = require('../config/database');

class LearningPathDAO {

    /**
     * Listar rutas disponibles
     */
    static async findAll(filters = {}, limit = 20, offset = 0) {
        let query = `SELECT * FROM tutor_learning_paths WHERE is_active = true`;
        const params = [];
        let paramIndex = 1;

        if (filters.subject) {
            query += ` AND subject = $${paramIndex++}`;
            params.push(filters.subject);
        }

        if (filters.difficulty) {
            query += ` AND difficulty = $${paramIndex++}`;
            params.push(filters.difficulty);
        }

        if (filters.featured) {
            query += ` AND is_featured = true`;
        }

        query += ` ORDER BY is_featured DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Obtener ruta por ID
     */
    static async findById(id) {
        const query = `SELECT * FROM tutor_learning_paths WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    /**
     * Obtener progreso de usuario en una ruta
     */
    static async getProgress(userId, pathId) {
        const query = `
            SELECT * FROM tutor_path_progress
            WHERE user_id = $1 AND path_id = $2
        `;
        const result = await executeQuery(query, [userId, pathId]);
        return result[0];
    }

    /**
     * Iniciar o actualizar progreso
     */
    static async upsertProgress(data) {
        const query = `
            INSERT INTO tutor_path_progress (
                user_id, path_id, status, current_module, current_topic,
                completed_topics, progress_percent, time_spent,
                sessions_completed, last_activity_at, completed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
            ON CONFLICT (user_id, path_id) DO UPDATE SET
                status = EXCLUDED.status,
                current_module = EXCLUDED.current_module,
                current_topic = EXCLUDED.current_topic,
                completed_topics = EXCLUDED.completed_topics,
                progress_percent = EXCLUDED.progress_percent,
                time_spent = tutor_path_progress.time_spent + EXCLUDED.time_spent,
                sessions_completed = tutor_path_progress.sessions_completed + EXCLUDED.sessions_completed,
                last_activity_at = NOW(),
                completed_at = EXCLUDED.completed_at
            RETURNING *
        `;

        const params = [
            data.user_id, data.path_id, data.status,
            data.current_module, data.current_topic,
            JSON.stringify(data.completed_topics || []),
            data.progress_percent, data.time_spent || 0,
            data.sessions_completed || 0,
            data.completed_at || null
        ];

        const result = await executeQuery(query, params);
        return result[0];
    }

    /**
     * Obtener rutas activas del usuario
     */
    static async getUserPaths(userId) {
        const query = `
            SELECT
                p.*,
                lp.title,
                lp.subject,
                lp.estimated_hours
            FROM tutor_path_progress p
            JOIN tutor_learning_paths lp ON p.path_id = lp.id
            WHERE p.user_id = $1
            ORDER BY p.last_activity_at DESC
        `;
        return executeQuery(query, [userId]);
    }
}

module.exports = LearningPathDAO;

/**
 * 🎬 VIDEO LEARNING SERVICE
 * Propósito: Gestionar la plataforma de video interactivo (Fase 5 - Semana 34)
 */

const { executeQuery } = require('../config/database');

class VideoLearningService {

    // --- VIDEO METADATA ---

    async getAllVideos(limit = 20, offset = 0) {
        return await executeQuery('SELECT * FROM video_metadata ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    }

    async getVideoById(videoId, userId) {
        // Obtenemos metadata básica
        const videoRes = await executeQuery('SELECT * FROM video_metadata WHERE id = $1', [videoId]);
        if (videoRes.length === 0) return null;
        const video = videoRes[0];

        // Obtenemos interacciones
        const interactions = await executeQuery(
            'SELECT * FROM video_interactions WHERE video_id = $1 ORDER BY timestamp_seconds ASC',
            [videoId]
        );

        // Obtenemos captions
        const captions = await executeQuery(
            'SELECT * FROM video_captions WHERE video_id = $1',
            [videoId]
        );

        // Obtenemos progreso del usuario si existe
        let progress = null;
        if (userId) {
            const progressRes = await executeQuery(
                'SELECT * FROM video_user_progress WHERE video_id = $1 AND user_id = $2',
                [videoId, userId]
            );
            progress = progressRes.length > 0 ? progressRes[0] : null;
        }

        // Obtenemos bookmarks del usuario
        let bookmarks = [];
        if (userId) {
            bookmarks = await executeQuery(
                'SELECT * FROM video_bookmarks WHERE video_id = $1 AND user_id = $2 ORDER BY timestamp_seconds ASC',
                [videoId, userId]
            );
        }

        return {
            ...video,
            interactions,
            captions,
            userProgress: progress,
            userBookmarks: bookmarks
        };
    }

    // --- PROGRESS & BOOKMARKS ---

    async updateProgress(userId, videoId, positionSeconds, isCompleted = false) {
        // Upsert progress
        // Nota: En PG < 9.5 no supports ON CONFLICT, pero estamos usando Neon (PG moderno).
        // Usaremos sintaxis standard PG INSERT ON CONFLICT
        const query = `
            INSERT INTO video_user_progress (user_id, video_id, last_position_seconds, completed, max_position_seconds, updated_at)
            VALUES ($1, $2, $3, $4, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, video_id) 
            DO UPDATE SET 
                last_position_seconds = EXCLUDED.last_position_seconds,
                completed = video_user_progress.completed OR EXCLUDED.completed,
                max_position_seconds = GREATEST(video_user_progress.max_position_seconds, EXCLUDED.last_position_seconds),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await executeQuery(query, [userId, videoId, positionSeconds, isCompleted]);
        return result[0];
    }

    async addBookmark(userId, videoId, timestamp, note) {
        const query = `
            INSERT INTO video_bookmarks (user_id, video_id, timestamp_seconds, note)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await executeQuery(query, [userId, videoId, timestamp, note]);
        return result[0];
    }

    async removeBookmark(userId, bookmarkId) {
        await executeQuery('DELETE FROM video_bookmarks WHERE id = $1 AND user_id = $2', [bookmarkId, userId]);
    }
}

module.exports = new VideoLearningService();

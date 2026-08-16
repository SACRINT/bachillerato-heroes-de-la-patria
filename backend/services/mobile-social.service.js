const { executeQuery } = require('../config/database.js');

class MobileSocialService {

    /**
     * Crea una nueva historia
     */
    async createStory(userId, mediaUrl, mediaType, caption, achievementId = null) {
        const query = `
            INSERT INTO social_stories (user_id, media_url, media_type, caption, related_achievement_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at, expires_at
        `;
        const res = await executeQuery(query, [userId, mediaUrl, mediaType, caption, achievementId]);
        return res[0];
    }

    /**
     * Obtiene el feed de historias activas (no expiradas)
     * Por ahora trae todas las activas, en futuro filtrar por amigos
     */
    async getStoriesFeed(currentUserId) {
        const query = `
            SELECT s.*, u.nombre as user_name, u.avatar_url as user_avatar,
                   (SELECT COUNT(*) FROM story_reactions r WHERE r.story_id = s.id) as reaction_count,
                   EXISTS(SELECT 1 FROM story_reactions r WHERE r.story_id = s.id AND r.user_id = $1) as has_reacted
            FROM social_stories s
            JOIN usuarios u ON s.user_id = u.id
            WHERE s.expires_at > NOW()
            ORDER BY s.created_at DESC
            LIMIT 20
        `;
        return await executeQuery(query, [currentUserId]);
    }

    /**
     * Reaccionar a una historia
     */
    async reactToStory(userId, storyId, reactionType) {
        // Upsert reaction
        const query = `
            INSERT INTO story_reactions (story_id, user_id, reaction_type)
            VALUES ($1, $2, $3)
            ON CONFLICT (story_id, user_id) 
            DO UPDATE SET reaction_type = $3, created_at = NOW()
            RETURNING id
        `;
        return await executeQuery(query, [storyId, userId, reactionType]);
    }

    /**
     * Iniciar una sala de estudio
     */
    async createStudyRoom(userId, topic, description) {
        const query = `
            INSERT INTO study_rooms (host_user_id, topic, description, status)
            VALUES ($1, $2, $3, 'active')
            RETURNING id, topic, started_at
        `;
        const res = await executeQuery(query, [userId, topic, description]);
        return res[0];
    }

    /**
     * Listar salas de estudio activas
     */
    async getActiveStudyRooms() {
        const query = `
            SELECT r.*, u.nombre as host_name, u.avatar_url as host_avatar
            FROM study_rooms r
            JOIN usuarios u ON r.host_user_id = u.id
            WHERE r.status = 'active'
            ORDER BY r.active_viewers DESC
        `;
        return await executeQuery(query);
    }
}

module.exports = new MobileSocialService();

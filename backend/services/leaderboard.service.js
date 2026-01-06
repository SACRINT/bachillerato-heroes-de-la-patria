const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class LeaderboardService {

    /**
     * Obtiene el Top Global con Avatar y Perfil
     */
    async getGlobalLeaderboard(limit = 20) {
        const query = `
            SELECT 
                u.id, u.username, u.role,
                COALESCE(ulp.current_level, 1) as level,
                COALESCE(ulp.current_xp, 0) as xp,
                COALESCE(ulp.level_title, 'Novato') as title,
                
                -- Avatar (Join dinámico para evitar nulos)
                uac.background_url,
                COALESCE(base.image_url, '/assets/avatars/base_novice.png') as avatar_url,
                frame.image_url as frame_url,
                
                -- Rank calculation handled by backend or frontend index
                ROW_NUMBER() OVER (ORDER BY COALESCE(ulp.current_xp, 0) DESC) as rank
                
            FROM usuarios u
            LEFT JOIN user_level_progress ulp ON u.id = ulp.user_id
            LEFT JOIN user_avatar_config uac ON u.id = uac.user_id
            LEFT JOIN avatar_items base ON uac.current_base_id = base.id
            LEFT JOIN avatar_items frame ON uac.current_frame_id = frame.id
            
            WHERE u.activo = true AND u.role = 'estudiante' -- Solo estudiantes compiten ranking ppal
            ORDER BY xp DESC
            LIMIT $1
        `;

        const res = await pool.query(query, [limit]);
        return res.rows;
    }

    /**
     * Obtiene Top Streak (Rachas)
     */
    async getStreakLeaderboard(limit = 10) {
        const query = `
            SELECT 
                u.id, u.username,
                s.current_streak,
                COALESCE(base.image_url, '/assets/avatars/base_novice.png') as avatar_url
            FROM streaks s
            JOIN usuarios u ON s.user_id = u.id
            LEFT JOIN user_avatar_config uac ON u.id = uac.user_id
            LEFT JOIN avatar_items base ON uac.current_base_id = base.id
            WHERE u.activo = true
            ORDER BY s.current_streak DESC
            LIMIT $1
        `;
        const res = await pool.query(query, [limit]);
        return res.rows;
    }

    /**
     * Obtiene el rango del usuario relativo a sus amigos/nivel (contextual)
     * Por ahora, simplificamos a rango global y los 2 arriba/abajo
     */
    async getUserContextRank(userId) {
        // ... Logica compleja para "neighbors" ...
        // Simplificado para MVP Fase 2
        return [];
    }
}

module.exports = new LeaderboardService();

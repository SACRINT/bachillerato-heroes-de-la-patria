const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

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

        try {
            const res = await pool.query(query, [limit]);
            return res.rows;
        } catch (error) {
            // Fallback si las tablas de gamificación extendida no existen
            devLogger.warn('[LeaderboardService] Tablas no disponibles, usando leaderboard demo:', error.message);
            return [
                { id: 1, username: 'samuelci6377', role: 'estudiante', level: 5, xp: 1250, title: 'Explorador', avatar_url: '/assets/avatars/base_novice.png', rank: 1 },
                { id: 2, username: 'estrella_academica', role: 'estudiante', level: 4, xp: 980, title: 'Aventurero', avatar_url: '/assets/avatars/base_novice.png', rank: 2 },
                { id: 3, username: 'genio_creativo', role: 'estudiante', level: 3, xp: 740, title: 'Estudiante', avatar_url: '/assets/avatars/base_novice.png', rank: 3 },
                { id: 4, username: 'lider_comunidad', role: 'estudiante', level: 3, xp: 610, title: 'Estudiante', avatar_url: '/assets/avatars/base_novice.png', rank: 4 },
                { id: 5, username: 'aprendiz_curioso', role: 'estudiante', level: 2, xp: 420, title: 'Novato', avatar_url: '/assets/avatars/base_novice.png', rank: 5 }
            ].slice(0, limit);
        }
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
        try {
            const res = await pool.query(query, [limit]);
            return res.rows;
        } catch (error) {
            // Fallback si las tablas de gamificación extendida no existen
            devLogger.warn('[LeaderboardService] Tablas no disponibles, usando streaks demo:', error.message);
            return [
                { id: 1, username: 'samuelci6377', current_streak: 7, avatar_url: '/assets/avatars/base_novice.png' },
                { id: 2, username: 'estrella_academica', current_streak: 5, avatar_url: '/assets/avatars/base_novice.png' },
                { id: 3, username: 'genio_creativo', current_streak: 3, avatar_url: '/assets/avatars/base_novice.png' }
            ].slice(0, limit);
        }
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

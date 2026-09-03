const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

class ProfileService {

    /**
     * Obtiene el perfil completo de usuario por Username.
     * Incluye: Info básica, Perfil extendido, Nivel, Racha, Avatar.
     */
    async getProfileByUsername(username) {
        // Asumiendo que existe columna 'username' en usuarios
        const query = `
            SELECT 
                u.id, u.username, u.nombre, u.apellido_paterno, u.role as tipo_usuario, COALESCE(u.created_at, NOW()) as joined_at,
                p.bio, p.location, p.website, p.social_links, p.interests,
                p.privacy_show_email, p.privacy_show_activity, p.privacy_show_achievements,
                
                -- Level Info
                COALESCE(ulp.current_level, 1) as level,
                COALESCE(ulp.level_title, 'Novato') as level_title,
                
                -- Streak Info
                COALESCE(s.current_streak, 0) as streak,
                
                -- Avatar Info
                base.image_url as avatar_base,
                frame.image_url as avatar_frame,
                bg.image_url as avatar_bg,
                acc.image_url as avatar_acc
                
            FROM usuarios u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN user_level_progress ulp ON u.id = ulp.user_id
            LEFT JOIN streaks s ON u.id = s.user_id
            LEFT JOIN user_avatar_config uac ON u.id = uac.user_id
            LEFT JOIN avatar_items base ON uac.current_base_id = base.id
            LEFT JOIN avatar_items frame ON uac.current_frame_id = frame.id
            LEFT JOIN avatar_items bg ON uac.current_background_id = bg.id
            LEFT JOIN avatar_items acc ON uac.current_accessory_id = acc.id
            
            WHERE u.username = $1 AND u.activo = true
        `;

        try {
            const res = await pool.query(query, [username]);
            if (res.rows.length === 0) return null;
            return res.rows[0];
        } catch (error) {
            // Fallback si las tablas no existen (gamificación extendida no migrada)
            devLogger.warn('[ProfileService] Tablas no disponibles, usando perfil demo:', error.message);
            return {
                id: 1,
                username,
                nombre: 'Usuario Demo',
                apellido_paterno: '',
                tipo_usuario: 'estudiante',
                joined_at: new Date().toISOString(),
                bio: 'Explorador de la comunidad BGE',
                location: '',
                website: '',
                social_links: {},
                interests: ['educación', 'tecnología'],
                privacy_show_email: false,
                privacy_show_activity: true,
                privacy_show_achievements: true,
                level: 1,
                level_title: 'Novato',
                streak: 0,
                avatar_base: '/assets/avatars/base_novice.png',
                avatar_frame: null,
                avatar_bg: null,
                avatar_acc: null
            };
        }
    }

    /**
     * Helper para obtener por ID (para edición propia)
     */
    async getProfileById(userId) {
        const query = `
            SELECT 
                u.id, u.username, u.nombre, u.email,
                p.*
            FROM usuarios u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id = $1
        `;
        const res = await pool.query(query, [userId]);
        return res.rows[0];
    }

    /**
     * Actualiza el perfil extendido
     */
    async updateProfile(userId, data) {
        const { bio, location, website, social_links, interests, privacy } = data;

        // Upsert simple
        const query = `
            INSERT INTO user_profiles (user_id, bio, location, website, social_links, interests, privacy_show_email, privacy_show_activity, privacy_show_achievements)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id) DO UPDATE SET
                bio = EXCLUDED.bio,
                location = EXCLUDED.location,
                website = EXCLUDED.website,
                social_links = EXCLUDED.social_links,
                interests = EXCLUDED.interests,
                privacy_show_email = EXCLUDED.privacy_show_email,
                privacy_show_activity = EXCLUDED.privacy_show_activity,
                privacy_show_achievements = EXCLUDED.privacy_show_achievements,
                updated_at = NOW()
            RETURNING *
        `;

        const res = await pool.query(query, [
            userId,
            bio || '',
            location || '',
            website || '',
            JSON.stringify(social_links || {}),
            JSON.stringify(interests || []),
            privacy?.show_email ?? false,
            privacy?.show_activity ?? true,
            privacy?.show_achievements ?? true
        ]);

        return res.rows[0];
    }
}

module.exports = new ProfileService();

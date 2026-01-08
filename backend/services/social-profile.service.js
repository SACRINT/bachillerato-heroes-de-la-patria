const { executeQuery } = require('../config/database');

class SocialProfileService {

    // Obtener Perfil Completo
    async getProfile(userId, viewerId = null) {
        // Obtener datos base y extendidos
        const query = `
            SELECT u.nombre, u.email, u.avatar_url, sp.*,
            (SELECT COUNT(*) FROM friendships WHERE (requester_id = u.id OR recipient_id = u.id) AND status = 'accepted') as friends_count
            FROM usuarios u
            LEFT JOIN social_profiles sp ON u.id = sp.user_id
            WHERE u.id = $1
        `;
        const profiles = await executeQuery(query, [userId]);

        if (profiles.length === 0) throw new Error('Usuario no encontrado');

        const profile = profiles[0];

        // Verificar privacidad (si no es el mismo usuario)
        if (userId !== viewerId && !profile.is_public) {
            // Verificar si son amigos
            const isFriend = await this._checkFriendship(userId, viewerId);
            if (!isFriend) throw new Error('Perfil privado');
        }

        // Obtener Portafolio
        profile.portfolio = await executeQuery('SELECT * FROM user_portfolios WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

        return profile;
    }

    // Actualizar Perfil
    async updateProfile(userId, data) {
        // Upsert profile
        const query = `
            INSERT INTO social_profiles (user_id, bio, location, interests, skills, theme_color)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id) 
            DO UPDATE SET bio = $2, location = $3, interests = $4, skills = $5, theme_color = $6, updated_at = NOW()
            RETURNING *
        `;
        return await executeQuery(query, [
            userId,
            data.bio,
            data.location,
            data.interests || [],
            data.skills || [],
            data.theme_color
        ]);
    }

    // Agregar Item al Portafolio
    async addPortfolioItem(userId, itemData) {
        const query = `
            INSERT INTO user_portfolios (user_id, title, description, image_url, project_url, tags)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        return await executeQuery(query, [
            userId,
            itemData.title,
            itemData.description,
            itemData.image_url,
            itemData.project_url,
            itemData.tags || []
        ]);
    }

    // Gestionar Amistad (Enviar/Aceptar solicitud)
    async manageFriendship(requesterId, recipientId, action) {
        if (action === 'request') {
            await executeQuery(
                'INSERT INTO friendships (requester_id, recipient_id, status) VALUES ($1, $2, \'pending\') ON CONFLICT DO NOTHING',
                [requesterId, recipientId]
            );
        } else if (action === 'accept') {
            await executeQuery(
                'UPDATE friendships SET status = \'accepted\', updated_at = NOW() WHERE requester_id = $2 AND recipient_id = $1 AND status = \'pending\'',
                [requesterId, recipientId] // requesterId is actually the current user accepting
            );
        }
    }

    async _checkFriendship(user1, user2) {
        if (!user2) return false;
        const res = await executeQuery(
            'SELECT 1 FROM friendships WHERE ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)) AND status = \'accepted\'',
            [user1, user2]
        );
        return res.length > 0;
    }
}

module.exports = new SocialProfileService();

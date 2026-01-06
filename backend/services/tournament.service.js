const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class TournamentService {

    /**
     * Obtener torneos activos o próximos
     */
    async getActiveTournaments(userId) {
        const query = `
            SELECT t.*,
                   (CASE WHEN tp.user_id IS NOT NULL THEN true ELSE false END) as is_participant,
                   tp.current_score as my_score
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id AND tp.user_id = $1
            WHERE t.status IN ('active', 'upcoming')
            ORDER BY t.end_date ASC
        `;
        const res = await pool.query(query, [userId]);
        return res.rows;
    }

    /**
     * Unirse a un torneo
     */
    async joinTournament(userId, tournamentId) {
        const tQuery = `SELECT * FROM tournaments WHERE id = $1`;
        const tRes = await pool.query(tQuery, [tournamentId]);

        if (tRes.rows.length === 0) throw new Error('Torneo no encontrado');
        const tournament = tRes.rows[0];

        if (tournament.status !== 'active' && tournament.status !== 'upcoming') {
            throw new Error('El torneo no está abierto para inscripciones');
        }

        // Insert participant
        const joinQuery = `
            INSERT INTO tournament_participants (tournament_id, user_id, joined_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (tournament_id, user_id) DO NOTHING
            RETURNING *
        `;
        const res = await pool.query(joinQuery, [tournamentId, userId]);
        return { success: true, message: 'Inscrito exitosamente' };
    }

    /**
     * Obtener Leaderboard de un Torneo
     */
    async getTournamentLeaderboard(tournamentId, limit = 50) {
        const query = `
            SELECT tp.user_id, tp.current_score,
                   u.username, u.role,
                   COALESCE(base.image_url, '/assets/avatars/base_novice.png') as avatar_url,
                   ROW_NUMBER() OVER (ORDER BY tp.current_score DESC) as rank
            FROM tournament_participants tp
            JOIN usuarios u ON tp.user_id = u.id
            LEFT JOIN user_avatar_config uac ON u.id = uac.user_id
            LEFT JOIN avatar_items base ON uac.current_base_id = base.id
            WHERE tp.tournament_id = $1
            ORDER BY tp.current_score DESC
            LIMIT $2
        `;
        const res = await pool.query(query, [tournamentId, limit]);
        return res.rows;
    }

    /**
     * Actualizar puntaje de torneo (Internal Use)
     * Llamar cuando el usuario gana XP si el scoring_type es 'xp_gained'
     */
    async updateTournamentScore(userId, scoreDelta, type = 'xp_gained') {
        try {
            // Buscar torneos activos donde el user participe y el tipo coincida
            const query = `
                UPDATE tournament_participants
                SET current_score = current_score + $2, last_updated_at = NOW()
                FROM tournaments t
                WHERE tournament_participants.tournament_id = t.id
                AND t.status = 'active'
                AND t.scoring_type = $3
                AND tournament_participants.user_id = $1
            `;
            await pool.query(query, [userId, scoreDelta, type]);
        } catch (error) {
            devLogger.error('[TournamentService] Error updating score', error);
        }
    }
}

module.exports = new TournamentService();

"use strict";
/**
 * 🏆 TOURNAMENT DAO - TypeScript
 * Data Access Object para sistema de torneos
 * Abstrae todas las queries SQL de TournamentsService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// TOURNAMENT DAO CLASS
// =====================================================
class TournamentDAO {
    // ==========================================
    // TORNEOS
    // ==========================================
    static async createTournament(data) {
        const { name, slug, description, tournamentType, format, subject, topics, minParticipants, maxParticipants, teamSize, registrationStart, registrationEnd, startDate, endDate, minLevel, entryFeeCoins, prizePoolCoins, prizePoolXp, prizes, rules, scoringSystem, settings, createdBy } = data;
        const result = await database_1.pool.query(`
            INSERT INTO tournaments (
                name, slug, description, tournament_type, format, subject, topics,
                min_participants, max_participants, team_size, is_team_tournament,
                registration_start, registration_end, start_date, end_date, min_level,
                entry_fee_coins, prize_pool_coins, prize_pool_xp, prizes, rules,
                scoring_system, settings, created_by, status
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,'draft')
            RETURNING *
        `, [
            name, slug, description, tournamentType, format || 'bracket', subject,
            JSON.stringify(topics || []), minParticipants || 2, maxParticipants || 100,
            teamSize || 1, (teamSize || 1) > 1, registrationStart, registrationEnd,
            startDate, endDate, minLevel || 1, entryFeeCoins || 0, prizePoolCoins || 0,
            prizePoolXp || 0, JSON.stringify(prizes || []), rules,
            JSON.stringify(scoringSystem || {}), JSON.stringify(settings || {}), createdBy
        ]);
        return result.rows[0];
    }
    static async getTournaments(whereClause, params, limit, offset) {
        params.push(limit, offset);
        const result = await database_1.pool.query(`
            SELECT *, (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = tournaments.id) as current_participants
            FROM tournaments ${whereClause}
            ORDER BY CASE status WHEN 'registration' THEN 1 WHEN 'active' THEN 2 WHEN 'draft' THEN 3 ELSE 4 END, start_date ASC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);
        return result.rows;
    }
    static async getTournamentById(tournamentId) {
        const result = await database_1.pool.query(`
            SELECT t.*, (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as current_participants,
                   (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = t.id) as total_matches
            FROM tournaments t WHERE t.id = $1
        `, [tournamentId]);
        return result.rows[0] || null;
    }
    static async getUserParticipation(tournamentId, userId) {
        const result = await database_1.pool.query(`SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2`, [tournamentId, userId]);
        return result.rows[0] || null;
    }
    static async updateStatus(tournamentId, newStatus) {
        const result = await database_1.pool.query(`UPDATE tournaments SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`, [tournamentId, newStatus]);
        return result.rows[0];
    }
    // ==========================================
    // PARTICIPACIÓN (con transacciones)
    // ==========================================
    static async getTournamentForRegister(client, tournamentId) {
        const result = await client.query(`SELECT * FROM tournaments WHERE id = $1`, [tournamentId]);
        return result.rows[0];
    }
    static async getParticipantCount(client, tournamentId) {
        const result = await client.query(`SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1`, [tournamentId]);
        return parseInt(result.rows[0].count);
    }
    static async getUserLevel(client, userId) {
        const result = await client.query(`SELECT COALESCE((SELECT current_level FROM user_levels WHERE user_id = $1), 1) as level`, [userId]);
        return parseInt(result.rows[0].level);
    }
    static async getWalletBalance(client, userId) {
        const result = await client.query(`SELECT balance FROM iacoins_wallets WHERE user_id = $1`, [userId]);
        return parseFloat(result.rows[0]?.balance) || 0;
    }
    static async deductBalance(client, userId, amount) {
        await client.query(`UPDATE iacoins_wallets SET balance = balance - $2, updated_at = NOW() WHERE user_id = $1`, [userId, amount]);
    }
    static async createTransaction(client, userId, amount, description) {
        await client.query(`INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description) VALUES ($1, 'spent', $2, $3)`, [userId, amount, description]);
    }
    static async registerParticipant(client, tournamentId, userId, entryPaid) {
        const result = await client.query(`
            INSERT INTO tournament_participants (tournament_id, user_id, status, entry_paid, paid_at)
            VALUES ($1, $2, 'registered', $3, $4) RETURNING *
        `, [tournamentId, userId, entryPaid, entryPaid ? new Date() : null]);
        return result.rows[0];
    }
    static async incrementParticipantCount(client, tournamentId) {
        await client.query(`UPDATE tournaments SET participant_count = participant_count + 1 WHERE id = $1`, [tournamentId]);
    }
    static async withdrawParticipant(client, tournamentId, userId) {
        const result = await client.query(`UPDATE tournament_participants SET status = 'withdrawn' WHERE tournament_id = $1 AND user_id = $2 RETURNING *`, [tournamentId, userId]);
        return result.rows[0];
    }
    static async decrementParticipantCount(client, tournamentId) {
        await client.query(`UPDATE tournaments SET participant_count = GREATEST(0, participant_count - 1) WHERE id = $1`, [tournamentId]);
    }
    static async getParticipants(tournamentId, whereClause, params, limit, offset) {
        params.push(limit, offset);
        const result = await database_1.pool.query(`
            SELECT p.*, u.nombre, u.apellido_paterno, u.email
            FROM tournament_participants p JOIN usuarios u ON p.user_id = u.id
            ${whereClause} ORDER BY p.points DESC, p.wins DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);
        return result.rows;
    }
    // ==========================================
    // BRACKETS Y MATCHES
    // ==========================================
    static async getRegisteredParticipants(client, tournamentId) {
        const result = await client.query(`SELECT * FROM tournament_participants WHERE tournament_id = $1 AND status = 'registered' ORDER BY RANDOM()`, [tournamentId]);
        return result.rows;
    }
    static async createRound(client, tournamentId, roundNumber, name, status) {
        await client.query(`INSERT INTO tournament_rounds (tournament_id, round_number, name, status) VALUES ($1, $2, $3, $4)`, [tournamentId, roundNumber, name, status]);
    }
    static async getFirstRound(client, tournamentId) {
        const result = await client.query(`SELECT id FROM tournament_rounds WHERE tournament_id = $1 AND round_number = 1`, [tournamentId]);
        return result.rows[0];
    }
    static async createMatch(client, tournamentId, roundId, p1Id, p2Id, matchNumber) {
        await client.query(`INSERT INTO tournament_matches (tournament_id, round_id, participant1_id, participant2_id, match_number, status) VALUES ($1, $2, $3, $4, $5, 'scheduled')`, [tournamentId, roundId, p1Id, p2Id, matchNumber]);
    }
    static async setSeed(client, participantId, seed) {
        await client.query(`UPDATE tournament_participants SET seed = $1 WHERE id = $2`, [seed, participantId]);
    }
    static async activateParticipants(client, tournamentId) {
        await client.query(`UPDATE tournament_participants SET status = 'active', confirmed_at = NOW() WHERE tournament_id = $1 AND status = 'registered'`, [tournamentId]);
    }
    static async getMatches(tournamentId, whereClause, params, limit, offset) {
        params.push(limit, offset);
        const result = await database_1.pool.query(`
            SELECT m.*, p1.user_id as user1_id, p2.user_id as user2_id, u1.nombre as user1_nombre, u2.nombre as user2_nombre
            FROM tournament_matches m
            LEFT JOIN tournament_participants p1 ON m.participant1_id = p1.id
            LEFT JOIN tournament_participants p2 ON m.participant2_id = p2.id
            LEFT JOIN usuarios u1 ON p1.user_id = u1.id
            LEFT JOIN usuarios u2 ON p2.user_id = u2.id
            ${whereClause} ORDER BY m.round_id, m.match_number LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);
        return result.rows;
    }
    static async startMatch(matchId) {
        const result = await database_1.pool.query(`UPDATE tournament_matches SET status = 'live', started_at = NOW() WHERE id = $1 RETURNING *`, [matchId]);
        return result.rows[0];
    }
    static async getMatchParticipant(client, matchId, which) {
        const field = which === 1 ? 'participant1_id' : 'participant2_id';
        const result = await client.query(`SELECT ${field} FROM tournament_matches WHERE id = $1`, [matchId]);
        return result.rows[0]?.[field];
    }
    static async recordMatchResult(client, matchId, score1, score2, winnerId, isDraw, responses, duration) {
        const result = await client.query(`
            UPDATE tournament_matches SET status = 'completed', score1 = $2, score2 = $3, winner_participant_id = $4,
                is_draw = $5, responses = $6, duration_seconds = $7, ended_at = NOW() WHERE id = $1 RETURNING *
        `, [matchId, score1, score2, winnerId, isDraw, JSON.stringify(responses || []), duration]);
        return result.rows[0];
    }
    static async updateParticipantStats(client, participantId, won, lost, draw, score) {
        await client.query(`
            UPDATE tournament_participants SET matches_played = matches_played + 1, wins = wins + $2, losses = losses + $3,
                draws = draws + $4, total_score = total_score + $5, points = points + $6,
                status = CASE WHEN $3 = 1 THEN 'eliminated' ELSE status END,
                eliminated_at = CASE WHEN $3 = 1 THEN NOW() ELSE eliminated_at END
            WHERE id = $1
        `, [participantId, won ? 1 : 0, lost ? 1 : 0, draw ? 1 : 0, score || 0, won ? 3 : (draw ? 1 : 0)]);
    }
    // ==========================================
    // LEADERBOARD Y PREMIOS
    // ==========================================
    static async getLeaderboard(tournamentId, limit) {
        const result = await database_1.pool.query(`
            SELECT p.user_id, u.nombre, u.apellido_paterno, p.wins, p.losses, p.draws, p.points, p.total_score,
                   p.matches_played, p.status, p.final_rank, RANK() OVER (ORDER BY p.points DESC, p.total_score DESC) as current_rank
            FROM tournament_participants p JOIN usuarios u ON p.user_id = u.id
            WHERE p.tournament_id = $1 ORDER BY p.points DESC, p.total_score DESC LIMIT $2
        `, [tournamentId, limit]);
        return result.rows.map((row) => ({
            ...row,
            wins: parseInt(row.wins),
            losses: parseInt(row.losses),
            draws: parseInt(row.draws),
            points: parseInt(row.points),
            total_score: parseInt(row.total_score),
            matches_played: parseInt(row.matches_played),
            current_rank: parseInt(row.current_rank),
            final_rank: row.final_rank ? parseInt(row.final_rank) : undefined
        }));
    }
    static async getRankings(client, tournamentId) {
        const result = await client.query(`
            SELECT user_id, wins, losses, points, total_score, matches_played, RANK() OVER (ORDER BY points DESC, total_score DESC) as rank
            FROM tournament_participants WHERE tournament_id = $1 ORDER BY rank
        `, [tournamentId]);
        return result.rows.map((row) => ({
            ...row,
            wins: parseInt(row.wins),
            losses: parseInt(row.losses),
            points: parseInt(row.points),
            total_score: parseInt(row.total_score),
            matches_played: parseInt(row.matches_played),
            rank: parseInt(row.rank)
        }));
    }
    static async upsertLeaderboard(client, tournamentId, row) {
        await client.query(`
            INSERT INTO tournament_leaderboards (tournament_id, user_id, rank, points, wins, losses, score, matches_played, avg_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (tournament_id, user_id) DO UPDATE SET previous_rank = tournament_leaderboards.rank,
                rank = $3, points = $4, wins = $5, losses = $6, score = $7, matches_played = $8, avg_score = $9, updated_at = NOW()
        `, [tournamentId, row.user_id, row.rank, row.points, row.wins, row.losses, row.total_score, row.matches_played,
            row.matches_played > 0 ? row.total_score / row.matches_played : 0]);
    }
    static async awardPrize(client, tournamentId, userId, rank, coins, xp, badgeId) {
        await client.query(`UPDATE tournament_participants SET final_rank = $1, prize_won_coins = $2, prize_won_xp = $3, badge_won_id = $4 WHERE tournament_id = $5 AND user_id = $6`, [rank, coins || 0, xp || 0, badgeId, tournamentId, userId]);
    }
    static async creditWallet(client, userId, amount) {
        await client.query(`UPDATE iacoins_wallets SET balance = balance + $2, total_earned = total_earned + $2 WHERE user_id = $1`, [userId, amount]);
    }
    static async createEarnTransaction(client, userId, amount, description) {
        await client.query(`INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description) VALUES ($1, 'earned', $2, $3)`, [userId, amount, description]);
    }
    static async addXP(client, userId, xp) {
        await client.query(`UPDATE user_levels SET current_xp = current_xp + $2 WHERE user_id = $1`, [userId, xp]);
    }
    static async upsertHistory(client, userId, tournamentId, rank, points, score, coins, xp, matches, wins, losses) {
        await client.query(`
            INSERT INTO tournament_history (user_id, tournament_id, final_rank, total_points, total_score, coins_won, xp_won, matches_played, wins, losses)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (user_id, tournament_id) DO UPDATE SET final_rank = $3, coins_won = $6, xp_won = $7
        `, [userId, tournamentId, rank, points, score, coins || 0, xp || 0, matches, wins, losses]);
    }
    static async completeTournament(client, tournamentId) {
        await client.query(`UPDATE tournaments SET status = 'completed', updated_at = NOW() WHERE id = $1`, [tournamentId]);
    }
    // ==========================================
    // HISTORIAL Y ESTADÍSTICAS
    // ==========================================
    static async getUserHistory(userId, limit, offset) {
        const result = await database_1.pool.query(`
            SELECT h.*, t.name, t.tournament_type, t.subject FROM tournament_history h
            JOIN tournaments t ON h.tournament_id = t.id WHERE h.user_id = $1 ORDER BY h.completed_at DESC LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
        return result.rows;
    }
    static async getUserStats(userId) {
        const result = await database_1.pool.query(`
            SELECT COUNT(*) as total_tournaments, SUM(wins) as total_wins, SUM(losses) as total_losses,
                   SUM(coins_won) as total_coins_won, SUM(xp_won) as total_xp_won,
                   AVG(final_rank) FILTER (WHERE final_rank IS NOT NULL) as avg_rank
            FROM tournament_history WHERE user_id = $1
        `, [userId]);
        const row = result.rows[0];
        return {
            total_tournaments: parseInt(row.total_tournaments),
            total_wins: parseInt(row.total_wins),
            total_losses: parseInt(row.total_losses),
            total_coins_won: parseInt(row.total_coins_won),
            total_xp_won: parseInt(row.total_xp_won),
            avg_rank: parseFloat(row.avg_rank)
        };
    }
    static async getUserActiveTournaments(userId) {
        const result = await database_1.pool.query(`
            SELECT t.*, p.status as participation_status, p.points, p.wins
            FROM tournament_participants p JOIN tournaments t ON p.tournament_id = t.id
            WHERE p.user_id = $1 AND t.status IN ('registration', 'active') ORDER BY t.start_date
        `, [userId]);
        return result.rows.map((row) => ({
            ...row,
            points: parseInt(row.points),
            wins: parseInt(row.wins)
        }));
    }
    static async getUserAchievements(userId) {
        const result = await database_1.pool.query(`
            SELECT a.*, ta.earned_at FROM tournament_achievements a
            JOIN user_tournament_achievements ta ON a.id = ta.achievement_id
            WHERE ta.user_id = $1 ORDER BY ta.earned_at DESC
        `, [userId]);
        return result.rows;
    }
    static async getConnection() {
        return database_1.pool.connect();
    }
}
exports.default = TournamentDAO;
module.exports = TournamentDAO;
//# sourceMappingURL=tournament.dao.js.map
/**
 * 🏆 TOURNAMENT DAO - TypeScript
 * Data Access Object para sistema de torneos
 * Abstrae todas las queries SQL de TournamentsService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface Tournament {
    id: number;
    name: string;
    slug: string;
    description: string;
    tournament_type: string;
    format: string;
    subject: string;
    topics: any; // JSON
    min_participants: number;
    max_participants: number;
    team_size: number;
    is_team_tournament: boolean;
    registration_start: Date;
    registration_end: Date;
    start_date: Date;
    end_date: Date;
    min_level: number;
    entry_fee_coins: number;
    prize_pool_coins: number;
    prize_pool_xp: number;
    prizes: any; // JSON
    rules: string;
    scoring_system: any; // JSON
    settings: any; // JSON
    created_by: number;
    status: string;
    participant_count: number;
    created_at: Date;
    updated_at: Date;
    // Calculated
    current_participants?: number;
    total_matches?: number;
    participation_status?: string;
    points?: number;
    wins?: number;
}

export interface TournamentParticipant {
    id: number;
    tournament_id: number;
    user_id: number;
    status: string;
    entry_paid: boolean;
    paid_at?: Date;
    matches_played: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    total_score: number;
    final_rank?: number;
    eliminated_at?: Date;
    prize_won_coins?: number;
    prize_won_xp?: number;
    badge_won_id?: number;
    created_at: Date;
    updated_at: Date;
    // Joined
    nombre?: string;
    apellido_paterno?: string;
    email?: string;
    current_rank?: number;
}

export interface TournamentMatch {
    id: number;
    tournament_id: number;
    round_id: number;
    participant1_id: number;
    participant2_id: number;
    match_number: number;
    status: string;
    score1: number;
    score2: number;
    winner_participant_id?: number;
    is_draw: boolean;
    responses?: any; // JSON
    duration_seconds?: number;
    started_at?: Date;
    ended_at?: Date;
    created_at: Date;
    // Joined
    user1_id?: number;
    user2_id?: number;
    user1_nombre?: number;
    user2_nombre?: number;
}

export interface TournamentRound {
    id: number;
    tournament_id: number;
    round_number: number;
    name: string;
    status: string;
    created_at: Date;
}

export interface LeaderboardEntry {
    user_id: number;
    nombre: string;
    apellido_paterno: string;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    total_score: number;
    matches_played: number;
    status: string;
    final_rank?: number;
    current_rank?: number;
    avg_score?: number;
    rank?: number; // Depending on query
}

export interface CreateTournamentInput {
    name: string;
    slug: string;
    description: string;
    tournamentType: string;
    format: string;
    subject: string;
    topics: string[];
    minParticipants: number;
    maxParticipants: number;
    teamSize: number;
    registrationStart: Date;
    registrationEnd: Date;
    startDate: Date;
    endDate: Date;
    minLevel: number;
    entryFeeCoins: number;
    prizePoolCoins: number;
    prizePoolXp: number;
    prizes: any[];
    rules: string;
    scoringSystem: any;
    settings: any;
    createdBy: number;
}

// =====================================================
// TOURNAMENT DAO CLASS
// =====================================================

class TournamentDAO {

    // ==========================================
    // TORNEOS
    // ==========================================

    static async createTournament(data: CreateTournamentInput): Promise<Tournament> {
        const {
            name, slug, description, tournamentType, format, subject, topics,
            minParticipants, maxParticipants, teamSize, registrationStart,
            registrationEnd, startDate, endDate, minLevel, entryFeeCoins,
            prizePoolCoins, prizePoolXp, prizes, rules, scoringSystem, settings, createdBy
        } = data;

        const result = await pool.query(`
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

    static async getTournaments(whereClause: string, params: any[], limit: number, offset: number): Promise<Tournament[]> {
        params.push(limit, offset);
        const result = await pool.query(`
            SELECT *, (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = tournaments.id) as current_participants
            FROM tournaments ${whereClause}
            ORDER BY CASE status WHEN 'registration' THEN 1 WHEN 'active' THEN 2 WHEN 'draft' THEN 3 ELSE 4 END, start_date ASC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);
        return result.rows;
    }

    static async getTournamentById(tournamentId: number): Promise<Tournament | null> {
        const result = await pool.query(`
            SELECT t.*, (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as current_participants,
                   (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = t.id) as total_matches
            FROM tournaments t WHERE t.id = $1
        `, [tournamentId]);
        return result.rows[0] || null;
    }

    static async getUserParticipation(tournamentId: number, userId: number): Promise<TournamentParticipant | null> {
        const result = await pool.query(`SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2`, [tournamentId, userId]);
        return result.rows[0] || null;
    }

    static async updateStatus(tournamentId: number, newStatus: string): Promise<Tournament> {
        const result = await pool.query(`UPDATE tournaments SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`, [tournamentId, newStatus]);
        return result.rows[0];
    }

    // ==========================================
    // PARTICIPACIÓN (con transacciones)
    // ==========================================

    static async getTournamentForRegister(client: any, tournamentId: number): Promise<Tournament> {
        const result = await client.query(`SELECT * FROM tournaments WHERE id = $1`, [tournamentId]);
        return result.rows[0];
    }

    static async getParticipantCount(client: any, tournamentId: number): Promise<number> {
        const result = await client.query(`SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1`, [tournamentId]);
        return parseInt(result.rows[0].count);
    }

    static async getUserLevel(client: any, userId: number): Promise<number> {
        const result = await client.query(`SELECT COALESCE((SELECT current_level FROM user_levels WHERE user_id = $1), 1) as level`, [userId]);
        return parseInt(result.rows[0].level);
    }

    static async getWalletBalance(client: any, userId: number): Promise<number> {
        const result = await client.query(`SELECT balance FROM iacoins_wallets WHERE user_id = $1`, [userId]);
        return parseFloat(result.rows[0]?.balance) || 0;
    }

    static async deductBalance(client: any, userId: number, amount: number): Promise<void> {
        await client.query(`UPDATE iacoins_wallets SET balance = balance - $2, updated_at = NOW() WHERE user_id = $1`, [userId, amount]);
    }

    static async createTransaction(client: any, userId: number, amount: number, description: string): Promise<void> {
        await client.query(`INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description) VALUES ($1, 'spent', $2, $3)`, [userId, amount, description]);
    }

    static async registerParticipant(client: any, tournamentId: number, userId: number, entryPaid: boolean): Promise<TournamentParticipant> {
        const result = await client.query(`
            INSERT INTO tournament_participants (tournament_id, user_id, status, entry_paid, paid_at)
            VALUES ($1, $2, 'registered', $3, $4) RETURNING *
        `, [tournamentId, userId, entryPaid, entryPaid ? new Date() : null]);
        return result.rows[0];
    }

    static async incrementParticipantCount(client: any, tournamentId: number): Promise<void> {
        await client.query(`UPDATE tournaments SET participant_count = participant_count + 1 WHERE id = $1`, [tournamentId]);
    }

    static async withdrawParticipant(client: any, tournamentId: number, userId: number): Promise<TournamentParticipant> {
        const result = await client.query(`UPDATE tournament_participants SET status = 'withdrawn' WHERE tournament_id = $1 AND user_id = $2 RETURNING *`, [tournamentId, userId]);
        return result.rows[0];
    }

    static async decrementParticipantCount(client: any, tournamentId: number): Promise<void> {
        await client.query(`UPDATE tournaments SET participant_count = GREATEST(0, participant_count - 1) WHERE id = $1`, [tournamentId]);
    }

    static async getParticipants(tournamentId: number, whereClause: string, params: any[], limit: number, offset: number): Promise<TournamentParticipant[]> {
        params.push(limit, offset);
        const result = await pool.query(`
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

    static async getRegisteredParticipants(client: any, tournamentId: number): Promise<TournamentParticipant[]> {
        const result = await client.query(`SELECT * FROM tournament_participants WHERE tournament_id = $1 AND status = 'registered' ORDER BY RANDOM()`, [tournamentId]);
        return result.rows;
    }

    static async createRound(client: any, tournamentId: number, roundNumber: number, name: string, status: string): Promise<void> {
        await client.query(`INSERT INTO tournament_rounds (tournament_id, round_number, name, status) VALUES ($1, $2, $3, $4)`, [tournamentId, roundNumber, name, status]);
    }

    static async getFirstRound(client: any, tournamentId: number): Promise<TournamentRound | undefined> {
        const result = await client.query(`SELECT id FROM tournament_rounds WHERE tournament_id = $1 AND round_number = 1`, [tournamentId]);
        return result.rows[0];
    }

    static async createMatch(client: any, tournamentId: number, roundId: number, p1Id: number | null, p2Id: number | null, matchNumber: number): Promise<void> {
        await client.query(`INSERT INTO tournament_matches (tournament_id, round_id, participant1_id, participant2_id, match_number, status) VALUES ($1, $2, $3, $4, $5, 'scheduled')`, [tournamentId, roundId, p1Id, p2Id, matchNumber]);
    }

    static async setSeed(client: any, participantId: number, seed: number): Promise<void> {
        await client.query(`UPDATE tournament_participants SET seed = $1 WHERE id = $2`, [seed, participantId]);
    }

    static async activateParticipants(client: any, tournamentId: number): Promise<void> {
        await client.query(`UPDATE tournament_participants SET status = 'active', confirmed_at = NOW() WHERE tournament_id = $1 AND status = 'registered'`, [tournamentId]);
    }

    static async getMatches(tournamentId: number, whereClause: string, params: any[], limit: number, offset: number): Promise<TournamentMatch[]> {
        params.push(limit, offset);
        const result = await pool.query(`
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

    static async startMatch(matchId: number): Promise<TournamentMatch> {
        const result = await pool.query(`UPDATE tournament_matches SET status = 'live', started_at = NOW() WHERE id = $1 RETURNING *`, [matchId]);
        return result.rows[0];
    }

    static async getMatchParticipant(client: any, matchId: number, which: 1 | 2): Promise<number | undefined> {
        if (which === 1) {
            const result = await client.query('SELECT participant1_id FROM tournament_matches WHERE id = $1', [matchId]);
            return result.rows[0]?.participant1_id;
        } else {
            const result = await client.query('SELECT participant2_id FROM tournament_matches WHERE id = $1', [matchId]);
            return result.rows[0]?.participant2_id;
        }
    }

    static async recordMatchResult(client: any, matchId: number, score1: number, score2: number, winnerId: number | null, isDraw: boolean, responses: any, duration: number): Promise<TournamentMatch> {
        const result = await client.query(`
            UPDATE tournament_matches SET status = 'completed', score1 = $2, score2 = $3, winner_participant_id = $4,
                is_draw = $5, responses = $6, duration_seconds = $7, ended_at = NOW() WHERE id = $1 RETURNING *
        `, [matchId, score1, score2, winnerId, isDraw, JSON.stringify(responses || []), duration]);
        return result.rows[0];
    }

    static async updateParticipantStats(client: any, participantId: number, won: boolean, lost: boolean, draw: boolean, score: number): Promise<void> {
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

    static async getLeaderboard(tournamentId: number, limit: number): Promise<LeaderboardEntry[]> {
        const result = await pool.query(`
            SELECT p.user_id, u.nombre, u.apellido_paterno, p.wins, p.losses, p.draws, p.points, p.total_score,
                   p.matches_played, p.status, p.final_rank, RANK() OVER (ORDER BY p.points DESC, p.total_score DESC) as current_rank
            FROM tournament_participants p JOIN usuarios u ON p.user_id = u.id
            WHERE p.tournament_id = $1 ORDER BY p.points DESC, p.total_score DESC LIMIT $2
        `, [tournamentId, limit]);
        return result.rows.map((row: any) => ({
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

    static async getRankings(client: any, tournamentId: number): Promise<LeaderboardEntry[]> {
        const result = await client.query(`
            SELECT user_id, wins, losses, points, total_score, matches_played, RANK() OVER (ORDER BY points DESC, total_score DESC) as rank
            FROM tournament_participants WHERE tournament_id = $1 ORDER BY rank
        `, [tournamentId]);
        return result.rows.map((row: any) => ({
            ...row,
            wins: parseInt(row.wins),
            losses: parseInt(row.losses),
            points: parseInt(row.points),
            total_score: parseInt(row.total_score),
            matches_played: parseInt(row.matches_played),
            rank: parseInt(row.rank)
        }));
    }

    static async upsertLeaderboard(client: any, tournamentId: number, row: LeaderboardEntry): Promise<void> {
        await client.query(`
            INSERT INTO tournament_leaderboards (tournament_id, user_id, rank, points, wins, losses, score, matches_played, avg_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (tournament_id, user_id) DO UPDATE SET previous_rank = tournament_leaderboards.rank,
                rank = $3, points = $4, wins = $5, losses = $6, score = $7, matches_played = $8, avg_score = $9, updated_at = NOW()
        `, [tournamentId, row.user_id, row.rank, row.points, row.wins, row.losses, row.total_score, row.matches_played,
            row.matches_played > 0 ? row.total_score / row.matches_played : 0]);
    }

    static async awardPrize(client: any, tournamentId: number, userId: number, rank: number, coins: number, xp: number, badgeId: number | null): Promise<void> {
        await client.query(`UPDATE tournament_participants SET final_rank = $1, prize_won_coins = $2, prize_won_xp = $3, badge_won_id = $4 WHERE tournament_id = $5 AND user_id = $6`,
            [rank, coins || 0, xp || 0, badgeId, tournamentId, userId]);
    }

    static async creditWallet(client: any, userId: number, amount: number): Promise<void> {
        await client.query(`UPDATE iacoins_wallets SET balance = balance + $2, total_earned = total_earned + $2 WHERE user_id = $1`, [userId, amount]);
    }

    static async createEarnTransaction(client: any, userId: number, amount: number, description: string): Promise<void> {
        await client.query(`INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description) VALUES ($1, 'earned', $2, $3)`, [userId, amount, description]);
    }

    static async addXP(client: any, userId: number, xp: number): Promise<void> {
        await client.query(`UPDATE user_levels SET current_xp = current_xp + $2 WHERE user_id = $1`, [userId, xp]);
    }

    static async upsertHistory(client: any, userId: number, tournamentId: number, rank: number, points: number, score: number, coins: number, xp: number, matches: number, wins: number, losses: number): Promise<void> {
        await client.query(`
            INSERT INTO tournament_history (user_id, tournament_id, final_rank, total_points, total_score, coins_won, xp_won, matches_played, wins, losses)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (user_id, tournament_id) DO UPDATE SET final_rank = $3, coins_won = $6, xp_won = $7
        `, [userId, tournamentId, rank, points, score, coins || 0, xp || 0, matches, wins, losses]);
    }

    static async completeTournament(client: any, tournamentId: number): Promise<void> {
        await client.query(`UPDATE tournaments SET status = 'completed', updated_at = NOW() WHERE id = $1`, [tournamentId]);
    }

    // ==========================================
    // HISTORIAL Y ESTADÍSTICAS
    // ==========================================

    static async getUserHistory(userId: number, limit: number, offset: number): Promise<any[]> {
        const result = await pool.query(`
            SELECT h.*, t.name, t.tournament_type, t.subject FROM tournament_history h
            JOIN tournaments t ON h.tournament_id = t.id WHERE h.user_id = $1 ORDER BY h.completed_at DESC LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
        return result.rows;
    }

    static async getUserStats(userId: number): Promise<any> {
        const result = await pool.query(`
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

    static async getUserActiveTournaments(userId: number): Promise<Tournament[]> {
        const result = await pool.query(`
            SELECT t.*, p.status as participation_status, p.points, p.wins
            FROM tournament_participants p JOIN tournaments t ON p.tournament_id = t.id
            WHERE p.user_id = $1 AND t.status IN ('registration', 'active') ORDER BY t.start_date
        `, [userId]);
        return result.rows.map((row: any) => ({
            ...row,
            points: parseInt(row.points),
            wins: parseInt(row.wins)
        }));
    }

    static async getUserAchievements(userId: number): Promise<any[]> {
        const result = await pool.query(`
            SELECT a.*, ta.earned_at FROM tournament_achievements a
            JOIN user_tournament_achievements ta ON a.id = ta.achievement_id
            WHERE ta.user_id = $1 ORDER BY ta.earned_at DESC
        `, [userId]);
        return result.rows;
    }

    static async getConnection(): Promise<any> {
        return pool.connect();
    }
}

export default TournamentDAO;
module.exports = TournamentDAO;

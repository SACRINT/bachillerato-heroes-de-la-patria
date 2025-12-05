/**
 * 🏆 TOURNAMENTS SERVICE
 * Servicio de torneos y competencias académicas
 * 
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar TournamentDAO
 * - Sin SQL directo en el servicio
 */

const TournamentDAO = require('../data/tournament.dao');

class TournamentsService {
    constructor() {
        this.tournamentTypes = ['quiz', 'challenge', 'project', 'hackathon', 'debate'];
        this.formats = ['bracket', 'round_robin', 'swiss', 'league'];
        this.statuses = ['draft', 'registration', 'active', 'completed', 'cancelled'];
    }

    // ========================================
    // GESTIÓN DE TORNEOS
    // ========================================

    async createTournament(tournamentData) {
        const { name } = tournamentData;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
        return TournamentDAO.createTournament({ ...tournamentData, slug });
    }

    async getTournaments(options = {}) {
        const { status, tournamentType, subject, featured, page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = 'WHERE 1=1';

        if (status) { params.push(status); whereClause += ` AND status = $${params.length}`; }
        if (tournamentType) { params.push(tournamentType); whereClause += ` AND tournament_type = $${params.length}`; }
        if (subject) { params.push(subject); whereClause += ` AND subject = $${params.length}`; }
        if (featured) { whereClause += ` AND is_featured = true`; }

        return TournamentDAO.getTournaments(whereClause, params, limit, offset);
    }

    async getTournamentById(tournamentId, userId = null) {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);
        if (!tournament) return null;

        if (userId) {
            tournament.userParticipation = await TournamentDAO.getUserParticipation(tournamentId, userId);
        }
        return tournament;
    }

    async updateTournamentStatus(tournamentId, newStatus) {
        const result = await TournamentDAO.updateStatus(tournamentId, newStatus);
        if (newStatus === 'active') {
            await this.generateBrackets(tournamentId);
        }
        return result;
    }

    // ========================================
    // PARTICIPACIÓN
    // ========================================

    async registerParticipant(tournamentId, userId) {
        const client = await TournamentDAO.getConnection();
        try {
            await client.query('BEGIN');

            const t = await TournamentDAO.getTournamentForRegister(client, tournamentId);
            if (!t) throw new Error('Torneo no encontrado');
            if (t.status !== 'registration') throw new Error('El torneo no está abierto para registro');

            const count = await TournamentDAO.getParticipantCount(client, tournamentId);
            if (count >= t.max_participants) throw new Error('El torneo está lleno');

            const userLevel = await TournamentDAO.getUserLevel(client, userId);
            if (userLevel < t.min_level) throw new Error(`Nivel mínimo requerido: ${t.min_level}`);

            if (t.entry_fee_coins > 0) {
                const balance = await TournamentDAO.getWalletBalance(client, userId);
                if (balance < t.entry_fee_coins) throw new Error(`IACoins insuficientes. Necesitas: ${t.entry_fee_coins}`);

                await TournamentDAO.deductBalance(client, userId, t.entry_fee_coins);
                await TournamentDAO.createTransaction(client, userId, t.entry_fee_coins, `Entrada a torneo: ${t.name}`);
            }

            const participant = await TournamentDAO.registerParticipant(client, tournamentId, userId, t.entry_fee_coins > 0);
            await TournamentDAO.incrementParticipantCount(client, tournamentId);

            await client.query('COMMIT');
            return participant;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async withdrawParticipant(tournamentId, userId) {
        const client = await TournamentDAO.getConnection();
        try {
            await client.query('BEGIN');
            const result = await TournamentDAO.withdrawParticipant(client, tournamentId, userId);
            if (!result) throw new Error('Participante no encontrado');
            await TournamentDAO.decrementParticipantCount(client, tournamentId);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getParticipants(tournamentId, options = {}) {
        const { status, page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;
        const params = [tournamentId];
        let whereClause = 'WHERE p.tournament_id = $1';

        if (status) { params.push(status); whereClause += ` AND p.status = $${params.length}`; }
        return TournamentDAO.getParticipants(tournamentId, whereClause, params, limit, offset);
    }

    // ========================================
    // MATCHES Y BRACKETS
    // ========================================

    async generateBrackets(tournamentId) {
        const client = await TournamentDAO.getConnection();
        try {
            await client.query('BEGIN');

            const participants = await TournamentDAO.getRegisteredParticipants(client, tournamentId);
            if (participants.length < 2) throw new Error('Se necesitan al menos 2 participantes');

            const rounds = Math.ceil(Math.log2(participants.length));
            const roundNames = ['Ronda 1', 'Ronda 2', 'Cuartos de Final', 'Semifinal', 'Final'];

            for (let i = 0; i < rounds; i++) {
                await TournamentDAO.createRound(client, tournamentId, i + 1, roundNames[Math.min(i, roundNames.length - 1)] || `Ronda ${i + 1}`, 'pending');
            }

            const firstRound = await TournamentDAO.getFirstRound(client, tournamentId);
            const matchesFirstRound = Math.ceil(participants.length / 2);

            for (let i = 0; i < matchesFirstRound; i++) {
                const p1 = participants[i * 2];
                const p2 = participants[i * 2 + 1];
                await TournamentDAO.createMatch(client, tournamentId, firstRound.id, p1?.id, p2?.id, i + 1);
                if (p1) await TournamentDAO.setSeed(client, p1.id, i * 2 + 1);
                if (p2) await TournamentDAO.setSeed(client, p2.id, i * 2 + 2);
            }

            await TournamentDAO.activateParticipants(client, tournamentId);
            await client.query('COMMIT');
            return { rounds, matchesFirstRound };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getMatches(tournamentId, options = {}) {
        const { roundId, status, page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;
        const params = [tournamentId];
        let whereClause = 'WHERE m.tournament_id = $1';

        if (roundId) { params.push(roundId); whereClause += ` AND m.round_id = $${params.length}`; }
        if (status) { params.push(status); whereClause += ` AND m.status = $${params.length}`; }

        return TournamentDAO.getMatches(tournamentId, whereClause, params, limit, offset);
    }

    async startMatch(matchId) {
        return TournamentDAO.startMatch(matchId);
    }

    async recordMatchResult(matchId, resultData) {
        const client = await TournamentDAO.getConnection();
        try {
            await client.query('BEGIN');

            const { score1, score2, winnerId, responses, duration } = resultData;
            let winner = winnerId, isDraw = false;

            if (!winner) {
                if (score1 > score2) winner = await TournamentDAO.getMatchParticipant(client, matchId, 1);
                else if (score2 > score1) winner = await TournamentDAO.getMatchParticipant(client, matchId, 2);
                else isDraw = true;
            }

            const match = await TournamentDAO.recordMatchResult(client, matchId, score1, score2, winner, isDraw, responses, duration);

            if (match.participant1_id) {
                await TournamentDAO.updateParticipantStats(client, match.participant1_id, winner === match.participant1_id, winner === match.participant2_id, isDraw, score1);
            }
            if (match.participant2_id) {
                await TournamentDAO.updateParticipantStats(client, match.participant2_id, winner === match.participant2_id, winner === match.participant1_id, isDraw, score2);
            }

            await client.query('COMMIT');
            return match;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // LEADERBOARD Y PREMIOS
    // ========================================

    async getLeaderboard(tournamentId, limit = 20) {
        return TournamentDAO.getLeaderboard(tournamentId, limit);
    }

    async updateLeaderboard(tournamentId) {
        const client = await TournamentDAO.getConnection();
        try {
            await client.query('BEGIN');
            const rankings = await TournamentDAO.getRankings(client, tournamentId);
            for (const row of rankings) {
                await TournamentDAO.upsertLeaderboard(client, tournamentId, row);
            }
            await client.query('COMMIT');
            return rankings;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async finalizeTournament(tournamentId) {
        const client = await TournamentDAO.getConnection();
        try {
            await client.query('BEGIN');

            const t = await TournamentDAO.getTournamentForRegister(client, tournamentId);
            if (!t) throw new Error('Torneo no encontrado');

            const rankings = await this.getLeaderboard(tournamentId, 100);
            const prizes = t.prizes || [];

            for (const prize of prizes) {
                const winner = rankings.find(r => r.current_rank === prize.rank);
                if (winner) {
                    await TournamentDAO.awardPrize(client, tournamentId, winner.user_id, prize.rank, prize.coins, prize.xp, prize.badge_id);

                    if (prize.coins > 0) {
                        await TournamentDAO.creditWallet(client, winner.user_id, prize.coins);
                        await TournamentDAO.createEarnTransaction(client, winner.user_id, prize.coins, `Premio torneo: ${t.name} (${prize.rank}° lugar)`);
                    }
                    if (prize.xp > 0) {
                        await TournamentDAO.addXP(client, winner.user_id, prize.xp);
                    }
                    await TournamentDAO.upsertHistory(client, winner.user_id, tournamentId, prize.rank, winner.points, winner.total_score, prize.coins, prize.xp, winner.matches_played, winner.wins, winner.losses);
                }
            }

            await TournamentDAO.completeTournament(client, tournamentId);
            await client.query('COMMIT');
            return { success: true, winners: rankings.slice(0, 3) };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // HISTORIAL Y ESTADÍSTICAS
    // ========================================

    async getUserTournamentHistory(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        return TournamentDAO.getUserHistory(userId, limit, (page - 1) * limit);
    }

    async getUserTournamentStats(userId) {
        return TournamentDAO.getUserStats(userId);
    }

    async getUserActiveTournaments(userId) {
        return TournamentDAO.getUserActiveTournaments(userId);
    }

    async getUserAchievements(userId) {
        return TournamentDAO.getUserAchievements(userId);
    }
}

module.exports = new TournamentsService();

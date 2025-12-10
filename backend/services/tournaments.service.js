"use strict";
/**
 * 🏆 TOURNAMENTS SERVICE - TypeScript Version
 * Torneos y competencias académicas
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentsService = void 0;
const TournamentDAO = require('../data/tournament.dao');
const devLogger = require('../utils/devLogger');
// ============================================
// TOURNAMENTS SERVICE CLASS
// ============================================
class TournamentsService {
    constructor() {
        this.tournamentTypes = ['quiz', 'challenge', 'project', 'hackathon', 'debate'];
        this.formats = ['bracket', 'round_robin', 'swiss', 'league'];
        devLogger.log('[TOURNAMENTS] Service initialized');
    }
    // Tournament Management
    async createTournament(tournamentData) {
        if (!this.tournamentTypes.includes(tournamentData.type)) {
            throw new Error('Tipo de torneo no válido');
        }
        return await TournamentDAO.createTournament(tournamentData);
    }
    async getTournaments(options = {}) {
        const tournaments = await TournamentDAO.getTournaments(options);
        const total = await TournamentDAO.countTournaments(options);
        return { tournaments, total };
    }
    async getTournamentById(tournamentId, userId = null) {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);
        if (tournament && userId) {
            tournament.isRegistered = await TournamentDAO.isRegistered(tournamentId, userId);
            tournament.userParticipant = await TournamentDAO.getParticipant(tournamentId, userId);
        }
        return tournament;
    }
    async updateTournamentStatus(tournamentId, newStatus) {
        await TournamentDAO.updateStatus(tournamentId, newStatus);
        if (newStatus === 'in_progress') {
            await this.generateBrackets(tournamentId);
        }
    }
    // Participants
    async registerParticipant(tournamentId, userId) {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);
        if (!tournament) {
            throw new Error('Torneo no encontrado');
        }
        if (tournament.status !== 'registration') {
            throw new Error('Las inscripciones están cerradas');
        }
        if (tournament.currentParticipants >= tournament.maxParticipants) {
            throw new Error('Torneo lleno');
        }
        if (await TournamentDAO.isRegistered(tournamentId, userId)) {
            throw new Error('Ya estás registrado');
        }
        return await TournamentDAO.registerParticipant(tournamentId, userId);
    }
    async withdrawParticipant(tournamentId, userId) {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);
        if (tournament.status === 'in_progress') {
            throw new Error('No puedes retirarte durante el torneo');
        }
        await TournamentDAO.withdrawParticipant(tournamentId, userId);
    }
    async getParticipants(tournamentId, options = {}) {
        return await TournamentDAO.getParticipants(tournamentId, options);
    }
    // Brackets & Matches
    async generateBrackets(tournamentId) {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);
        const participants = await TournamentDAO.getParticipants(tournamentId, {});
        if (participants.length < 2) {
            throw new Error('Se necesitan al menos 2 participantes');
        }
        // Shuffle participants
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        // Generate first round matches
        const matches = [];
        for (let i = 0; i < shuffled.length - 1; i += 2) {
            matches.push({
                tournamentId,
                round: 1,
                participant1Id: shuffled[i].id,
                participant2Id: shuffled[i + 1]?.id,
                status: 'pending'
            });
        }
        // Handle bye if odd number
        if (shuffled.length % 2 !== 0) {
            const byeParticipant = shuffled[shuffled.length - 1];
            await TournamentDAO.advanceToNextRound(tournamentId, byeParticipant.id, 1);
        }
        await TournamentDAO.createMatches(matches);
    }
    async getMatches(tournamentId, options = {}) {
        return await TournamentDAO.getMatches(tournamentId, options);
    }
    async startMatch(matchId) {
        await TournamentDAO.updateMatchStatus(matchId, 'in_progress');
    }
    async recordMatchResult(matchId, resultData) {
        const match = await TournamentDAO.getMatchById(matchId);
        await TournamentDAO.updateMatchResult(matchId, resultData);
        await TournamentDAO.updateParticipantStats(resultData.winnerId, true);
        const loserId = match.participant1Id === resultData.winnerId ? match.participant2Id : match.participant1Id;
        await TournamentDAO.updateParticipantStats(loserId, false);
        await this.updateLeaderboard(match.tournamentId);
    }
    // Leaderboard
    async getLeaderboard(tournamentId, limit = 20) {
        return await TournamentDAO.getLeaderboard(tournamentId, limit);
    }
    async updateLeaderboard(tournamentId) {
        await TournamentDAO.recalculateRanks(tournamentId);
    }
    async finalizeTournament(tournamentId) {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);
        const leaderboard = await this.getLeaderboard(tournamentId, 3);
        // Distribute prizes
        for (let i = 0; i < leaderboard.length; i++) {
            const participant = leaderboard[i];
            const prizeMultiplier = i === 0 ? 1 : i === 1 ? 0.5 : 0.25;
            await TournamentDAO.grantPrize(participant.userId, {
                xp: Math.round(tournament.prizePool.xp * prizeMultiplier),
                coins: Math.round(tournament.prizePool.coins * prizeMultiplier),
                badge: i === 0 ? 'tournament_champion' : undefined
            });
        }
        await TournamentDAO.updateStatus(tournamentId, 'completed');
    }
    // User Stats
    async getUserTournamentHistory(userId, options = {}) {
        return await TournamentDAO.getUserHistory(userId, options);
    }
    async getUserTournamentStats(userId) {
        return await TournamentDAO.getUserStats(userId);
    }
    async getUserActiveTournaments(userId) {
        return await TournamentDAO.getUserActiveTournaments(userId);
    }
    async getUserAchievements(userId) {
        return await TournamentDAO.getUserAchievements(userId);
    }
}
exports.TournamentsService = TournamentsService;
// ============================================
// EXPORTS
// ============================================
const tournamentsService = new TournamentsService();
exports.default = tournamentsService;
module.exports = tournamentsService;
module.exports.TournamentsService = TournamentsService;
//# sourceMappingURL=tournaments.service.js.map
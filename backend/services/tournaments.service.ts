/**
 * 🏆 TOURNAMENTS SERVICE - TypeScript Version
 * Torneos y competencias académicas
 * Refactorizado: 07 Diciembre 2025
 */

const TournamentDAO = require('../data/tournament.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export type TournamentType = 'quiz' | 'challenge' | 'project' | 'hackathon' | 'debate';
export type TournamentFormat = 'bracket' | 'round_robin' | 'swiss' | 'league';
export type TournamentStatus = 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';

export interface Tournament {
    id: number;
    name: string;
    description: string;
    type: TournamentType;
    format: TournamentFormat;
    status: TournamentStatus;
    subject?: string;
    maxParticipants: number;
    currentParticipants: number;
    registrationDeadline: Date;
    startDate: Date;
    endDate?: Date;
    prizePool: { xp: number; coins: number; badges?: string[] };
    createdBy: number;
}

export interface Participant {
    id: number;
    tournamentId: number;
    userId: number;
    displayName: string;
    score: number;
    wins: number;
    losses: number;
    rank?: number;
    registeredAt: Date;
    status: 'active' | 'eliminated' | 'withdrawn';
}

export interface Match {
    id: number;
    tournamentId: number;
    round: number;
    participant1Id: number;
    participant2Id: number;
    winnerId?: number;
    score1?: number;
    score2?: number;
    status: 'pending' | 'in_progress' | 'completed';
    scheduledAt?: Date;
    completedAt?: Date;
}

export interface TournamentOptions {
    type?: TournamentType;
    status?: TournamentStatus;
    subject?: string;
    limit?: number;
    offset?: number;
}

// ============================================
// TOURNAMENTS SERVICE CLASS
// ============================================

class TournamentsService {
    private tournamentTypes: TournamentType[];
    private formats: TournamentFormat[];

    constructor() {
        this.tournamentTypes = ['quiz', 'challenge', 'project', 'hackathon', 'debate'];
        this.formats = ['bracket', 'round_robin', 'swiss', 'league'];
        devLogger.log('[TOURNAMENTS] Service initialized');
    }

    // Tournament Management
    async createTournament(tournamentData: Partial<Tournament>): Promise<Tournament> {
        if (!this.tournamentTypes.includes(tournamentData.type as TournamentType)) {
            throw new Error('Tipo de torneo no válido');
        }
        return await TournamentDAO.createTournament(tournamentData);
    }

    async getTournaments(options: TournamentOptions = {}): Promise<{ tournaments: Tournament[]; total: number }> {
        const tournaments = await TournamentDAO.getTournaments(options);
        const total = await TournamentDAO.countTournaments(options);
        return { tournaments, total };
    }

    async getTournamentById(tournamentId: number, userId: number | null = null): Promise<Tournament | null> {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);
        if (tournament && userId) {
            tournament.isRegistered = await TournamentDAO.isRegistered(tournamentId, userId);
            tournament.userParticipant = await TournamentDAO.getParticipant(tournamentId, userId);
        }
        return tournament;
    }

    async updateTournamentStatus(tournamentId: number, newStatus: TournamentStatus): Promise<void> {
        await TournamentDAO.updateStatus(tournamentId, newStatus);

        if (newStatus === 'in_progress') {
            await this.generateBrackets(tournamentId);
        }
    }

    // Participants
    async registerParticipant(tournamentId: number, userId: number): Promise<Participant> {
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

    async withdrawParticipant(tournamentId: number, userId: number): Promise<void> {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);

        if (tournament.status === 'in_progress') {
            throw new Error('No puedes retirarte durante el torneo');
        }

        await TournamentDAO.withdrawParticipant(tournamentId, userId);
    }

    async getParticipants(tournamentId: number, options: { limit?: number; sortBy?: string } = {}): Promise<Participant[]> {
        return await TournamentDAO.getParticipants(tournamentId, options);
    }

    // Brackets & Matches
    async generateBrackets(tournamentId: number): Promise<void> {
        const tournament = await TournamentDAO.getTournamentById(tournamentId);
        const participants = await TournamentDAO.getParticipants(tournamentId, {});

        if (participants.length < 2) {
            throw new Error('Se necesitan al menos 2 participantes');
        }

        // Shuffle participants
        const shuffled = [...participants].sort(() => Math.random() - 0.5);

        // Generate first round matches
        const matches: Partial<Match>[] = [];
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

    async getMatches(tournamentId: number, options: { round?: number; status?: string } = {}): Promise<Match[]> {
        return await TournamentDAO.getMatches(tournamentId, options);
    }

    async startMatch(matchId: number): Promise<void> {
        await TournamentDAO.updateMatchStatus(matchId, 'in_progress');
    }

    async recordMatchResult(matchId: number, resultData: { winnerId: number; score1: number; score2: number }): Promise<void> {
        const match = await TournamentDAO.getMatchById(matchId);

        await TournamentDAO.updateMatchResult(matchId, resultData);
        await TournamentDAO.updateParticipantStats(resultData.winnerId, true);

        const loserId = match.participant1Id === resultData.winnerId ? match.participant2Id : match.participant1Id;
        await TournamentDAO.updateParticipantStats(loserId, false);

        await this.updateLeaderboard(match.tournamentId);
    }

    // Leaderboard
    async getLeaderboard(tournamentId: number, limit: number = 20): Promise<Participant[]> {
        return await TournamentDAO.getLeaderboard(tournamentId, limit);
    }

    async updateLeaderboard(tournamentId: number): Promise<void> {
        await TournamentDAO.recalculateRanks(tournamentId);
    }

    async finalizeTournament(tournamentId: number): Promise<void> {
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
    async getUserTournamentHistory(userId: number, options: { limit?: number; offset?: number } = {}): Promise<any[]> {
        return await TournamentDAO.getUserHistory(userId, options);
    }

    async getUserTournamentStats(userId: number): Promise<any> {
        return await TournamentDAO.getUserStats(userId);
    }

    async getUserActiveTournaments(userId: number): Promise<Tournament[]> {
        return await TournamentDAO.getUserActiveTournaments(userId);
    }

    async getUserAchievements(userId: number): Promise<any[]> {
        return await TournamentDAO.getUserAchievements(userId);
    }
}

// ============================================
// EXPORTS
// ============================================

const tournamentsService = new TournamentsService();

export { TournamentsService };
export default tournamentsService;

module.exports = tournamentsService;
module.exports.TournamentsService = TournamentsService;

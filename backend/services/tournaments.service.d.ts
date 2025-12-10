/**
 * 🏆 TOURNAMENTS SERVICE - TypeScript Version
 * Torneos y competencias académicas
 * Refactorizado: 07 Diciembre 2025
 */
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
    prizePool: {
        xp: number;
        coins: number;
        badges?: string[];
    };
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
declare class TournamentsService {
    private tournamentTypes;
    private formats;
    constructor();
    createTournament(tournamentData: Partial<Tournament>): Promise<Tournament>;
    getTournaments(options?: TournamentOptions): Promise<{
        tournaments: Tournament[];
        total: number;
    }>;
    getTournamentById(tournamentId: number, userId?: number | null): Promise<Tournament | null>;
    updateTournamentStatus(tournamentId: number, newStatus: TournamentStatus): Promise<void>;
    registerParticipant(tournamentId: number, userId: number): Promise<Participant>;
    withdrawParticipant(tournamentId: number, userId: number): Promise<void>;
    getParticipants(tournamentId: number, options?: {
        limit?: number;
        sortBy?: string;
    }): Promise<Participant[]>;
    generateBrackets(tournamentId: number): Promise<void>;
    getMatches(tournamentId: number, options?: {
        round?: number;
        status?: string;
    }): Promise<Match[]>;
    startMatch(matchId: number): Promise<void>;
    recordMatchResult(matchId: number, resultData: {
        winnerId: number;
        score1: number;
        score2: number;
    }): Promise<void>;
    getLeaderboard(tournamentId: number, limit?: number): Promise<Participant[]>;
    updateLeaderboard(tournamentId: number): Promise<void>;
    finalizeTournament(tournamentId: number): Promise<void>;
    getUserTournamentHistory(userId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    getUserTournamentStats(userId: number): Promise<any>;
    getUserActiveTournaments(userId: number): Promise<Tournament[]>;
    getUserAchievements(userId: number): Promise<any[]>;
}
declare const tournamentsService: TournamentsService;
export { TournamentsService };
export default tournamentsService;
//# sourceMappingURL=tournaments.service.d.ts.map
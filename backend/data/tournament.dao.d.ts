/**
 * 🏆 TOURNAMENT DAO - TypeScript
 * Data Access Object para sistema de torneos
 * Abstrae todas las queries SQL de TournamentsService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface Tournament {
    id: number;
    name: string;
    slug: string;
    description: string;
    tournament_type: string;
    format: string;
    subject: string;
    topics: any;
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
    prizes: any;
    rules: string;
    scoring_system: any;
    settings: any;
    created_by: number;
    status: string;
    participant_count: number;
    created_at: Date;
    updated_at: Date;
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
    responses?: any;
    duration_seconds?: number;
    started_at?: Date;
    ended_at?: Date;
    created_at: Date;
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
    rank?: number;
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
declare class TournamentDAO {
    static createTournament(data: CreateTournamentInput): Promise<Tournament>;
    static getTournaments(whereClause: string, params: any[], limit: number, offset: number): Promise<Tournament[]>;
    static getTournamentById(tournamentId: number): Promise<Tournament | null>;
    static getUserParticipation(tournamentId: number, userId: number): Promise<TournamentParticipant | null>;
    static updateStatus(tournamentId: number, newStatus: string): Promise<Tournament>;
    static getTournamentForRegister(client: any, tournamentId: number): Promise<Tournament>;
    static getParticipantCount(client: any, tournamentId: number): Promise<number>;
    static getUserLevel(client: any, userId: number): Promise<number>;
    static getWalletBalance(client: any, userId: number): Promise<number>;
    static deductBalance(client: any, userId: number, amount: number): Promise<void>;
    static createTransaction(client: any, userId: number, amount: number, description: string): Promise<void>;
    static registerParticipant(client: any, tournamentId: number, userId: number, entryPaid: boolean): Promise<TournamentParticipant>;
    static incrementParticipantCount(client: any, tournamentId: number): Promise<void>;
    static withdrawParticipant(client: any, tournamentId: number, userId: number): Promise<TournamentParticipant>;
    static decrementParticipantCount(client: any, tournamentId: number): Promise<void>;
    static getParticipants(tournamentId: number, whereClause: string, params: any[], limit: number, offset: number): Promise<TournamentParticipant[]>;
    static getRegisteredParticipants(client: any, tournamentId: number): Promise<TournamentParticipant[]>;
    static createRound(client: any, tournamentId: number, roundNumber: number, name: string, status: string): Promise<void>;
    static getFirstRound(client: any, tournamentId: number): Promise<TournamentRound | undefined>;
    static createMatch(client: any, tournamentId: number, roundId: number, p1Id: number | null, p2Id: number | null, matchNumber: number): Promise<void>;
    static setSeed(client: any, participantId: number, seed: number): Promise<void>;
    static activateParticipants(client: any, tournamentId: number): Promise<void>;
    static getMatches(tournamentId: number, whereClause: string, params: any[], limit: number, offset: number): Promise<TournamentMatch[]>;
    static startMatch(matchId: number): Promise<TournamentMatch>;
    static getMatchParticipant(client: any, matchId: number, which: 1 | 2): Promise<number | undefined>;
    static recordMatchResult(client: any, matchId: number, score1: number, score2: number, winnerId: number | null, isDraw: boolean, responses: any, duration: number): Promise<TournamentMatch>;
    static updateParticipantStats(client: any, participantId: number, won: boolean, lost: boolean, draw: boolean, score: number): Promise<void>;
    static getLeaderboard(tournamentId: number, limit: number): Promise<LeaderboardEntry[]>;
    static getRankings(client: any, tournamentId: number): Promise<LeaderboardEntry[]>;
    static upsertLeaderboard(client: any, tournamentId: number, row: LeaderboardEntry): Promise<void>;
    static awardPrize(client: any, tournamentId: number, userId: number, rank: number, coins: number, xp: number, badgeId: number | null): Promise<void>;
    static creditWallet(client: any, userId: number, amount: number): Promise<void>;
    static createEarnTransaction(client: any, userId: number, amount: number, description: string): Promise<void>;
    static addXP(client: any, userId: number, xp: number): Promise<void>;
    static upsertHistory(client: any, userId: number, tournamentId: number, rank: number, points: number, score: number, coins: number, xp: number, matches: number, wins: number, losses: number): Promise<void>;
    static completeTournament(client: any, tournamentId: number): Promise<void>;
    static getUserHistory(userId: number, limit: number, offset: number): Promise<any[]>;
    static getUserStats(userId: number): Promise<any>;
    static getUserActiveTournaments(userId: number): Promise<Tournament[]>;
    static getUserAchievements(userId: number): Promise<any[]>;
    static getConnection(): Promise<any>;
}
export default TournamentDAO;
//# sourceMappingURL=tournament.dao.d.ts.map
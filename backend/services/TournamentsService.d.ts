declare const _exports: TournamentsService;
export = _exports;
declare class TournamentsService {
    tournamentTypes: string[];
    formats: string[];
    statuses: string[];
    createTournament(tournamentData: any): Promise<any>;
    getTournaments(options?: {}): Promise<any>;
    getTournamentById(tournamentId: any, userId?: any): Promise<any>;
    updateTournamentStatus(tournamentId: any, newStatus: any): Promise<any>;
    registerParticipant(tournamentId: any, userId: any): Promise<any>;
    withdrawParticipant(tournamentId: any, userId: any): Promise<any>;
    getParticipants(tournamentId: any, options?: {}): Promise<any>;
    generateBrackets(tournamentId: any): Promise<{
        rounds: number;
        matchesFirstRound: number;
    }>;
    getMatches(tournamentId: any, options?: {}): Promise<any>;
    startMatch(matchId: any): Promise<any>;
    recordMatchResult(matchId: any, resultData: any): Promise<any>;
    getLeaderboard(tournamentId: any, limit?: number): Promise<any>;
    updateLeaderboard(tournamentId: any): Promise<any>;
    finalizeTournament(tournamentId: any): Promise<{
        success: boolean;
        winners: any;
    }>;
    getUserTournamentHistory(userId: any, options?: {}): Promise<any>;
    getUserTournamentStats(userId: any): Promise<any>;
    getUserActiveTournaments(userId: any): Promise<any>;
    getUserAchievements(userId: any): Promise<any>;
}
//# sourceMappingURL=TournamentsService.d.ts.map
/**
 * 🏆 CHALLENGES SERVICE - TypeScript Version
 * Gestión de retos dinámicos y gamificación
 * Refactorizado: 07 Diciembre 2025
 */
export interface StreakMultipliers {
    [days: number]: number;
}
export interface Challenge {
    id: number;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'special' | 'collaborative';
    xpReward: number;
    coinsReward: number;
    target: number;
    subject?: string;
    isActive: boolean;
}
export interface UserChallenge {
    userId: number;
    challengeId: number;
    progress: number;
    completed: boolean;
    rewardClaimed: boolean;
    startedAt: Date;
    completedAt?: Date;
}
export interface ChallengeOptions {
    type?: string;
    subject?: string;
    limit?: number;
}
declare class ChallengesService {
    private streakMultipliers;
    private subjects;
    constructor();
    getAvailableChallenges(userId: number, options?: ChallengeOptions): Promise<Challenge[]>;
    getChallengeById(challengeId: number, userId: number): Promise<Challenge | null>;
    getDailyChallenges(userId: number): Promise<Challenge[]>;
    getFeaturedChallenges(userId: number, limit?: number): Promise<Challenge[]>;
    startChallenge(userId: number, challengeId: number): Promise<UserChallenge>;
    updateProgress(userId: number, challengeId: number, incrementBy?: number, progressData?: any): Promise<UserChallenge>;
    claimReward(userId: number, challengeId: number): Promise<{
        xp: number;
        coins: number;
    }>;
    updateStreak(userId: number, streakType?: string): Promise<any>;
    getUserStreaks(userId: number): Promise<any[]>;
    calculateStreakBonus(streak: number): number;
    getStreakMultiplier(userId: number): Promise<number>;
    joinCollaborativeChallenge(userId: number, challengeId: number): Promise<any>;
    getCollaborativeParticipants(challengeId: number): Promise<any[]>;
    private processChallenge;
    private checkLevelUp;
    getUserChallengeStats(userId: number): Promise<any>;
}
declare const challengesService: ChallengesService;
export { ChallengesService };
export default challengesService;
//# sourceMappingURL=challenges.service.d.ts.map
declare const _exports: ChallengesService;
export = _exports;
declare class ChallengesService {
    streakMultipliers: {
        3: number;
        7: number;
        14: number;
        30: number;
        60: number;
        100: number;
    };
    subjects: string[];
    getAvailableChallenges(userId: any, options?: {}): Promise<any>;
    getChallengeById(challengeId: any, userId: any): Promise<any>;
    getDailyChallenges(userId: any): Promise<any>;
    getFeaturedChallenges(userId: any, limit?: number): Promise<any>;
    startChallenge(userId: any, challengeId: any): Promise<{
        success: boolean;
        message: string;
        progress: any;
    }>;
    updateProgress(userId: any, challengeId: any, incrementBy?: number, progressData?: any): any;
    claimReward(userId: any, challengeId: any): Promise<{
        success: boolean;
        coinsEarned: number;
        xpEarned: number;
        multiplier: number;
        message: string;
    }>;
    updateStreak(userId: any, streakType?: string): Promise<any>;
    getUserStreaks(userId: any): Promise<any>;
    calculateStreakBonus(streak: any): any;
    getStreakMultiplier(userId: any): Promise<number>;
    joinCollaborativeChallenge(userId: any, challengeId: any): Promise<{
        success: boolean;
        participation: any;
        message: string;
    }>;
    getCollaborativeParticipants(challengeId: any): Promise<any>;
    processChallenge(challenge: any, userId: any): any;
    checkLevelUp(userId: any): Promise<void>;
    getUserChallengeStats(userId: any): Promise<any>;
}
//# sourceMappingURL=ChallengesService.d.ts.map
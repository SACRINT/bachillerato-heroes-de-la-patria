declare const _exports: LevelsService;
export = _exports;
declare class LevelsService {
    levelsCache: any;
    badgesCache: any;
    getLevelDefinitions(): Promise<any>;
    getLevelInfo(level: any): Promise<any>;
    calculateLevelFromXP(xp: any): Promise<{
        level: any;
        title: any;
        subtitle: any;
        icon: any;
        color: any;
        currentXP: any;
        xpForCurrentLevel: any;
        xpForNextLevel: any;
        xpNeeded: number;
        progressPercent: number;
        isMaxLevel: boolean;
    }>;
    grantXP(userId: any, amount: any, source?: string): Promise<{
        xpGranted: any;
        source: string;
        totalXP: any;
        levelInfo: {
            level: any;
            title: any;
            subtitle: any;
            icon: any;
            color: any;
            currentXP: any;
            xpForCurrentLevel: any;
            xpForNextLevel: any;
            xpNeeded: number;
            progressPercent: number;
            isMaxLevel: boolean;
        };
        levelUp: {
            coinsEarned: number;
            badgesEarned: any[];
            unlocks: any[];
        };
    }>;
    processLevelUp(userId: any, fromLevel: any, toLevel: any): Promise<{
        coinsEarned: number;
        badgesEarned: any[];
        unlocks: any[];
    }>;
    getUserLevel(userId: any): Promise<any>;
    getAllBadges(): Promise<any>;
    getUserBadges(userId: any): Promise<any>;
    getBadgesWithStatus(userId: any): Promise<any>;
    grantBadge(userId: any, badgeId: any, details?: any): Promise<{
        success: boolean;
        message: string;
        badge?: undefined;
        rewards?: undefined;
    } | {
        success: boolean;
        badge: any;
        rewards: {
            coins: any;
            xp: any;
        };
        message?: undefined;
    }>;
    checkLevelBadge(userId: any, level: any): Promise<any>;
    checkActivityBadges(userId: any, activityType: any, value: any): Promise<any[]>;
    setFeaturedBadge(userId: any, badgeId: any): Promise<boolean>;
    getUserProfile(userId: any): Promise<any>;
    createUserProfile(userId: any): Promise<{
        user_id: any;
        level: any;
        experience_points: any;
    }>;
    getUnlocksForLevel(level: any): Promise<any>;
    getAvailableFeatures(userId: any): Promise<any>;
    hasFeatureAccess(userId: any, featureSlug: any): Promise<any>;
    getXPLeaderboard(limit?: number): Promise<any>;
    getUserRank(userId: any): Promise<any>;
    getLevelHistory(userId: any, limit?: number): Promise<any>;
    addCoinsToUser(userId: any, amount: any): Promise<any>;
    createTransaction(userId: any, amount: any, description: any): Promise<any>;
    invalidateCache(): void;
}
//# sourceMappingURL=LevelsService.d.ts.map
/**
 * 🌟 LEVELS SERVICE - TypeScript Version
 * Sistema de niveles, XP y badges
 * Refactorizado: 07 Diciembre 2025
 */
export interface LevelDefinition {
    level: number;
    xpRequired: number;
    title: string;
    color: string;
    features: string[];
}
export interface Badge {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    category: string;
}
export interface UserLevel {
    userId: number;
    level: number;
    xp: number;
    coins: number;
    title: string;
    xpToNextLevel: number;
    progress: number;
}
export interface UserProfile {
    userId: number;
    level: number;
    xp: number;
    coins: number;
    badges: Badge[];
    featuredBadge?: Badge;
}
declare class LevelsService {
    private levelsCache;
    private badgesCache;
    constructor();
    getLevelDefinitions(): Promise<LevelDefinition[]>;
    getLevelInfo(level: number): Promise<LevelDefinition | undefined>;
    calculateLevelFromXP(xp: number): Promise<UserLevel>;
    grantXP(userId: number, amount: number, source?: string): Promise<{
        newXP: number;
        leveledUp: boolean;
        newLevel?: number;
    }>;
    private processLevelUp;
    getUserLevel(userId: number): Promise<UserLevel>;
    getAllBadges(): Promise<Badge[]>;
    getUserBadges(userId: number): Promise<Badge[]>;
    getBadgesWithStatus(userId: number): Promise<Array<Badge & {
        earned: boolean;
        earnedAt?: Date;
    }>>;
    grantBadge(userId: number, badgeId: number, details?: any): Promise<boolean>;
    checkLevelBadge(userId: number, level: number): Promise<void>;
    checkActivityBadges(userId: number, activityType: string, value: number): Promise<void>;
    setFeaturedBadge(userId: number, badgeId: number): Promise<void>;
    getUserProfile(userId: number): Promise<UserProfile>;
    createUserProfile(userId: number): Promise<void>;
    getUnlocksForLevel(level: number): Promise<string[]>;
    getAvailableFeatures(userId: number): Promise<string[]>;
    hasFeatureAccess(userId: number, featureSlug: string): Promise<boolean>;
    getXPLeaderboard(limit?: number): Promise<any[]>;
    getUserRank(userId: number): Promise<number>;
    getLevelHistory(userId: number, limit?: number): Promise<any[]>;
    addCoinsToUser(userId: number, amount: number): Promise<void>;
    createTransaction(userId: number, amount: number, description: string): Promise<void>;
    invalidateCache(): void;
}
declare const levelsService: LevelsService;
export { LevelsService };
export default levelsService;
//# sourceMappingURL=levels.service.d.ts.map
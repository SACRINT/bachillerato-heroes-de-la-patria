/**
 * 🌟 LEVELS SERVICE - TypeScript Version
 * Sistema de niveles, XP y badges
 * Refactorizado: 07 Diciembre 2025
 */

const GamificationDAO = require('../data/gamification.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// LEVELS SERVICE CLASS
// ============================================

class LevelsService {
    private levelsCache: LevelDefinition[] | null;
    private badgesCache: Badge[] | null;

    constructor() {
        this.levelsCache = null;
        this.badgesCache = null;
        devLogger.log('[LEVELS] Service initialized');
    }

    // Level Definitions
    async getLevelDefinitions(): Promise<LevelDefinition[]> {
        if (!this.levelsCache) {
            this.levelsCache = await GamificationDAO.getLevelDefinitions();
        }
        return this.levelsCache;
    }

    async getLevelInfo(level: number): Promise<LevelDefinition | undefined> {
        const definitions = await this.getLevelDefinitions();
        return definitions.find(d => d.level === level);
    }

    async calculateLevelFromXP(xp: number): Promise<UserLevel> {
        const definitions = await this.getLevelDefinitions();

        let currentLevel = 1;
        let currentTitle = 'Novato';
        let xpForCurrentLevel = 0;
        let xpForNextLevel = 100;

        for (const def of definitions) {
            if (xp >= def.xpRequired) {
                currentLevel = def.level;
                currentTitle = def.title;
                xpForCurrentLevel = def.xpRequired;
            } else {
                xpForNextLevel = def.xpRequired;
                break;
            }
        }

        const xpInLevel = xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const progress = xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 100;

        return {
            userId: 0,
            level: currentLevel,
            xp,
            coins: 0,
            title: currentTitle,
            xpToNextLevel: xpForNextLevel - xp,
            progress: Math.round(progress)
        };
    }

    // XP Management
    async grantXP(userId: number, amount: number, source: string = 'general'): Promise<{ newXP: number; leveledUp: boolean; newLevel?: number }> {
        const currentProfile = await GamificationDAO.getUserProfile(userId);
        const oldLevel = await this.calculateLevelFromXP(currentProfile.xp);

        await GamificationDAO.grantXP(userId, amount, source);

        const newProfile = await GamificationDAO.getUserProfile(userId);
        const newLevel = await this.calculateLevelFromXP(newProfile.xp);

        if (newLevel.level > oldLevel.level) {
            await this.processLevelUp(userId, oldLevel.level, newLevel.level);
            return { newXP: newProfile.xp, leveledUp: true, newLevel: newLevel.level };
        }

        return { newXP: newProfile.xp, leveledUp: false };
    }

    private async processLevelUp(userId: number, fromLevel: number, toLevel: number): Promise<void> {
        const levelInfo = await this.getLevelInfo(toLevel);

        if (levelInfo) {
            // Grant level-up rewards
            const coinsReward = toLevel * 50;
            await GamificationDAO.addCoins(userId, coinsReward);

            // Check for level badges
            await this.checkLevelBadge(userId, toLevel);

            // Log level up
            await GamificationDAO.logLevelUp(userId, fromLevel, toLevel);
        }

        devLogger.log(`[LEVELS] User ${userId} leveled up from ${fromLevel} to ${toLevel}`);
    }

    async getUserLevel(userId: number): Promise<UserLevel> {
        const profile = await GamificationDAO.getUserProfile(userId);
        const levelInfo = await this.calculateLevelFromXP(profile.xp);
        return { ...levelInfo, userId, coins: profile.coins };
    }

    // Badges
    async getAllBadges(): Promise<Badge[]> {
        if (!this.badgesCache) {
            this.badgesCache = await GamificationDAO.getAllBadges();
        }
        return this.badgesCache;
    }

    async getUserBadges(userId: number): Promise<Badge[]> {
        return await GamificationDAO.getUserBadges(userId);
    }

    async getBadgesWithStatus(userId: number): Promise<Array<Badge & { earned: boolean; earnedAt?: Date }>> {
        return await GamificationDAO.getBadgesWithStatus(userId);
    }

    async grantBadge(userId: number, badgeId: number, details: any = null): Promise<boolean> {
        const existing = await GamificationDAO.getUserBadge(userId, badgeId);
        if (existing) {
            return false; // Already has badge
        }

        await GamificationDAO.grantBadge(userId, badgeId, details);
        await this.grantXP(userId, 50, 'badge_earned');

        devLogger.log(`[LEVELS] Badge ${badgeId} granted to user ${userId}`);
        return true;
    }

    async checkLevelBadge(userId: number, level: number): Promise<void> {
        const levelBadges: Record<number, string> = {
            5: 'level_5',
            10: 'level_10',
            25: 'level_25',
            50: 'level_50',
            100: 'level_100'
        };

        if (levelBadges[level]) {
            const badge = await GamificationDAO.getBadgeBySlug(levelBadges[level]);
            if (badge) {
                await this.grantBadge(userId, badge.id);
            }
        }
    }

    async checkActivityBadges(userId: number, activityType: string, value: number): Promise<void> {
        const activityBadges: Record<string, Record<number, string>> = {
            challenges_completed: { 10: 'challenger_bronze', 50: 'challenger_silver', 100: 'challenger_gold' },
            forum_posts: { 10: 'contributor_bronze', 50: 'contributor_silver', 100: 'contributor_gold' }
        };

        const badges = activityBadges[activityType];
        if (badges && badges[value]) {
            const badge = await GamificationDAO.getBadgeBySlug(badges[value]);
            if (badge) {
                await this.grantBadge(userId, badge.id);
            }
        }
    }

    async setFeaturedBadge(userId: number, badgeId: number): Promise<void> {
        await GamificationDAO.setFeaturedBadge(userId, badgeId);
    }

    // Profile
    async getUserProfile(userId: number): Promise<UserProfile> {
        const profile = await GamificationDAO.getUserProfile(userId);
        const levelInfo = await this.calculateLevelFromXP(profile.xp);
        const badges = await this.getUserBadges(userId);
        const featuredBadge = badges.find((b: any) => b.is_featured);

        return {
            userId,
            level: levelInfo.level,
            xp: profile.xp,
            coins: profile.coins,
            badges,
            featuredBadge
        };
    }

    async createUserProfile(userId: number): Promise<void> {
        await GamificationDAO.createProfile(userId);
    }

    // Features & Unlocks
    async getUnlocksForLevel(level: number): Promise<string[]> {
        return await GamificationDAO.getUnlocksForLevel(level);
    }

    async getAvailableFeatures(userId: number): Promise<string[]> {
        const level = await this.getUserLevel(userId);
        return await GamificationDAO.getAvailableFeatures(level.level);
    }

    async hasFeatureAccess(userId: number, featureSlug: string): Promise<boolean> {
        const features = await this.getAvailableFeatures(userId);
        return features.includes(featureSlug);
    }

    // Leaderboard
    async getXPLeaderboard(limit: number = 10): Promise<any[]> {
        return await GamificationDAO.getXPLeaderboard(limit);
    }

    async getUserRank(userId: number): Promise<number> {
        return await GamificationDAO.getUserRank(userId);
    }

    async getLevelHistory(userId: number, limit: number = 10): Promise<any[]> {
        return await GamificationDAO.getLevelHistory(userId, limit);
    }

    // Coins
    async addCoinsToUser(userId: number, amount: number): Promise<void> {
        await GamificationDAO.addCoins(userId, amount);
    }

    async createTransaction(userId: number, amount: number, description: string): Promise<void> {
        await GamificationDAO.createTransaction(userId, amount, description);
    }

    // Cache
    invalidateCache(): void {
        this.levelsCache = null;
        this.badgesCache = null;
    }
}

// ============================================
// EXPORTS
// ============================================

const levelsService = new LevelsService();

export { LevelsService };
export default levelsService;

module.exports = levelsService;
module.exports.LevelsService = LevelsService;

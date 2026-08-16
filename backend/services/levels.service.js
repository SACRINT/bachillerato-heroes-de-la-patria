"use strict";
/**
 * 🌟 LEVELS SERVICE - TypeScript Version
 * Sistema de niveles, XP y badges
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelsService = void 0;
const GamificationDAO = require('../data/gamification.dao.js');
const devLogger = require('../utils/devLogger.js');
// ============================================
// LEVELS SERVICE CLASS
// ============================================
class LevelsService {
    constructor() {
        this.levelsCache = null;
        this.badgesCache = null;
        devLogger.log('[LEVELS] Service initialized');
    }
    // Level Definitions
    async getLevelDefinitions() {
        if (!this.levelsCache) {
            this.levelsCache = await GamificationDAO.getLevelDefinitions();
        }
        return this.levelsCache;
    }
    async getLevelInfo(level) {
        const definitions = await this.getLevelDefinitions();
        return definitions.find(d => d.level === level);
    }
    async calculateLevelFromXP(xp) {
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
            }
            else {
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
    async grantXP(userId, amount, source = 'general') {
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
    async processLevelUp(userId, fromLevel, toLevel) {
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
    async getUserLevel(userId) {
        const profile = await GamificationDAO.getUserProfile(userId);
        const levelInfo = await this.calculateLevelFromXP(profile.xp);
        return { ...levelInfo, userId, coins: profile.coins };
    }
    // Badges
    async getAllBadges() {
        if (!this.badgesCache) {
            this.badgesCache = await GamificationDAO.getAllBadges();
        }
        return this.badgesCache;
    }
    async getUserBadges(userId) {
        return await GamificationDAO.getUserBadges(userId);
    }
    async getBadgesWithStatus(userId) {
        return await GamificationDAO.getBadgesWithStatus(userId);
    }
    async grantBadge(userId, badgeId, details = null) {
        const existing = await GamificationDAO.getUserBadge(userId, badgeId);
        if (existing) {
            return false; // Already has badge
        }
        await GamificationDAO.grantBadge(userId, badgeId, details);
        await this.grantXP(userId, 50, 'badge_earned');
        devLogger.log(`[LEVELS] Badge ${badgeId} granted to user ${userId}`);
        return true;
    }
    async checkLevelBadge(userId, level) {
        const levelBadges = {
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
    async checkActivityBadges(userId, activityType, value) {
        const activityBadges = {
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
    async setFeaturedBadge(userId, badgeId) {
        await GamificationDAO.setFeaturedBadge(userId, badgeId);
    }
    // Profile
    async getUserProfile(userId) {
        const profile = await GamificationDAO.getUserProfile(userId);
        const levelInfo = await this.calculateLevelFromXP(profile.xp);
        const badges = await this.getUserBadges(userId);
        const featuredBadge = badges.find((b) => b.is_featured);
        return {
            userId,
            level: levelInfo.level,
            xp: profile.xp,
            coins: profile.coins,
            badges,
            featuredBadge
        };
    }
    async createUserProfile(userId) {
        await GamificationDAO.createProfile(userId);
    }
    // Features & Unlocks
    async getUnlocksForLevel(level) {
        return await GamificationDAO.getUnlocksForLevel(level);
    }
    async getAvailableFeatures(userId) {
        const level = await this.getUserLevel(userId);
        return await GamificationDAO.getAvailableFeatures(level.level);
    }
    async hasFeatureAccess(userId, featureSlug) {
        const features = await this.getAvailableFeatures(userId);
        return features.includes(featureSlug);
    }
    // Leaderboard
    async getXPLeaderboard(limit = 10) {
        return await GamificationDAO.getXPLeaderboard(limit);
    }
    async getUserRank(userId) {
        return await GamificationDAO.getUserRank(userId);
    }
    async getLevelHistory(userId, limit = 10) {
        return await GamificationDAO.getLevelHistory(userId, limit);
    }
    // Coins
    async addCoinsToUser(userId, amount) {
        await GamificationDAO.addCoins(userId, amount);
    }
    async createTransaction(userId, amount, description) {
        await GamificationDAO.createTransaction(userId, amount, description);
    }
    // Cache
    invalidateCache() {
        this.levelsCache = null;
        this.badgesCache = null;
    }
}
exports.LevelsService = LevelsService;
// ============================================
// EXPORTS
// ============================================
const levelsService = new LevelsService();
exports.default = levelsService;
module.exports = levelsService;
module.exports.LevelsService = LevelsService;
//# sourceMappingURL=levels.service.js.map
/**
 * 🌟 LEVELS SERVICE
 * Servicio para sistema de niveles, XP y badges
 * 
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar GamificationDAO
 * - Sin SQL directo en el servicio
 */

const GamificationDAO = require('../data/gamification.dao.js');

class LevelsService {
    constructor() {
        // Cache de niveles (se carga una vez)
        this.levelsCache = null;
        this.badgesCache = null;
    }

    // =====================================
    // GESTIÓN DE NIVELES
    // =====================================

    async getLevelDefinitions() {
        if (this.levelsCache) return this.levelsCache;
        this.levelsCache = await GamificationDAO.getLevelDefinitions();
        return this.levelsCache;
    }

    async getLevelInfo(level) {
        const levels = await this.getLevelDefinitions();
        return levels.find(l => l.level === level) || null;
    }

    async calculateLevelFromXP(xp) {
        const levels = await this.getLevelDefinitions();

        let currentLevel = levels[0];
        for (const level of levels) {
            if (xp >= level.xp_required) {
                currentLevel = level;
            } else {
                break;
            }
        }

        const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
        let progressToNext = 100;
        let xpForNext = 0;

        if (nextLevel) {
            const xpInCurrentLevel = xp - currentLevel.xp_required;
            const xpNeededForNext = nextLevel.xp_required - currentLevel.xp_required;
            progressToNext = Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
            xpForNext = nextLevel.xp_required - xp;
        }

        return {
            level: currentLevel.level,
            title: currentLevel.title,
            subtitle: currentLevel.subtitle,
            icon: currentLevel.icon,
            color: currentLevel.color,
            currentXP: xp,
            xpForCurrentLevel: currentLevel.xp_required,
            xpForNextLevel: nextLevel ? nextLevel.xp_required : currentLevel.xp_required,
            xpNeeded: xpForNext,
            progressPercent: Math.min(progressToNext, 100),
            isMaxLevel: !nextLevel
        };
    }

    async grantXP(userId, amount, source = 'general') {
        const balance = await GamificationDAO.getUserBalance(userId);
        if (!balance) {
            throw new Error('Usuario no tiene balance de IACoins');
        }

        const currentXP = balance.experience_points;
        const currentLevel = balance.level;
        const newXP = currentXP + amount;

        await GamificationDAO.updateXP(userId, newXP);

        const newLevelInfo = await this.calculateLevelFromXP(newXP);
        let levelUpRewards = null;

        if (newLevelInfo.level > currentLevel) {
            levelUpRewards = await this.processLevelUp(userId, currentLevel, newLevelInfo.level);
        }

        return {
            xpGranted: amount,
            source,
            totalXP: newXP,
            levelInfo: newLevelInfo,
            levelUp: levelUpRewards
        };
    }

    async processLevelUp(userId, fromLevel, toLevel) {
        const rewards = { coinsEarned: 0, badgesEarned: [], unlocks: [] };

        for (let level = fromLevel + 1; level <= toLevel; level++) {
            const levelInfo = await this.getLevelInfo(level);
            if (!levelInfo) continue;

            if (levelInfo.reward_coins > 0) {
                rewards.coinsEarned += levelInfo.reward_coins;
                await GamificationDAO.addCoins(userId, levelInfo.reward_coins);
                await GamificationDAO.createTransaction(userId, levelInfo.reward_coins, 'earn', `Subida a nivel ${level}: ${levelInfo.title}`);
            }

            const balance = await GamificationDAO.getUserBalance(userId);
            await GamificationDAO.recordLevelUp(userId, level, fromLevel, balance?.experience_points || 0, levelInfo.reward_coins, levelInfo.unlocks);

            const levelBadge = await this.checkLevelBadge(userId, level);
            if (levelBadge) {
                rewards.badgesEarned.push(levelBadge);
            }

            const unlocks = await GamificationDAO.getUnlocksForLevel(level);
            if (unlocks.length > 0) {
                rewards.unlocks.push(...unlocks);
            }
        }

        await GamificationDAO.updateLevel(userId, toLevel);
        return rewards;
    }

    async getUserLevel(userId) {
        const data = await GamificationDAO.getUserLevelWithDetails(userId);
        if (!data) return null;

        const levelInfo = await this.calculateLevelFromXP(data.experience_points);
        return { ...data, ...levelInfo };
    }

    // =====================================
    // GESTIÓN DE BADGES
    // =====================================

    async getAllBadges() {
        if (this.badgesCache) return this.badgesCache;
        this.badgesCache = await GamificationDAO.getAllBadges();
        return this.badgesCache;
    }

    async getUserBadges(userId) {
        return GamificationDAO.getUserBadges(userId);
    }

    async getBadgesWithStatus(userId) {
        return GamificationDAO.getBadgesWithStatus(userId);
    }

    async grantBadge(userId, badgeId, details = null) {
        const hasBadge = await GamificationDAO.hasBadge(userId, badgeId);
        if (hasBadge) {
            return { success: false, message: 'Badge ya otorgado' };
        }

        const badge = await GamificationDAO.getBadgeById(badgeId);
        if (!badge) {
            throw new Error('Badge no encontrado');
        }

        await GamificationDAO.grantBadge(userId, badgeId, details);

        if (badge.reward_coins > 0) {
            await GamificationDAO.addCoins(userId, badge.reward_coins);
            await GamificationDAO.createTransaction(userId, badge.reward_coins, 'earn', `Badge obtenido: ${badge.name}`);
        }

        if (badge.reward_xp > 0) {
            await this.grantXP(userId, badge.reward_xp, `Badge: ${badge.name}`);
        }

        return {
            success: true,
            badge,
            rewards: { coins: badge.reward_coins, xp: badge.reward_xp }
        };
    }

    async checkLevelBadge(userId, level) {
        const badges = await GamificationDAO.getBadgesByLevel(level);
        if (badges.length === 0) return null;

        const badge = badges[0];
        const result = await this.grantBadge(userId, badge.id, { level_reached: level });
        return result.success ? badge : null;
    }

    async checkActivityBadges(userId, activityType, value) {
        const badges = await GamificationDAO.getBadgesByRequirement(activityType, value);
        const granted = [];

        for (const badge of badges) {
            const result = await this.grantBadge(userId, badge.id, { activity_type: activityType, value });
            if (result.success) {
                granted.push(badge);
            }
        }

        return granted;
    }

    async setFeaturedBadge(userId, badgeId) {
        const result = await GamificationDAO.setFeaturedBadge(userId, badgeId);
        return !!result;
    }

    // =====================================
    // PERFIL DE USUARIO
    // =====================================

    async getUserProfile(userId) {
        const levelData = await GamificationDAO.getUserLevelWithDetails(userId);
        if (!levelData) {
            return this.createUserProfile(userId);
        }

        const [badges, levelInfo] = await Promise.all([
            this.getUserBadges(userId),
            this.calculateLevelFromXP(levelData.experience_points || 0)
        ]);

        return {
            ...levelData,
            featuredBadges: badges,
            levelInfo
        };
    }

    async createUserProfile(userId) {
        // Crear balance inicial si no existe
        const balance = await GamificationDAO.getUserBalance(userId);
        if (!balance) {
            throw new Error('Usuario no tiene balance de IACoins - debe crearse primero');
        }
        return { user_id: userId, level: balance.level, experience_points: balance.experience_points };
    }

    // =====================================
    // DESBLOQUEOS
    // =====================================

    async getUnlocksForLevel(level) {
        return GamificationDAO.getUnlocksForLevel(level);
    }

    async getAvailableFeatures(userId) {
        const userLevel = await this.getUserLevel(userId);
        if (!userLevel) return [];
        return GamificationDAO.getUnlocksForLevel(userLevel.level);
    }

    async hasFeatureAccess(userId, featureSlug) {
        const userLevel = await this.getUserLevel(userId);
        if (!userLevel) return false;
        return GamificationDAO.hasFeatureAccess(featureSlug, userLevel.level);
    }

    // =====================================
    // LEADERBOARD
    // =====================================

    async getXPLeaderboard(limit = 10) {
        const results = await GamificationDAO.getXPLeaderboard(limit);
        return results.map((user, index) => ({ rank: index + 1, ...user }));
    }

    async getUserRank(userId) {
        return GamificationDAO.getUserRank(userId);
    }

    // =====================================
    // HISTORIAL
    // =====================================

    async getLevelHistory(userId, limit = 10) {
        return GamificationDAO.getLevelHistory(userId, limit);
    }

    // =====================================
    // MONEDAS
    // =====================================

    async addCoinsToUser(userId, amount) {
        return GamificationDAO.addCoins(userId, amount);
    }

    async createTransaction(userId, amount, description) {
        return GamificationDAO.createTransaction(userId, amount, 'earn', description);
    }

    // =====================================
    // HELPERS
    // =====================================

    invalidateCache() {
        this.levelsCache = null;
        this.badgesCache = null;
    }
}

module.exports = new LevelsService();

"use strict";
/**
 * 🏆 CHALLENGES SERVICE - TypeScript Version
 * Gestión de retos dinámicos y gamificación
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengesService = void 0;
const ChallengeDAO = require('../data/challenge.dao');
const devLogger = require('../utils/devLogger');
// ============================================
// CHALLENGES SERVICE CLASS
// ============================================
class ChallengesService {
    constructor() {
        this.streakMultipliers = {
            3: 1.1, 7: 1.25, 14: 1.5, 30: 2.0, 60: 2.5, 100: 3.0
        };
        this.subjects = ['matematicas', 'espanol', 'ciencias', 'historia', 'ingles', 'civica'];
        devLogger.log('[CHALLENGES] Service initialized');
    }
    async getAvailableChallenges(userId, options = {}) {
        const challenges = await ChallengeDAO.getAvailableChallenges(options);
        return Promise.all(challenges.map((c) => this.processChallenge(c, userId)));
    }
    async getChallengeById(challengeId, userId) {
        const challenge = await ChallengeDAO.getChallengeById(challengeId);
        return challenge ? this.processChallenge(challenge, userId) : null;
    }
    async getDailyChallenges(userId) {
        return await ChallengeDAO.getDailyChallenges(userId);
    }
    async getFeaturedChallenges(userId, limit = 5) {
        const challenges = await ChallengeDAO.getFeaturedChallenges(limit);
        return Promise.all(challenges.map((c) => this.processChallenge(c, userId)));
    }
    async startChallenge(userId, challengeId) {
        const existing = await ChallengeDAO.getUserChallenge(userId, challengeId);
        if (existing) {
            return existing;
        }
        const challenge = await ChallengeDAO.getChallengeById(challengeId);
        if (!challenge || !challenge.isActive) {
            throw new Error('Reto no disponible');
        }
        return await ChallengeDAO.startChallenge(userId, challengeId);
    }
    async updateProgress(userId, challengeId, incrementBy = 1, progressData = null) {
        const userChallenge = await ChallengeDAO.getUserChallenge(userId, challengeId);
        if (!userChallenge) {
            throw new Error('Reto no iniciado');
        }
        if (userChallenge.completed) {
            return userChallenge;
        }
        const challenge = await ChallengeDAO.getChallengeById(challengeId);
        const newProgress = userChallenge.progress + incrementBy;
        const completed = newProgress >= challenge.target;
        return await ChallengeDAO.updateProgress(userId, challengeId, newProgress, completed);
    }
    async claimReward(userId, challengeId) {
        const userChallenge = await ChallengeDAO.getUserChallenge(userId, challengeId);
        if (!userChallenge || !userChallenge.completed) {
            throw new Error('Reto no completado');
        }
        if (userChallenge.rewardClaimed) {
            throw new Error('Recompensa ya reclamada');
        }
        const challenge = await ChallengeDAO.getChallengeById(challengeId);
        const multiplier = await this.getStreakMultiplier(userId);
        const xp = Math.round(challenge.xpReward * multiplier);
        const coins = Math.round(challenge.coinsReward * multiplier);
        await ChallengeDAO.claimReward(userId, challengeId, xp, coins);
        await this.checkLevelUp(userId);
        return { xp, coins };
    }
    // Streaks
    async updateStreak(userId, streakType = 'daily_login') {
        const streak = await ChallengeDAO.getUserStreak(userId, streakType);
        if (!streak) {
            return await ChallengeDAO.createStreak(userId, streakType);
        }
        const lastUpdate = new Date(streak.last_activity);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 0) {
            return streak; // Already updated today
        }
        else if (daysDiff === 1) {
            return await ChallengeDAO.incrementStreak(userId, streakType);
        }
        else {
            return await ChallengeDAO.resetStreak(userId, streakType);
        }
    }
    async getUserStreaks(userId) {
        return await ChallengeDAO.getUserStreaks(userId);
    }
    calculateStreakBonus(streak) {
        for (const [days, multiplier] of Object.entries(this.streakMultipliers).reverse()) {
            if (streak >= parseInt(days)) {
                return multiplier;
            }
        }
        return 1.0;
    }
    async getStreakMultiplier(userId) {
        const streaks = await ChallengeDAO.getUserStreaks(userId);
        const loginStreak = streaks.find((s) => s.streak_type === 'daily_login');
        return loginStreak ? this.calculateStreakBonus(loginStreak.current_streak) : 1.0;
    }
    // Collaborative
    async joinCollaborativeChallenge(userId, challengeId) {
        const challenge = await ChallengeDAO.getChallengeById(challengeId);
        if (!challenge || challenge.type !== 'collaborative') {
            throw new Error('Reto colaborativo no encontrado');
        }
        return await ChallengeDAO.joinCollaborative(userId, challengeId);
    }
    async getCollaborativeParticipants(challengeId) {
        return await ChallengeDAO.getCollaborativeParticipants(challengeId);
    }
    // Helpers
    async processChallenge(challenge, userId) {
        const userProgress = await ChallengeDAO.getUserChallenge(userId, challenge.id);
        return { ...challenge, userProgress };
    }
    async checkLevelUp(userId) {
        await ChallengeDAO.checkAndProcessLevelUp(userId);
    }
    async getUserChallengeStats(userId) {
        return await ChallengeDAO.getUserStats(userId);
    }
}
exports.ChallengesService = ChallengesService;
// ============================================
// EXPORTS
// ============================================
const challengesService = new ChallengesService();
exports.default = challengesService;
module.exports = challengesService;
module.exports.ChallengesService = ChallengesService;
//# sourceMappingURL=challenges.service.js.map
/**
 * 🏆 CHALLENGES SERVICE
 * Servicio para gestión de retos dinámicos
 * 
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar ChallengeDAO
 * - Sin SQL directo en el servicio
 */

const ChallengeDAO = require('../data/challenge.dao');

class ChallengesService {
    constructor() {
        this.streakMultipliers = {
            3: 1.1, 7: 1.25, 14: 1.5, 30: 2.0, 60: 2.5, 100: 3.0
        };
        this.subjects = [
            'Matemáticas', 'Física', 'Química', 'Biología', 'Historia',
            'Geografía', 'Español', 'Inglés', 'Filosofía', 'Ética',
            'Informática', 'Economía', 'Sociología', 'Psicología', 'Arte',
            'Música', 'Educación Física', 'Civismo', 'Ecología', 'Derecho'
        ];
    }

    // =====================================
    // OBTENER RETOS
    // =====================================

    async getAvailableChallenges(userId, options = {}) {
        const challenges = await ChallengeDAO.getAvailableChallenges(userId, options);
        return challenges.map(c => this.processChallenge(c, userId));
    }

    async getChallengeById(challengeId, userId) {
        const challenge = await ChallengeDAO.getChallengeById(challengeId, userId);
        return challenge ? this.processChallenge(challenge, userId) : null;
    }

    async getDailyChallenges(userId) {
        return this.getAvailableChallenges(userId, { frequency: 'daily', limit: 10 });
    }

    async getFeaturedChallenges(userId, limit = 5) {
        const challenges = await ChallengeDAO.getFeaturedChallenges(userId, limit);
        return challenges.map(c => this.processChallenge(c, userId));
    }

    // =====================================
    // PROGRESO DE RETOS
    // =====================================

    async startChallenge(userId, challengeId) {
        const challenge = await this.getChallengeById(challengeId, userId);
        if (!challenge) throw new Error('Reto no encontrado');

        if (challenge.user_status) {
            return { success: true, message: 'Reto ya iniciado', progress: challenge };
        }

        const userLevel = await ChallengeDAO.getUserLevel(userId);
        if (userLevel < challenge.min_level) {
            throw new Error(`Necesitas nivel ${challenge.min_level} para este reto`);
        }

        if (challenge.prerequisites?.length > 0) {
            const completedPrereqs = await ChallengeDAO.checkPrerequisites(userId, challenge.prerequisites);
            if (!completedPrereqs) {
                throw new Error('No has completado los retos previos requeridos');
            }
        }

        const targetProgress = challenge.completion_criteria?.target || 1;
        const progress = await ChallengeDAO.createProgress(userId, challengeId, targetProgress);

        return { success: true, message: 'Reto iniciado', progress };
    }

    async updateProgress(userId, challengeId, incrementBy = 1, progressData = null) {
        let progress = await ChallengeDAO.getProgressWithChallenge(userId, challengeId);

        if (!progress) {
            await this.startChallenge(userId, challengeId);
            return this.updateProgress(userId, challengeId, incrementBy, progressData);
        }

        if (progress.status === 'claimed' && !progress.is_repeatable) {
            return { success: false, message: 'Reto ya completado' };
        }

        if (progress.max_completions && progress.completion_count >= progress.max_completions) {
            return { success: false, message: 'Límite de completaciones alcanzado' };
        }

        const newProgress = Math.min(progress.current_progress + incrementBy, progress.target_progress);
        const newStatus = (newProgress >= progress.target_progress && progress.status !== 'completed') ? 'completed' : progress.status;

        const updated = await ChallengeDAO.updateProgress(userId, challengeId, newProgress, newStatus, progressData);

        return {
            success: true,
            completed: newStatus === 'completed',
            progress: updated,
            canClaim: newStatus === 'completed'
        };
    }

    async claimReward(userId, challengeId) {
        const progress = await ChallengeDAO.getProgressWithChallenge(userId, challengeId);
        if (!progress) throw new Error('No tienes progreso en este reto');
        if (progress.status !== 'completed') throw new Error('El reto no está completado');

        const streakMultiplier = await this.getStreakMultiplier(userId);
        const totalMultiplier = (progress.bonus_multiplier || 1) * streakMultiplier;

        const coinsEarned = Math.floor(progress.reward_coins * totalMultiplier);
        const xpEarned = Math.floor(progress.reward_xp * totalMultiplier);

        await ChallengeDAO.addRewards(userId, coinsEarned, xpEarned);
        await ChallengeDAO.claimReward(userId, challengeId, coinsEarned, xpEarned);
        await ChallengeDAO.createTransaction(userId, coinsEarned, `Reto completado: ${progress.title}`);
        await this.checkLevelUp(userId);

        return {
            success: true,
            coinsEarned,
            xpEarned,
            multiplier: totalMultiplier,
            message: `¡Felicidades! Has ganado ${coinsEarned} IACoins y ${xpEarned} XP`
        };
    }

    // =====================================
    // SISTEMA DE STREAKS
    // =====================================

    async updateStreak(userId, streakType = 'daily_login') {
        const today = new Date().toISOString().split('T')[0];
        const streak = await ChallengeDAO.getStreak(userId, streakType);

        if (!streak) {
            const newStreak = await ChallengeDAO.createStreak(userId, streakType, today);
            return { ...newStreak, isNew: true };
        }

        const lastActivity = new Date(streak.last_activity_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastActivity) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return { ...streak, alreadyRecorded: true };

        let newCurrentStreak = streak.current_streak;
        let newLongestStreak = streak.longest_streak;
        let bonusCoins = 0, bonusXp = 0;

        if (diffDays === 1) {
            newCurrentStreak++;
            if (newCurrentStreak > newLongestStreak) newLongestStreak = newCurrentStreak;

            const bonus = this.calculateStreakBonus(newCurrentStreak);
            bonusCoins = bonus.coins;
            bonusXp = bonus.xp;

            if (bonusCoins > 0) {
                await ChallengeDAO.addRewards(userId, bonusCoins, bonusXp);
                await ChallengeDAO.createTransaction(userId, bonusCoins, `Bonus de racha: ${newCurrentStreak} días`);
            }
        } else {
            newCurrentStreak = 1;
        }

        const updated = await ChallengeDAO.updateStreak(userId, streakType, newCurrentStreak, newLongestStreak, today, bonusCoins, bonusXp);

        return { ...updated, streakBroken: diffDays > 1, bonusCoins, bonusXp };
    }

    async getUserStreaks(userId) {
        return ChallengeDAO.getAllStreaks(userId);
    }

    calculateStreakBonus(streak) {
        const milestones = {
            7: { coins: 25, xp: 100 }, 14: { coins: 50, xp: 200 },
            30: { coins: 150, xp: 500 }, 60: { coins: 300, xp: 1000 },
            100: { coins: 500, xp: 2000 }, 365: { coins: 2000, xp: 10000 }
        };
        return milestones[streak] || { coins: 0, xp: 0 };
    }

    async getStreakMultiplier(userId) {
        const streaks = await this.getUserStreaks(userId);
        const loginStreak = streaks.find(s => s.streak_type === 'daily_login');
        if (!loginStreak) return 1.0;

        let multiplier = 1.0;
        for (const [days, mult] of Object.entries(this.streakMultipliers)) {
            if (loginStreak.current_streak >= parseInt(days)) multiplier = mult;
        }
        return multiplier;
    }

    // =====================================
    // RETOS COLABORATIVOS
    // =====================================

    async joinCollaborativeChallenge(userId, challengeId) {
        const challenge = await this.getChallengeById(challengeId, userId);
        if (!challenge?.is_collaborative) throw new Error('No es un reto colaborativo válido');

        const currentParticipants = await ChallengeDAO.getParticipantCount(challengeId);
        if (challenge.max_participants && currentParticipants >= challenge.max_participants) {
            throw new Error('El reto ya tiene el máximo de participantes');
        }

        const participation = await ChallengeDAO.addParticipant(challengeId, userId);
        await this.startChallenge(userId, challengeId);

        return { success: true, participation, message: 'Te has unido al reto colaborativo' };
    }

    async getCollaborativeParticipants(challengeId) {
        return ChallengeDAO.getParticipants(challengeId);
    }

    // =====================================
    // HELPERS
    // =====================================

    processChallenge(challenge, userId) {
        return {
            ...challenge,
            completion_criteria: typeof challenge.completion_criteria === 'string'
                ? JSON.parse(challenge.completion_criteria) : challenge.completion_criteria,
            progress_percentage: challenge.target_progress
                ? Math.round((challenge.current_progress || 0) / challenge.target_progress * 100) : 0,
            can_start: !challenge.user_status,
            can_claim: challenge.user_status === 'completed'
        };
    }

    async checkLevelUp(userId) {
        const balance = await ChallengeDAO.getBalance(userId);
        if (!balance) return;

        const requiredXp = Math.floor(100 * Math.pow(1.5, balance.level));
        if (balance.experience_points >= requiredXp) {
            await ChallengeDAO.updateLevel(userId);
        }
    }

    async getUserChallengeStats(userId) {
        return ChallengeDAO.getUserChallengeStats(userId);
    }
}

module.exports = new ChallengesService();

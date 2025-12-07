/**
 * 🏆 CHALLENGES SERVICE - TypeScript Version
 * Gestión de retos dinámicos y gamificación
 * Refactorizado: 07 Diciembre 2025
 */

const ChallengeDAO = require('../data/challenge.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// CHALLENGES SERVICE CLASS
// ============================================

class ChallengesService {
    private streakMultipliers: StreakMultipliers;
    private subjects: string[];

    constructor() {
        this.streakMultipliers = {
            3: 1.1, 7: 1.25, 14: 1.5, 30: 2.0, 60: 2.5, 100: 3.0
        };
        this.subjects = ['matematicas', 'espanol', 'ciencias', 'historia', 'ingles', 'civica'];

        devLogger.log('[CHALLENGES] Service initialized');
    }

    async getAvailableChallenges(userId: number, options: ChallengeOptions = {}): Promise<Challenge[]> {
        const challenges = await ChallengeDAO.getAvailableChallenges(options);
        return Promise.all(challenges.map((c: Challenge) => this.processChallenge(c, userId)));
    }

    async getChallengeById(challengeId: number, userId: number): Promise<Challenge | null> {
        const challenge = await ChallengeDAO.getChallengeById(challengeId);
        return challenge ? this.processChallenge(challenge, userId) : null;
    }

    async getDailyChallenges(userId: number): Promise<Challenge[]> {
        return await ChallengeDAO.getDailyChallenges(userId);
    }

    async getFeaturedChallenges(userId: number, limit: number = 5): Promise<Challenge[]> {
        const challenges = await ChallengeDAO.getFeaturedChallenges(limit);
        return Promise.all(challenges.map((c: Challenge) => this.processChallenge(c, userId)));
    }

    async startChallenge(userId: number, challengeId: number): Promise<UserChallenge> {
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

    async updateProgress(userId: number, challengeId: number, incrementBy: number = 1, progressData: any = null): Promise<UserChallenge> {
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

    async claimReward(userId: number, challengeId: number): Promise<{ xp: number; coins: number }> {
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
    async updateStreak(userId: number, streakType: string = 'daily_login'): Promise<any> {
        const streak = await ChallengeDAO.getUserStreak(userId, streakType);

        if (!streak) {
            return await ChallengeDAO.createStreak(userId, streakType);
        }

        const lastUpdate = new Date(streak.last_activity);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            return streak; // Already updated today
        } else if (daysDiff === 1) {
            return await ChallengeDAO.incrementStreak(userId, streakType);
        } else {
            return await ChallengeDAO.resetStreak(userId, streakType);
        }
    }

    async getUserStreaks(userId: number): Promise<any[]> {
        return await ChallengeDAO.getUserStreaks(userId);
    }

    calculateStreakBonus(streak: number): number {
        for (const [days, multiplier] of Object.entries(this.streakMultipliers).reverse()) {
            if (streak >= parseInt(days)) {
                return multiplier;
            }
        }
        return 1.0;
    }

    async getStreakMultiplier(userId: number): Promise<number> {
        const streaks = await ChallengeDAO.getUserStreaks(userId);
        const loginStreak = streaks.find((s: any) => s.streak_type === 'daily_login');
        return loginStreak ? this.calculateStreakBonus(loginStreak.current_streak) : 1.0;
    }

    // Collaborative
    async joinCollaborativeChallenge(userId: number, challengeId: number): Promise<any> {
        const challenge = await ChallengeDAO.getChallengeById(challengeId);
        if (!challenge || challenge.type !== 'collaborative') {
            throw new Error('Reto colaborativo no encontrado');
        }
        return await ChallengeDAO.joinCollaborative(userId, challengeId);
    }

    async getCollaborativeParticipants(challengeId: number): Promise<any[]> {
        return await ChallengeDAO.getCollaborativeParticipants(challengeId);
    }

    // Helpers
    private async processChallenge(challenge: Challenge, userId: number): Promise<Challenge & { userProgress?: UserChallenge }> {
        const userProgress = await ChallengeDAO.getUserChallenge(userId, challenge.id);
        return { ...challenge, userProgress };
    }

    private async checkLevelUp(userId: number): Promise<void> {
        await ChallengeDAO.checkAndProcessLevelUp(userId);
    }

    async getUserChallengeStats(userId: number): Promise<any> {
        return await ChallengeDAO.getUserStats(userId);
    }
}

// ============================================
// EXPORTS
// ============================================

const challengesService = new ChallengesService();

export { ChallengesService };
export default challengesService;

module.exports = challengesService;
module.exports.ChallengesService = ChallengesService;

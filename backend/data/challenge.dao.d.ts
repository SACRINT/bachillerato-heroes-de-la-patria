/**
 * 🏆 CHALLENGE DAO - TypeScript
 * Data Access Object para sistema de retos
 * Abstrae todas las queries SQL de ChallengesService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface Challenge {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    frequency: string;
    subject?: string;
    is_active: boolean;
    start_date?: Date;
    end_date?: Date;
    created_at: Date;
    featured: boolean;
    sort_order: number;
    completion_criteria: any;
    reward_coins: number;
    reward_xp: number;
    is_repeatable: boolean;
    max_completions?: number;
    bonus_multiplier?: number;
    user_status?: string;
    current_progress?: number;
    target_progress?: number;
    completion_count?: number;
    coins_earned?: number;
    xp_earned?: number;
    started_at?: Date;
    first_completed_at?: Date;
}
export interface ChallengeProgress {
    id: number;
    user_id: number;
    challenge_id: number;
    status: 'in_progress' | 'completed' | 'claimed';
    current_progress: number;
    target_progress: number;
    progress_data?: any;
    completion_count: number;
    coins_earned: number;
    xp_earned: number;
    started_at: Date;
    updated_at: Date;
    first_completed_at?: Date;
    last_completed_at?: Date;
    claimed_at?: Date;
    completion_criteria?: any;
    reward_coins?: number;
    reward_xp?: number;
    is_repeatable?: boolean;
    max_completions?: number;
    bonus_multiplier?: number;
    title?: string;
}
export interface UserStreak {
    id: number;
    user_id: number;
    streak_type: string;
    current_streak: number;
    longest_streak: number;
    total_completions: number;
    last_activity_date: Date;
    streak_started_at: Date;
    bonus_coins_earned: number;
    bonus_xp_earned: number;
    updated_at: Date;
}
export interface ChallengeParticipant {
    user_id: number;
    challenge_id: number;
    role: string;
    joined_at: Date;
    contribution_score: number;
    nombre?: string;
    apellido_paterno?: string;
    level?: number;
}
export interface IacoinsBalance {
    level: number;
    experience_points: number;
    balance?: number;
    total_earned?: number;
}
export interface ChallengeOptions {
    category?: string;
    difficulty?: string;
    frequency?: string;
    subject?: string;
    includeProgress?: boolean;
    limit?: number;
    offset?: number;
}
export interface ChallengeStats {
    completed: number;
    in_progress: number;
    total_coins: number;
    total_xp: number;
}
declare class ChallengeDAO {
    static getAvailableChallenges(userId: number, options?: ChallengeOptions): Promise<Challenge[]>;
    static getChallengeById(challengeId: number, userId: number): Promise<Challenge | null>;
    static getFeaturedChallenges(userId: number, limit?: number): Promise<Challenge[]>;
    static createProgress(userId: number, challengeId: number, targetProgress: number): Promise<ChallengeProgress>;
    static getProgressWithChallenge(userId: number, challengeId: number): Promise<ChallengeProgress | null>;
    static updateProgress(userId: number, challengeId: number, newProgress: number, status: string, progressData?: any): Promise<ChallengeProgress>;
    static claimReward(userId: number, challengeId: number, coinsEarned: number, xpEarned: number): Promise<ChallengeProgress>;
    static getStreak(userId: number, streakType: string): Promise<UserStreak | null>;
    static createStreak(userId: number, streakType: string, date: Date | string): Promise<UserStreak>;
    static updateStreak(userId: number, streakType: string, currentStreak: number, longestStreak: number, date: Date | string, bonusCoins: number, bonusXp: number): Promise<UserStreak>;
    static getAllStreaks(userId: number): Promise<UserStreak[]>;
    static getParticipantCount(challengeId: number): Promise<number>;
    static addParticipant(challengeId: number, userId: number): Promise<ChallengeParticipant | null>;
    static getParticipants(challengeId: number): Promise<ChallengeParticipant[]>;
    static getUserLevel(userId: number): Promise<number>;
    static checkPrerequisites(userId: number, prerequisiteIds: number[]): Promise<boolean>;
    static addRewards(userId: number, coins: number, xp: number): Promise<void>;
    static getBalance(userId: number): Promise<IacoinsBalance | null>;
    static updateLevel(userId: number): Promise<void>;
    static createTransaction(userId: number, amount: number, description: string): Promise<any>;
    static getUserChallengeStats(userId: number): Promise<ChallengeStats>;
}
export default ChallengeDAO;
//# sourceMappingURL=challenge.dao.d.ts.map
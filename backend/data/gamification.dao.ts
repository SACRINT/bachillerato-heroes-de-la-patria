/**
 * 🎮 GAMIFICATION DAO - TypeScript
 * Data Access Object para sistema de gamificación
 * Abstrae todo el SQL de niveles, XP, badges y monedas
 * 
 * Migración TypeScript: 07 Diciembre 2025
 * Usa tabla iacoins_balance para XP, niveles y monedas
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface LevelDefinition {
    level: number;
    xp_required: number;
    title: string;
    subtitle?: string;
    icon?: string;
    color?: string;
    description?: string;
}

export interface UserBalance {
    user_id?: number;
    experience_points: number;
    level: number;
    balance: number;
    total_earned: number;
    total_spent?: number;
    updated_at?: Date;
    // Joined details
    title?: string;
    subtitle?: string;
    icon?: string;
    color?: string;
    description?: string;
}

export interface LevelHistory {
    id: number;
    user_id: number;
    level: number;
    previous_level: number;
    xp_at_levelup: number;
    coins_earned: number;
    unlocks_gained: any; // JSON
    achieved_at: Date;
}

export interface Badge {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon_url: string;
    category: string;
    rarity: string;
    xp_reward: number;
    coins_reward: number;
    requirement_type: string;
    requirement_value: number;
    is_active: boolean;
    is_hidden: boolean;
    sort_order: number;
    // Joined user fields
    earned_at?: Date;
    is_featured?: boolean;
    earn_details?: any;
    earned?: boolean;
}

export interface UserBadge {
    id: number;
    user_id: number;
    badge_id: number;
    earned_at: Date;
    is_featured: boolean;
    earn_details?: any;
}

export interface Transaction {
    id: number;
    user_id: number;
    amount: number;
    type: string;
    description: string;
    reference_id?: string;
    reference_type?: string;
    created_at: Date;
}

export interface LevelUnlock {
    id: number;
    level: number;
    feature_slug: string;
    description: string;
    is_active: boolean;
}

export interface UserStreak {
    id: number;
    user_id: number;
    streak_type: string;
    current_streak: number;
    longest_streak: number;
    last_activity_date: Date;
    updated_at: Date;
}

export interface XPLeaderboardEntry {
    user_id: number;
    level: number;
    experience_points: number;
    balance: number;
    nombre: string;
    apellido_paterno: string;
    avatar_url?: string;
    level_title?: string;
    level_icon?: string;
    rank: number;
}

export interface BadgesLeaderboardEntry {
    user_id: number;
    badge_count: number;
    nombre: string;
    apellido_paterno: string;
    rank: number;
}

export interface Challenge {
    id: number;
    title: string;
    description: string;
    icon: string;
    category: string;
    difficulty: string;
    is_active: boolean;
    start_date?: Date;
    end_date?: Date;
    priority: number;
    // Joined fields
    status?: string;
    progress?: number;
    started_at?: Date;
    claimed_at?: Date;
    coins_earned?: number;
    xp_earned?: number;
}

// =====================================================
// GAMIFICATION DAO CLASS
// =====================================================

class GamificationDAO {

    // ==========================================
    // NIVELES Y XP
    // ==========================================

    /**
     * Obtiene todas las definiciones de niveles
     */
    static async getLevelDefinitions(): Promise<LevelDefinition[]> {
        const query = `SELECT * FROM level_definitions ORDER BY level ASC`;
        return executeQuery(query, []);
    }

    /**
     * Obtiene balance de usuario (XP, nivel, monedas)
     */
    static async getUserBalance(userId: number): Promise<UserBalance> {
        const query = `SELECT experience_points, level, balance, total_earned FROM iacoins_balance WHERE user_id = $1`;
        const result = await executeQuery(query, [userId]);
        return result[0];
    }

    /**
     * Actualiza XP del usuario
     */
    static async updateXP(userId: number, newXP: number): Promise<void> {
        const query = `UPDATE iacoins_balance SET experience_points = $1, updated_at = NOW() WHERE user_id = $2`;
        await executeQuery(query, [newXP, userId]);
    }

    /**
     * Actualiza nivel del usuario
     */
    static async updateLevel(userId: number, newLevel: number): Promise<void> {
        const query = `UPDATE iacoins_balance SET level = $1, updated_at = NOW() WHERE user_id = $2`;
        await executeQuery(query, [newLevel, userId]);
    }

    /**
     * Obtiene el nivel actual del usuario con detalles
     */
    static async getUserLevelWithDetails(userId: number): Promise<UserBalance> {
        const query = `
            SELECT ib.level, ib.experience_points, ib.balance, ib.total_earned,
                   ld.title, ld.subtitle, ld.icon, ld.color, ld.description
            FROM iacoins_balance ib
            LEFT JOIN level_definitions ld ON ib.level = ld.level
            WHERE ib.user_id = $1
        `;
        const result = await executeQuery(query, [userId]);
        return result[0];
    }

    /**
     * Registra subida de nivel en historial
     */
    static async recordLevelUp(userId: number, level: number, previousLevel: number, xp: number, coinsEarned: number, unlocks: any): Promise<void> {
        const query = `
            INSERT INTO level_history (user_id, level, previous_level, xp_at_levelup, coins_earned, unlocks_gained)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await executeQuery(query, [userId, level, previousLevel, xp, coinsEarned, unlocks]);
    }

    /**
     * Obtiene historial de niveles del usuario
     */
    static async getLevelHistory(userId: number, limit: number = 10): Promise<LevelHistory[]> {
        const query = `SELECT * FROM level_history WHERE user_id = $1 ORDER BY achieved_at DESC LIMIT $2`;
        return executeQuery(query, [userId, limit]);
    }

    // ==========================================
    // BADGES
    // ==========================================

    /**
     * Obtiene todos los badges activos
     */
    static async getAllBadges(): Promise<Badge[]> {
        const query = `SELECT * FROM badges WHERE is_active = true ORDER BY category, sort_order, rarity`;
        return executeQuery(query, []);
    }

    /**
     * Obtiene badges de un usuario
     */
    static async getUserBadges(userId: number): Promise<Badge[]> {
        const query = `
            SELECT b.*, ub.earned_at, ub.is_featured, ub.earn_details
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = $1
            ORDER BY ub.is_featured DESC, ub.earned_at DESC
        `;
        return executeQuery(query, [userId]);
    }

    /**
     * Obtiene badges con estado (ganados y no ganados)
     */
    static async getBadgesWithStatus(userId: number): Promise<Badge[]> {
        const query = `
            SELECT b.*, ub.earned_at, ub.is_featured,
                   CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as earned
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
            WHERE b.is_active = true AND (b.is_hidden = false OR ub.id IS NOT NULL)
            ORDER BY b.category, earned DESC, b.sort_order
        `;
        return executeQuery(query, [userId]);
    }

    /**
     * Verifica si usuario ya tiene un badge
     */
    static async hasBadge(userId: number, badgeId: number): Promise<boolean> {
        const query = `SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2`;
        const result = await executeQuery(query, [userId, badgeId]);
        return result.length > 0;
    }

    /**
     * Obtiene información de un badge
     */
    static async getBadgeById(badgeId: number): Promise<Badge> {
        const query = `SELECT * FROM badges WHERE id = $1`;
        const result = await executeQuery(query, [badgeId]);
        return result[0];
    }

    /**
     * Otorga un badge a un usuario
     */
    static async grantBadge(userId: number, badgeId: number, details: any = null): Promise<UserBadge> {
        const query = `INSERT INTO user_badges (user_id, badge_id, earn_details) VALUES ($1, $2, $3) RETURNING *`;
        const result = await executeQuery(query, [userId, badgeId, details]);
        return result[0];
    }

    /**
     * Obtiene badges por tipo de requerimiento
     */
    static async getBadgesByRequirement(requirementType: string, value: number): Promise<Badge[]> {
        const query = `
            SELECT * FROM badges
            WHERE requirement_type = $1 AND requirement_value <= $2 AND is_active = true
        `;
        return executeQuery(query, [requirementType, value]);
    }

    /**
     * Obtiene badges por nivel
     */
    static async getBadgesByLevel(level: number): Promise<Badge[]> {
        const query = `SELECT * FROM badges WHERE requirement_type = 'level_reach' AND requirement_value = $1 AND is_active = true`;
        return executeQuery(query, [level]);
    }

    /**
     * Establece un badge como destacado
     */
    static async setFeaturedBadge(userId: number, badgeId: number): Promise<UserBadge> {
        await executeQuery(`UPDATE user_badges SET is_featured = false WHERE user_id = $1`, [userId]);
        const query = `UPDATE user_badges SET is_featured = true WHERE user_id = $1 AND badge_id = $2 RETURNING *`;
        const result = await executeQuery(query, [userId, badgeId]);
        return result[0];
    }

    // ==========================================
    // MONEDAS (IACoins)
    // ==========================================

    /**
     * Obtiene balance de monedas
     */
    static async getCoinBalance(userId: number): Promise<UserBalance> {
        const query = `SELECT balance, total_earned, total_spent FROM iacoins_balance WHERE user_id = $1`;
        const result = await executeQuery(query, [userId]);
        return result[0];
    }

    /**
     * Agrega monedas al usuario
     */
    static async addCoins(userId: number, amount: number): Promise<void> {
        const query = `
            UPDATE iacoins_balance 
            SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW()
            WHERE user_id = $2
        `;
        await executeQuery(query, [amount, userId]);
    }

    /**
     * Resta monedas del usuario
     */
    static async spendCoins(userId: number, amount: number): Promise<boolean> {
        const query = `
            UPDATE iacoins_balance 
            SET balance = balance - $1, total_spent = total_spent + $1, updated_at = NOW()
            WHERE user_id = $2 AND balance >= $1
            RETURNING *
        `;
        const result = await executeQuery(query, [amount, userId]);
        return result.length > 0;
    }

    /**
     * Crea transacción de monedas
     */
    static async createTransaction(userId: number, amount: number, type: string, description: string, reference: string | null = null): Promise<Transaction> {
        const query = `
            INSERT INTO iacoins_transactions (user_id, amount, type, description, reference_id, reference_type)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
        const result = await executeQuery(query, [userId, amount, type, description, reference, null]);
        return result[0];
    }

    /**
     * Obtiene historial de transacciones
     */
    static async getTransactionHistory(userId: number, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
        const query = `
            SELECT * FROM iacoins_transactions 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        `;
        return executeQuery(query, [userId, limit, offset]);
    }

    // ==========================================
    // DESBLOQUEOS Y FEATURES
    // ==========================================

    /**
     * Obtiene desbloqueos para un nivel
     */
    static async getUnlocksForLevel(level: number): Promise<LevelUnlock[]> {
        const query = `SELECT * FROM level_unlocks WHERE level = $1 AND is_active = true`;
        return executeQuery(query, [level]);
    }

    /**
     * Verifica acceso a feature
     */
    static async hasFeatureAccess(featureSlug: string, userLevel: number): Promise<boolean> {
        const query = `SELECT id FROM level_unlocks WHERE feature_slug = $1 AND level <= $2 AND is_active = true`;
        const result = await executeQuery(query, [featureSlug, userLevel]);
        return result.length > 0;
    }

    // ==========================================
    // STREAKS
    // ==========================================

    /**
     * Obtiene streak del usuario
     */
    static async getUserStreak(userId: number, streakType: string = 'daily_login'): Promise<UserStreak | undefined> {
        const query = `SELECT * FROM user_streaks WHERE user_id = $1 AND streak_type = $2`;
        const result = await executeQuery(query, [userId, streakType]);
        return result[0];
    }

    /**
     * Actualiza streak del usuario
     */
    static async updateStreak(userId: number, streakType: string, currentStreak: number, lastDate: Date): Promise<UserStreak> {
        const query = `
            INSERT INTO user_streaks (user_id, streak_type, current_streak, last_activity_date, longest_streak)
            VALUES ($1, $2, $3, $4, $3)
            ON CONFLICT (user_id, streak_type) DO UPDATE SET
                current_streak = CASE WHEN $3 > user_streaks.current_streak THEN $3 ELSE user_streaks.current_streak END,
                longest_streak = GREATEST(user_streaks.longest_streak, $3),
                last_activity_date = $4
            RETURNING *
        `;
        const result = await executeQuery(query, [userId, streakType, currentStreak, lastDate]);
        return result[0];
    }

    // ==========================================
    // LEADERBOARDS
    // ==========================================

    /**
     * Obtiene leaderboard por XP
     */
    static async getXPLeaderboard(limit: number = 10): Promise<XPLeaderboardEntry[]> {
        const query = `
            SELECT ib.user_id, ib.level, ib.experience_points, ib.balance,
                   u.nombre, u.apellido_paterno, u.avatar_url,
                   ld.title as level_title, ld.icon as level_icon,
                   ROW_NUMBER() OVER (ORDER BY ib.experience_points DESC) as rank
            FROM iacoins_balance ib
            JOIN usuarios u ON ib.user_id = u.id
            LEFT JOIN level_definitions ld ON ib.level = ld.level
            ORDER BY ib.experience_points DESC
            LIMIT $1
        `;
        const results = await executeQuery(query, [limit]);
        return results.map((row: any) => ({
            ...row,
            rank: parseInt(row.rank)
        }));
    }

    /**
     * Obtiene posición del usuario en leaderboard
     */
    static async getUserRank(userId: number): Promise<number | undefined> {
        const query = `
            SELECT rank FROM (
                SELECT user_id, ROW_NUMBER() OVER (ORDER BY experience_points DESC) as rank
                FROM iacoins_balance
            ) rankings WHERE user_id = $1
        `;
        const result = await executeQuery(query, [userId]);
        return result[0]?.rank ? parseInt(result[0].rank) : undefined;
    }

    /**
     * Obtiene leaderboard por badges
     */
    static async getBadgesLeaderboard(limit: number = 10): Promise<BadgesLeaderboardEntry[]> {
        const query = `
            SELECT ib.user_id, COUNT(ub.id) as badge_count,
                   u.nombre, u.apellido_paterno,
                   ROW_NUMBER() OVER (ORDER BY COUNT(ub.id) DESC) as rank
            FROM iacoins_balance ib
            JOIN usuarios u ON ib.user_id = u.id
            LEFT JOIN user_badges ub ON ib.user_id = ub.user_id
            GROUP BY ib.user_id, u.nombre, u.apellido_paterno
            ORDER BY badge_count DESC
            LIMIT $1
        `;
        const results = await executeQuery(query, [limit]);
        return results.map((row: any) => ({
            ...row,
            badge_count: parseInt(row.badge_count),
            rank: parseInt(row.rank)
        }));
    }

    // ==========================================
    // RETOS Y CHALLENGES
    // ==========================================

    /**
     * Obtiene retos activos
     */
    static async getActiveChallenges(): Promise<Challenge[]> {
        const query = `
            SELECT * FROM challenges 
            WHERE is_active = true 
            AND (start_date IS NULL OR start_date <= NOW())
            AND (end_date IS NULL OR end_date >= NOW())
            ORDER BY priority DESC, created_at DESC
        `;
        return executeQuery(query, []);
    }

    /**
     * Obtiene progreso de retos del usuario
     */
    static async getUserChallengeProgress(userId: number): Promise<Challenge[]> {
        const query = `
            SELECT c.*, cp.status, cp.progress, cp.started_at, cp.claimed_at, cp.coins_earned, cp.xp_earned
            FROM challenges c
            LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id AND cp.user_id = $1
            WHERE c.is_active = true
            ORDER BY c.priority DESC
        `;
        return executeQuery(query, [userId]);
    }

    /**
     * Actualiza progreso de reto
     */
    static async updateChallengeProgress(userId: number, challengeId: number, progress: number, status: string = 'in_progress'): Promise<{ id: number }> {
        const query = `
            INSERT INTO challenge_progress (user_id, challenge_id, progress, status, started_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id, challenge_id) DO UPDATE SET
                progress = $3, status = $4, updated_at = NOW()
            RETURNING *
        `;
        const result = await executeQuery(query, [userId, challengeId, progress, status]);
        return result[0];
    }

    /**
     * Reclama recompensa de reto
     */
    static async claimChallengeReward(userId: number, challengeId: number, coinsEarned: number, xpEarned: number): Promise<{ id: number }> {
        const query = `
            UPDATE challenge_progress 
            SET status = 'claimed', claimed_at = NOW(), coins_earned = $3, xp_earned = $4
            WHERE user_id = $1 AND challenge_id = $2 AND status = 'completed'
            RETURNING *
        `;
        const result = await executeQuery(query, [userId, challengeId, coinsEarned, xpEarned]);
        return result[0];
    }
}

export default GamificationDAO;
module.exports = GamificationDAO;

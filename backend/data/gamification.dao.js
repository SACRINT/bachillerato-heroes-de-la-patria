/**
 * 🎮 GAMIFICATION DAO
 * Data Access Object para sistema de gamificación
 * Abstrae todo el SQL de niveles, XP, badges y monedas
 * 
 * Refactorizado: 04 Diciembre 2025
 * Usa tabla iacoins_balance para XP, niveles y monedas
 */

const { executeQuery } = require('../config/database');

class GamificationDAO {

    // ==========================================
    // NIVELES Y XP
    // ==========================================

    /**
     * Obtiene todas las definiciones de niveles
     */
    static async getLevelDefinitions() {
        const query = `SELECT * FROM level_definitions ORDER BY level ASC`;
        return executeQuery(query, []);
    }

    /**
     * Obtiene balance de usuario (XP, nivel, monedas)
     */
    static async getUserBalance(userId) {
        const query = `SELECT experience_points, level, balance, total_earned FROM iacoins_balance WHERE user_id = $1`;
        const result = await executeQuery(query, [userId]);
        return result[0];
    }

    /**
     * Actualiza XP del usuario
     */
    static async updateXP(userId, newXP) {
        const query = `UPDATE iacoins_balance SET experience_points = $1, updated_at = NOW() WHERE user_id = $2`;
        await executeQuery(query, [newXP, userId]);
    }

    /**
     * Actualiza nivel del usuario
     */
    static async updateLevel(userId, newLevel) {
        const query = `UPDATE iacoins_balance SET level = $1, updated_at = NOW() WHERE user_id = $2`;
        await executeQuery(query, [newLevel, userId]);
    }

    /**
     * Obtiene el nivel actual del usuario con detalles
     */
    static async getUserLevelWithDetails(userId) {
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
    static async recordLevelUp(userId, level, previousLevel, xp, coinsEarned, unlocks) {
        const query = `
            INSERT INTO level_history (user_id, level, previous_level, xp_at_levelup, coins_earned, unlocks_gained)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await executeQuery(query, [userId, level, previousLevel, xp, coinsEarned, unlocks]);
    }

    /**
     * Obtiene historial de niveles del usuario
     */
    static async getLevelHistory(userId, limit = 10) {
        const query = `SELECT * FROM level_history WHERE user_id = $1 ORDER BY achieved_at DESC LIMIT $2`;
        return executeQuery(query, [userId, limit]);
    }

    // ==========================================
    // BADGES
    // ==========================================

    /**
     * Obtiene todos los badges activos
     */
    static async getAllBadges() {
        const query = `SELECT * FROM badges WHERE is_active = true ORDER BY category, sort_order, rarity`;
        return executeQuery(query, []);
    }

    /**
     * Obtiene badges de un usuario
     */
    static async getUserBadges(userId) {
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
    static async getBadgesWithStatus(userId) {
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
    static async hasBadge(userId, badgeId) {
        const query = `SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2`;
        const result = await executeQuery(query, [userId, badgeId]);
        return result.length > 0;
    }

    /**
     * Obtiene información de un badge
     */
    static async getBadgeById(badgeId) {
        const query = `SELECT * FROM badges WHERE id = $1`;
        const result = await executeQuery(query, [badgeId]);
        return result[0];
    }

    /**
     * Otorga un badge a un usuario
     */
    static async grantBadge(userId, badgeId, details = null) {
        const query = `INSERT INTO user_badges (user_id, badge_id, earn_details) VALUES ($1, $2, $3) RETURNING *`;
        const result = await executeQuery(query, [userId, badgeId, details]);
        return result[0];
    }

    /**
     * Obtiene badges por tipo de requerimiento
     */
    static async getBadgesByRequirement(requirementType, value) {
        const query = `
            SELECT * FROM badges
            WHERE requirement_type = $1 AND requirement_value <= $2 AND is_active = true
        `;
        return executeQuery(query, [requirementType, value]);
    }

    /**
     * Obtiene badges por nivel
     */
    static async getBadgesByLevel(level) {
        const query = `SELECT * FROM badges WHERE requirement_type = 'level_reach' AND requirement_value = $1 AND is_active = true`;
        return executeQuery(query, [level]);
    }

    /**
     * Establece un badge como destacado
     */
    static async setFeaturedBadge(userId, badgeId) {
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
    static async getCoinBalance(userId) {
        const query = `SELECT balance, total_earned, total_spent FROM iacoins_balance WHERE user_id = $1`;
        const result = await executeQuery(query, [userId]);
        return result[0];
    }

    /**
     * Agrega monedas al usuario
     */
    static async addCoins(userId, amount) {
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
    static async spendCoins(userId, amount) {
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
    static async createTransaction(userId, amount, type, description, reference = null) {
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
    static async getTransactionHistory(userId, limit = 50, offset = 0) {
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
    static async getUnlocksForLevel(level) {
        const query = `SELECT * FROM level_unlocks WHERE level = $1 AND is_active = true`;
        return executeQuery(query, [level]);
    }

    /**
     * Verifica acceso a feature
     */
    static async hasFeatureAccess(featureSlug, userLevel) {
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
    static async getUserStreak(userId, streakType = 'daily_login') {
        const query = `SELECT * FROM user_streaks WHERE user_id = $1 AND streak_type = $2`;
        const result = await executeQuery(query, [userId, streakType]);
        return result[0];
    }

    /**
     * Actualiza streak del usuario
     */
    static async updateStreak(userId, streakType, currentStreak, lastDate) {
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
    static async getXPLeaderboard(limit = 10) {
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
        return executeQuery(query, [limit]);
    }

    /**
     * Obtiene posición del usuario en leaderboard
     */
    static async getUserRank(userId) {
        const query = `
            SELECT rank FROM (
                SELECT user_id, ROW_NUMBER() OVER (ORDER BY experience_points DESC) as rank
                FROM iacoins_balance
            ) rankings WHERE user_id = $1
        `;
        const result = await executeQuery(query, [userId]);
        return result[0]?.rank;
    }

    /**
     * Obtiene leaderboard por badges
     */
    static async getBadgesLeaderboard(limit = 10) {
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
        return executeQuery(query, [limit]);
    }

    // ==========================================
    // RETOS Y CHALLENGES
    // ==========================================

    /**
     * Obtiene retos activos
     */
    static async getActiveChallenges() {
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
    static async getUserChallengeProgress(userId) {
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
    static async updateChallengeProgress(userId, challengeId, progress, status = 'in_progress') {
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
    static async claimChallengeReward(userId, challengeId, coinsEarned, xpEarned) {
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

module.exports = GamificationDAO;

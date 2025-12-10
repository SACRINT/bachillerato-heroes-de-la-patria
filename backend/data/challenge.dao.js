"use strict";
/**
 * 🏆 CHALLENGE DAO - TypeScript
 * Data Access Object para sistema de retos
 * Abstrae todas las queries SQL de ChallengesService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// CHALLENGE DAO CLASS
// =====================================================
class ChallengeDAO {
    // ==========================================
    // OBTENER RETOS
    // ==========================================
    static async getAvailableChallenges(userId, options = {}) {
        const { category, difficulty, frequency, subject, includeProgress = true, limit = 50, offset = 0 } = options;
        let query = `
            SELECT c.*
                ${includeProgress ? `, cp.status as user_status, cp.current_progress, cp.target_progress,
                   cp.completion_count, cp.coins_earned, cp.xp_earned` : ', NULL as user_status'}
            FROM challenges c
            ${includeProgress ? `LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id AND cp.user_id = $1` : ''}
            WHERE c.is_active = true
            AND (c.start_date IS NULL OR c.start_date <= NOW())
            AND (c.end_date IS NULL OR c.end_date >= NOW())
        `;
        const params = includeProgress ? [userId] : [];
        let paramIndex = params.length + 1;
        if (category) {
            query += ` AND c.category = $${paramIndex++}`;
            params.push(category);
        }
        if (difficulty) {
            query += ` AND c.difficulty = $${paramIndex++}`;
            params.push(difficulty);
        }
        if (frequency) {
            query += ` AND c.frequency = $${paramIndex++}`;
            params.push(frequency);
        }
        if (subject) {
            query += ` AND c.subject = $${paramIndex++}`;
            params.push(subject);
        }
        query += ` ORDER BY c.featured DESC, c.sort_order ASC, c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);
        return (0, database_1.executeQuery)(query, params);
    }
    static async getChallengeById(challengeId, userId) {
        const query = `
            SELECT c.*, cp.status as user_status, cp.current_progress, cp.target_progress,
                   cp.completion_count, cp.coins_earned, cp.xp_earned, cp.started_at, cp.first_completed_at
            FROM challenges c
            LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id AND cp.user_id = $2
            WHERE c.id = $1
        `;
        const result = await (0, database_1.executeQuery)(query, [challengeId, userId]);
        return result[0] || null;
    }
    static async getFeaturedChallenges(userId, limit = 5) {
        const query = `
            SELECT c.*, cp.status as user_status, cp.current_progress, cp.target_progress
            FROM challenges c
            LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id AND cp.user_id = $1
            WHERE c.is_active = true AND c.featured = true
            AND (c.start_date IS NULL OR c.start_date <= NOW())
            AND (c.end_date IS NULL OR c.end_date >= NOW())
            ORDER BY c.sort_order ASC LIMIT $2
        `;
        return (0, database_1.executeQuery)(query, [userId, limit]);
    }
    // ==========================================
    // PROGRESO
    // ==========================================
    static async createProgress(userId, challengeId, targetProgress) {
        const query = `
            INSERT INTO challenge_progress (user_id, challenge_id, status, current_progress, target_progress)
            VALUES ($1, $2, 'in_progress', 0, $3) RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, challengeId, targetProgress]);
        return result[0];
    }
    static async getProgressWithChallenge(userId, challengeId) {
        const query = `
            SELECT cp.*, c.completion_criteria, c.reward_coins, c.reward_xp,
                   c.is_repeatable, c.max_completions, c.bonus_multiplier, c.title
            FROM challenge_progress cp
            JOIN challenges c ON cp.challenge_id = c.id
            WHERE cp.user_id = $1 AND cp.challenge_id = $2
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, challengeId]);
        return result[0] || null;
    }
    static async updateProgress(userId, challengeId, newProgress, status, progressData = null) {
        const completionUpdate = status === 'completed'
            ? `, completion_count = completion_count + 1, first_completed_at = COALESCE(first_completed_at, NOW()), last_completed_at = NOW()`
            : '';
        const query = `
            UPDATE challenge_progress
            SET current_progress = $1, status = $2, progress_data = COALESCE($3, progress_data), updated_at = NOW() ${completionUpdate}
            WHERE user_id = $4 AND challenge_id = $5 RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [newProgress, status, progressData, userId, challengeId]);
        return result[0];
    }
    static async claimReward(userId, challengeId, coinsEarned, xpEarned) {
        const query = `
            UPDATE challenge_progress
            SET status = 'claimed', coins_earned = coins_earned + $1, xp_earned = xp_earned + $2, claimed_at = NOW(), updated_at = NOW()
            WHERE user_id = $3 AND challenge_id = $4 RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [coinsEarned, xpEarned, userId, challengeId]);
        return result[0];
    }
    // ==========================================
    // STREAKS
    // ==========================================
    static async getStreak(userId, streakType) {
        const query = `SELECT * FROM user_streaks WHERE user_id = $1 AND streak_type = $2`;
        const result = await (0, database_1.executeQuery)(query, [userId, streakType]);
        return result[0] || null;
    }
    static async createStreak(userId, streakType, date) {
        const query = `
            INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, total_completions, last_activity_date, streak_started_at)
            VALUES ($1, $2, 1, 1, 1, $3, NOW()) RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, streakType, date]);
        return result[0];
    }
    static async updateStreak(userId, streakType, currentStreak, longestStreak, date, bonusCoins, bonusXp) {
        const query = `
            UPDATE user_streaks
            SET current_streak = $1, longest_streak = $2, total_completions = total_completions + 1,
                last_activity_date = $3, bonus_coins_earned = bonus_coins_earned + $4, bonus_xp_earned = bonus_xp_earned + $5, updated_at = NOW()
            WHERE user_id = $6 AND streak_type = $7 RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [currentStreak, longestStreak, date, bonusCoins, bonusXp, userId, streakType]);
        return result[0];
    }
    static async getAllStreaks(userId) {
        const query = `SELECT * FROM user_streaks WHERE user_id = $1 ORDER BY current_streak DESC`;
        return (0, database_1.executeQuery)(query, [userId]);
    }
    // ==========================================
    // COLABORATIVOS
    // ==========================================
    static async getParticipantCount(challengeId) {
        const query = `SELECT COUNT(*) as count FROM collaborative_challenge_participants WHERE challenge_id = $1`;
        const result = await (0, database_1.executeQuery)(query, [challengeId]);
        return parseInt(result[0].count);
    }
    static async addParticipant(challengeId, userId) {
        const query = `
            INSERT INTO collaborative_challenge_participants (challenge_id, user_id, role)
            VALUES ($1, $2, 'participant') ON CONFLICT (challenge_id, user_id) DO NOTHING RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [challengeId, userId]);
        return result[0] || null;
    }
    static async getParticipants(challengeId) {
        const query = `
            SELECT ccp.*, u.nombre, u.apellido_paterno, COALESCE(ib.level, 1) as level
            FROM collaborative_challenge_participants ccp
            JOIN usuarios u ON ccp.user_id = u.id
            LEFT JOIN iacoins_balance ib ON ccp.user_id = ib.user_id
            WHERE ccp.challenge_id = $1 ORDER BY ccp.contribution_score DESC
        `;
        return (0, database_1.executeQuery)(query, [challengeId]);
    }
    // ==========================================
    // HELPERS
    // ==========================================
    static async getUserLevel(userId) {
        const query = `SELECT level FROM iacoins_balance WHERE user_id = $1`;
        const result = await (0, database_1.executeQuery)(query, [userId]);
        return result[0]?.level || 1;
    }
    static async checkPrerequisites(userId, prerequisiteIds) {
        if (!prerequisiteIds || prerequisiteIds.length === 0)
            return true;
        const query = `
            SELECT COUNT(*) as completed FROM challenge_progress
            WHERE user_id = $1 AND challenge_id = ANY($2) AND status = 'claimed'
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, prerequisiteIds]);
        return parseInt(result[0].completed) === prerequisiteIds.length;
    }
    static async addRewards(userId, coins, xp) {
        const query = `
            UPDATE iacoins_balance
            SET balance = balance + $1, total_earned = total_earned + $1, experience_points = experience_points + $2, updated_at = NOW()
            WHERE user_id = $3
        `;
        await (0, database_1.executeQuery)(query, [coins, xp, userId]);
    }
    static async getBalance(userId) {
        const query = `SELECT level, experience_points FROM iacoins_balance WHERE user_id = $1`;
        const result = await (0, database_1.executeQuery)(query, [userId]);
        return result[0] || null;
    }
    static async updateLevel(userId) {
        const query = `UPDATE iacoins_balance SET level = level + 1, updated_at = NOW() WHERE user_id = $1`;
        await (0, database_1.executeQuery)(query, [userId]);
    }
    static async createTransaction(userId, amount, description) {
        const query = `
            INSERT INTO iacoins_transactions (user_id, type, amount, description, balance_before, balance_after)
            SELECT $1, 'earn', $2, $3, balance - $2, balance FROM iacoins_balance WHERE user_id = $1 RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, amount, description]);
        return result[0];
    }
    static async getUserChallengeStats(userId) {
        const query = `
            SELECT COUNT(*) FILTER (WHERE status = 'claimed') as completed,
                   COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                   SUM(coins_earned) as total_coins, SUM(xp_earned) as total_xp
            FROM challenge_progress WHERE user_id = $1
        `;
        const result = await (0, database_1.executeQuery)(query, [userId]);
        const row = result[0];
        return {
            completed: parseInt(row.completed || '0'),
            in_progress: parseInt(row.in_progress || '0'),
            total_coins: parseInt(row.total_coins || '0'),
            total_xp: parseInt(row.total_xp || '0')
        };
    }
}
exports.default = ChallengeDAO;
module.exports = ChallengeDAO;
//# sourceMappingURL=challenge.dao.js.map
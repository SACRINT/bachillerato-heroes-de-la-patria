/**
 * 🎮 GAMIFICATION EXTENDED DAO
 * Data Access Object para sistema de gamificación avanzado
 * Incluye: Streaks, Achievements, Leaderboards, Daily Rewards
 * Fecha: 18 Diciembre 2025
 * Plan Estratégico: Semana 3-4 Gamification Foundation
 */

const { pool } = require('../config/database');

// ============================================
// SISTEMA DE STREAKS (RACHAS)
// ============================================

/**
 * Obtener racha actual del usuario
 * @param {number} userId - ID del usuario
 * @param {string} streakType - Tipo de racha (daily_login, daily_task, etc.)
 */
async function getUserStreak(userId, streakType = 'daily_login') {
    const query = `
        SELECT * FROM user_streaks
        WHERE user_id = $1 AND streak_type = $2
    `;
    const result = await pool.query(query, [userId, streakType]);
    return result.rows[0] || null;
}

/**
 * Actualizar racha del usuario
 * @param {number} userId - ID del usuario
 * @param {string} streakType - Tipo de racha
 */
async function updateUserStreak(userId, streakType = 'daily_login') {
    const today = new Date().toISOString().split('T')[0];

    // Verificar si ya existe una racha
    const existing = await getUserStreak(userId, streakType);

    if (!existing) {
        // Crear nueva racha
        const insertQuery = `
            INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, total_days_active)
            VALUES ($1, $2, 1, 1, $3, 1)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [userId, streakType, today]);
        return result.rows[0];
    }

    const lastDate = new Date(existing.last_activity_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    let newStreak = existing.current_streak;
    let longestStreak = existing.longest_streak;

    if (diffDays === 0) {
        // Ya registró hoy, no hacer nada
        return existing;
    } else if (diffDays === 1) {
        // Día consecutivo, incrementar racha
        newStreak = existing.current_streak + 1;
        longestStreak = Math.max(longestStreak, newStreak);
    } else {
        // Racha perdida, reiniciar
        newStreak = 1;
    }

    // Calcular bonus por racha
    let bonus = 0;
    if (newStreak >= 7) bonus = 50;
    if (newStreak >= 30) bonus = 150;
    if (newStreak >= 100) bonus = 500;

    const updateQuery = `
        UPDATE user_streaks
        SET current_streak = $1,
            longest_streak = $2,
            last_activity_date = $3,
            total_days_active = total_days_active + 1,
            bonus_earned = bonus_earned + $4,
            updated_at = NOW()
        WHERE user_id = $5 AND streak_type = $6
        RETURNING *
    `;
    const result = await pool.query(updateQuery, [newStreak, longestStreak, today, bonus, userId, streakType]);
    return result.rows[0];
}

/**
 * Obtener top rachas
 * @param {string} streakType - Tipo de racha
 * @param {number} limit - Límite de resultados
 */
async function getTopStreaks(streakType = 'daily_login', limit = 10) {
    const query = `
        SELECT us.*, u.nombre, u.apellido_paterno
        FROM user_streaks us
        JOIN usuarios u ON us.user_id = u.id
        WHERE us.streak_type = $1 AND us.current_streak > 0
        ORDER BY us.current_streak DESC
        LIMIT $2
    `;
    const result = await pool.query(query, [streakType, limit]);
    return result.rows;
}

// ============================================
// SISTEMA DE ACHIEVEMENTS (LOGROS)
// ============================================

/**
 * Obtener todos los achievements disponibles
 */
async function getAllAchievements() {
    const query = `
        SELECT * FROM achievements
        WHERE is_active = true
        ORDER BY rarity, sort_order, name
    `;
    const result = await pool.query(query);
    return result.rows;
}

/**
 * Obtener achievements de un usuario
 * @param {number} userId - ID del usuario
 */
async function getUserAchievements(userId) {
    const query = `
        SELECT a.*, ua.earned_at, ua.is_claimed, ua.claimed_at, ua.progress
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
        WHERE a.is_active = true
        ORDER BY ua.earned_at DESC NULLS LAST, a.rarity DESC, a.sort_order
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

/**
 * Otorgar achievement a usuario
 * @param {number} userId - ID del usuario
 * @param {string} achievementCode - Código del achievement
 */
async function grantAchievement(userId, achievementCode) {
    // Obtener el achievement
    const achievementQuery = `SELECT * FROM achievements WHERE code = $1 AND is_active = true`;
    const achievementResult = await pool.query(achievementQuery, [achievementCode]);

    if (achievementResult.rows.length === 0) {
        throw new Error(`Achievement ${achievementCode} no encontrado`);
    }

    const achievement = achievementResult.rows[0];

    // Verificar si ya lo tiene
    const checkQuery = `
        SELECT * FROM user_achievements
        WHERE user_id = $1 AND achievement_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, achievement.id]);

    if (checkResult.rows.length > 0) {
        return { already_earned: true, achievement };
    }

    // Otorgar achievement
    const insertQuery = `
        INSERT INTO user_achievements (user_id, achievement_id, earned_at)
        VALUES ($1, $2, NOW())
        RETURNING *
    `;
    const result = await pool.query(insertQuery, [userId, achievement.id]);

    // Si tiene recompensa de IACoins, agregarla al wallet
    if (achievement.iacoins_reward > 0) {
        const walletQuery = `
            UPDATE wallet
            SET balance = balance + $1,
                total_earned = total_earned + $1,
                updated_at = NOW()
            WHERE user_id = $2
        `;
        await pool.query(walletQuery, [achievement.iacoins_reward, userId]);
    }

    return { earned: true, achievement, user_achievement: result.rows[0] };
}

/**
 * Reclamar recompensa de achievement
 * @param {number} userId - ID del usuario
 * @param {number} achievementId - ID del achievement
 */
async function claimAchievementReward(userId, achievementId) {
    const query = `
        UPDATE user_achievements
        SET is_claimed = true, claimed_at = NOW()
        WHERE user_id = $1 AND achievement_id = $2 AND is_claimed = false
        RETURNING *
    `;
    const result = await pool.query(query, [userId, achievementId]);
    return result.rows[0];
}

// ============================================
// SISTEMA DE LEADERBOARDS
// ============================================

/**
 * Obtener leaderboard activo
 * @param {string} code - Código del leaderboard
 * @param {number} limit - Límite de resultados
 */
async function getLeaderboard(code, limit = 50) {
    const leaderboardQuery = `SELECT * FROM leaderboards WHERE code = $1 AND is_active = true`;
    const leaderboardResult = await pool.query(leaderboardQuery, [code]);

    if (leaderboardResult.rows.length === 0) {
        throw new Error(`Leaderboard ${code} no encontrado`);
    }

    const leaderboard = leaderboardResult.rows[0];

    // Calcular período
    let periodStart;
    const today = new Date();

    switch (leaderboard.period) {
        case 'daily':
            periodStart = today.toISOString().split('T')[0];
            break;
        case 'weekly':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            periodStart = weekStart.toISOString().split('T')[0];
            break;
        case 'monthly':
            periodStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            break;
        default:
            periodStart = '2020-01-01'; // all_time
    }

    const entriesQuery = `
        SELECT le.*, u.nombre, u.apellido_paterno,
               RANK() OVER (ORDER BY le.score DESC) as computed_rank
        FROM leaderboard_entries le
        JOIN usuarios u ON le.user_id = u.id
        WHERE le.leaderboard_id = $1 AND le.period_start >= $2::date
        ORDER BY le.score DESC
        LIMIT $3
    `;
    const entriesResult = await pool.query(entriesQuery, [leaderboard.id, periodStart, limit]);

    return {
        ...leaderboard,
        period_start: periodStart,
        entries: entriesResult.rows
    };
}

/**
 * Actualizar puntuación en leaderboard
 * @param {number} userId - ID del usuario
 * @param {string} leaderboardCode - Código del leaderboard
 * @param {number} score - Puntuación a agregar
 */
async function updateLeaderboardScore(userId, leaderboardCode, score) {
    const leaderboardQuery = `SELECT * FROM leaderboards WHERE code = $1 AND is_active = true`;
    const leaderboardResult = await pool.query(leaderboardQuery, [leaderboardCode]);

    if (leaderboardResult.rows.length === 0) {
        throw new Error(`Leaderboard ${leaderboardCode} no encontrado`);
    }

    const leaderboard = leaderboardResult.rows[0];

    // Calcular período
    const today = new Date();
    let periodStart;

    switch (leaderboard.period) {
        case 'daily':
            periodStart = today.toISOString().split('T')[0];
            break;
        case 'weekly':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            periodStart = weekStart.toISOString().split('T')[0];
            break;
        case 'monthly':
            periodStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            break;
        default:
            periodStart = '2020-01-01';
    }

    const upsertQuery = `
        INSERT INTO leaderboard_entries (leaderboard_id, user_id, score, period_start)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (leaderboard_id, user_id, period_start)
        DO UPDATE SET score = leaderboard_entries.score + $3, updated_at = NOW()
        RETURNING *
    `;
    const result = await pool.query(upsertQuery, [leaderboard.id, userId, score, periodStart]);
    return result.rows[0];
}

/**
 * Obtener posición del usuario en leaderboard
 * @param {number} userId - ID del usuario
 * @param {string} leaderboardCode - Código del leaderboard
 */
async function getUserLeaderboardPosition(userId, leaderboardCode) {
    const leaderboard = await getLeaderboard(leaderboardCode);
    const entry = leaderboard.entries.find(e => e.user_id === userId);

    return entry ? {
        rank: entry.computed_rank,
        score: entry.score,
        leaderboard: leaderboard.name
    } : null;
}

// ============================================
// SISTEMA DE DAILY REWARDS
// ============================================

/**
 * Obtener todas las recompensas diarias
 */
async function getDailyRewards() {
    const query = `SELECT * FROM daily_rewards ORDER BY day_number`;
    const result = await pool.query(query);
    return result.rows;
}

/**
 * Verificar y reclamar recompensa diaria
 * @param {number} userId - ID del usuario
 */
async function claimDailyReward(userId) {
    const today = new Date().toISOString().split('T')[0];

    // Verificar si ya reclamó hoy
    const checkQuery = `
        SELECT * FROM user_daily_rewards
        WHERE user_id = $1 AND claim_date = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, today]);

    if (checkResult.rows.length > 0) {
        return { already_claimed: true, message: 'Ya reclamaste tu recompensa hoy' };
    }

    // Obtener racha actual para determinar día
    const streak = await getUserStreak(userId, 'daily_login');
    const dayNumber = streak ? Math.min(streak.current_streak, 30) : 1;

    // Obtener recompensa del día
    const rewardQuery = `SELECT * FROM daily_rewards WHERE day_number = $1`;
    const rewardResult = await pool.query(rewardQuery, [dayNumber]);

    if (rewardResult.rows.length === 0) {
        return { error: true, message: 'No se encontró recompensa para este día' };
    }

    const reward = rewardResult.rows[0];

    // Registrar claim
    const claimQuery = `
        INSERT INTO user_daily_rewards (user_id, daily_reward_id, claim_date)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    await pool.query(claimQuery, [userId, reward.id, today]);

    // Agregar IACoins al wallet si es ese tipo de recompensa
    if (reward.reward_type === 'iacoins') {
        const walletQuery = `
            UPDATE wallet
            SET balance = balance + $1,
                total_earned = total_earned + $1,
                updated_at = NOW()
            WHERE user_id = $2
        `;
        await pool.query(walletQuery, [reward.reward_amount, userId]);
    }

    return {
        claimed: true,
        day: dayNumber,
        reward: reward,
        next_day: dayNumber < 30 ? dayNumber + 1 : 1
    };
}

/**
 * Obtener historial de recompensas diarias del usuario
 * @param {number} userId - ID del usuario
 * @param {number} limit - Límite de resultados
 */
async function getUserDailyRewardsHistory(userId, limit = 30) {
    const query = `
        SELECT udr.*, dr.day_number, dr.reward_type, dr.reward_amount, dr.icon, dr.is_special
        FROM user_daily_rewards udr
        JOIN daily_rewards dr ON udr.daily_reward_id = dr.id
        WHERE udr.user_id = $1
        ORDER BY udr.claimed_at DESC
        LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
}

// ============================================
// EXPORTACIONES
// ============================================

module.exports = {
    // Streaks
    getUserStreak,
    updateUserStreak,
    getTopStreaks,

    // Achievements
    getAllAchievements,
    getUserAchievements,
    grantAchievement,
    claimAchievementReward,

    // Leaderboards
    getLeaderboard,
    updateLeaderboardScore,
    getUserLeaderboardPosition,

    // Daily Rewards
    getDailyRewards,
    claimDailyReward,
    getUserDailyRewardsHistory
};

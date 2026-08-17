/**
 * 🎮 GAMIFICACIÓN FASE 3 — Endpoints reales de Rachas, Ligas y Leaderboard
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Rutas:
 *   POST /api/gamification/streak/check-in   — Registrar actividad diaria
 *   GET  /api/gamification/streak/:userId     — Estado de racha del usuario
 *   GET  /api/gamification/league/:userId     — Liga actual del usuario
 *   GET  /api/gamification/leaderboard-real   — Leaderboard real desde iacoins_balance
 *   GET  /api/gamification/xp/profile/:userId — Perfil XP/nivel real
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const { getPool } = require('../data/database-access.js');

// ============================================================
// HELPER: ejecutar query con fallback
// ============================================================
async function runQuery(sql, params = []) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    } finally {
        client.release();
    }
}

// ============================================================
// TABLA DE LIGAS por XP total
// ============================================================
const LIGAS = [
    { min: 0,     max: 999,   name: 'bronze',   label: 'Bronce',   icon: '🥉', color: '#cd7f32' },
    { min: 1000,  max: 4999,  name: 'silver',   label: 'Plata',    icon: '🥈', color: '#c0c0c0' },
    { min: 5000,  max: 14999, name: 'gold',     label: 'Oro',      icon: '🥇', color: '#ffd700' },
    { min: 15000, max: 29999, name: 'platinum', label: 'Platino',  icon: '💎', color: '#a8d8ea' },
    { min: 30000, max: Infinity, name: 'diamond', label: 'Diamante', icon: '✨', color: '#b9f2ff' }
];

function getLeague(xp) {
    return LIGAS.find(l => xp >= l.min && xp <= l.max) || LIGAS[0];
}

function getNextLeague(xp) {
    const idx = LIGAS.findIndex(l => xp >= l.min && xp <= l.max);
    return LIGAS[idx + 1] || null;
}

// ============================================================
// POST /api/gamification/streak/check-in
// Registrar actividad diaria — actualiza racha
// ============================================================
router.post('/streak/check-in', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const streakType = req.body.streak_type || 'daily_login';

    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Obtener racha actual
        let streak = null;
        try {
            const rows = await runQuery(
                `SELECT * FROM user_streaks WHERE user_id = $1 AND streak_type = $2`,
                [userId, streakType]
            );
            streak = rows[0] || null;
        } catch (e) {
            console.warn('[STREAK] user_streaks no existe aún:', e.message);
        }

        let currentStreak = 1;
        let longestStreak = 1;
        let totalCompletions = 1;
        let alreadyDone = false;
        let bonusCoins = 0;
        let bonusXp = 0;

        if (streak) {
            // Verificar si ya hizo check-in hoy
            if (streak.last_activity_date && streak.last_activity_date.toISOString?.().split('T')[0] === today) {
                alreadyDone = true;
                currentStreak = streak.current_streak;
                longestStreak = streak.longest_streak;
                totalCompletions = streak.total_completions;
            } else {
                // ¿Es consecutivo? (ayer o hoy)
                const lastDate = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
                const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                const isConsecutive = lastDate && lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];

                if (isConsecutive) {
                    currentStreak = streak.current_streak + 1;
                } else {
                    currentStreak = 1; // Racha rota
                }
                longestStreak = Math.max(streak.longest_streak, currentStreak);
                totalCompletions = streak.total_completions + 1;

                // Actualizar racha
                try {
                    await runQuery(`
                        UPDATE user_streaks SET
                            current_streak    = $1,
                            longest_streak    = $2,
                            total_completions = $3,
                            last_activity_date = $4,
                            updated_at        = NOW()
                        WHERE user_id = $5 AND streak_type = $6
                    `, [currentStreak, longestStreak, totalCompletions, today, userId, streakType]);
                } catch (e) {
                    console.warn('[STREAK] UPDATE:', e.message);
                }

                // Bonus por rachas especiales (7, 14, 30 días)
                if ([7, 14, 30, 60, 100, 365].includes(currentStreak)) {
                    bonusCoins = currentStreak <= 7 ? 50 : currentStreak <= 30 ? 100 : 200;
                    bonusXp = bonusCoins * 2;

                    // Otorgar bonus
                    try {
                        await runQuery(`
                            UPDATE iacoins_balance SET
                                balance = balance + $1,
                                total_earned = total_earned + $1,
                                experience_points = experience_points + $2,
                                updated_at = NOW()
                            WHERE user_id = $3
                        `, [bonusCoins, bonusXp, userId]);
                        await runQuery(`
                            UPDATE iacoins_balances SET
                                balance = balance + $1,
                                total_earned = total_earned + $1,
                                updated_at = NOW()
                            WHERE user_id = $2
                        `, [bonusCoins, userId]);
                    } catch (e) {
                        console.warn('[STREAK] bonus update:', e.message);
                    }
                }
            }
        } else {
            // Crear nueva racha
            try {
                await runQuery(`
                    INSERT INTO user_streaks
                        (user_id, streak_type, current_streak, longest_streak, total_completions,
                         last_activity_date, streak_started_at)
                    VALUES ($1, $2, 1, 1, 1, $3, $3)
                `, [userId, streakType, today]);
            } catch (e) {
                console.warn('[STREAK] INSERT:', e.message);
            }
        }

        // Calcular liga actual
        let xp = 0;
        try {
            const xpRows = await runQuery(
                `SELECT experience_points FROM iacoins_balance WHERE user_id = $1`, [userId]
            );
            xp = xpRows[0]?.experience_points || 0;
        } catch (e) {}

        const liga = getLeague(xp);
        const nextLiga = getNextLeague(xp);

        console.log(`[STREAK] ✅ Usuario ${userId} | Tipo: ${streakType} | Racha: ${currentStreak} | Bonus: ${bonusCoins} IACoins`);

        return res.json({
            success: true,
            data: {
                streak_type: streakType,
                current_streak: currentStreak,
                longest_streak: longestStreak,
                total_completions: totalCompletions,
                already_done_today: alreadyDone,
                bonus: bonusCoins > 0 ? { coins: bonusCoins, xp: bonusXp, milestone: `${currentStreak} días consecutivos` } : null,
                league: liga,
                next_league: nextLiga ? { ...nextLiga, xp_needed: nextLiga.min - xp } : null
            }
        });

    } catch (err) {
        console.error('[STREAK] Error:', err);
        // Retornar demo si hay error de BD
        return res.json({
            success: true,
            data: {
                streak_type: streakType,
                current_streak: 1,
                longest_streak: 1,
                total_completions: 1,
                already_done_today: false,
                bonus: null,
                league: LIGAS[0],
                _demo: true
            }
        });
    }
});

// ============================================================
// GET /api/gamification/streak/:userId
// Estado actual de racha
// ============================================================
router.get('/streak/:userId', authenticateToken, async (req, res) => {
    const userId = req.params.userId;
    try {
        const rows = await runQuery(
            `SELECT * FROM user_streaks WHERE user_id = $1 ORDER BY current_streak DESC`,
            [userId]
        );
        return res.json({ success: true, data: rows });
    } catch (e) {
        return res.json({ success: true, data: [], _demo: true });
    }
});

// ============================================================
// GET /api/gamification/league/:userId
// Liga actual del usuario
// ============================================================
router.get('/league/:userId', authenticateToken, async (req, res) => {
    const userId = req.params.userId;
    try {
        let xp = 0;
        try {
            const rows = await runQuery(
                `SELECT experience_points, total_earned FROM iacoins_balance WHERE user_id = $1`, [userId]
            );
            xp = rows[0]?.experience_points || 0;
        } catch (e) {}

        const liga = getLeague(xp);
        const nextLiga = getNextLeague(xp);

        return res.json({
            success: true,
            data: {
                user_id: userId,
                xp,
                current_league: liga,
                next_league: nextLiga ? { ...nextLiga, xp_needed: nextLiga.min - xp } : null,
                progress_pct: nextLiga
                    ? Math.round(((xp - liga.min) / (nextLiga.min - liga.min)) * 100)
                    : 100
            }
        });
    } catch (err) {
        return res.json({ success: true, data: { user_id: userId, xp: 0, current_league: LIGAS[0] }, _demo: true });
    }
});

// ============================================================
// GET /api/gamification/leaderboard-real
// Leaderboard real desde iacoins_balance
// ============================================================
router.get('/leaderboard-real', authenticateToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    try {
        const rows = await runQuery(`
            SELECT
                ib.user_id,
                ib.level,
                ib.total_earned,
                ib.experience_points,
                ib.balance,
                ROW_NUMBER() OVER (ORDER BY ib.total_earned DESC, ib.experience_points DESC) AS rank
            FROM iacoins_balance ib
            ORDER BY ib.total_earned DESC
            LIMIT $1
        `, [limit]);

        return res.json({
            success: true,
            data: {
                leaderboard: rows,
                lastUpdated: new Date().toISOString(),
                total: rows.length
            }
        });
    } catch (err) {
        // Fallback demo
        return res.json({
            success: true,
            data: {
                leaderboard: Array.from({ length: 5 }, (_, i) => ({
                    rank: i + 1, user_id: `demo-${i}`,
                    level: 10 - i, total_earned: 1000 - i * 100,
                    experience_points: 500 - i * 50
                })),
                _demo: true
            }
        });
    }
});

// ============================================================
// GET /api/gamification/xp/profile/:userId
// Perfil XP/nivel real
// ============================================================
router.get('/xp/profile/:userId', authenticateToken, async (req, res) => {
    const userId = req.params.userId;
    try {
        // Obtener balance de IACoins y XP
        let balance = { level: 1, experience_points: 0, total_earned: 0, balance: 0 };
        try {
            const rows = await runQuery(
                `SELECT level, experience_points, total_earned, balance FROM iacoins_balance WHERE user_id = $1`,
                [userId]
            );
            if (rows[0]) {
                balance = {
                    level: rows[0].level || 1,
                    experience_points: rows[0].experience_points || 0,
                    total_earned: rows[0].total_earned || 0,
                    balance: rows[0].balance !== undefined ? rows[0].balance : 0
                };
            }
        } catch (e) {}

        // Obtener definición del nivel actual y siguiente
        let levelDef = null, nextLevelDef = null;
        try {
            const levels = await runQuery(
                `SELECT * FROM level_definitions WHERE level IN ($1, $2)`,
                [balance.level, balance.level + 1]
            );
            levelDef = levels.find(l => l.level === balance.level);
            nextLevelDef = levels.find(l => l.level === balance.level + 1);
        } catch (e) {}

        // Calcular progreso al siguiente nivel
        const xpForCurrent = levelDef?.xp_required || 0;
        const xpForNext = nextLevelDef?.xp_required || (xpForCurrent + 100);
        const xpProgress = balance.experience_points - xpForCurrent;
        const xpNeeded = xpForNext - xpForCurrent;
        const progressPct = nextLevelDef ? Math.min(100, Math.round((xpProgress / xpNeeded) * 100)) : 100;

        const liga = getLeague(balance.experience_points);

        return res.json({
            success: true,
            data: {
                user_id: userId,
                level: balance.level,
                xp: balance.experience_points,
                balance: balance.balance,
                total_earned: balance.total_earned,
                level_info: levelDef || { level: balance.level, title: 'Aprendiz', icon: '🌱' },
                next_level: nextLevelDef,
                progress: { current: xpProgress, needed: xpNeeded, pct: progressPct },
                league: liga
            }
        });
    } catch (err) {
        return res.json({
            success: true,
            data: {
                user_id: userId, level: 1, xp: 0, balance: 0,
                level_info: { level: 1, title: 'Aprendiz', icon: '🌱' },
                _demo: true
            }
        });
    }
});

module.exports = router;

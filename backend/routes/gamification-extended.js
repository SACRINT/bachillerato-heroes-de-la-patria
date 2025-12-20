/**
 * 🎮 GAMIFICATION EXTENDED ROUTES
 * Rutas de API para sistema de gamificación avanzado
 * Conecta con base de datos real usando DAO
 * Fecha: 18 Diciembre 2025
 * Plan Estratégico: Semana 3-4 Gamification Foundation
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const gamificationDAO = require('../data/gamification-extended.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// SISTEMA DE STREAKS (RACHAS)
// ============================================

/**
 * GET /api/gamification-ext/streaks/:userId
 * Obtener racha actual del usuario
 */
router.get('/streaks/:userId', authenticateToken, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { streakType = 'daily_login' } = req.query;

        devLogger.info('[GAMIFICATION-EXT] Obteniendo racha', { userId, streakType });

        const streak = await gamificationDAO.getUserStreak(parseInt(userId), streakType);

        res.json({
            success: true,
            data: streak || {
                user_id: parseInt(userId),
                streak_type: streakType,
                current_streak: 0,
                longest_streak: 0,
                total_days_active: 0,
                message: 'Sin racha registrada aún'
            }
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo racha', error);
        next(error);
    }
});

/**
 * POST /api/gamification-ext/streaks/update
 * Actualizar racha del usuario (llamar al hacer login diario)
 */
router.post('/streaks/update', authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.id;
        const { streakType = 'daily_login' } = req.body;

        devLogger.info('[GAMIFICATION-EXT] Actualizando racha', { userId, streakType });

        const updatedStreak = await gamificationDAO.updateUserStreak(userId, streakType);

        // Verificar si ganó bonus por racha
        let bonusMessage = null;
        if (updatedStreak.current_streak === 7) {
            bonusMessage = '¡Bonus de 7 días! +50 IACoins';
        } else if (updatedStreak.current_streak === 30) {
            bonusMessage = '¡Bonus de 30 días! +150 IACoins';
        } else if (updatedStreak.current_streak === 100) {
            bonusMessage = '¡Bonus de 100 días! +500 IACoins';
        }

        res.json({
            success: true,
            data: updatedStreak,
            bonusMessage,
            message: `Racha actualizada: ${updatedStreak.current_streak} días consecutivos`
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error actualizando racha', error);
        next(error);
    }
});

/**
 * GET /api/gamification-ext/streaks/top
 * Obtener top rachas (leaderboard de rachas)
 */
router.get('/streaks/top', async (req, res, next) => {
    try {
        const { streakType = 'daily_login', limit = 10 } = req.query;

        devLogger.info('[GAMIFICATION-EXT] Obteniendo top rachas', { streakType, limit });

        const topStreaks = await gamificationDAO.getTopStreaks(streakType, parseInt(limit));

        res.json({
            success: true,
            data: {
                streakType,
                topStreaks,
                totalParticipants: topStreaks.length
            }
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo top rachas', error);
        next(error);
    }
});

// ============================================
// SISTEMA DE ACHIEVEMENTS (LOGROS)
// ============================================

/**
 * GET /api/gamification-ext/achievements
 * Obtener todos los achievements disponibles
 */
router.get('/achievements', async (req, res, next) => {
    try {
        devLogger.info('[GAMIFICATION-EXT] Obteniendo todos los achievements');

        const achievements = await gamificationDAO.getAllAchievements();

        // Agrupar por rareza
        const grouped = {
            common: achievements.filter(a => a.rarity === 'common'),
            uncommon: achievements.filter(a => a.rarity === 'uncommon'),
            rare: achievements.filter(a => a.rarity === 'rare'),
            epic: achievements.filter(a => a.rarity === 'epic'),
            legendary: achievements.filter(a => a.rarity === 'legendary')
        };

        res.json({
            success: true,
            data: {
                total: achievements.length,
                achievements,
                byRarity: grouped
            }
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo achievements', error);
        next(error);
    }
});

/**
 * GET /api/gamification-ext/achievements/user/:userId
 * Obtener achievements de un usuario específico
 */
router.get('/achievements/user/:userId', authenticateToken, async (req, res, next) => {
    try {
        const { userId } = req.params;

        devLogger.info('[GAMIFICATION-EXT] Obteniendo achievements del usuario', { userId });

        const userAchievements = await gamificationDAO.getUserAchievements(parseInt(userId));

        // Separar ganados y no ganados
        const earned = userAchievements.filter(a => a.earned_at);
        const notEarned = userAchievements.filter(a => !a.earned_at);

        res.json({
            success: true,
            data: {
                userId: parseInt(userId),
                totalEarned: earned.length,
                totalAvailable: userAchievements.length,
                completionPercentage: Math.round((earned.length / userAchievements.length) * 100),
                earned,
                notEarned
            }
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo achievements del usuario', error);
        next(error);
    }
});

/**
 * POST /api/gamification-ext/achievements/grant
 * Otorgar achievement a usuario (admin o sistema)
 */
router.post('/achievements/grant', authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;
        const { userId, achievementCode } = req.body;

        // Verificar permisos (admin o self-grant para achievements automáticos)
        if (authReq.user.role !== 'admin' && authReq.user.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para otorgar achievements'
            });
        }

        devLogger.info('[GAMIFICATION-EXT] Otorgando achievement', { userId, achievementCode });

        const result = await gamificationDAO.grantAchievement(userId, achievementCode);

        if (result.already_earned) {
            return res.json({
                success: true,
                message: 'El usuario ya tiene este achievement',
                data: result
            });
        }

        res.json({
            success: true,
            message: `¡Achievement desbloqueado: ${result.achievement.name}!`,
            data: result
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error otorgando achievement', error);
        next(error);
    }
});

/**
 * POST /api/gamification-ext/achievements/claim
 * Reclamar recompensa de achievement
 */
router.post('/achievements/claim', authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;
        const { achievementId } = req.body;

        devLogger.info('[GAMIFICATION-EXT] Reclamando recompensa', {
            userId: authReq.user.id,
            achievementId
        });

        const result = await gamificationDAO.claimAchievementReward(authReq.user.id, achievementId);

        if (!result) {
            return res.status(400).json({
                success: false,
                error: 'No se pudo reclamar la recompensa. Verifica que tienes el achievement y no lo hayas reclamado antes.'
            });
        }

        res.json({
            success: true,
            message: '¡Recompensa reclamada exitosamente!',
            data: result
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error reclamando recompensa', error);
        next(error);
    }
});

// ============================================
// SISTEMA DE LEADERBOARDS
// ============================================

/**
 * GET /api/gamification-ext/leaderboards/:code
 * Obtener leaderboard específico
 */
router.get('/leaderboards/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { limit = 50 } = req.query;

        devLogger.info('[GAMIFICATION-EXT] Obteniendo leaderboard', { code, limit });

        const leaderboard = await gamificationDAO.getLeaderboard(code, parseInt(limit));

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo leaderboard', error);
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        next(error);
    }
});

/**
 * POST /api/gamification-ext/leaderboards/score
 * Actualizar puntuación en leaderboard
 */
router.post('/leaderboards/score', authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;
        const { leaderboardCode, score } = req.body;

        if (!leaderboardCode || score === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere leaderboardCode y score'
            });
        }

        devLogger.info('[GAMIFICATION-EXT] Actualizando score en leaderboard', {
            userId: authReq.user.id,
            leaderboardCode,
            score
        });

        const result = await gamificationDAO.updateLeaderboardScore(
            authReq.user.id,
            leaderboardCode,
            score
        );

        res.json({
            success: true,
            message: 'Puntuación actualizada',
            data: result
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error actualizando score', error);
        next(error);
    }
});

/**
 * GET /api/gamification-ext/leaderboards/:code/position/:userId
 * Obtener posición del usuario en leaderboard
 */
router.get('/leaderboards/:code/position/:userId', authenticateToken, async (req, res, next) => {
    try {
        const { code, userId } = req.params;

        devLogger.info('[GAMIFICATION-EXT] Obteniendo posición del usuario', { code, userId });

        const position = await gamificationDAO.getUserLeaderboardPosition(parseInt(userId), code);

        if (!position) {
            return res.json({
                success: true,
                data: {
                    userId: parseInt(userId),
                    leaderboardCode: code,
                    rank: null,
                    score: 0,
                    message: 'Usuario sin participación en este leaderboard'
                }
            });
        }

        res.json({
            success: true,
            data: position
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo posición', error);
        next(error);
    }
});

// ============================================
// SISTEMA DE DAILY REWARDS
// ============================================

/**
 * GET /api/gamification-ext/daily-rewards
 * Obtener todas las recompensas diarias disponibles
 */
router.get('/daily-rewards', async (req, res, next) => {
    try {
        devLogger.info('[GAMIFICATION-EXT] Obteniendo daily rewards');

        const dailyRewards = await gamificationDAO.getDailyRewards();

        // Marcar días especiales (7, 14, 21, 30)
        const specialDays = [7, 14, 21, 30];
        const rewardsWithSpecial = dailyRewards.map(r => ({
            ...r,
            isSpecialDay: specialDays.includes(r.day_number)
        }));

        res.json({
            success: true,
            data: {
                rewards: rewardsWithSpecial,
                totalDays: dailyRewards.length,
                specialDays
            }
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo daily rewards', error);
        next(error);
    }
});

/**
 * POST /api/gamification-ext/daily-rewards/claim
 * Reclamar recompensa diaria
 */
router.post('/daily-rewards/claim', authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;

        devLogger.info('[GAMIFICATION-EXT] Reclamando daily reward', { userId: authReq.user.id });

        const result = await gamificationDAO.claimDailyReward(authReq.user.id);

        if (result.already_claimed) {
            return res.json({
                success: false,
                message: result.message,
                data: { canClaimAgainAt: 'mañana' }
            });
        }

        if (result.error) {
            return res.status(400).json({
                success: false,
                error: result.message
            });
        }

        res.json({
            success: true,
            message: `¡Día ${result.day} completado! Recompensa: ${result.reward.reward_amount} ${result.reward.reward_type}`,
            data: result
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error reclamando daily reward', error);
        next(error);
    }
});

/**
 * GET /api/gamification-ext/daily-rewards/history/:userId
 * Obtener historial de recompensas diarias del usuario
 */
router.get('/daily-rewards/history/:userId', authenticateToken, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { limit = 30 } = req.query;

        devLogger.info('[GAMIFICATION-EXT] Obteniendo historial de daily rewards', { userId, limit });

        const history = await gamificationDAO.getUserDailyRewardsHistory(parseInt(userId), parseInt(limit));

        // Calcular estadísticas
        const totalClaimed = history.length;
        const totalRewards = history.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

        res.json({
            success: true,
            data: {
                userId: parseInt(userId),
                history,
                stats: {
                    totalDaysClaimed: totalClaimed,
                    totalRewardsEarned: totalRewards
                }
            }
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo historial', error);
        next(error);
    }
});

// ============================================
// RESUMEN DE GAMIFICACIÓN DEL USUARIO
// ============================================

/**
 * GET /api/gamification-ext/summary/:userId
 * Obtener resumen completo de gamificación del usuario
 */
router.get('/summary/:userId', authenticateToken, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const parsedUserId = parseInt(userId);

        devLogger.info('[GAMIFICATION-EXT] Obteniendo resumen de gamificación', { userId: parsedUserId });

        // Obtener todos los datos en paralelo
        const [
            loginStreak,
            achievements,
            weeklyPosition,
            monthlyPosition,
            rewardsHistory
        ] = await Promise.all([
            gamificationDAO.getUserStreak(parsedUserId, 'daily_login'),
            gamificationDAO.getUserAchievements(parsedUserId),
            gamificationDAO.getUserLeaderboardPosition(parsedUserId, 'weekly_iacoins').catch(() => null),
            gamificationDAO.getUserLeaderboardPosition(parsedUserId, 'monthly_xp').catch(() => null),
            gamificationDAO.getUserDailyRewardsHistory(parsedUserId, 7)
        ]);

        const earnedAchievements = achievements.filter(a => a.earned_at);

        res.json({
            success: true,
            data: {
                userId: parsedUserId,
                streak: loginStreak || { current_streak: 0, longest_streak: 0 },
                achievements: {
                    earned: earnedAchievements.length,
                    total: achievements.length,
                    percentage: Math.round((earnedAchievements.length / achievements.length) * 100)
                },
                leaderboards: {
                    weekly: weeklyPosition,
                    monthly: monthlyPosition
                },
                recentRewards: rewardsHistory.slice(0, 7),
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo resumen', error);
        next(error);
    }
});

module.exports = router;

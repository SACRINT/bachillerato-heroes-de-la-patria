/**
 * 🎮 GAMIFICATION EXTENDED ROUTES
 * Rutas de API para sistema de gamificación avanzado
 * Conecta con base de datos real usando DAO
 * Fecha: 18 Diciembre 2025
 * Plan Estratégico: Semana 3-4 Gamification Foundation
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const gamificationDAO = require('../data/gamification-extended.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// SISTEMA DE STREAKS (RACHAS)
// ============================================

const streakService = require('../services/streak.service');

/**
 * GET /api/gamification-ext/streaks/:userId
 * Obtener racha actual del usuario
 */
router.get('/streaks/:userId', authenticateToken, async (req, res, next) => {
    try {
        const { userId } = req.params;
        // Ignoramos streakType por ahora ya que el sistema v2 es racha única global

        devLogger.info('[GAMIFICATION-EXT] Obteniendo racha (v2)', { userId });

        const streak = await streakService.getStreak(parseInt(userId));

        res.json({
            success: true,
            data: streak
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo racha', error);
        next(error);
    }
});

/**
 * POST /api/gamification-ext/streaks/update
 * Actualizar racha del usuario (Check-in diario)
 * Soporta freezes y milestones automáticos
 */
router.post('/streaks/update', authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.id;

        devLogger.info('[GAMIFICATION-EXT] Realizando check-in de racha', { userId });

        const result = await streakService.checkIn(userId);

        if (result.status === 'already_checked_in') {
            return res.json({
                success: true,
                data: result.streak_data,
                message: result.message,
                alreadyCheckedIn: true
            });
        }

        let message = result.streak_frozen
            ? `¡Racha salvada! Usaste un protector de racha.`
            : `¡Racha actualizada! ${result.current_streak} días seguidos.`;

        if (result.xp_gained > 0) {
            message += ` +${result.xp_gained} XP`;
        }

        if (result.level_up) {
            message += ` ¡Subiste al nivel ${result.level_up.newLevel}!`;
        }

        res.json({
            success: true,
            data: {
                current_streak: result.current_streak,
                streak_frozen: result.streak_frozen,
                milestones_awarded: result.milestones_awarded,
                xp_gained: result.xp_gained,
                level_up: result.level_up
            },
            message: message,
            milestones: result.milestones_awarded
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error en check-in de racha', error);
        next(error);
    }
});

// ============================================
// SISTEMA DE XP & NIVELES
// ============================================

const xpService = require('../services/xp.service');

/**
 * GET /api/gamification-ext/xp/profile/:userId
 * Obtener perfil detallado de XP y nivel
 */
router.get('/xp/profile/:userId', authenticateToken, async (req, res, next) => {
    try {
        const { userId } = req.params;
        devLogger.info('[GAMIFICATION-EXT] Obteniendo perfil XP', { userId });

        const profile = await xpService.getXPProfile(parseInt(userId));

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo perfil XP', error);
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

const achievementService = require('../services/achievement.service');

// ... (existing code)

/**
 * GET /api/gamification-ext/achievements
 * Obtener todos los achievements disponibles
 */
router.get('/achievements', async (req, res, next) => {
    try {
        devLogger.info('[GAMIFICATION-EXT] Obteniendo todos los achievements');
        // Usamos DAO o Service, Service está bien para future-proof
        // Por ahora mantenemos DAO para lectura masiva si es más simple, pero unificaremos.
        // achievementService.getUserAchievements pide userId, aquí es general.
        // Usaremos el DAO existente para la lista general o crearemos método en Service.
        // Para consistencia rápida, llamaremos al DAO directamente aquí como estaba, pero
        // para user achievements usaremos el service si aporta valor.

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

        const userAchievements = await achievementService.getUserAchievements(parseInt(userId));

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

        // Verificar permisos (admin o self-grant para testing/debugging controlado)
        if (authReq.user.role !== 'admin' && authReq.user.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para otorgar achievements'
            });
        }

        devLogger.info('[GAMIFICATION-EXT] Otorgando achievement', { userId, achievementCode });

        const result = await achievementService.unlockAchievement(userId, achievementCode);

        if (!result) {
            return res.status(404).json({ success: false, error: 'Logro no encontrado' });
        }

        if (result.status === 'already_earned') {
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

const avatarService = require('../services/avatar.service');

// ... (previous endpoints) ...

// ============================================
// SISTEMA DE AVATARES Y PERFIL
// ============================================

/**
 * GET /api/gamification-ext/avatar/my-avatar
 * Obtener configuración actual del avatar
 */
router.get('/avatar/my-avatar', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const avatar = await avatarService.getUserAvatar(userId);
        res.json({ success: true, data: avatar });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo avatar', error);
        next(error);
    }
});

/**
 * GET /api/gamification-ext/avatar/shop
 * Obtener catálogo de items (y estado de ownership)
 */
router.get('/avatar/shop', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const items = await avatarService.getCatalog(userId);
        res.json({ success: true, data: items });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo tienda de avatares', error);
        next(error);
    }
});

/**
 * POST /api/gamification-ext/avatar/buy
 * Comprar item
 */
router.post('/avatar/buy', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.body;

        const result = await avatarService.purchaseItem(userId, itemId);
        res.json({ success: true, message: 'Item comprado exitosamente', data: result });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error comprando item', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/gamification-ext/avatar/equip
 * Equipar item
 */
router.post('/avatar/equip', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.body;

        const result = await avatarService.equipItem(userId, itemId);
        res.json({ success: true, message: 'Avatar actualizado' });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error equipando item', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

const profileService = require('../services/profile.service');

// ============================================
// PERFILES PÚBLICOS Y EDICIÓN
// ============================================

/**
 * GET /api/gamification-ext/profile/public/:username
 * Obtener perfil público
 */
router.get('/profile/public/:username', async (req, res, next) => {
    try {
        const { username } = req.params;
        const profile = await profileService.getProfileByUsername(username);

        if (!profile) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Filter private info if needed based on privacy settings
        // (Aunque el SQL ya trae solo info segura, el privacy_show_email se procesa aquí si queremos ocultar algo más)

        res.json({ success: true, data: profile });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo perfil público', error);
        next(error);
    }
});

/**
 * GET /api/gamification-ext/profile/me
 * Obtener mi perfil para edición
 */
router.get('/profile/me', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await profileService.getProfileById(userId);
        res.json({ success: true, data: profile });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error obteniendo mi perfil', error);
        next(error);
    }
});

/**
 * POST /api/gamification-ext/profile/update
 * Actualizar mi perfil
 */
router.post('/profile/update', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const updateData = req.body; // { bio, location, social_links, etc }

        const updated = await profileService.updateProfile(userId, updateData);
        res.json({ success: true, message: 'Perfil actualizado', data: updated });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error actualizando perfil', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

const leaderboardService = require('../services/leaderboard.service');

// ============================================
// LEADERBOARDS AVANZADOS
// ============================================

/**
 * GET /api/gamification-ext/leaderboard/global
 */
router.get('/leaderboard/global', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const ranking = await leaderboardService.getGlobalLeaderboard(limit);
        res.json({ success: true, data: ranking });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error leaderboard global', error);
        next(error);
    }
});

/**
 * GET /api/gamification-ext/leaderboard/streaks
 */
router.get('/leaderboard/streaks', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const ranking = await leaderboardService.getStreakLeaderboard(limit);
        res.json({ success: true, data: ranking });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error leaderboard streaks', error);
        next(error);
    }
});

const tournamentService = require('../services/tournament.service');

// ============================================
// TORNEOS Y EVENTOS
// ============================================

/**
 * GET /api/gamification-ext/tournaments
 * Listar torneos activos
 */
router.get('/tournaments', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const tournaments = await tournamentService.getActiveTournaments(userId);
        res.json({ success: true, data: tournaments });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error listing tournaments', error);
        next(error);
    }
});

/**
 * POST /api/gamification-ext/tournaments/:id/join
 * Unirse a torneo
 */
router.post('/tournaments/:id/join', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const tournamentId = req.params.id;

        await tournamentService.joinTournament(userId, tournamentId);
        res.json({ success: true, message: 'Te has unido al torneo' });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error joining tournament', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/gamification-ext/tournaments/:id/leaderboard
 * Ranking del torneo
 */
router.get('/tournaments/:id/leaderboard', async (req, res, next) => {
    try {
        const tournamentId = req.params.id;
        const ranking = await tournamentService.getTournamentLeaderboard(tournamentId);
        res.json({ success: true, data: ranking });
    } catch (error) {
        next(error);
    }
});

const gamificationAnalyticsService = require('../services/gamification-analytics.service');

// ============================================
// ANALYTICS & REPORTING (Admin/Docente Only)
// ============================================

/**
 * GET /api/gamification-ext/analytics/overview
 * Resumen general
 */
router.get('/analytics/overview', authenticateToken, requireRole(['admin', 'docente', 'directivo']), async (req, res, next) => {
    try {
        const stats = await gamificationAnalyticsService.getGlobalStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        devLogger.error('[GAMIFICATION-EXT] Error analytics overview', error);
        next(error);
    }
});

/**
 * GET /api/gamification-ext/analytics/levels
 * Distribución de niveles
 */
router.get('/analytics/levels', authenticateToken, requireRole(['admin', 'docente', 'directivo']), async (req, res, next) => {
    try {
        const distribution = await gamificationAnalyticsService.getLevelDistribution();
        res.json({ success: true, data: distribution });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification-ext/analytics/weekly-top
 * Top semanal
 */
router.get('/analytics/weekly-top', authenticateToken, requireRole(['admin', 'docente', 'directivo']), async (req, res, next) => {
    try {
        const top = await gamificationAnalyticsService.getWeeklyTopEarners();
        res.json({ success: true, data: top });
    } catch (error) {
        next(error);
    }
});

module.exports = router;


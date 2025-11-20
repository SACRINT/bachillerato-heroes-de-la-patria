/**
 * 🌟 LEVELS ROUTES
 * API para sistema de niveles, XP y badges
 * FASE 1 - Semana 7-8
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const LevelsService = require('../services/LevelsService');

// Middleware de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: errors.array()
        });
    }
    next();
};

// =====================================
// NIVELES
// =====================================

/**
 * GET /api/levels
 * Obtiene todas las definiciones de niveles
 */
router.get('/',
    async (req, res) => {
        try {
            const levels = await LevelsService.getLevelDefinitions();

            res.json({
                success: true,
                data: levels
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo niveles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener niveles'
            });
        }
    }
);

/**
 * GET /api/levels/current
 * Obtiene nivel actual del usuario autenticado
 */
router.get('/current',
    authenticateToken,
    async (req, res) => {
        try {
            const levelInfo = await LevelsService.getUserLevel(req.user.id);

            if (!levelInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Información de nivel no encontrada'
                });
            }

            res.json({
                success: true,
                data: levelInfo
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo nivel actual:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener nivel'
            });
        }
    }
);

/**
 * GET /api/levels/:level
 * Obtiene información de un nivel específico
 */
router.get('/:level',
    [param('level').isInt({ min: 1, max: 50 })],
    validate,
    async (req, res) => {
        try {
            const levelInfo = await LevelsService.getLevelInfo(parseInt(req.params.level));

            if (!levelInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Nivel no encontrado'
                });
            }

            res.json({
                success: true,
                data: levelInfo
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo info de nivel:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información del nivel'
            });
        }
    }
);

/**
 * GET /api/levels/history
 * Obtiene historial de niveles del usuario
 */
router.get('/user/history',
    authenticateToken,
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const history = await LevelsService.getLevelHistory(req.user.id, limit);

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo historial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial'
            });
        }
    }
);

// =====================================
// BADGES
// =====================================

/**
 * GET /api/levels/badges
 * Obtiene todos los badges disponibles
 */
router.get('/badges/all',
    async (req, res) => {
        try {
            const badges = await LevelsService.getAllBadges();

            // Agrupar por categoría
            const grouped = {
                all: badges,
                level: badges.filter(b => b.category === 'level'),
                achievement: badges.filter(b => b.category === 'achievement'),
                special: badges.filter(b => b.category === 'special'),
                event: badges.filter(b => b.category === 'event')
            };

            res.json({
                success: true,
                data: req.query.category ? grouped[req.query.category] || badges : badges,
                summary: {
                    total: badges.length,
                    byRarity: {
                        common: badges.filter(b => b.rarity === 'common').length,
                        rare: badges.filter(b => b.rarity === 'rare').length,
                        epic: badges.filter(b => b.rarity === 'epic').length,
                        legendary: badges.filter(b => b.rarity === 'legendary').length
                    }
                }
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo badges:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener badges'
            });
        }
    }
);

/**
 * GET /api/levels/badges/user
 * Obtiene badges del usuario con estado
 */
router.get('/badges/user',
    authenticateToken,
    async (req, res) => {
        try {
            const badges = await LevelsService.getBadgesWithStatus(req.user.id);

            res.json({
                success: true,
                data: badges,
                summary: {
                    total: badges.length,
                    earned: badges.filter(b => b.earned).length,
                    locked: badges.filter(b => !b.earned).length
                }
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo badges de usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener badges'
            });
        }
    }
);

/**
 * POST /api/levels/badges/:id/feature
 * Establece un badge como destacado
 */
router.post('/badges/:id/feature',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const success = await LevelsService.setFeaturedBadge(
                req.user.id,
                parseInt(req.params.id)
            );

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Badge no encontrado o no lo tienes'
                });
            }

            res.json({
                success: true,
                message: 'Badge destacado actualizado'
            });
        } catch (error) {
            console.error('[LEVELS] Error destacando badge:', error);
            res.status(500).json({
                success: false,
                message: 'Error al destacar badge'
            });
        }
    }
);

// =====================================
// PERFIL
// =====================================

/**
 * GET /api/levels/profile
 * Obtiene perfil del usuario autenticado
 */
router.get('/profile/me',
    authenticateToken,
    async (req, res) => {
        try {
            const profile = await LevelsService.getUserProfile(req.user.id);

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil'
            });
        }
    }
);

/**
 * GET /api/levels/profile/:userId
 * Obtiene perfil público de un usuario
 */
router.get('/profile/:userId',
    [param('userId').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const profile = await LevelsService.getUserProfile(parseInt(req.params.userId));

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Perfil no encontrado'
                });
            }

            // Si no es público y no es el mismo usuario
            if (!profile.is_public && (!req.user || req.user.id !== profile.user_id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Este perfil es privado'
                });
            }

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo perfil público:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil'
            });
        }
    }
);

/**
 * PUT /api/levels/profile
 * Actualiza perfil del usuario
 */
router.put('/profile',
    authenticateToken,
    [
        body('display_name').optional().isString().isLength({ min: 2, max: 100 }),
        body('bio').optional().isString().isLength({ max: 500 }),
        body('avatar_url').optional().isURL(),
        body('is_public').optional().isBoolean(),
        body('show_level').optional().isBoolean(),
        body('show_badges').optional().isBoolean(),
        body('show_stats').optional().isBoolean(),
        body('theme').optional().isString()
    ],
    validate,
    async (req, res) => {
        try {
            const profile = await LevelsService.updateUserProfile(req.user.id, req.body);

            res.json({
                success: true,
                data: profile,
                message: 'Perfil actualizado'
            });
        } catch (error) {
            console.error('[LEVELS] Error actualizando perfil:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar perfil'
            });
        }
    }
);

// =====================================
// DESBLOQUEOS
// =====================================

/**
 * GET /api/levels/unlocks
 * Obtiene features disponibles para el usuario
 */
router.get('/unlocks/available',
    authenticateToken,
    async (req, res) => {
        try {
            const features = await LevelsService.getAvailableFeatures(req.user.id);

            res.json({
                success: true,
                data: features
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo desbloqueos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener desbloqueos'
            });
        }
    }
);

/**
 * GET /api/levels/unlocks/check/:feature
 * Verifica si usuario tiene acceso a una feature
 */
router.get('/unlocks/check/:feature',
    authenticateToken,
    async (req, res) => {
        try {
            const hasAccess = await LevelsService.hasFeatureAccess(
                req.user.id,
                req.params.feature
            );

            res.json({
                success: true,
                data: {
                    feature: req.params.feature,
                    hasAccess
                }
            });
        } catch (error) {
            console.error('[LEVELS] Error verificando acceso:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar acceso'
            });
        }
    }
);

// =====================================
// LEADERBOARD
// =====================================

/**
 * GET /api/levels/leaderboard
 * Obtiene leaderboard de XP
 */
router.get('/leaderboard/xp',
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const leaderboard = await LevelsService.getXPLeaderboard(limit);

            res.json({
                success: true,
                data: leaderboard
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo leaderboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener leaderboard'
            });
        }
    }
);

/**
 * GET /api/levels/leaderboard/rank
 * Obtiene posición del usuario en el leaderboard
 */
router.get('/leaderboard/rank',
    authenticateToken,
    async (req, res) => {
        try {
            const rank = await LevelsService.getUserRank(req.user.id);

            res.json({
                success: true,
                data: { rank }
            });
        } catch (error) {
            console.error('[LEVELS] Error obteniendo rank:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener posición'
            });
        }
    }
);

// =====================================
// XP (Admin)
// =====================================

/**
 * POST /api/levels/xp/grant
 * Otorga XP a un usuario (admin)
 */
router.post('/xp/grant',
    authenticateToken,
    [
        body('userId').isInt({ min: 1 }),
        body('amount').isInt({ min: 1, max: 10000 }),
        body('source').optional().isString().isLength({ max: 100 })
    ],
    validate,
    async (req, res) => {
        try {
            // Verificar permisos admin
            if (!['admin', 'administrativo'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden otorgar XP'
                });
            }

            const result = await LevelsService.grantXP(
                req.body.userId,
                req.body.amount,
                req.body.source || 'admin_grant'
            );

            res.json({
                success: true,
                data: result,
                message: `${req.body.amount} XP otorgados`
            });
        } catch (error) {
            console.error('[LEVELS] Error otorgando XP:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al otorgar XP'
            });
        }
    }
);

module.exports = router;

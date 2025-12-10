/**
 * 🏆 CHALLENGES ROUTES - SISTEMA DE RETOS v2.0
 * Gestión de desafíos educativos, streaks y recompensas
 * FASE 1 - Semana 5-6 (Actualizado)
 */

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const ChallengesService = require('../services/ChallengesService');
const { executeQuery } = require('../data/database-access');

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
// OBTENER RETOS
// =====================================

/**
 * GET /api/challenges
 * Listar todos los retos disponibles
 */
router.get('/',
    authenticateToken,
    [
        query('category').optional().isIn(['academic', 'social', 'creative', 'physical', 'daily']),
        query('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']),
        query('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'one-time', 'event']),
        query('subject').optional().isString().isLength({ max: 100 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const options = {
                category: req.query.category,
                difficulty: req.query.difficulty,
                frequency: req.query.frequency,
                subject: req.query.subject,
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0
            };

            const challenges = await ChallengesService.getAvailableChallenges(userId, options);

            // Agrupar por frecuencia
            const grouped = {
                all: challenges,
                daily: challenges.filter(c => c.frequency === 'daily'),
                weekly: challenges.filter(c => c.frequency === 'weekly'),
                monthly: challenges.filter(c => c.frequency === 'monthly'),
                oneTime: challenges.filter(c => c.frequency === 'one-time')
            };

            res.json({
                success: true,
                data: req.query.frequency ? grouped[req.query.frequency] || challenges : challenges,
                summary: {
                    total: challenges.length,
                    completed: challenges.filter(c => c.user_status === 'claimed').length,
                    in_progress: challenges.filter(c => c.user_status === 'in_progress').length,
                    available: challenges.filter(c => !c.user_status).length
                },
                pagination: {
                    limit: options.limit,
                    offset: options.offset,
                    count: challenges.length
                }
            });
        } catch (error) {
            console.error('[CHALLENGES] Error obteniendo retos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener retos'
            });
        }
    }
);

/**
 * GET /api/challenges/daily
 * Obtiene retos diarios
 */
router.get('/daily',
    authenticateToken,
    async (req, res) => {
        try {
            const challenges = await ChallengesService.getDailyChallenges(req.user.id);

            res.json({
                success: true,
                data: challenges
            });
        } catch (error) {
            console.error('[CHALLENGES] Error obteniendo retos diarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener retos diarios'
            });
        }
    }
);

/**
 * GET /api/challenges/featured
 * Obtiene retos destacados
 */
router.get('/featured',
    authenticateToken,
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const challenges = await ChallengesService.getFeaturedChallenges(req.user.id, limit);

            res.json({
                success: true,
                data: challenges
            });
        } catch (error) {
            console.error('[CHALLENGES] Error obteniendo retos destacados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener retos destacados'
            });
        }
    }
);

/**
 * GET /api/challenges/user/streaks
 * Obtiene streaks del usuario
 */
router.get('/user/streaks',
    authenticateToken,
    async (req, res) => {
        try {
            const streaks = await ChallengesService.getUserStreaks(req.user.id);

            res.json({
                success: true,
                data: streaks
            });
        } catch (error) {
            console.error('[CHALLENGES] Error obteniendo streaks:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener streaks'
            });
        }
    }
);

/**
 * GET /api/challenges/user/stats
 * Obtiene estadísticas del usuario
 */
router.get('/user/stats',
    authenticateToken,
    async (req, res) => {
        try {
            const stats = await ChallengesService.getUserChallengeStats(req.user.id);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('[CHALLENGES] Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }
);

/**
 * GET /api/challenges/streaks/multiplier
 * Obtiene multiplicador por streak
 */
router.get('/streaks/multiplier',
    authenticateToken,
    async (req, res) => {
        try {
            const multiplier = await ChallengesService.getStreakMultiplier(req.user.id);

            res.json({
                success: true,
                data: {
                    multiplier,
                    percentage: Math.round((multiplier - 1) * 100)
                }
            });
        } catch (error) {
            console.error('[CHALLENGES] Error obteniendo multiplicador:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener multiplicador'
            });
        }
    }
);

/**
 * GET /api/challenges/meta/categories
 * Obtiene categorías disponibles
 */
router.get('/meta/categories',
    async (req, res) => {
        res.json({
            success: true,
            data: [
                { id: 'academic', name: 'Académico', icon: 'fa-graduation-cap', color: '#4a90d9' },
                { id: 'social', name: 'Social', icon: 'fa-users', color: '#6c5ce7' },
                { id: 'creative', name: 'Creativo', icon: 'fa-paint-brush', color: '#e17055' },
                { id: 'physical', name: 'Físico', icon: 'fa-running', color: '#00b894' },
                { id: 'daily', name: 'Diario', icon: 'fa-calendar-day', color: '#f5a623' }
            ]
        });
    }
);

/**
 * GET /api/challenges/meta/subjects
 * Obtiene materias de BGE
 */
router.get('/meta/subjects',
    async (req, res) => {
        res.json({
            success: true,
            data: ChallengesService.subjects
        });
    }
);

/**
 * GET /api/challenges/:id
 * Obtiene detalles de un reto específico
 */
router.get('/:id',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const challenge = await ChallengesService.getChallengeById(
                parseInt(req.params.id),
                req.user.id
            );

            if (!challenge) {
                return res.status(404).json({
                    success: false,
                    message: 'Reto no encontrado'
                });
            }

            res.json({
                success: true,
                data: challenge
            });
        } catch (error) {
            console.error('[CHALLENGES] Error obteniendo reto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener reto'
            });
        }
    }
);

// =====================================
// ACCIONES DE RETOS
// =====================================

/**
 * POST /api/challenges/:id/start
 * Inicia un reto
 */
router.post('/:id/start',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const result = await ChallengesService.startChallenge(
                req.user.id,
                parseInt(req.params.id)
            );

            res.json(result);
        } catch (error) {
            console.error('[CHALLENGES] Error iniciando reto:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al iniciar reto'
            });
        }
    }
);

/**
 * POST /api/challenges/:id/progress
 * Actualiza progreso
 */
router.post('/:id/progress',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('increment').optional().isInt({ min: 1, max: 100 })
    ],
    validate,
    async (req, res) => {
        try {
            const result = await ChallengesService.updateProgress(
                req.user.id,
                parseInt(req.params.id),
                req.body.increment || 1,
                req.body.progressData
            );

            res.json(result);
        } catch (error) {
            console.error('[CHALLENGES] Error actualizando progreso:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar progreso'
            });
        }
    }
);

/**
 * POST /api/challenges/:id/complete
 * Marca reto como completado (compatibilidad con v1)
 */
router.post('/:id/complete',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            // Actualizar progreso al máximo
            const progressResult = await ChallengesService.updateProgress(
                req.user.id,
                parseInt(req.params.id),
                1000 // Asegurar que llega al target
            );

            if (!progressResult.completed) {
                return res.json(progressResult);
            }

            // Reclamar recompensa automáticamente
            const claimResult = await ChallengesService.claimReward(
                req.user.id,
                parseInt(req.params.id)
            );

            res.json({
                success: true,
                ...claimResult,
                challenge: {
                    id: parseInt(req.params.id)
                }
            });
        } catch (error) {
            console.error('[CHALLENGES] Error completando reto:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al completar reto'
            });
        }
    }
);

/**
 * POST /api/challenges/:id/claim
 * Reclama recompensa
 */
router.post('/:id/claim',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const result = await ChallengesService.claimReward(
                req.user.id,
                parseInt(req.params.id)
            );

            res.json(result);
        } catch (error) {
            console.error('[CHALLENGES] Error reclamando recompensa:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al reclamar recompensa'
            });
        }
    }
);

/**
 * POST /api/challenges/streaks/update
 * Actualiza streak de login
 */
router.post('/streaks/update',
    authenticateToken,
    async (req, res) => {
        try {
            const result = await ChallengesService.updateStreak(
                req.user.id,
                req.body.streakType || 'daily_login'
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('[CHALLENGES] Error actualizando streak:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar streak'
            });
        }
    }
);

/**
 * POST /api/challenges/:id/join
 * Unirse a reto colaborativo
 */
router.post('/:id/join',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const result = await ChallengesService.joinCollaborativeChallenge(
                req.user.id,
                parseInt(req.params.id)
            );

            res.json(result);
        } catch (error) {
            console.error('[CHALLENGES] Error uniéndose a reto:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al unirse al reto'
            });
        }
    }
);

/**
 * GET /api/challenges/:id/participants
 * Obtiene participantes de reto colaborativo
 */
router.get('/:id/participants',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const participants = await ChallengesService.getCollaborativeParticipants(
                parseInt(req.params.id)
            );

            res.json({
                success: true,
                data: participants
            });
        } catch (error) {
            console.error('[CHALLENGES] Error obteniendo participantes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener participantes'
            });
        }
    }
);

// =====================================
// ADMIN ENDPOINTS
// =====================================

/**
 * POST /api/challenges
 * Crear nuevo reto (admin)
 */
router.post('/',
    authenticateToken,
    [
        body('title').isString().isLength({ min: 3, max: 200 }),
        body('description').isString().isLength({ min: 10 }),
        body('category').isIn(['academic', 'social', 'creative', 'physical', 'daily']),
        body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']),
        body('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'one-time', 'event']),
        body('reward_coins').optional().isInt({ min: 1, max: 1000 }),
        body('reward_xp').optional().isInt({ min: 1, max: 5000 })
    ],
    validate,
    async (req, res) => {
        try {
            // Verificar permisos
            if (!['admin', 'administrativo'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden crear retos'
                });
            }

            const {
                title, description, category, subject, difficulty = 'medium',
                challenge_type = 'assignment', frequency = 'one-time',
                reward_coins = 10, reward_xp = 50, completion_criteria = {},
                start_date, end_date, is_collaborative = false,
                min_participants = 1, max_participants, icon = 'fa-trophy'
            } = req.body;

            const query = `
                INSERT INTO challenges (
                    title, description, category, subject, difficulty,
                    challenge_type, frequency, reward_coins, reward_xp,
                    completion_criteria, start_date, end_date,
                    is_collaborative, min_participants, max_participants, icon
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
                )
                RETURNING *
            `;

            const result = await executeQuery(query, [
                title, description, category, subject, difficulty,
                challenge_type, frequency, reward_coins, reward_xp,
                JSON.stringify(completion_criteria), start_date, end_date,
                is_collaborative, min_participants, max_participants, icon
            ]);

            res.status(201).json({
                success: true,
                data: result[0],
                message: 'Reto creado exitosamente'
            });
        } catch (error) {
            console.error('[CHALLENGES] Error creando reto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear reto'
            });
        }
    }
);

module.exports = router;

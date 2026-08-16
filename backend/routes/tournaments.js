/**
 * Rutas de Torneos y Competencias
 * BGE Héroes de la Patria
 * FASE 3 - Semana 21-22
 *
 * Endpoints para sistema de torneos académicos
 */

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');

// Middleware de autenticación
const { authenticateToken } = require('../middleware/auth.js');

// Helper para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Intentar cargar el servicio
let tournamentsService;
try {
    tournamentsService = require('../services/TournamentsService.js');
} catch (error) {
    console.log('[TOURNAMENTS] Servicio no disponible, usando mock');
    tournamentsService = null;
}

// ========================================
// TORNEOS
// ========================================

/**
 * GET /api/tournaments
 * Obtener lista de torneos
 */
router.get('/',
    authenticateToken,
    [
        query('status').optional().isIn(['draft', 'registration', 'active', 'completed', 'cancelled']),
        query('tournament_type').optional().isIn(['quiz', 'challenge', 'project', 'hackathon', 'debate']),
        query('subject').optional().isString(),
        query('featured').optional().isBoolean(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const options = {
                status: req.query.status,
                tournamentType: req.query.tournament_type,
                subject: req.query.subject,
                featured: req.query.featured === 'true',
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            if (tournamentsService && tournamentsService.getTournaments) {
                const tournaments = await tournamentsService.getTournaments(options);
                return res.json({
                    success: true,
                    data: tournaments
                });
            }

            // Datos de ejemplo
            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error obteniendo torneos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener torneos'
            });
        }
    }
);

/**
 * GET /api/tournaments/featured
 * Obtener torneos destacados
 */
router.get('/featured', authenticateToken, async (req, res) => {
    try {
        if (tournamentsService && tournamentsService.getTournaments) {
            const tournaments = await tournamentsService.getTournaments({
                featured: true,
                status: 'registration',
                limit: 5
            });
            return res.json({
                success: true,
                data: tournaments
            });
        }

        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('[TOURNAMENTS] Error obteniendo destacados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener torneos destacados'
        });
    }
});

/**
 * GET /api/tournaments/:id
 * Obtener detalles de un torneo
 */
router.get('/:id',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de torneo inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            if (tournamentsService && tournamentsService.getTournamentById) {
                const tournament = await tournamentsService.getTournamentById(id, userId);
                if (!tournament) {
                    return res.status(404).json({
                        success: false,
                        message: 'Torneo no encontrado'
                    });
                }
                return res.json({
                    success: true,
                    data: tournament
                });
            }

            res.status(404).json({
                success: false,
                message: 'Torneo no encontrado'
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error obteniendo torneo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener torneo'
            });
        }
    }
);

/**
 * POST /api/tournaments
 * Crear nuevo torneo (admin/docente)
 */
router.post('/',
    authenticateToken,
    [
        body('name').notEmpty().withMessage('Nombre requerido'),
        body('tournament_type').isIn(['quiz', 'challenge', 'project', 'hackathon', 'debate']),
        body('registration_start').isISO8601(),
        body('registration_end').isISO8601(),
        body('start_date').isISO8601(),
        body('end_date').isISO8601(),
        body('min_participants').optional().isInt({ min: 2 }),
        body('max_participants').optional().isInt({ min: 2 }),
        body('subject').optional().isString(),
        body('prize_pool_coins').optional().isInt({ min: 0 }),
        body('prize_pool_xp').optional().isInt({ min: 0 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            // Verificar permisos
            if (req.user.role !== 'admin' && req.user.role !== 'docente') {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            const tournamentData = {
                ...req.body,
                createdBy: req.user.id
            };

            if (tournamentsService && tournamentsService.createTournament) {
                const tournament = await tournamentsService.createTournament(tournamentData);
                return res.status(201).json({
                    success: true,
                    message: 'Torneo creado',
                    data: tournament
                });
            }

            res.status(201).json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error creando torneo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear torneo'
            });
        }
    }
);

/**
 * PUT /api/tournaments/:id/status
 * Actualizar estado del torneo
 */
router.put('/:id/status',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido'),
        body('status').isIn(['draft', 'registration', 'active', 'completed', 'cancelled'])
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            if (req.user.role !== 'admin' && req.user.role !== 'docente') {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            const { id } = req.params;
            const { status } = req.body;

            if (tournamentsService && tournamentsService.updateTournamentStatus) {
                const tournament = await tournamentsService.updateTournamentStatus(id, status);
                return res.json({
                    success: true,
                    message: 'Estado actualizado',
                    data: tournament
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error actualizando estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado'
            });
        }
    }
);

// ========================================
// PARTICIPACIÓN
// ========================================

/**
 * POST /api/tournaments/:id/register
 * Registrarse en un torneo
 */
router.post('/:id/register',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de torneo inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            if (tournamentsService && tournamentsService.registerParticipant) {
                const participant = await tournamentsService.registerParticipant(id, userId);
                return res.status(201).json({
                    success: true,
                    message: 'Registro exitoso',
                    data: participant
                });
            }

            res.status(201).json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error en registro:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al registrarse'
            });
        }
    }
);

/**
 * POST /api/tournaments/:id/withdraw
 * Retirarse de un torneo
 */
router.post('/:id/withdraw',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de torneo inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            if (tournamentsService && tournamentsService.withdrawParticipant) {
                const result = await tournamentsService.withdrawParticipant(id, userId);
                return res.json({
                    success: true,
                    message: 'Retiro exitoso',
                    data: result
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error en retiro:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al retirarse'
            });
        }
    }
);

/**
 * GET /api/tournaments/:id/participants
 * Obtener participantes de un torneo
 */
router.get('/:id/participants',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de torneo inválido'),
        query('status').optional().isString(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const options = {
                status: req.query.status,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 50
            };

            if (tournamentsService && tournamentsService.getParticipants) {
                const participants = await tournamentsService.getParticipants(id, options);
                return res.json({
                    success: true,
                    data: participants
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error obteniendo participantes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener participantes'
            });
        }
    }
);

// ========================================
// MATCHES
// ========================================

/**
 * GET /api/tournaments/:id/matches
 * Obtener matches de un torneo
 */
router.get('/:id/matches',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de torneo inválido'),
        query('round_id').optional().isInt(),
        query('status').optional().isIn(['scheduled', 'live', 'completed', 'cancelled']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const options = {
                roundId: req.query.round_id ? parseInt(req.query.round_id) : null,
                status: req.query.status,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 50
            };

            if (tournamentsService && tournamentsService.getMatches) {
                const matches = await tournamentsService.getMatches(id, options);
                return res.json({
                    success: true,
                    data: matches
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error obteniendo matches:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener matches'
            });
        }
    }
);

/**
 * POST /api/tournaments/matches/:matchId/start
 * Iniciar un match
 */
router.post('/matches/:matchId/start',
    authenticateToken,
    [
        param('matchId').isInt().withMessage('ID de match inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { matchId } = req.params;

            if (tournamentsService && tournamentsService.startMatch) {
                const match = await tournamentsService.startMatch(matchId);
                return res.json({
                    success: true,
                    message: 'Match iniciado',
                    data: match
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error iniciando match:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar match'
            });
        }
    }
);

/**
 * POST /api/tournaments/matches/:matchId/result
 * Registrar resultado de match
 */
router.post('/matches/:matchId/result',
    authenticateToken,
    [
        param('matchId').isInt().withMessage('ID de match inválido'),
        body('score1').isFloat({ min: 0 }),
        body('score2').isFloat({ min: 0 }),
        body('winner_id').optional().isInt(),
        body('responses').optional().isArray(),
        body('duration').optional().isInt()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { matchId } = req.params;
            const resultData = {
                score1: req.body.score1,
                score2: req.body.score2,
                winnerId: req.body.winner_id,
                responses: req.body.responses,
                duration: req.body.duration
            };

            if (tournamentsService && tournamentsService.recordMatchResult) {
                const match = await tournamentsService.recordMatchResult(matchId, resultData);
                return res.json({
                    success: true,
                    message: 'Resultado registrado',
                    data: match
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error registrando resultado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar resultado'
            });
        }
    }
);

// ========================================
// LEADERBOARD
// ========================================

/**
 * GET /api/tournaments/:id/leaderboard
 * Obtener leaderboard del torneo
 */
router.get('/:id/leaderboard',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de torneo inválido'),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 20;

            if (tournamentsService && tournamentsService.getLeaderboard) {
                const leaderboard = await tournamentsService.getLeaderboard(id, limit);
                return res.json({
                    success: true,
                    data: leaderboard
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error obteniendo leaderboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener leaderboard'
            });
        }
    }
);

/**
 * POST /api/tournaments/:id/finalize
 * Finalizar torneo y distribuir premios
 */
router.post('/:id/finalize',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de torneo inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            if (req.user.role !== 'admin' && req.user.role !== 'docente') {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            const { id } = req.params;

            if (tournamentsService && tournamentsService.finalizeTournament) {
                const result = await tournamentsService.finalizeTournament(id);
                return res.json({
                    success: true,
                    message: 'Torneo finalizado',
                    data: result
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error finalizando torneo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al finalizar torneo'
            });
        }
    }
);

// ========================================
// HISTORIAL Y ESTADÍSTICAS DEL USUARIO
// ========================================

/**
 * GET /api/tournaments/user/active
 * Obtener torneos activos del usuario
 */
router.get('/user/active', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        if (tournamentsService && tournamentsService.getUserActiveTournaments) {
            const tournaments = await tournamentsService.getUserActiveTournaments(userId);
            return res.json({
                success: true,
                data: tournaments
            });
        }

        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('[TOURNAMENTS] Error obteniendo torneos activos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener torneos activos'
        });
    }
});

/**
 * GET /api/tournaments/user/history
 * Obtener historial de torneos del usuario
 */
router.get('/user/history',
    authenticateToken,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            if (tournamentsService && tournamentsService.getUserTournamentHistory) {
                const history = await tournamentsService.getUserTournamentHistory(userId, options);
                return res.json({
                    success: true,
                    data: history
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[TOURNAMENTS] Error obteniendo historial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial'
            });
        }
    }
);

/**
 * GET /api/tournaments/user/stats
 * Obtener estadísticas de torneos del usuario
 */
router.get('/user/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        if (tournamentsService && tournamentsService.getUserTournamentStats) {
            const stats = await tournamentsService.getUserTournamentStats(userId);
            return res.json({
                success: true,
                data: stats
            });
        }

        // Datos de ejemplo
        res.json({
            success: true,
            data: {
                tournaments_played: 0,
                total_wins: 0,
                total_losses: 0,
                total_coins_won: 0,
                total_xp_won: 0,
                first_places: 0,
                podium_finishes: 0,
                avg_rank: null
            }
        });
    } catch (error) {
        console.error('[TOURNAMENTS] Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

/**
 * GET /api/tournaments/user/achievements
 * Obtener logros de torneos del usuario
 */
router.get('/user/achievements', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        if (tournamentsService && tournamentsService.getUserAchievements) {
            const achievements = await tournamentsService.getUserAchievements(userId);
            return res.json({
                success: true,
                data: achievements
            });
        }

        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('[TOURNAMENTS] Error obteniendo logros:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logros'
        });
    }
});

module.exports = router;

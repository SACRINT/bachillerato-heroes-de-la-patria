/**
 * 💬 FORUMS ROUTES
 * Endpoints para foros de discusión
 * FASE 2 - Semana 15-16
 */

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const ForumsService = require('../services/ForumsService');

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
// CATEGORÍAS
// =====================================

/**
 * GET /api/forums/categories
 * Lista todas las categorías
 */
router.get('/categories',
    authenticateToken,
    async (req, res) => {
        try {
            const categories = await ForumsService.getCategories(req.user.role);

            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo categorías:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener categorías'
            });
        }
    }
);

/**
 * GET /api/forums/categories/:slug
 * Obtiene categoría por slug
 */
router.get('/categories/:slug',
    authenticateToken,
    async (req, res) => {
        try {
            const category = await ForumsService.getCategoryBySlug(req.params.slug);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }

            res.json({
                success: true,
                data: category
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener categoría'
            });
        }
    }
);

// =====================================
// TEMAS
// =====================================

/**
 * GET /api/forums/topics
 * Lista temas con filtros
 */
router.get('/topics',
    authenticateToken,
    [
        query('categoryId').optional().isInt({ min: 1 }),
        query('status').optional().isIn(['open', 'closed', 'solved', 'all']),
        query('topicType').optional().isIn(['discussion', 'question', 'announcement', 'poll']),
        query('search').optional().isString(),
        query('sortBy').optional().isIn(['created_at', 'last_reply_at', 'view_count', 'reply_count', 'like_count']),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    async (req, res) => {
        try {
            const topics = await ForumsService.getTopics({
                categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : null,
                status: req.query.status,
                topicType: req.query.topicType,
                search: req.query.search,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder || 'DESC',
                limit: parseInt(req.query.limit) || 20,
                offset: parseInt(req.query.offset) || 0
            });

            res.json({
                success: true,
                data: topics,
                pagination: {
                    limit: parseInt(req.query.limit) || 20,
                    offset: parseInt(req.query.offset) || 0,
                    count: topics.length
                }
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo temas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener temas'
            });
        }
    }
);

/**
 * GET /api/forums/topics/trending
 * Temas trending
 */
router.get('/topics/trending',
    authenticateToken,
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const topics = await ForumsService.getTrendingTopics(limit);

            res.json({
                success: true,
                data: topics
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo trending:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener temas trending'
            });
        }
    }
);

/**
 * GET /api/forums/topics/:id
 * Obtiene tema por ID
 */
router.get('/topics/:id',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const topic = await ForumsService.getTopicById(
                parseInt(req.params.id),
                req.user.id
            );

            if (!topic) {
                return res.status(404).json({
                    success: false,
                    message: 'Tema no encontrado'
                });
            }

            res.json({
                success: true,
                data: topic
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo tema:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tema'
            });
        }
    }
);

/**
 * POST /api/forums/topics
 * Crea un nuevo tema
 */
router.post('/topics',
    authenticateToken,
    [
        body('categoryId').isInt({ min: 1 }),
        body('title').isString().isLength({ min: 5, max: 300 }),
        body('content').isString().isLength({ min: 10 }),
        body('topicType').optional().isIn(['discussion', 'question', 'announcement', 'poll']),
        body('tags').optional().isArray()
    ],
    validate,
    async (req, res) => {
        try {
            const topic = await ForumsService.createTopic(req.user.id, {
                categoryId: req.body.categoryId,
                title: req.body.title,
                content: req.body.content,
                topicType: req.body.topicType,
                tags: req.body.tags
            });

            res.status(201).json({
                success: true,
                data: topic,
                message: 'Tema creado exitosamente'
            });
        } catch (error) {
            console.error('[FORUMS] Error creando tema:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear tema'
            });
        }
    }
);

/**
 * PUT /api/forums/topics/:id
 * Actualiza un tema
 */
router.put('/topics/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('title').optional().isString().isLength({ min: 5, max: 300 }),
        body('content').optional().isString().isLength({ min: 10 }),
        body('tags').optional().isArray(),
        body('status').optional().isIn(['open', 'closed', 'solved', 'archived'])
    ],
    validate,
    async (req, res) => {
        try {
            const topic = await ForumsService.updateTopic(
                parseInt(req.params.id),
                req.user.id,
                req.body
            );

            if (!topic) {
                return res.status(404).json({
                    success: false,
                    message: 'Tema no encontrado o no autorizado'
                });
            }

            res.json({
                success: true,
                data: topic,
                message: 'Tema actualizado'
            });
        } catch (error) {
            console.error('[FORUMS] Error actualizando tema:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar tema'
            });
        }
    }
);

// =====================================
// POSTS/RESPUESTAS
// =====================================

/**
 * GET /api/forums/topics/:id/posts
 * Obtiene posts de un tema
 */
router.get('/topics/:id/posts',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    async (req, res) => {
        try {
            const posts = await ForumsService.getTopicPosts(
                parseInt(req.params.id),
                {
                    limit: parseInt(req.query.limit) || 50,
                    offset: parseInt(req.query.offset) || 0,
                    userId: req.user.id
                }
            );

            res.json({
                success: true,
                data: posts
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo posts:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuestas'
            });
        }
    }
);

/**
 * POST /api/forums/topics/:id/posts
 * Crea una respuesta
 */
router.post('/topics/:id/posts',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('content').isString().isLength({ min: 3 }),
        body('parentPostId').optional().isInt({ min: 1 })
    ],
    validate,
    async (req, res) => {
        try {
            const post = await ForumsService.createPost(req.user.id, {
                topicId: parseInt(req.params.id),
                content: req.body.content,
                parentPostId: req.body.parentPostId
            });

            res.status(201).json({
                success: true,
                data: post,
                message: 'Respuesta publicada'
            });
        } catch (error) {
            console.error('[FORUMS] Error creando post:', error);
            res.status(500).json({
                success: false,
                message: 'Error al publicar respuesta'
            });
        }
    }
);

/**
 * PUT /api/forums/posts/:id
 * Actualiza una respuesta
 */
router.put('/posts/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('content').isString().isLength({ min: 3 })
    ],
    validate,
    async (req, res) => {
        try {
            const post = await ForumsService.updatePost(
                parseInt(req.params.id),
                req.user.id,
                req.body.content
            );

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta no encontrada o no autorizada'
                });
            }

            res.json({
                success: true,
                data: post,
                message: 'Respuesta actualizada'
            });
        } catch (error) {
            console.error('[FORUMS] Error actualizando post:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar respuesta'
            });
        }
    }
);

/**
 * DELETE /api/forums/posts/:id
 * Elimina una respuesta
 */
router.delete('/posts/:id',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const deleted = await ForumsService.deletePost(
                parseInt(req.params.id),
                req.user.id,
                req.body.reason
            );

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta no encontrada o no autorizada'
                });
            }

            res.json({
                success: true,
                message: 'Respuesta eliminada'
            });
        } catch (error) {
            console.error('[FORUMS] Error eliminando post:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar respuesta'
            });
        }
    }
);

/**
 * POST /api/forums/topics/:topicId/posts/:postId/solution
 * Marca post como solución
 */
router.post('/topics/:topicId/posts/:postId/solution',
    authenticateToken,
    [
        param('topicId').isInt({ min: 1 }),
        param('postId').isInt({ min: 1 })
    ],
    validate,
    async (req, res) => {
        try {
            await ForumsService.markAsSolution(
                parseInt(req.params.topicId),
                parseInt(req.params.postId),
                req.user.id
            );

            res.json({
                success: true,
                message: 'Respuesta marcada como solución'
            });
        } catch (error) {
            console.error('[FORUMS] Error marcando solución:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al marcar solución'
            });
        }
    }
);

// =====================================
// REACCIONES
// =====================================

/**
 * POST /api/forums/topics/:id/react
 * Reaccionar a un tema
 */
router.post('/topics/:id/react',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('reactionType').isIn(['like', 'dislike', 'helpful', 'insightful', 'funny'])
    ],
    validate,
    async (req, res) => {
        try {
            const result = await ForumsService.reactToTopic(
                req.user.id,
                parseInt(req.params.id),
                req.body.reactionType
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('[FORUMS] Error reaccionando a tema:', error);
            res.status(500).json({
                success: false,
                message: 'Error al reaccionar'
            });
        }
    }
);

/**
 * POST /api/forums/posts/:id/react
 * Reaccionar a un post
 */
router.post('/posts/:id/react',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('reactionType').isIn(['like', 'dislike', 'helpful', 'insightful', 'funny'])
    ],
    validate,
    async (req, res) => {
        try {
            const result = await ForumsService.reactToPost(
                req.user.id,
                parseInt(req.params.id),
                req.body.reactionType
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('[FORUMS] Error reaccionando a post:', error);
            res.status(500).json({
                success: false,
                message: 'Error al reaccionar'
            });
        }
    }
);

// =====================================
// SUSCRIPCIONES
// =====================================

/**
 * POST /api/forums/topics/:id/subscribe
 * Suscribirse a un tema
 */
router.post('/topics/:id/subscribe',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const subscription = await ForumsService.subscribeTopic(
                req.user.id,
                parseInt(req.params.id)
            );

            res.json({
                success: true,
                data: subscription,
                message: 'Suscrito al tema'
            });
        } catch (error) {
            console.error('[FORUMS] Error suscribiendo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al suscribirse'
            });
        }
    }
);

/**
 * DELETE /api/forums/topics/:id/subscribe
 * Desuscribirse de un tema
 */
router.delete('/topics/:id/subscribe',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            await ForumsService.unsubscribeTopic(
                req.user.id,
                parseInt(req.params.id)
            );

            res.json({
                success: true,
                message: 'Desuscrito del tema'
            });
        } catch (error) {
            console.error('[FORUMS] Error desuscribiendo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al desuscribirse'
            });
        }
    }
);

/**
 * GET /api/forums/subscriptions
 * Obtiene suscripciones del usuario
 */
router.get('/subscriptions',
    authenticateToken,
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const subscriptions = await ForumsService.getUserSubscriptions(req.user.id, limit);

            res.json({
                success: true,
                data: subscriptions
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo suscripciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener suscripciones'
            });
        }
    }
);

// =====================================
// MENCIONES
// =====================================

/**
 * GET /api/forums/mentions
 * Obtiene menciones no leídas
 */
router.get('/mentions',
    authenticateToken,
    async (req, res) => {
        try {
            const mentions = await ForumsService.getUnreadMentions(req.user.id);

            res.json({
                success: true,
                data: mentions
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo menciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener menciones'
            });
        }
    }
);

/**
 * PUT /api/forums/mentions/read
 * Marca menciones como leídas
 */
router.put('/mentions/read',
    authenticateToken,
    [body('mentionIds').optional().isArray()],
    validate,
    async (req, res) => {
        try {
            await ForumsService.markMentionsAsRead(req.user.id, req.body.mentionIds);

            res.json({
                success: true,
                message: 'Menciones marcadas como leídas'
            });
        } catch (error) {
            console.error('[FORUMS] Error marcando menciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al marcar menciones'
            });
        }
    }
);

// =====================================
// REPORTES
// =====================================

/**
 * POST /api/forums/report
 * Reportar contenido
 */
router.post('/report',
    authenticateToken,
    [
        body('topicId').optional().isInt({ min: 1 }),
        body('postId').optional().isInt({ min: 1 }),
        body('reason').isIn(['spam', 'offensive', 'harassment', 'inappropriate', 'other']),
        body('description').optional().isString().isLength({ max: 500 })
    ],
    validate,
    async (req, res) => {
        try {
            if (!req.body.topicId && !req.body.postId) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar topicId o postId'
                });
            }

            const report = await ForumsService.reportContent(req.user.id, req.body);

            res.status(201).json({
                success: true,
                data: report,
                message: 'Reporte enviado. Será revisado por un moderador.'
            });
        } catch (error) {
            console.error('[FORUMS] Error reportando:', error);
            res.status(500).json({
                success: false,
                message: 'Error al enviar reporte'
            });
        }
    }
);

/**
 * GET /api/forums/reports/pending
 * Obtiene reportes pendientes (admin)
 */
router.get('/reports/pending',
    authenticateToken,
    async (req, res) => {
        try {
            if (!['admin', 'administrativo'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso solo para moderadores'
                });
            }

            const reports = await ForumsService.getPendingReports();

            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo reportes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener reportes'
            });
        }
    }
);

// =====================================
// ENCUESTAS
// =====================================

/**
 * POST /api/forums/topics/:id/poll
 * Crea encuesta en un tema
 */
router.post('/topics/:id/poll',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('question').isString().isLength({ min: 5, max: 500 }),
        body('options').isArray({ min: 2, max: 10 }),
        body('options.*').isString().isLength({ min: 1, max: 200 }),
        body('allowsMultiple').optional().isBoolean(),
        body('endsAt').optional().isISO8601()
    ],
    validate,
    async (req, res) => {
        try {
            const poll = await ForumsService.createPoll(
                parseInt(req.params.id),
                {
                    question: req.body.question,
                    options: req.body.options,
                    allowsMultiple: req.body.allowsMultiple,
                    endsAt: req.body.endsAt
                }
            );

            res.status(201).json({
                success: true,
                data: poll,
                message: 'Encuesta creada'
            });
        } catch (error) {
            console.error('[FORUMS] Error creando encuesta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear encuesta'
            });
        }
    }
);

/**
 * POST /api/forums/polls/:id/vote
 * Votar en encuesta
 */
router.post('/polls/:id/vote',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('optionIds').isArray({ min: 1 }),
        body('optionIds.*').isInt({ min: 1 })
    ],
    validate,
    async (req, res) => {
        try {
            await ForumsService.votePoll(
                req.user.id,
                parseInt(req.params.id),
                req.body.optionIds
            );

            res.json({
                success: true,
                message: 'Voto registrado'
            });
        } catch (error) {
            console.error('[FORUMS] Error votando:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al votar'
            });
        }
    }
);

// =====================================
// ESTADÍSTICAS
// =====================================

/**
 * GET /api/forums/stats/user
 * Estadísticas del usuario
 */
router.get('/stats/user',
    authenticateToken,
    async (req, res) => {
        try {
            const stats = await ForumsService.getUserStats(req.user.id);

            res.json({
                success: true,
                data: stats || {
                    topics_created: 0,
                    posts_created: 0,
                    reputation_score: 0,
                    reputation_level: 'Novato'
                }
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }
);

/**
 * GET /api/forums/leaderboard
 * Leaderboard de reputación
 */
router.get('/leaderboard',
    authenticateToken,
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const leaderboard = await ForumsService.getReputationLeaderboard(limit);

            res.json({
                success: true,
                data: leaderboard
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo leaderboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener leaderboard'
            });
        }
    }
);

/**
 * GET /api/forums/search
 * Búsqueda de temas
 */
router.get('/search',
    authenticateToken,
    [
        query('q').isString().isLength({ min: 2 }),
        query('categoryId').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    async (req, res) => {
        try {
            const topics = await ForumsService.searchTopics(req.query.q, {
                categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : null,
                limit: parseInt(req.query.limit) || 20,
                offset: parseInt(req.query.offset) || 0
            });

            res.json({
                success: true,
                data: topics,
                query: req.query.q
            });
        } catch (error) {
            console.error('[FORUMS] Error en búsqueda:', error);
            res.status(500).json({
                success: false,
                message: 'Error en búsqueda'
            });
        }
    }
);

module.exports = router;

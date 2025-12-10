/**
 * 💬 FORUMS ROUTES
 * Endpoints para foros de discusión
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
// @ts-ignore
import ForumsService from '../services/ForumsService';

const router: Router = express.Router();

// Middleware de validación
const validate = (req: Request, res: Response, next: express.NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: errors.array()
        });
        return;
    }
    next();
};

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        role: string;
    };
}

// =====================================
// CATEGORÍAS
// =====================================

router.get('/categories', authenticateToken, async (req: Request, res: Response) => {
    try {
        const categories = await ForumsService.getCategories((req as AuthenticatedRequest).user.role);
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('[FORUMS] Error obteniendo categorías:', error);
        res.status(500).json({ success: false, message: 'Error al obtener categorías' });
    }
});

router.get('/categories/:slug', authenticateToken, async (req: Request, res: Response) => {
    try {
        const category = await ForumsService.getCategoryBySlug(req.params.slug);
        if (!category) {
            res.status(404).json({ success: false, message: 'Categoría no encontrada' });
            return;
        }
        res.json({ success: true, data: category });
    } catch (error) {
        console.error('[FORUMS] Error obteniendo categoría:', error);
        res.status(500).json({ success: false, message: 'Error al obtener categoría' });
    }
});

// =====================================
// TEMAS
// =====================================

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
    async (req: Request, res: Response) => {
        try {
            const { categoryId, status, topicType, search, sortBy, sortOrder, limit, offset } = req.query;
            const topics = await ForumsService.getTopics({
                categoryId: categoryId ? parseInt(categoryId as string) : null,
                status, topicType, search, sortBy,
                sortOrder: sortOrder || 'DESC',
                limit: parseInt((limit as string) || '20'),
                offset: parseInt((offset as string) || '0')
            });

            res.json({
                success: true,
                data: topics,
                pagination: {
                    limit: parseInt((limit as string) || '20'),
                    offset: parseInt((offset as string) || '0'),
                    count: topics.length
                }
            });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo temas:', error);
            res.status(500).json({ success: false, message: 'Error al obtener temas' });
        }
    }
);

router.get('/topics/trending', authenticateToken, async (req: Request, res: Response) => {
    try {
        const limit = parseInt((req.query.limit as string) || '10');
        const topics = await ForumsService.getTrendingTopics(limit);
        res.json({ success: true, data: topics });
    } catch (error) {
        console.error('[FORUMS] Error obteniendo trending:', error);
        res.status(500).json({ success: false, message: 'Error al obtener temas trending' });
    }
});

router.get('/topics/:id',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req: Request, res: Response) => {
        try {
            const topic = await ForumsService.getTopicById(
                parseInt(req.params.id),
                (req as AuthenticatedRequest).user.id
            );
            if (!topic) {
                res.status(404).json({ success: false, message: 'Tema no encontrado' });
                return;
            }
            res.json({ success: true, data: topic });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo tema:', error);
            res.status(500).json({ success: false, message: 'Error al obtener tema' });
        }
    }
);

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
    async (req: Request, res: Response) => {
        try {
            const topic = await ForumsService.createTopic((req as AuthenticatedRequest).user.id, {
                categoryId: req.body.categoryId,
                title: req.body.title,
                content: req.body.content,
                topicType: req.body.topicType,
                tags: req.body.tags
            });
            res.status(201).json({ success: true, data: topic, message: 'Tema creado exitosamente' });
        } catch (error) {
            console.error('[FORUMS] Error creando tema:', error);
            res.status(500).json({ success: false, message: 'Error al crear tema' });
        }
    }
);

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
    async (req: Request, res: Response) => {
        try {
            const topic = await ForumsService.updateTopic(
                parseInt(req.params.id),
                (req as AuthenticatedRequest).user.id,
                req.body
            );
            if (!topic) {
                res.status(404).json({ success: false, message: 'Tema no encontrado o no autorizado' });
                return;
            }
            res.json({ success: true, data: topic, message: 'Tema actualizado' });
        } catch (error) {
            console.error('[FORUMS] Error actualizando tema:', error);
            res.status(500).json({ success: false, message: 'Error al actualizar tema' });
        }
    }
);

// =====================================
// POSTS/RESPUESTAS
// =====================================

router.get('/topics/:id/posts',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            const posts = await ForumsService.getTopicPosts(
                parseInt(req.params.id),
                {
                    limit: parseInt((req.query.limit as string) || '50'),
                    offset: parseInt((req.query.offset as string) || '0'),
                    userId: (req as AuthenticatedRequest).user.id
                }
            );
            res.json({ success: true, data: posts });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo posts:', error);
            res.status(500).json({ success: false, message: 'Error al obtener respuestas' });
        }
    }
);

router.post('/topics/:id/posts',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('content').isString().isLength({ min: 3 }),
        body('parentPostId').optional().isInt({ min: 1 })
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            const post = await ForumsService.createPost((req as AuthenticatedRequest).user.id, {
                topicId: parseInt(req.params.id),
                content: req.body.content,
                parentPostId: req.body.parentPostId
            });
            res.status(201).json({ success: true, data: post, message: 'Respuesta publicada' });
        } catch (error) {
            console.error('[FORUMS] Error creando post:', error);
            res.status(500).json({ success: false, message: 'Error al publicar respuesta' });
        }
    }
);

router.put('/posts/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('content').isString().isLength({ min: 3 })
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            const post = await ForumsService.updatePost(
                parseInt(req.params.id),
                (req as AuthenticatedRequest).user.id,
                req.body.content
            );
            if (!post) {
                res.status(404).json({ success: false, message: 'Respuesta no encontrada o no autorizada' });
                return;
            }
            res.json({ success: true, data: post, message: 'Respuesta actualizada' });
        } catch (error) {
            console.error('[FORUMS] Error actualizando post:', error);
            res.status(500).json({ success: false, message: 'Error al actualizar respuesta' });
        }
    }
);

router.delete('/posts/:id',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req: Request, res: Response) => {
        try {
            const deleted = await ForumsService.deletePost(
                parseInt(req.params.id),
                (req as AuthenticatedRequest).user.id,
                req.body.reason
            );
            if (!deleted) {
                res.status(404).json({ success: false, message: 'Respuesta no encontrada o no autorizada' });
                return;
            }
            res.json({ success: true, message: 'Respuesta eliminada' });
        } catch (error) {
            console.error('[FORUMS] Error eliminando post:', error);
            res.status(500).json({ success: false, message: 'Error al eliminar respuesta' });
        }
    }
);

router.post('/topics/:topicId/posts/:postId/solution',
    authenticateToken,
    [
        param('topicId').isInt({ min: 1 }),
        param('postId').isInt({ min: 1 })
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            await ForumsService.markAsSolution(
                parseInt(req.params.topicId),
                parseInt(req.params.postId),
                (req as AuthenticatedRequest).user.id
            );
            res.json({ success: true, message: 'Respuesta marcada como solución' });
        } catch (error: any) {
            console.error('[FORUMS] Error marcando solución:', error);
            res.status(400).json({ success: false, message: error.message || 'Error al marcar solución' });
        }
    }
);

// =====================================
// REACCIONES
// =====================================

router.post('/topics/:id/react',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('reactionType').isIn(['like', 'dislike', 'helpful', 'insightful', 'funny'])
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            const result = await ForumsService.reactToTopic(
                (req as AuthenticatedRequest).user.id,
                parseInt(req.params.id),
                req.body.reactionType
            );
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('[FORUMS] Error reaccionando a tema:', error);
            res.status(500).json({ success: false, message: 'Error al reaccionar' });
        }
    }
);

router.post('/posts/:id/react',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }),
        body('reactionType').isIn(['like', 'dislike', 'helpful', 'insightful', 'funny'])
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            const result = await ForumsService.reactToPost(
                (req as AuthenticatedRequest).user.id,
                parseInt(req.params.id),
                req.body.reactionType
            );
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('[FORUMS] Error reaccionando a post:', error);
            res.status(500).json({ success: false, message: 'Error al reaccionar' });
        }
    }
);

// =====================================
// SUSCRIPCIONES
// =====================================

router.post('/topics/:id/subscribe',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req: Request, res: Response) => {
        try {
            const subscription = await ForumsService.subscribeTopic(
                (req as AuthenticatedRequest).user.id,
                parseInt(req.params.id)
            );
            res.json({ success: true, data: subscription, message: 'Suscrito al tema' });
        } catch (error) {
            console.error('[FORUMS] Error suscribiendo:', error);
            res.status(500).json({ success: false, message: 'Error al suscribirse' });
        }
    }
);

router.delete('/topics/:id/subscribe',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req: Request, res: Response) => {
        try {
            await ForumsService.unsubscribeTopic(
                (req as AuthenticatedRequest).user.id,
                parseInt(req.params.id)
            );
            res.json({ success: true, message: 'Desuscrito del tema' });
        } catch (error) {
            console.error('[FORUMS] Error desuscribiendo:', error);
            res.status(500).json({ success: false, message: 'Error al desuscribirse' });
        }
    }
);

router.get('/subscriptions',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const limit = parseInt((req.query.limit as string) || '50');
            const subscriptions = await ForumsService.getUserSubscriptions((req as AuthenticatedRequest).user.id, limit);
            res.json({ success: true, data: subscriptions });
        } catch (error) {
            console.error('[FORUMS] Error obteniendo suscripciones:', error);
            res.status(500).json({ success: false, message: 'Error al obtener suscripciones' });
        }
    }
);

// =====================================
// MENCIONES
// =====================================

router.get('/mentions', authenticateToken, async (req: Request, res: Response) => {
    try {
        const mentions = await ForumsService.getUnreadMentions((req as AuthenticatedRequest).user.id);
        res.json({ success: true, data: mentions });
    } catch (error) {
        console.error('[FORUMS] Error obteniendo menciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener menciones' });
    }
});

router.put('/mentions/read',
    authenticateToken,
    [body('mentionIds').optional().isArray()],
    validate,
    async (req: Request, res: Response) => {
        try {
            await ForumsService.markMentionsAsRead((req as AuthenticatedRequest).user.id, req.body.mentionIds);
            res.json({ success: true, message: 'Menciones marcadas como leídas' });
        } catch (error) {
            console.error('[FORUMS] Error marcando menciones:', error);
            res.status(500).json({ success: false, message: 'Error al marcar menciones' });
        }
    }
);

// =====================================
// REPORTES
// =====================================

router.post('/report',
    authenticateToken,
    [
        body('topicId').optional().isInt({ min: 1 }),
        body('postId').optional().isInt({ min: 1 }),
        body('reason').isIn(['spam', 'offensive', 'harassment', 'inappropriate', 'other']),
        body('description').optional().isString().isLength({ max: 500 })
    ],
    validate,
    async (req: Request, res: Response) => {
        try {
            if (!req.body.topicId && !req.body.postId) {
                res.status(400).json({ success: false, message: 'Debe especificar topicId o postId' });
                return;
            }
            const report = await ForumsService.reportContent((req as AuthenticatedRequest).user.id, req.body);
            res.status(201).json({ success: true, data: report, message: 'Reporte enviado. Será revisado por un moderador.' });
        } catch (error) {
            console.error('[FORUMS] Error reportando:', error);
            res.status(500).json({ success: false, message: 'Error al enviar reporte' });
        }
    }
);

router.get('/reports/pending', authenticateToken, async (req: Request, res: Response) => {
    try {
        if (!['admin', 'administrativo'].includes((req as AuthenticatedRequest).user.role)) {
            res.status(403).json({ success: false, message: 'Acceso solo para moderadores' });
            return;
        }
        const reports = await ForumsService.getPendingReports();
        res.json({ success: true, data: reports });
    } catch (error) {
        console.error('[FORUMS] Error obteniendo reportes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reportes' });
    }
});

// =====================================
// ENCUESTAS
// =====================================

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
    async (req: Request, res: Response) => {
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
            res.status(201).json({ success: true, data: poll, message: 'Encuesta creada' });
        } catch (error) {
            console.error('[FORUMS] Error creando encuesta:', error);
            res.status(500).json({ success: false, message: 'Error al crear encuesta' });
        }
    }
);

export default router;

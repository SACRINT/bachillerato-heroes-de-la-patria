/**
 * 💬 FORUMS ROUTES - Sistema de Foros v2.0 - TypeScript
 * Discusiones, categorías, likes y moderación
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';
// @ts-ignore
import { body, query, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
// @ts-ignore
import ForumsService from '../services/ForumsService';

const router: Router = express.Router();

// ============================================
// MIDDLEWARE & TIPOS
// ============================================

interface RequestWithUser extends Request {
    user?: { id: number; role: string };
}

const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: 'Error de validación', errors: errors.array() });
        return;
    }
    next();
};

// ============================================
// RUTAS CATEGORÍAS & TEMAS
// ============================================

/**
 * GET /api/forums/categories
 */
router.get('/categories', authenticateToken, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const categories = await ForumsService.getCategories(req.user!.role);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener categorías' });
    }
});

/**
 * GET /api/forums/categories/:slug
 */
router.get('/categories/:slug', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const category = await ForumsService.getCategoryBySlug(req.params.slug);
        if (!category) { res.status(404).json({ success: false, message: 'Categoría no encontrada' }); return; }
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener categoría' });
    }
});

/**
 * GET /api/forums/topics
 */
router.get('/topics', authenticateToken, [
    query('categoryId').optional().isInt({ min: 1 }),
    query('status').optional().isIn(['open', 'closed', 'solved', 'all']),
    query('topicType').optional().isIn(['discussion', 'question', 'announcement', 'poll']),
    query('search').optional().isString(),
    query('sortBy').optional().isIn(['created_at', 'last_reply_at', 'view_count', 'reply_count', 'like_count']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const { categoryId, status, topicType, search, sortBy, sortOrder, limit = 20, offset = 0 } = req.query as any;

        const topics = await ForumsService.getTopics({
            categoryId: categoryId ? parseInt(categoryId) : null,
            status,
            topicType,
            search,
            sortBy,
            sortOrder: sortOrder || 'DESC',
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: topics,
            pagination: { limit: parseInt(limit), offset: parseInt(offset), count: topics.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener temas' });
    }
});

/**
 * GET /api/forums/topics/:id
 */
router.get('/topics/:id', authenticateToken, [param('id').isInt({ min: 1 })], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const topic = await ForumsService.getTopicById(parseInt(req.params.id), req.user!.id);
        if (!topic) { res.status(404).json({ success: false, message: 'Tema no encontrado' }); return; }
        res.json({ success: true, data: topic });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener tema' });
    }
});

/**
 * POST /api/forums/topics
 */
router.post('/topics', authenticateToken, [
    body('categoryId').isInt({ min: 1 }),
    body('title').isString().isLength({ min: 5, max: 300 }),
    body('content').isString().isLength({ min: 10 }),
    body('topicType').optional().isIn(['discussion', 'question', 'announcement', 'poll']),
    body('tags').optional().isArray()
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const topic = await ForumsService.createTopic(req.user!.id, {
            categoryId: req.body.categoryId,
            title: req.body.title,
            content: req.body.content,
            topicType: req.body.topicType,
            tags: req.body.tags
        });
        res.status(201).json({ success: true, data: topic, message: 'Tema creado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear tema' });
    }
});

/**
 * PUT /api/forums/topics/:id
 */
router.put('/topics/:id', authenticateToken, [
    param('id').isInt({ min: 1 }),
    body('title').optional().isString().isLength({ min: 5, max: 300 }),
    body('content').optional().isString().isLength({ min: 10 }),
    body('tags').optional().isArray(),
    body('status').optional().isIn(['open', 'closed', 'solved', 'archived'])
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const topic = await ForumsService.updateTopic(parseInt(req.params.id), req.user!.id, req.body);
        if (!topic) { res.status(404).json({ success: false, message: 'Tema no encontrado o no autorizado' }); return; }
        res.json({ success: true, data: topic, message: 'Tema actualizado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar tema' });
    }
});

// ============================================
// RUTAS POSTS (RESPUESTAS)
// ============================================

/**
 * GET /api/forums/topics/:id/posts
 */
router.get('/topics/:id/posts', authenticateToken, [
    param('id').isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const posts = await ForumsService.getTopicPosts(parseInt(req.params.id), {
            limit: parseInt(req.query.limit as string) || 50,
            offset: parseInt(req.query.offset as string) || 0,
            userId: req.user!.id
        });
        res.json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener respuestas' });
    }
});

/**
 * POST /api/forums/topics/:id/posts
 */
router.post('/topics/:id/posts', authenticateToken, [
    param('id').isInt({ min: 1 }),
    body('content').isString().isLength({ min: 3 }),
    body('parentPostId').optional().isInt({ min: 1 })
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const post = await ForumsService.createPost(req.user!.id, {
            topicId: parseInt(req.params.id),
            content: req.body.content,
            parentPostId: req.body.parentPostId
        });
        res.status(201).json({ success: true, data: post, message: 'Respuesta publicada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al publicar respuesta' });
    }
});

/**
 * DELETE /api/forums/posts/:id
 */
router.delete('/posts/:id', authenticateToken, [param('id').isInt({ min: 1 })], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const deleted = await ForumsService.deletePost(parseInt(req.params.id), req.user!.id, req.body.reason);
        if (!deleted) { res.status(404).json({ success: false, message: 'Respuesta no encontrada o no autorizada' }); return; }
        res.json({ success: true, message: 'Respuesta eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar respuesta' });
    }
});

/**
 * POSTReaccionar a temas/posts
 */
router.post('/topics/:id/react', authenticateToken, [
    param('id').isInt({ min: 1 }),
    body('reactionType').isIn(['like', 'dislike', 'helpful', 'insightful', 'funny'])
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const result = await ForumsService.reactToTopic(req.user!.id, parseInt(req.params.id), req.body.reactionType);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al reaccionar' });
    }
});

router.post('/posts/:id/react', authenticateToken, [
    param('id').isInt({ min: 1 }),
    body('reactionType').isIn(['like', 'dislike', 'helpful', 'insightful', 'funny'])
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const result = await ForumsService.reactToPost(req.user!.id, parseInt(req.params.id), req.body.reactionType);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al reaccionar' });
    }
});

/**
 * Reportar contenido
 */
router.post('/report', authenticateToken, [
    body('topicId').optional().isInt({ min: 1 }),
    body('postId').optional().isInt({ min: 1 }),
    body('reason').isIn(['spam', 'offensive', 'harassment', 'inappropriate', 'other']),
    body('description').optional().isString().isLength({ max: 500 })
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        if (!req.body.topicId && !req.body.postId) { res.status(400).json({ success: false, message: 'Debe especificar topicId o postId' }); return; }
        const report = await ForumsService.reportContent(req.user!.id, req.body);
        res.status(201).json({ success: true, data: report, message: 'Reporte enviado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al enviar reporte' });
    }
});

/**
 * Crear encuesta
 */
router.post('/topics/:id/poll', authenticateToken, [
    param('id').isInt({ min: 1 }),
    body('question').isString().isLength({ min: 5, max: 500 }),
    body('options').isArray({ min: 2, max: 10 }),
    body('options.*').isString().isLength({ min: 1, max: 200 }),
    body('allowsMultiple').optional().isBoolean(),
    body('endsAt').optional().isISO8601()
], validate, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const poll = await ForumsService.createPoll(parseInt(req.params.id), {
            question: req.body.question,
            options: req.body.options,
            allowsMultiple: req.body.allowsMultiple,
            endsAt: req.body.endsAt
        });
        res.status(201).json({ success: true, data: poll, message: 'Encuesta creada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear encuesta' });
    }
});

export default router;

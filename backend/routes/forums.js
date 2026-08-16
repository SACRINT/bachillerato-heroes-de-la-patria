"use strict";
/**
 * 💬 FORUMS ROUTES
 * Endpoints para foros de discusión
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require('../middleware/auth.js');
// @ts-ignore
const ForumsService_1 = __importDefault(require('../services/ForumsService.js'));
const router = express_1.default.Router();
// Middleware de validación
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
// =====================================
// CATEGORÍAS
// =====================================
router.get('/categories', auth_1.authenticateToken, async (req, res) => {
    try {
        const categories = await ForumsService_1.default.getCategories(req.user.role);
        res.json({ success: true, data: categories });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo categorías:', error);
        res.status(500).json({ success: false, message: 'Error al obtener categorías' });
    }
});
router.get('/categories/:slug', auth_1.authenticateToken, async (req, res) => {
    try {
        const category = await ForumsService_1.default.getCategoryBySlug(req.params.slug);
        if (!category) {
            res.status(404).json({ success: false, message: 'Categoría no encontrada' });
            return;
        }
        res.json({ success: true, data: category });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo categoría:', error);
        res.status(500).json({ success: false, message: 'Error al obtener categoría' });
    }
});
// =====================================
// TEMAS
// =====================================
router.get('/topics', auth_1.authenticateToken, [
    (0, express_validator_1.query)('categoryId').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('status').optional().isIn(['open', 'closed', 'solved', 'all']),
    (0, express_validator_1.query)('topicType').optional().isIn(['discussion', 'question', 'announcement', 'poll']),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('sortBy').optional().isIn(['created_at', 'last_reply_at', 'view_count', 'reply_count', 'like_count']),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 })
], validate, async (req, res) => {
    try {
        const { categoryId, status, topicType, search, sortBy, sortOrder, limit, offset } = req.query;
        const topics = await ForumsService_1.default.getTopics({
            categoryId: categoryId ? parseInt(categoryId) : null,
            status, topicType, search, sortBy,
            sortOrder: sortOrder || 'DESC',
            limit: parseInt(limit || '20'),
            offset: parseInt(offset || '0')
        });
        res.json({
            success: true,
            data: topics,
            pagination: {
                limit: parseInt(limit || '20'),
                offset: parseInt(offset || '0'),
                count: topics.length
            }
        });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo temas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener temas' });
    }
});
router.get('/topics/trending', auth_1.authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '10');
        const topics = await ForumsService_1.default.getTrendingTopics(limit);
        res.json({ success: true, data: topics });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo trending:', error);
        res.status(500).json({ success: false, message: 'Error al obtener temas trending' });
    }
});
router.get('/topics/:id', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const topic = await ForumsService_1.default.getTopicById(parseInt(req.params.id), req.user.id);
        if (!topic) {
            res.status(404).json({ success: false, message: 'Tema no encontrado' });
            return;
        }
        res.json({ success: true, data: topic });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo tema:', error);
        res.status(500).json({ success: false, message: 'Error al obtener tema' });
    }
});
router.post('/topics', auth_1.authenticateToken, [
    (0, express_validator_1.body)('categoryId').isInt({ min: 1 }),
    (0, express_validator_1.body)('title').isString().isLength({ min: 5, max: 300 }),
    (0, express_validator_1.body)('content').isString().isLength({ min: 10 }),
    (0, express_validator_1.body)('topicType').optional().isIn(['discussion', 'question', 'announcement', 'poll']),
    (0, express_validator_1.body)('tags').optional().isArray()
], validate, async (req, res) => {
    try {
        const topic = await ForumsService_1.default.createTopic(req.user.id, {
            categoryId: req.body.categoryId,
            title: req.body.title,
            content: req.body.content,
            topicType: req.body.topicType,
            tags: req.body.tags
        });
        res.status(201).json({ success: true, data: topic, message: 'Tema creado exitosamente' });
    }
    catch (error) {
        console.error('[FORUMS] Error creando tema:', error);
        res.status(500).json({ success: false, message: 'Error al crear tema' });
    }
});
router.put('/topics/:id', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt({ min: 1 }),
    (0, express_validator_1.body)('title').optional().isString().isLength({ min: 5, max: 300 }),
    (0, express_validator_1.body)('content').optional().isString().isLength({ min: 10 }),
    (0, express_validator_1.body)('tags').optional().isArray(),
    (0, express_validator_1.body)('status').optional().isIn(['open', 'closed', 'solved', 'archived'])
], validate, async (req, res) => {
    try {
        const topic = await ForumsService_1.default.updateTopic(parseInt(req.params.id), req.user.id, req.body);
        if (!topic) {
            res.status(404).json({ success: false, message: 'Tema no encontrado o no autorizado' });
            return;
        }
        res.json({ success: true, data: topic, message: 'Tema actualizado' });
    }
    catch (error) {
        console.error('[FORUMS] Error actualizando tema:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar tema' });
    }
});
// =====================================
// POSTS/RESPUESTAS
// =====================================
router.get('/topics/:id/posts', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 })
], validate, async (req, res) => {
    try {
        const posts = await ForumsService_1.default.getTopicPosts(parseInt(req.params.id), {
            limit: parseInt(req.query.limit || '50'),
            offset: parseInt(req.query.offset || '0'),
            userId: req.user.id
        });
        res.json({ success: true, data: posts });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo posts:', error);
        res.status(500).json({ success: false, message: 'Error al obtener respuestas' });
    }
});
router.post('/topics/:id/posts', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt({ min: 1 }),
    (0, express_validator_1.body)('content').isString().isLength({ min: 3 }),
    (0, express_validator_1.body)('parentPostId').optional().isInt({ min: 1 })
], validate, async (req, res) => {
    try {
        const post = await ForumsService_1.default.createPost(req.user.id, {
            topicId: parseInt(req.params.id),
            content: req.body.content,
            parentPostId: req.body.parentPostId
        });
        res.status(201).json({ success: true, data: post, message: 'Respuesta publicada' });
    }
    catch (error) {
        console.error('[FORUMS] Error creando post:', error);
        res.status(500).json({ success: false, message: 'Error al publicar respuesta' });
    }
});
router.put('/posts/:id', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt({ min: 1 }),
    (0, express_validator_1.body)('content').isString().isLength({ min: 3 })
], validate, async (req, res) => {
    try {
        const post = await ForumsService_1.default.updatePost(parseInt(req.params.id), req.user.id, req.body.content);
        if (!post) {
            res.status(404).json({ success: false, message: 'Respuesta no encontrada o no autorizada' });
            return;
        }
        res.json({ success: true, data: post, message: 'Respuesta actualizada' });
    }
    catch (error) {
        console.error('[FORUMS] Error actualizando post:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar respuesta' });
    }
});
router.delete('/posts/:id', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const deleted = await ForumsService_1.default.deletePost(parseInt(req.params.id), req.user.id, req.body.reason);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Respuesta no encontrada o no autorizada' });
            return;
        }
        res.json({ success: true, message: 'Respuesta eliminada' });
    }
    catch (error) {
        console.error('[FORUMS] Error eliminando post:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar respuesta' });
    }
});
router.post('/topics/:topicId/posts/:postId/solution', auth_1.authenticateToken, [
    (0, express_validator_1.param)('topicId').isInt({ min: 1 }),
    (0, express_validator_1.param)('postId').isInt({ min: 1 })
], validate, async (req, res) => {
    try {
        await ForumsService_1.default.markAsSolution(parseInt(req.params.topicId), parseInt(req.params.postId), req.user.id);
        res.json({ success: true, message: 'Respuesta marcada como solución' });
    }
    catch (error) {
        console.error('[FORUMS] Error marcando solución:', error);
        res.status(400).json({ success: false, message: error.message || 'Error al marcar solución' });
    }
});
// =====================================
// REACCIONES
// =====================================
router.post('/topics/:id/react', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt({ min: 1 }),
    (0, express_validator_1.body)('reactionType').isIn(['like', 'dislike', 'helpful', 'insightful', 'funny'])
], validate, async (req, res) => {
    try {
        const result = await ForumsService_1.default.reactToTopic(req.user.id, parseInt(req.params.id), req.body.reactionType);
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('[FORUMS] Error reaccionando a tema:', error);
        res.status(500).json({ success: false, message: 'Error al reaccionar' });
    }
});
router.post('/posts/:id/react', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt({ min: 1 }),
    (0, express_validator_1.body)('reactionType').isIn(['like', 'dislike', 'helpful', 'insightful', 'funny'])
], validate, async (req, res) => {
    try {
        const result = await ForumsService_1.default.reactToPost(req.user.id, parseInt(req.params.id), req.body.reactionType);
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('[FORUMS] Error reaccionando a post:', error);
        res.status(500).json({ success: false, message: 'Error al reaccionar' });
    }
});
// =====================================
// SUSCRIPCIONES
// =====================================
router.post('/topics/:id/subscribe', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const subscription = await ForumsService_1.default.subscribeTopic(req.user.id, parseInt(req.params.id));
        res.json({ success: true, data: subscription, message: 'Suscrito al tema' });
    }
    catch (error) {
        console.error('[FORUMS] Error suscribiendo:', error);
        res.status(500).json({ success: false, message: 'Error al suscribirse' });
    }
});
router.delete('/topics/:id/subscribe', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        await ForumsService_1.default.unsubscribeTopic(req.user.id, parseInt(req.params.id));
        res.json({ success: true, message: 'Desuscrito del tema' });
    }
    catch (error) {
        console.error('[FORUMS] Error desuscribiendo:', error);
        res.status(500).json({ success: false, message: 'Error al desuscribirse' });
    }
});
router.get('/subscriptions', auth_1.authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '50');
        const subscriptions = await ForumsService_1.default.getUserSubscriptions(req.user.id, limit);
        res.json({ success: true, data: subscriptions });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo suscripciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener suscripciones' });
    }
});
// =====================================
// MENCIONES
// =====================================
router.get('/mentions', auth_1.authenticateToken, async (req, res) => {
    try {
        const mentions = await ForumsService_1.default.getUnreadMentions(req.user.id);
        res.json({ success: true, data: mentions });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo menciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener menciones' });
    }
});
router.put('/mentions/read', auth_1.authenticateToken, [(0, express_validator_1.body)('mentionIds').optional().isArray()], validate, async (req, res) => {
    try {
        await ForumsService_1.default.markMentionsAsRead(req.user.id, req.body.mentionIds);
        res.json({ success: true, message: 'Menciones marcadas como leídas' });
    }
    catch (error) {
        console.error('[FORUMS] Error marcando menciones:', error);
        res.status(500).json({ success: false, message: 'Error al marcar menciones' });
    }
});
// =====================================
// REPORTES
// =====================================
router.post('/report', auth_1.authenticateToken, [
    (0, express_validator_1.body)('topicId').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('postId').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('reason').isIn(['spam', 'offensive', 'harassment', 'inappropriate', 'other']),
    (0, express_validator_1.body)('description').optional().isString().isLength({ max: 500 })
], validate, async (req, res) => {
    try {
        if (!req.body.topicId && !req.body.postId) {
            res.status(400).json({ success: false, message: 'Debe especificar topicId o postId' });
            return;
        }
        const report = await ForumsService_1.default.reportContent(req.user.id, req.body);
        res.status(201).json({ success: true, data: report, message: 'Reporte enviado. Será revisado por un moderador.' });
    }
    catch (error) {
        console.error('[FORUMS] Error reportando:', error);
        res.status(500).json({ success: false, message: 'Error al enviar reporte' });
    }
});
router.get('/reports/pending', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'administrativo'].includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Acceso solo para moderadores' });
            return;
        }
        const reports = await ForumsService_1.default.getPendingReports();
        res.json({ success: true, data: reports });
    }
    catch (error) {
        console.error('[FORUMS] Error obteniendo reportes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reportes' });
    }
});
// =====================================
// ENCUESTAS
// =====================================
router.post('/topics/:id/poll', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt({ min: 1 }),
    (0, express_validator_1.body)('question').isString().isLength({ min: 5, max: 500 }),
    (0, express_validator_1.body)('options').isArray({ min: 2, max: 10 }),
    (0, express_validator_1.body)('options.*').isString().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('allowsMultiple').optional().isBoolean(),
    (0, express_validator_1.body)('endsAt').optional().isISO8601()
], validate, async (req, res) => {
    try {
        const poll = await ForumsService_1.default.createPoll(parseInt(req.params.id), {
            question: req.body.question,
            options: req.body.options,
            allowsMultiple: req.body.allowsMultiple,
            endsAt: req.body.endsAt
        });
        res.status(201).json({ success: true, data: poll, message: 'Encuesta creada' });
    }
    catch (error) {
        console.error('[FORUMS] Error creando encuesta:', error);
        res.status(500).json({ success: false, message: 'Error al crear encuesta' });
    }
});
exports.default = router;
//# sourceMappingURL=forums.js.map
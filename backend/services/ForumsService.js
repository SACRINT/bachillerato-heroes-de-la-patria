/**
 * 💬 FORUMS SERVICE
 * Servicio de gestión de foros de discusión
 * 
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar ForumDAO
 * - Sin SQL directo en el servicio
 */

const ForumDAO = require('../data/forum.dao');

class ForumsService {
    constructor() {
        // Niveles de reputación
        this.reputationLevels = [
            { min: 0, max: 49, name: 'Novato' },
            { min: 50, max: 199, name: 'Aprendiz' },
            { min: 200, max: 499, name: 'Participante' },
            { min: 500, max: 999, name: 'Contribuidor' },
            { min: 1000, max: 2499, name: 'Experto' },
            { min: 2500, max: 4999, name: 'Maestro' },
            { min: 5000, max: Infinity, name: 'Leyenda' }
        ];

        // Puntos de reputación por acción
        this.reputationPoints = {
            create_topic: 5,
            create_post: 2,
            receive_like: 3,
            solution_accepted: 15,
            best_answer: 25
        };
    }

    // =====================================
    // CATEGORÍAS
    // =====================================

    async getCategories(userRole = 'estudiante') {
        return ForumDAO.getCategories(userRole);
    }

    async getCategoryBySlug(slug) {
        return ForumDAO.getCategoryBySlug(slug);
    }

    // =====================================
    // TEMAS
    // =====================================

    async getTopics(options = {}) {
        return ForumDAO.getTopics(options);
    }

    async getTopicById(topicId, userId = null) {
        const topic = await ForumDAO.getTopicById(topicId, userId);
        if (topic) {
            await ForumDAO.incrementViewCount(topicId);
        }
        return topic;
    }

    async createTopic(userId, topicData) {
        const { categoryId, title, content, topicType = 'discussion', tags } = topicData;

        // Generar slug
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
            '-' + Date.now().toString(36);

        const topic = await ForumDAO.createTopic({
            categoryId, title, slug, content, authorId: userId,
            topicType, tags, xpReward: 5, coinsReward: 2
        });

        // Actualizar estadísticas y suscribir autor
        await Promise.all([
            this.updateUserStats(userId, 'topics_created', 1),
            this.grantReputation(userId, 'create_topic'),
            this.subscribeTopic(userId, topic.id)
        ]);

        return topic;
    }

    async updateTopic(topicId, userId, topicData) {
        const allowedFields = ['title', 'content', 'tags', 'status', 'is_locked'];
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(topicData)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (allowedFields.includes(snakeKey)) {
                fields.push(`${snakeKey} = $${paramIndex++}`);
                values.push(key === 'tags' ? JSON.stringify(value) : value);
            }
        }

        if (fields.length === 0) return null;
        return ForumDAO.updateTopic(topicId, userId, fields, values);
    }

    async incrementViewCount(topicId) {
        return ForumDAO.incrementViewCount(topicId);
    }

    // =====================================
    // POSTS/RESPUESTAS
    // =====================================

    async getTopicPosts(topicId, options = {}) {
        return ForumDAO.getTopicPosts(topicId, options);
    }

    async createPost(userId, postData) {
        const { topicId, content, parentPostId } = postData;
        const post = await ForumDAO.createPost(topicId, parentPostId, content, userId);

        // Actualizar estadísticas y procesar menciones en paralelo
        await Promise.all([
            this.updateUserStats(userId, 'posts_created', 1),
            this.grantReputation(userId, 'create_post'),
            this.processMentions(post.id, content)
        ]);

        return post;
    }

    async updatePost(postId, userId, content) {
        return ForumDAO.updatePost(postId, userId, content);
    }

    async deletePost(postId, userId, reason = null) {
        return ForumDAO.deletePost(postId, userId, reason);
    }

    async markAsSolution(topicId, postId, userId) {
        // Verificar que el usuario es el autor del tema
        const topicAuthor = await ForumDAO.getTopicAuthor(topicId);
        if (topicAuthor !== userId) {
            throw new Error('Solo el autor del tema puede marcar soluciones');
        }

        // Quitar solución anterior y marcar nueva
        await ForumDAO.clearTopicSolutions(topicId);
        const solutionPost = await ForumDAO.markPostAsSolution(postId);
        await ForumDAO.updateTopicSolution(topicId, postId);

        // Otorgar reputación al autor de la solución
        if (solutionPost) {
            await Promise.all([
                this.updateUserStats(solutionPost.author_id, 'solutions_provided', 1),
                this.grantReputation(solutionPost.author_id, 'solution_accepted')
            ]);
        }

        return true;
    }

    // =====================================
    // REACCIONES
    // =====================================

    async reactToTopic(userId, topicId, reactionType) {
        const existing = await ForumDAO.getTopicReaction(userId, topicId);

        if (existing) {
            if (existing.reaction_type === reactionType) {
                await ForumDAO.deleteReaction(existing.id);
                await ForumDAO.updateLikeCount('topic', topicId, -1);
                return { action: 'removed' };
            } else {
                await ForumDAO.updateReaction(existing.id, reactionType);
                return { action: 'changed', type: reactionType };
            }
        }

        await ForumDAO.createTopicReaction(userId, topicId, reactionType);

        if (reactionType === 'like') {
            await ForumDAO.updateLikeCount('topic', topicId, 1);
            const topicAuthor = await ForumDAO.getTopicAuthor(topicId);
            if (topicAuthor && topicAuthor !== userId) {
                await this.grantReputation(topicAuthor, 'receive_like');
            }
        }

        return { action: 'added', type: reactionType };
    }

    async reactToPost(userId, postId, reactionType) {
        const existing = await ForumDAO.getPostReaction(userId, postId);

        if (existing) {
            if (existing.reaction_type === reactionType) {
                await ForumDAO.deleteReaction(existing.id);
                await ForumDAO.updateLikeCount('post', postId, -1);
                return { action: 'removed' };
            } else {
                await ForumDAO.updateReaction(existing.id, reactionType);
                return { action: 'changed', type: reactionType };
            }
        }

        await ForumDAO.createPostReaction(userId, postId, reactionType);

        if (reactionType === 'like') {
            await ForumDAO.updateLikeCount('post', postId, 1);
            const postAuthor = await ForumDAO.getPostAuthor(postId);
            if (postAuthor && postAuthor !== userId) {
                await this.grantReputation(postAuthor, 'receive_like');
            }
        }

        return { action: 'added', type: reactionType };
    }

    async updateLikeCount(type, id, delta) {
        return ForumDAO.updateLikeCount(type, id, delta);
    }

    // =====================================
    // SUSCRIPCIONES
    // =====================================

    async subscribeTopic(userId, topicId) {
        return ForumDAO.subscribeTopic(userId, topicId);
    }

    async unsubscribeTopic(userId, topicId) {
        await ForumDAO.unsubscribeTopic(userId, topicId);
        return true;
    }

    async getUserSubscriptions(userId, limit = 50) {
        return ForumDAO.getUserSubscriptions(userId, limit);
    }

    // =====================================
    // MENCIONES
    // =====================================

    async processMentions(postId, content) {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }

        if (mentions.length === 0) return;

        for (const username of mentions) {
            const user = await ForumDAO.findUserByUsername(username);
            if (user) {
                await ForumDAO.createMention(postId, user.id);
            }
        }
    }

    async getUnreadMentions(userId) {
        return ForumDAO.getUnreadMentions(userId);
    }

    async markMentionsAsRead(userId, mentionIds = null) {
        await ForumDAO.markMentionsAsRead(userId, mentionIds);
        return true;
    }

    // =====================================
    // REPORTES
    // =====================================

    async reportContent(userId, reportData) {
        const { topicId, postId, reason, description } = reportData;
        return ForumDAO.createReport(userId, topicId, postId, reason, description);
    }

    async getPendingReports(limit = 50) {
        return ForumDAO.getPendingReports(limit);
    }

    // =====================================
    // ENCUESTAS
    // =====================================

    async createPoll(topicId, pollData) {
        const { question, options, allowsMultiple, endsAt } = pollData;

        const formattedOptions = options.map((text, index) => ({
            id: index + 1,
            text,
            votes: 0
        }));

        const poll = await ForumDAO.createPoll(topicId, question, formattedOptions, allowsMultiple, endsAt);
        await ForumDAO.updateTopicType(topicId, 'poll');
        return poll;
    }

    async votePoll(userId, pollId, optionIds) {
        const existing = await ForumDAO.getPollVote(pollId, userId);
        if (existing) {
            throw new Error('Ya has votado en esta encuesta');
        }

        await ForumDAO.createPollVote(pollId, userId, optionIds);

        const options = await ForumDAO.getPollOptions(pollId);
        if (options) {
            for (const optId of optionIds) {
                const opt = options.find(o => o.id === optId);
                if (opt) opt.votes++;
            }
            await ForumDAO.updatePollOptions(pollId, options, optionIds.length);
        }

        return true;
    }

    // =====================================
    // ESTADÍSTICAS Y REPUTACIÓN
    // =====================================

    async updateUserStats(userId, field, increment = 1) {
        await ForumDAO.ensureUserStats(userId);
        await ForumDAO.updateUserStats(userId, field, increment);
    }

    async grantReputation(userId, action) {
        const points = this.reputationPoints[action] || 0;
        if (points === 0) return;

        await this.updateUserStats(userId, 'reputation_score', points);

        const stats = await this.getUserStats(userId);
        if (stats) {
            const level = this.getReputationLevel(stats.reputation_score);
            if (level !== stats.reputation_level) {
                await ForumDAO.updateReputationLevel(userId, level);
            }
        }
    }

    getReputationLevel(score) {
        for (const level of this.reputationLevels) {
            if (score >= level.min && score <= level.max) {
                return level.name;
            }
        }
        return 'Novato';
    }

    async getUserStats(userId) {
        return ForumDAO.getUserStats(userId);
    }

    async getReputationLeaderboard(limit = 10) {
        return ForumDAO.getReputationLeaderboard(limit);
    }

    // =====================================
    // BÚSQUEDA
    // =====================================

    async searchTopics(searchTerm, options = {}) {
        return ForumDAO.searchTopics(searchTerm, options);
    }

    async getTrendingTopics(limit = 10) {
        return ForumDAO.getTrendingTopics(limit);
    }
}

module.exports = new ForumsService();

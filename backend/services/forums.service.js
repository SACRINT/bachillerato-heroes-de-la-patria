"use strict";
/**
 * 💬 FORUMS SERVICE - TypeScript Version
 * Gestión de foros de discusión
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumsService = void 0;
const ForumDAO = require('../data/forum.dao');
const devLogger = require('../utils/devLogger');
// ============================================
// FORUMS SERVICE CLASS
// ============================================
class ForumsService {
    constructor() {
        this.reputationLevels = [
            { min: 0, max: 49, name: 'Novato' },
            { min: 50, max: 199, name: 'Aprendiz' },
            { min: 200, max: 499, name: 'Contribuidor' },
            { min: 500, max: 999, name: 'Experto' },
            { min: 1000, max: 4999, name: 'Maestro' },
            { min: 5000, max: Infinity, name: 'Leyenda' }
        ];
        this.reputationPoints = {
            create_topic: 5,
            reply_post: 2,
            receive_like: 3,
            marked_solution: 15,
            receive_badge: 10
        };
        devLogger.log('[FORUMS] Service initialized');
    }
    // Categories
    async getCategories(userRole = 'estudiante') {
        return await ForumDAO.getCategories(userRole);
    }
    async getCategoryBySlug(slug) {
        return await ForumDAO.getCategoryBySlug(slug);
    }
    // Topics
    async getTopics(options = {}) {
        return await ForumDAO.getTopics(options);
    }
    async getTopicById(topicId, userId = null) {
        const topic = await ForumDAO.getTopicById(topicId);
        if (topic && userId) {
            await this.incrementViewCount(topicId);
        }
        return topic;
    }
    async createTopic(userId, topicData) {
        const topic = await ForumDAO.createTopic({
            authorId: userId,
            categoryId: topicData.categoryId,
            title: topicData.title,
            content: topicData.content,
            tags: topicData.tags || [],
            isPinned: topicData.isPinned || false
        });
        await this.updateUserStats(userId, 'topics_created');
        await this.grantReputation(userId, 'create_topic');
        return topic;
    }
    async updateTopic(topicId, userId, topicData) {
        const topic = await ForumDAO.getTopicById(topicId);
        if (!topic || topic.author_id !== userId) {
            return null;
        }
        return await ForumDAO.updateTopic(topicId, topicData);
    }
    async incrementViewCount(topicId) {
        await ForumDAO.incrementViewCount(topicId);
    }
    // Posts
    async getTopicPosts(topicId, options = {}) {
        return await ForumDAO.getTopicPosts(topicId, options);
    }
    async createPost(userId, postData) {
        const post = await ForumDAO.createPost({
            authorId: userId,
            topicId: postData.topicId,
            content: postData.content,
            parentId: postData.parentId
        });
        await this.updateUserStats(userId, 'posts_created');
        await this.grantReputation(userId, 'reply_post');
        await this.processMentions(post.id, postData.content);
        return post;
    }
    async updatePost(postId, userId, content) {
        return await ForumDAO.updatePost(postId, userId, content);
    }
    async deletePost(postId, userId, reason = null) {
        return await ForumDAO.deletePost(postId, userId, reason);
    }
    async markAsSolution(topicId, postId, userId) {
        const topic = await ForumDAO.getTopicById(topicId);
        if (!topic || topic.author_id !== userId) {
            return false;
        }
        await ForumDAO.markAsSolution(topicId, postId);
        const post = await ForumDAO.getPostById(postId);
        if (post) {
            await this.grantReputation(post.author_id, 'marked_solution');
        }
        return true;
    }
    // Reactions
    async reactToTopic(userId, topicId, reactionType) {
        const existing = await ForumDAO.getReaction('topic', topicId, userId);
        if (existing) {
            if (existing.reaction_type === reactionType) {
                await ForumDAO.removeReaction('topic', topicId, userId);
                await this.updateLikeCount('topic', topicId, -1);
                return { removed: true };
            }
            else {
                await ForumDAO.updateReaction('topic', topicId, userId, reactionType);
                return { updated: true, type: reactionType };
            }
        }
        await ForumDAO.createReaction('topic', topicId, userId, reactionType);
        await this.updateLikeCount('topic', topicId, 1);
        const topic = await ForumDAO.getTopicById(topicId);
        if (topic && topic.author_id !== userId) {
            await this.grantReputation(topic.author_id, 'receive_like');
        }
        return { added: true, type: reactionType };
    }
    async reactToPost(userId, postId, reactionType) {
        const existing = await ForumDAO.getReaction('post', postId, userId);
        if (existing) {
            if (existing.reaction_type === reactionType) {
                await ForumDAO.removeReaction('post', postId, userId);
                await this.updateLikeCount('post', postId, -1);
                return { removed: true };
            }
            else {
                await ForumDAO.updateReaction('post', postId, userId, reactionType);
                return { updated: true, type: reactionType };
            }
        }
        await ForumDAO.createReaction('post', postId, userId, reactionType);
        await this.updateLikeCount('post', postId, 1);
        const post = await ForumDAO.getPostById(postId);
        if (post && post.author_id !== userId) {
            await this.grantReputation(post.author_id, 'receive_like');
        }
        return { added: true, type: reactionType };
    }
    async updateLikeCount(type, id, delta) {
        await ForumDAO.updateLikeCount(type, id, delta);
    }
    // Subscriptions
    async subscribeTopic(userId, topicId) {
        await ForumDAO.subscribeTopic(userId, topicId);
    }
    async unsubscribeTopic(userId, topicId) {
        await ForumDAO.unsubscribeTopic(userId, topicId);
    }
    async getUserSubscriptions(userId, limit = 50) {
        return await ForumDAO.getUserSubscriptions(userId, limit);
    }
    // Mentions
    async processMentions(postId, content) {
        const mentionPattern = /@(\w+)/g;
        const mentions = content.match(mentionPattern);
        if (!mentions)
            return;
        for (const mention of mentions) {
            const username = mention.substring(1);
            const user = await ForumDAO.getUserByUsername(username);
            if (user) {
                await ForumDAO.createMention(postId, user.id);
            }
        }
    }
    async getUnreadMentions(userId) {
        return await ForumDAO.getUnreadMentions(userId);
    }
    async markMentionsAsRead(userId, mentionIds = null) {
        await ForumDAO.markMentionsAsRead(userId, mentionIds);
    }
    // Reports
    async reportContent(userId, reportData) {
        return await ForumDAO.createReport(userId, reportData);
    }
    async getPendingReports(limit = 50) {
        return await ForumDAO.getPendingReports(limit);
    }
    // User Stats & Reputation
    async updateUserStats(userId, field, increment = 1) {
        await ForumDAO.updateUserStats(userId, field, increment);
    }
    async grantReputation(userId, action) {
        const points = this.reputationPoints[action] || 0;
        if (points > 0) {
            await ForumDAO.grantReputation(userId, points);
        }
    }
    getReputationLevel(score) {
        for (const level of this.reputationLevels) {
            if (score >= level.min && score <= level.max) {
                return level;
            }
        }
        return this.reputationLevels[0];
    }
    async getUserStats(userId) {
        return await ForumDAO.getUserStats(userId);
    }
    async getReputationLeaderboard(limit = 10) {
        return await ForumDAO.getReputationLeaderboard(limit);
    }
    // Search
    async searchTopics(searchTerm, options = {}) {
        return await ForumDAO.searchTopics(searchTerm, options);
    }
    async getTrendingTopics(limit = 10) {
        return await ForumDAO.getTrendingTopics(limit);
    }
}
exports.ForumsService = ForumsService;
// ============================================
// EXPORTS
// ============================================
const forumsService = new ForumsService();
exports.default = forumsService;
module.exports = forumsService;
module.exports.ForumsService = ForumsService;
//# sourceMappingURL=forums.service.js.map
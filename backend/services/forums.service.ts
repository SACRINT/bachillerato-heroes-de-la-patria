/**
 * 💬 FORUMS SERVICE - TypeScript Version
 * Gestión de foros de discusión
 * Refactorizado: 07 Diciembre 2025
 */

const ForumDAO = require('../data/forum.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface ReputationLevel {
    min: number;
    max: number;
    name: string;
}

export interface ReputationPoints {
    [key: string]: number;
}

export interface TopicData {
    categoryId: number;
    title: string;
    content: string;
    tags?: string[];
    isPinned?: boolean;
}

export interface PostData {
    topicId: number;
    content: string;
    parentId?: number;
    quotedPostId?: number;
}

export interface Topic {
    id: number;
    title: string;
    content: string;
    authorId: number;
    categoryId: number;
    views: number;
    likes: number;
    replyCount: number;
    createdAt: Date;
}

export interface Post {
    id: number;
    topicId: number;
    content: string;
    authorId: number;
    likes: number;
    createdAt: Date;
}

// ============================================
// FORUMS SERVICE CLASS
// ============================================

class ForumsService {
    private reputationLevels: ReputationLevel[];
    private reputationPoints: ReputationPoints;

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
    async getCategories(userRole: string = 'estudiante'): Promise<any[]> {
        return await ForumDAO.getCategories(userRole);
    }

    async getCategoryBySlug(slug: string): Promise<any> {
        return await ForumDAO.getCategoryBySlug(slug);
    }

    // Topics
    async getTopics(options: { categoryId?: number; page?: number; limit?: number } = {}): Promise<any> {
        return await ForumDAO.getTopics(options);
    }

    async getTopicById(topicId: number, userId: number | null = null): Promise<Topic | null> {
        const topic = await ForumDAO.getTopicById(topicId);
        if (topic && userId) {
            await this.incrementViewCount(topicId);
        }
        return topic;
    }

    async createTopic(userId: number, topicData: TopicData): Promise<Topic> {
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

    async updateTopic(topicId: number, userId: number, topicData: Partial<TopicData>): Promise<Topic | null> {
        const topic = await ForumDAO.getTopicById(topicId);
        if (!topic || topic.author_id !== userId) {
            return null;
        }
        return await ForumDAO.updateTopic(topicId, topicData);
    }

    async incrementViewCount(topicId: number): Promise<void> {
        await ForumDAO.incrementViewCount(topicId);
    }

    // Posts
    async getTopicPosts(topicId: number, options: { page?: number; limit?: number } = {}): Promise<any> {
        return await ForumDAO.getTopicPosts(topicId, options);
    }

    async createPost(userId: number, postData: PostData): Promise<Post> {
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

    async updatePost(postId: number, userId: number, content: string): Promise<Post | null> {
        return await ForumDAO.updatePost(postId, userId, content);
    }

    async deletePost(postId: number, userId: number, reason: string | null = null): Promise<boolean> {
        return await ForumDAO.deletePost(postId, userId, reason);
    }

    async markAsSolution(topicId: number, postId: number, userId: number): Promise<boolean> {
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
    async reactToTopic(userId: number, topicId: number, reactionType: string): Promise<any> {
        const existing = await ForumDAO.getReaction('topic', topicId, userId);

        if (existing) {
            if (existing.reaction_type === reactionType) {
                await ForumDAO.removeReaction('topic', topicId, userId);
                await this.updateLikeCount('topic', topicId, -1);
                return { removed: true };
            } else {
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

    async reactToPost(userId: number, postId: number, reactionType: string): Promise<any> {
        const existing = await ForumDAO.getReaction('post', postId, userId);

        if (existing) {
            if (existing.reaction_type === reactionType) {
                await ForumDAO.removeReaction('post', postId, userId);
                await this.updateLikeCount('post', postId, -1);
                return { removed: true };
            } else {
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

    private async updateLikeCount(type: string, id: number, delta: number): Promise<void> {
        await ForumDAO.updateLikeCount(type, id, delta);
    }

    // Subscriptions
    async subscribeTopic(userId: number, topicId: number): Promise<void> {
        await ForumDAO.subscribeTopic(userId, topicId);
    }

    async unsubscribeTopic(userId: number, topicId: number): Promise<void> {
        await ForumDAO.unsubscribeTopic(userId, topicId);
    }

    async getUserSubscriptions(userId: number, limit: number = 50): Promise<any[]> {
        return await ForumDAO.getUserSubscriptions(userId, limit);
    }

    // Mentions
    private async processMentions(postId: number, content: string): Promise<void> {
        const mentionPattern = /@(\w+)/g;
        const mentions = content.match(mentionPattern);

        if (!mentions) return;

        for (const mention of mentions) {
            const username = mention.substring(1);
            const user = await ForumDAO.getUserByUsername(username);
            if (user) {
                await ForumDAO.createMention(postId, user.id);
            }
        }
    }

    async getUnreadMentions(userId: number): Promise<any[]> {
        return await ForumDAO.getUnreadMentions(userId);
    }

    async markMentionsAsRead(userId: number, mentionIds: number[] | null = null): Promise<void> {
        await ForumDAO.markMentionsAsRead(userId, mentionIds);
    }

    // Reports
    async reportContent(userId: number, reportData: { type: string; id: number; reason: string }): Promise<any> {
        return await ForumDAO.createReport(userId, reportData);
    }

    async getPendingReports(limit: number = 50): Promise<any[]> {
        return await ForumDAO.getPendingReports(limit);
    }

    // User Stats & Reputation
    private async updateUserStats(userId: number, field: string, increment: number = 1): Promise<void> {
        await ForumDAO.updateUserStats(userId, field, increment);
    }

    async grantReputation(userId: number, action: string): Promise<void> {
        const points = this.reputationPoints[action] || 0;
        if (points > 0) {
            await ForumDAO.grantReputation(userId, points);
        }
    }

    getReputationLevel(score: number): ReputationLevel {
        for (const level of this.reputationLevels) {
            if (score >= level.min && score <= level.max) {
                return level;
            }
        }
        return this.reputationLevels[0];
    }

    async getUserStats(userId: number): Promise<any> {
        return await ForumDAO.getUserStats(userId);
    }

    async getReputationLeaderboard(limit: number = 10): Promise<any[]> {
        return await ForumDAO.getReputationLeaderboard(limit);
    }

    // Search
    async searchTopics(searchTerm: string, options: { categoryId?: number; limit?: number } = {}): Promise<any[]> {
        return await ForumDAO.searchTopics(searchTerm, options);
    }

    async getTrendingTopics(limit: number = 10): Promise<any[]> {
        return await ForumDAO.getTrendingTopics(limit);
    }
}

// ============================================
// EXPORTS
// ============================================

const forumsService = new ForumsService();

export { ForumsService };
export default forumsService;

module.exports = forumsService;
module.exports.ForumsService = ForumsService;

/**
 * 💬 FORUM DAO - TypeScript
 * Data Access Object para sistema de foros
 * Abstrae todas las queries SQL de ForumsService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface ForumCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    parent_id?: number;
    sort_order: number;
    is_active: boolean;
    allowed_roles: string[];
    topic_count: number;
    post_count: number;
    last_post_at?: Date;
    last_post_user_id?: number;
    last_post_topic_id?: number;
    created_at: Date;
    updated_at: Date;
    // Joined fields
    last_post_user_name?: string;
    last_topic_title?: string;
}

export interface ForumTopic {
    id: number;
    category_id: number;
    title: string;
    slug: string;
    content: string;
    author_id: number;
    topic_type: string;
    status: string;
    is_pinned: boolean;
    is_locked: boolean;
    is_hidden: boolean;
    is_approved: boolean;
    view_count: number;
    reply_count: number;
    like_count: number;
    last_reply_at?: Date;
    last_reply_user_id?: number;
    solution_post_id?: number;
    solved_at?: Date;
    tags?: any;
    xp_reward: number;
    coins_reward: number;
    search_vector?: any;
    created_at: Date;
    updated_at: Date;
    // Joined fields
    category_name?: string;
    category_slug?: string;
    author_name?: string;
    last_reply_user_name?: string;
    is_subscribed?: boolean;
    user_reaction?: string;
    relevance?: number;
    trending_score?: number;
}

export interface ForumPost {
    id: number;
    topic_id: number;
    parent_post_id?: number;
    content: string;
    author_id: number;
    is_solution: boolean;
    is_hidden: boolean;
    hidden_by?: number;
    hidden_at?: Date;
    hidden_reason?: string;
    is_edited: boolean;
    edited_by?: number;
    edited_at?: Date;
    edit_count: number;
    like_count: number;
    is_approved: boolean;
    created_at: Date;
    updated_at: Date;
    // Joined fields
    author_name?: string;
    edited_by_name?: string;
    user_reaction?: string;
    topic_title?: string;
    topic_slug?: string;
}

export interface ForumReaction {
    id: number;
    user_id: number;
    topic_id?: number;
    post_id?: number;
    reaction_type: string;
    created_at: Date;
}

export interface ForumSubscription {
    id: number;
    user_id: number;
    topic_id: number;
    is_muted: boolean;
    created_at: Date;
    // Joined fields
    title?: string;
    slug?: string;
    reply_count?: number;
    last_reply_at?: Date;
}

export interface ForumMention {
    id: number;
    post_id: number;
    mentioned_user_id: number;
    is_read: boolean;
    read_at?: Date;
    created_at: Date;
    // Joined fields
    content?: string;
    post_created_at?: Date;
    topic_title?: string;
    topic_slug?: string;
    author_name?: string;
}

export interface ForumReport {
    id: number;
    reporter_id: number;
    topic_id?: number;
    post_id?: number;
    reason: string;
    description?: string;
    status: string;
    resolution?: string;
    resolved_by?: number;
    resolved_at?: Date;
    created_at: Date;
    updated_at: Date;
    // Joined fields
    reporter_name?: string;
    topic_title?: string;
    post_content?: string;
}

export interface ForumPoll {
    id: number;
    topic_id: number;
    question: string;
    options: any; // JSON
    allows_multiple: boolean;
    starts_at?: Date;
    ends_at?: Date;
    total_votes: number;
    voter_count: number;
    created_at: Date;
}

export interface ForumUserStats {
    user_id: number;
    topic_count: number;
    post_count: number;
    solution_count: number;
    reputation_score: number;
    reputation_level: string;
    last_activity_at: Date;
    created_at: Date;
    updated_at: Date;
    // Joined fields
    nombre?: string;
    email?: string;
    rank?: number;
}

export interface CreateTopicInput {
    categoryId: number;
    title: string;
    slug: string;
    content: string;
    authorId: number;
    topicType: string;
    tags?: string[];
    xpReward?: number;
    coinsReward?: number;
}

export interface GetTopicsOptions {
    categoryId?: number;
    authorId?: number;
    status?: string;
    topicType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
    userId?: number;
}

// =====================================================
// FORUM DAO CLASS
// =====================================================

class ForumDAO {

    // ==========================================
    // CATEGORÍAS
    // ==========================================

    static async getCategories(userRole: string = 'estudiante'): Promise<ForumCategory[]> {
        const query = `
            SELECT
                c.*,
                u.nombre as last_post_user_name,
                (SELECT title FROM forum_topics WHERE category_id = c.id ORDER BY created_at DESC LIMIT 1) as last_topic_title
            FROM forum_categories c
            LEFT JOIN usuarios u ON c.last_post_user_id = u.id
            WHERE c.is_active = true
            AND $1 = ANY(c.allowed_roles)
            ORDER BY c.parent_id NULLS FIRST, c.sort_order ASC
        `;
        return executeQuery(query, [userRole]);
    }

    static async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
        const query = `SELECT * FROM forum_categories WHERE slug = $1 AND is_active = true`;
        const results = await executeQuery(query, [slug]);
        return results[0] || null;
    }

    // ==========================================
    // TEMAS
    // ==========================================

    static async getTopics(options: GetTopicsOptions = {}): Promise<ForumTopic[]> {
        const {
            categoryId, authorId, status = 'open', topicType, search,
            sortBy = 'last_reply_at', sortOrder = 'DESC', limit = 20, offset = 0
        } = options;

        let query = `
            SELECT t.*, c.name as category_name, c.slug as category_slug,
                   u.nombre as author_name, lu.nombre as last_reply_user_name
            FROM forum_topics t
            JOIN forum_categories c ON t.category_id = c.id
            JOIN usuarios u ON t.author_id = u.id
            LEFT JOIN usuarios lu ON t.last_reply_user_id = lu.id
            WHERE t.is_approved = true
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (categoryId) {
            query += ` AND t.category_id = $${paramIndex++}`;
            params.push(categoryId);
        }
        if (authorId) {
            query += ` AND t.author_id = $${paramIndex++}`;
            params.push(authorId);
        }
        if (status && status !== 'all') {
            query += ` AND t.status = $${paramIndex++}`;
            params.push(status);
        }
        if (topicType) {
            query += ` AND t.topic_type = $${paramIndex++}`;
            params.push(topicType);
        }
        if (search) {
            query += ` AND t.search_vector @@ plainto_tsquery('spanish', $${paramIndex++})`;
            params.push(search);
        }

        const validSortFields = ['created_at', 'last_reply_at', 'view_count', 'reply_count', 'like_count'];
        const sortField = sortBy && validSortFields.includes(sortBy) ? sortBy : 'last_reply_at';
        const order = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY t.is_pinned DESC, t.${sortField} ${order} NULLS LAST`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    static async getTopicById(topicId: number | string, userId: number | null = null): Promise<ForumTopic | null> {
        let query = `SELECT t.*, c.name as category_name, c.slug as category_slug, u.nombre as author_name`;
        const params: any[] = [topicId];

        if (userId) {
            query += `, CASE WHEN s.id IS NOT NULL THEN true ELSE false END as is_subscribed, r.reaction_type as user_reaction`;
        }

        query += ` FROM forum_topics t
            JOIN forum_categories c ON t.category_id = c.id
            JOIN usuarios u ON t.author_id = u.id`;

        if (userId) {
            query += ` LEFT JOIN forum_subscriptions s ON t.id = s.topic_id AND s.user_id = $2
                       LEFT JOIN forum_reactions r ON t.id = r.topic_id AND r.user_id = $2`;
            params.push(userId);
        }

        query += ` WHERE t.id = $1`;
        const results = await executeQuery(query, params);
        return results[0] || null;
    }

    static async createTopic(data: CreateTopicInput): Promise<ForumTopic> {
        const { categoryId, title, slug, content, authorId, topicType, tags, xpReward, coinsReward } = data;
        const query = `
            INSERT INTO forum_topics (category_id, title, slug, content, author_id, topic_type, tags, xp_reward, coins_reward)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `;
        const results = await executeQuery(query, [
            categoryId, title, slug, content, authorId, topicType, tags ? JSON.stringify(tags) : null, xpReward || 5, coinsReward || 2
        ]);
        return results[0];
    }

    static async updateTopic(topicId: number | string, authorId: number, fields: string[], values: any[]): Promise<ForumTopic> {
        values.push(topicId, authorId);
        const paramCount = values.length;
        const query = `
            UPDATE forum_topics SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount - 1} AND author_id = $${paramCount} RETURNING *
        `;
        const results = await executeQuery(query, values);
        return results[0];
    }

    static async incrementViewCount(topicId: number | string): Promise<void> {
        await executeQuery(`UPDATE forum_topics SET view_count = view_count + 1 WHERE id = $1`, [topicId]);
    }

    static async getTopicAuthor(topicId: number | string): Promise<number | undefined> {
        const result = await executeQuery(`SELECT author_id FROM forum_topics WHERE id = $1`, [topicId]);
        return result[0]?.author_id;
    }

    // ==========================================
    // POSTS
    // ==========================================

    static async getTopicPosts(topicId: number | string, options: { limit?: number; offset?: number; userId?: number | null } = {}): Promise<ForumPost[]> {
        const { limit = 50, offset = 0, userId = null } = options;
        let query = `SELECT p.*, u.nombre as author_name, eu.nombre as edited_by_name`;
        const params: any[] = [topicId, limit, offset];

        if (userId) {
            query += `, r.reaction_type as user_reaction`;
        }

        query += ` FROM forum_posts p
            JOIN usuarios u ON p.author_id = u.id
            LEFT JOIN usuarios eu ON p.edited_by = eu.id`;

        if (userId) {
            query += ` LEFT JOIN forum_reactions r ON p.id = r.post_id AND r.user_id = $4`;
            params.push(userId);
        }

        query += ` WHERE p.topic_id = $1 AND p.is_hidden = false AND p.is_approved = true
            ORDER BY p.is_solution DESC, p.created_at ASC LIMIT $2 OFFSET $3`;

        return executeQuery(query, params);
    }

    static async createPost(topicId: number | string, parentPostId: number | null, content: string, authorId: number): Promise<ForumPost> {
        const query = `INSERT INTO forum_posts (topic_id, parent_post_id, content, author_id) VALUES ($1, $2, $3, $4) RETURNING *`;
        const results = await executeQuery(query, [topicId, parentPostId, content, authorId]);
        return results[0];
    }

    static async updatePost(postId: number | string, authorId: number, content: string): Promise<ForumPost> {
        const query = `
            UPDATE forum_posts SET content = $1, is_edited = true, edit_count = edit_count + 1, edited_at = NOW(), edited_by = $2, updated_at = NOW()
            WHERE id = $3 AND author_id = $2 RETURNING *
        `;
        const results = await executeQuery(query, [content, authorId, postId]);
        return results[0];
    }

    static async deletePost(postId: number | string, userId: number, reason: string): Promise<boolean> {
        const query = `
            UPDATE forum_posts SET is_hidden = true, hidden_by = $1, hidden_at = NOW(), hidden_reason = $2
            WHERE id = $3 AND (author_id = $1 OR EXISTS (SELECT 1 FROM usuarios WHERE id = $1 AND role IN ('admin', 'administrativo')))
            RETURNING *
        `;
        const results = await executeQuery(query, [userId, reason, postId]);
        return results.length > 0;
    }

    static async getPostAuthor(postId: number | string): Promise<number | undefined> {
        const result = await executeQuery(`SELECT author_id FROM forum_posts WHERE id = $1`, [postId]);
        return result[0]?.author_id;
    }

    static async clearTopicSolutions(topicId: number | string): Promise<void> {
        await executeQuery(`UPDATE forum_posts SET is_solution = false WHERE topic_id = $1`, [topicId]);
    }

    static async markPostAsSolution(postId: number | string): Promise<{ author_id: number }> {
        const result = await executeQuery(`UPDATE forum_posts SET is_solution = true WHERE id = $1 RETURNING author_id`, [postId]);
        return result[0];
    }

    static async updateTopicSolution(topicId: number | string, postId: number | string): Promise<void> {
        await executeQuery(
            `UPDATE forum_topics SET solution_post_id = $1, solved_at = NOW(), status = 'solved' WHERE id = $2`,
            [postId, topicId]
        );
    }

    // ==========================================
    // REACCIONES
    // ==========================================

    static async getTopicReaction(userId: number, topicId: number | string): Promise<ForumReaction | undefined> {
        const results = await executeQuery(
            `SELECT id, reaction_type FROM forum_reactions WHERE user_id = $1 AND topic_id = $2`,
            [userId, topicId]
        );
        return results[0];
    }

    static async getPostReaction(userId: number, postId: number | string): Promise<ForumReaction | undefined> {
        const results = await executeQuery(
            `SELECT id, reaction_type FROM forum_reactions WHERE user_id = $1 AND post_id = $2`,
            [userId, postId]
        );
        return results[0];
    }

    static async deleteReaction(reactionId: number): Promise<void> {
        await executeQuery(`DELETE FROM forum_reactions WHERE id = $1`, [reactionId]);
    }

    static async updateReaction(reactionId: number, reactionType: string): Promise<void> {
        await executeQuery(`UPDATE forum_reactions SET reaction_type = $1 WHERE id = $2`, [reactionType, reactionId]);
    }

    static async createTopicReaction(userId: number, topicId: number | string, reactionType: string): Promise<void> {
        await executeQuery(
            `INSERT INTO forum_reactions (user_id, topic_id, reaction_type) VALUES ($1, $2, $3)`,
            [userId, topicId, reactionType]
        );
    }

    static async createPostReaction(userId: number, postId: number | string, reactionType: string): Promise<void> {
        await executeQuery(
            `INSERT INTO forum_reactions (user_id, post_id, reaction_type) VALUES ($1, $2, $3)`,
            [userId, postId, reactionType]
        );
    }

    static async updateLikeCount(type: 'topic' | 'post', id: number | string, delta: number): Promise<void> {
        const table = type === 'topic' ? 'forum_topics' : 'forum_posts';
        await executeQuery(`UPDATE ${table} SET like_count = GREATEST(0, like_count + $1) WHERE id = $2`, [delta, id]);
    }

    // ==========================================
    // SUSCRIPCIONES
    // ==========================================

    static async subscribeTopic(userId: number, topicId: number | string): Promise<ForumSubscription> {
        const query = `
            INSERT INTO forum_subscriptions (user_id, topic_id) VALUES ($1, $2)
            ON CONFLICT (user_id, topic_id) DO UPDATE SET is_muted = false RETURNING *
        `;
        const results = await executeQuery(query, [userId, topicId]);
        return results[0];
    }

    static async unsubscribeTopic(userId: number, topicId: number | string): Promise<void> {
        await executeQuery(`DELETE FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2`, [userId, topicId]);
    }

    static async getUserSubscriptions(userId: number, limit: number = 50): Promise<ForumSubscription[]> {
        const query = `
            SELECT s.*, t.title, t.slug, t.reply_count, t.last_reply_at
            FROM forum_subscriptions s
            JOIN forum_topics t ON s.topic_id = t.id
            WHERE s.user_id = $1 AND s.is_muted = false
            ORDER BY t.last_reply_at DESC NULLS LAST LIMIT $2
        `;
        return executeQuery(query, [userId, limit]);
    }

    // ==========================================
    // MENCIONES
    // ==========================================

    static async findUserByUsername(username: string): Promise<{ id: number } | undefined> {
        const results = await executeQuery(
            `SELECT id FROM usuarios WHERE username = $1 OR email LIKE $2 LIMIT 1`,
            [username, `${username}@%`]
        );
        return results[0];
    }

    static async createMention(postId: number | string, mentionedUserId: number): Promise<void> {
        await executeQuery(
            `INSERT INTO forum_mentions (post_id, mentioned_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [postId, mentionedUserId]
        );
    }

    static async getUnreadMentions(userId: number): Promise<ForumMention[]> {
        const query = `
            SELECT m.*, p.content, p.created_at as post_created_at,
                   t.title as topic_title, t.slug as topic_slug, u.nombre as author_name
            FROM forum_mentions m
            JOIN forum_posts p ON m.post_id = p.id
            JOIN forum_topics t ON p.topic_id = t.id
            JOIN usuarios u ON p.author_id = u.id
            WHERE m.mentioned_user_id = $1 AND m.is_read = false
            ORDER BY m.created_at DESC
        `;
        return executeQuery(query, [userId]);
    }

    static async markMentionsAsRead(userId: number, mentionIds: number[] | null = null): Promise<void> {
        if (mentionIds && mentionIds.length > 0) {
            await executeQuery(
                `UPDATE forum_mentions SET is_read = true, read_at = NOW() WHERE mentioned_user_id = $1 AND id = ANY($2)`,
                [userId, mentionIds]
            );
        } else {
            await executeQuery(
                `UPDATE forum_mentions SET is_read = true, read_at = NOW() WHERE mentioned_user_id = $1 AND is_read = false`,
                [userId]
            );
        }
    }

    // ==========================================
    // REPORTES
    // ==========================================

    static async createReport(userId: number, topicId: number | null, postId: number | null, reason: string, description?: string): Promise<ForumReport> {
        const query = `
            INSERT INTO forum_reports (reporter_id, topic_id, post_id, reason, description) VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const results = await executeQuery(query, [userId, topicId, postId, reason, description]);
        return results[0];
    }

    static async getPendingReports(limit: number = 50): Promise<ForumReport[]> {
        const query = `
            SELECT r.*, u.nombre as reporter_name, t.title as topic_title, p.content as post_content
            FROM forum_reports r
            JOIN usuarios u ON r.reporter_id = u.id
            LEFT JOIN forum_topics t ON r.topic_id = t.id
            LEFT JOIN forum_posts p ON r.post_id = p.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC LIMIT $1
        `;
        return executeQuery(query, [limit]);
    }

    // ==========================================
    // ENCUESTAS
    // ==========================================

    static async createPoll(topicId: number | string, question: string, options: any, allowsMultiple: boolean, endsAt?: Date): Promise<ForumPoll> {
        const query = `INSERT INTO forum_polls (topic_id, question, options, allows_multiple, ends_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const results = await executeQuery(query, [topicId, question, JSON.stringify(options), allowsMultiple, endsAt]);
        return results[0];
    }

    static async updateTopicType(topicId: number | string, type: string): Promise<void> {
        await executeQuery(`UPDATE forum_topics SET topic_type = $1 WHERE id = $2`, [type, topicId]);
    }

    static async getPollVote(pollId: number, userId: number): Promise<{ id: number } | undefined> {
        const results = await executeQuery(`SELECT id FROM forum_poll_votes WHERE poll_id = $1 AND user_id = $2`, [pollId, userId]);
        return results[0];
    }

    static async createPollVote(pollId: number, userId: number, optionIds: number[]): Promise<void> {
        await executeQuery(`INSERT INTO forum_poll_votes (poll_id, user_id, option_ids) VALUES ($1, $2, $3)`, [pollId, userId, optionIds]);
    }

    static async getPollOptions(pollId: number): Promise<any> {
        const results = await executeQuery(`SELECT options FROM forum_polls WHERE id = $1`, [pollId]);
        return results[0]?.options;
    }

    static async updatePollOptions(pollId: number, options: any, voteCount: number): Promise<void> {
        await executeQuery(
            `UPDATE forum_polls SET options = $1, total_votes = total_votes + $2, voter_count = voter_count + 1 WHERE id = $3`,
            [JSON.stringify(options), voteCount, pollId]
        );
    }

    // ==========================================
    // ESTADÍSTICAS Y REPUTACIÓN
    // ==========================================

    static async ensureUserStats(userId: number): Promise<void> {
        await executeQuery(`INSERT INTO forum_user_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
    }

    static async updateUserStats(userId: number, field: string, increment: number = 1): Promise<void> {
        // Warning: Direct string interpolation for field name. Ensure field name is safe.
        // In this context, field comes from controlled source in service.
        await executeQuery(
            `UPDATE forum_user_stats SET ${field} = ${field} + $1, last_activity_at = NOW(), updated_at = NOW() WHERE user_id = $2`,
            [increment, userId]
        );
    }

    static async getUserStats(userId: number): Promise<ForumUserStats | undefined> {
        const results = await executeQuery(`SELECT * FROM forum_user_stats WHERE user_id = $1`, [userId]);
        return results[0];
    }

    static async updateReputationLevel(userId: number, level: string): Promise<void> {
        await executeQuery(`UPDATE forum_user_stats SET reputation_level = $1 WHERE user_id = $2`, [level, userId]);
    }

    static async getReputationLeaderboard(limit: number = 10): Promise<ForumUserStats[]> {
        const query = `
            SELECT fus.*, u.nombre, u.email
            FROM forum_user_stats fus
            JOIN usuarios u ON fus.user_id = u.id
            ORDER BY fus.reputation_score DESC
            LIMIT $1
        `;
        return executeQuery(query, [limit]);
    }

    // ==========================================
    // BÚSQUEDA Y TRENDING
    // ==========================================

    static async searchTopics(searchTerm: string, options: { categoryId?: number; limit?: number; offset?: number } = {}): Promise<ForumTopic[]> {
        const { categoryId, limit = 20, offset = 0 } = options;

        let query = `
            SELECT t.*, c.name as category_name, u.nombre as author_name,
                   ts_rank(t.search_vector, plainto_tsquery('spanish', $1)) as relevance
            FROM forum_topics t
            JOIN forum_categories c ON t.category_id = c.id
            JOIN usuarios u ON t.author_id = u.id
            WHERE t.search_vector @@ plainto_tsquery('spanish', $1) AND t.is_approved = true
        `;
        const params: any[] = [searchTerm];
        let paramIndex = 2;

        if (categoryId) {
            query += ` AND t.category_id = $${paramIndex++}`;
            params.push(categoryId);
        }

        query += ` ORDER BY relevance DESC, t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    static async getTrendingTopics(limit: number = 10): Promise<ForumTopic[]> {
        const query = `
            SELECT t.*, c.name as category_name, u.nombre as author_name,
                   (t.view_count * 0.3 + t.reply_count * 0.5 + t.like_count * 0.2) as trending_score
            FROM forum_topics t
            JOIN forum_categories c ON t.category_id = c.id
            JOIN usuarios u ON t.author_id = u.id
            WHERE t.is_approved = true AND t.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY trending_score DESC
            LIMIT $1
        `;
        return executeQuery(query, [limit]);
    }
}

export default ForumDAO;
module.exports = ForumDAO;

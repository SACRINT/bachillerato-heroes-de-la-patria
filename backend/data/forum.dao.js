/**
 * 💬 FORUM DAO
 * Data Access Object para sistema de foros
 * Abstrae todas las queries SQL de ForumsService
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { executeQuery } = require('../config/database');

class ForumDAO {

    // ==========================================
    // CATEGORÍAS
    // ==========================================

    static async getCategories(userRole = 'estudiante') {
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

    static async getCategoryBySlug(slug) {
        const query = `SELECT * FROM forum_categories WHERE slug = $1 AND is_active = true`;
        const results = await executeQuery(query, [slug]);
        return results[0] || null;
    }

    // ==========================================
    // TEMAS
    // ==========================================

    static async getTopics(options = {}) {
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
        const params = [];
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
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'last_reply_at';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY t.is_pinned DESC, t.${sortField} ${order} NULLS LAST`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    static async getTopicById(topicId, userId = null) {
        let query = `SELECT t.*, c.name as category_name, c.slug as category_slug, u.nombre as author_name`;
        const params = [topicId];

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

    static async createTopic(data) {
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

    static async updateTopic(topicId, authorId, fields, values) {
        values.push(topicId, authorId);
        const paramCount = values.length;
        const query = `
            UPDATE forum_topics SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount - 1} AND author_id = $${paramCount} RETURNING *
        `;
        const results = await executeQuery(query, values);
        return results[0];
    }

    static async incrementViewCount(topicId) {
        await executeQuery(`UPDATE forum_topics SET view_count = view_count + 1 WHERE id = $1`, [topicId]);
    }

    static async getTopicAuthor(topicId) {
        const result = await executeQuery(`SELECT author_id FROM forum_topics WHERE id = $1`, [topicId]);
        return result[0]?.author_id;
    }

    // ==========================================
    // POSTS
    // ==========================================

    static async getTopicPosts(topicId, options = {}) {
        const { limit = 50, offset = 0, userId = null } = options;
        let query = `SELECT p.*, u.nombre as author_name, eu.nombre as edited_by_name`;
        const params = [topicId, limit, offset];

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

    static async createPost(topicId, parentPostId, content, authorId) {
        const query = `INSERT INTO forum_posts (topic_id, parent_post_id, content, author_id) VALUES ($1, $2, $3, $4) RETURNING *`;
        const results = await executeQuery(query, [topicId, parentPostId, content, authorId]);
        return results[0];
    }

    static async updatePost(postId, authorId, content) {
        const query = `
            UPDATE forum_posts SET content = $1, is_edited = true, edit_count = edit_count + 1, edited_at = NOW(), edited_by = $2, updated_at = NOW()
            WHERE id = $3 AND author_id = $2 RETURNING *
        `;
        const results = await executeQuery(query, [content, authorId, postId]);
        return results[0];
    }

    static async deletePost(postId, userId, reason) {
        const query = `
            UPDATE forum_posts SET is_hidden = true, hidden_by = $1, hidden_at = NOW(), hidden_reason = $2
            WHERE id = $3 AND (author_id = $1 OR EXISTS (SELECT 1 FROM usuarios WHERE id = $1 AND role IN ('admin', 'administrativo')))
            RETURNING *
        `;
        const results = await executeQuery(query, [userId, reason, postId]);
        return results.length > 0;
    }

    static async getPostAuthor(postId) {
        const result = await executeQuery(`SELECT author_id FROM forum_posts WHERE id = $1`, [postId]);
        return result[0]?.author_id;
    }

    static async clearTopicSolutions(topicId) {
        await executeQuery(`UPDATE forum_posts SET is_solution = false WHERE topic_id = $1`, [topicId]);
    }

    static async markPostAsSolution(postId) {
        const result = await executeQuery(`UPDATE forum_posts SET is_solution = true WHERE id = $1 RETURNING author_id`, [postId]);
        return result[0];
    }

    static async updateTopicSolution(topicId, postId) {
        await executeQuery(
            `UPDATE forum_topics SET solution_post_id = $1, solved_at = NOW(), status = 'solved' WHERE id = $2`,
            [postId, topicId]
        );
    }

    // ==========================================
    // REACCIONES
    // ==========================================

    static async getTopicReaction(userId, topicId) {
        const results = await executeQuery(
            `SELECT id, reaction_type FROM forum_reactions WHERE user_id = $1 AND topic_id = $2`,
            [userId, topicId]
        );
        return results[0];
    }

    static async getPostReaction(userId, postId) {
        const results = await executeQuery(
            `SELECT id, reaction_type FROM forum_reactions WHERE user_id = $1 AND post_id = $2`,
            [userId, postId]
        );
        return results[0];
    }

    static async deleteReaction(reactionId) {
        await executeQuery(`DELETE FROM forum_reactions WHERE id = $1`, [reactionId]);
    }

    static async updateReaction(reactionId, reactionType) {
        await executeQuery(`UPDATE forum_reactions SET reaction_type = $1 WHERE id = $2`, [reactionType, reactionId]);
    }

    static async createTopicReaction(userId, topicId, reactionType) {
        await executeQuery(
            `INSERT INTO forum_reactions (user_id, topic_id, reaction_type) VALUES ($1, $2, $3)`,
            [userId, topicId, reactionType]
        );
    }

    static async createPostReaction(userId, postId, reactionType) {
        await executeQuery(
            `INSERT INTO forum_reactions (user_id, post_id, reaction_type) VALUES ($1, $2, $3)`,
            [userId, postId, reactionType]
        );
    }

    static async updateLikeCount(type, id, delta) {
        const table = type === 'topic' ? 'forum_topics' : 'forum_posts';
        await executeQuery(`UPDATE ${table} SET like_count = GREATEST(0, like_count + $1) WHERE id = $2`, [delta, id]);
    }

    // ==========================================
    // SUSCRIPCIONES
    // ==========================================

    static async subscribeTopic(userId, topicId) {
        const query = `
            INSERT INTO forum_subscriptions (user_id, topic_id) VALUES ($1, $2)
            ON CONFLICT (user_id, topic_id) DO UPDATE SET is_muted = false RETURNING *
        `;
        const results = await executeQuery(query, [userId, topicId]);
        return results[0];
    }

    static async unsubscribeTopic(userId, topicId) {
        await executeQuery(`DELETE FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2`, [userId, topicId]);
    }

    static async getUserSubscriptions(userId, limit = 50) {
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

    static async findUserByUsername(username) {
        const results = await executeQuery(
            `SELECT id FROM usuarios WHERE username = $1 OR email LIKE $2 LIMIT 1`,
            [username, `${username}@%`]
        );
        return results[0];
    }

    static async createMention(postId, mentionedUserId) {
        await executeQuery(
            `INSERT INTO forum_mentions (post_id, mentioned_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [postId, mentionedUserId]
        );
    }

    static async getUnreadMentions(userId) {
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

    static async markMentionsAsRead(userId, mentionIds = null) {
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

    static async createReport(userId, topicId, postId, reason, description) {
        const query = `
            INSERT INTO forum_reports (reporter_id, topic_id, post_id, reason, description) VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const results = await executeQuery(query, [userId, topicId, postId, reason, description]);
        return results[0];
    }

    static async getPendingReports(limit = 50) {
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

    static async createPoll(topicId, question, options, allowsMultiple, endsAt) {
        const query = `INSERT INTO forum_polls (topic_id, question, options, allows_multiple, ends_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const results = await executeQuery(query, [topicId, question, JSON.stringify(options), allowsMultiple, endsAt]);
        return results[0];
    }

    static async updateTopicType(topicId, type) {
        await executeQuery(`UPDATE forum_topics SET topic_type = $1 WHERE id = $2`, [type, topicId]);
    }

    static async getPollVote(pollId, userId) {
        const results = await executeQuery(`SELECT id FROM forum_poll_votes WHERE poll_id = $1 AND user_id = $2`, [pollId, userId]);
        return results[0];
    }

    static async createPollVote(pollId, userId, optionIds) {
        await executeQuery(`INSERT INTO forum_poll_votes (poll_id, user_id, option_ids) VALUES ($1, $2, $3)`, [pollId, userId, optionIds]);
    }

    static async getPollOptions(pollId) {
        const results = await executeQuery(`SELECT options FROM forum_polls WHERE id = $1`, [pollId]);
        return results[0]?.options;
    }

    static async updatePollOptions(pollId, options, voteCount) {
        await executeQuery(
            `UPDATE forum_polls SET options = $1, total_votes = total_votes + $2, voter_count = voter_count + 1 WHERE id = $3`,
            [JSON.stringify(options), voteCount, pollId]
        );
    }

    // ==========================================
    // ESTADÍSTICAS Y REPUTACIÓN
    // ==========================================

    static async ensureUserStats(userId) {
        await executeQuery(`INSERT INTO forum_user_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
    }

    static async updateUserStats(userId, field, increment = 1) {
        await executeQuery(
            `UPDATE forum_user_stats SET ${field} = ${field} + $1, last_activity_at = NOW(), updated_at = NOW() WHERE user_id = $2`,
            [increment, userId]
        );
    }

    static async getUserStats(userId) {
        const results = await executeQuery(`SELECT * FROM forum_user_stats WHERE user_id = $1`, [userId]);
        return results[0];
    }

    static async updateReputationLevel(userId, level) {
        await executeQuery(`UPDATE forum_user_stats SET reputation_level = $1 WHERE user_id = $2`, [level, userId]);
    }

    static async getReputationLeaderboard(limit = 10) {
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

    static async searchTopics(searchTerm, options = {}) {
        const { categoryId, limit = 20, offset = 0 } = options;

        let query = `
            SELECT t.*, c.name as category_name, u.nombre as author_name,
                   ts_rank(t.search_vector, plainto_tsquery('spanish', $1)) as relevance
            FROM forum_topics t
            JOIN forum_categories c ON t.category_id = c.id
            JOIN usuarios u ON t.author_id = u.id
            WHERE t.search_vector @@ plainto_tsquery('spanish', $1) AND t.is_approved = true
        `;
        const params = [searchTerm];
        let paramIndex = 2;

        if (categoryId) {
            query += ` AND t.category_id = $${paramIndex++}`;
            params.push(categoryId);
        }

        query += ` ORDER BY relevance DESC, t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    static async getTrendingTopics(limit = 10) {
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

module.exports = ForumDAO;

/**
 * 💬 FORUMS SERVICE
 * Servicio de gestión de foros de discusión
 * FASE 2 - Semana 15-16
 */

const { executeQuery } = require('../data/database-access');

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

    /**
     * Obtiene todas las categorías
     */
    async getCategories(userRole = 'estudiante') {
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

    /**
     * Obtiene categoría por slug
     */
    async getCategoryBySlug(slug) {
        const query = `SELECT * FROM forum_categories WHERE slug = $1 AND is_active = true`;
        const results = await executeQuery(query, [slug]);
        return results[0] || null;
    }

    // =====================================
    // TEMAS
    // =====================================

    /**
     * Obtiene temas con filtros
     */
    async getTopics(options = {}) {
        const {
            categoryId,
            authorId,
            status = 'open',
            topicType,
            search,
            sortBy = 'last_reply_at',
            sortOrder = 'DESC',
            limit = 20,
            offset = 0
        } = options;

        let query = `
            SELECT
                t.*,
                c.name as category_name,
                c.slug as category_slug,
                u.nombre as author_name,
                lu.nombre as last_reply_user_name
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

        // Ordenamiento
        const validSortFields = ['created_at', 'last_reply_at', 'view_count', 'reply_count', 'like_count'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'last_reply_at';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Pinned primero
        query += ` ORDER BY t.is_pinned DESC, t.${sortField} ${order} NULLS LAST`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Obtiene un tema por ID
     */
    async getTopicById(topicId, userId = null) {
        let query = `
            SELECT
                t.*,
                c.name as category_name,
                c.slug as category_slug,
                u.nombre as author_name
        `;

        const params = [topicId];

        if (userId) {
            query += `,
                CASE WHEN s.id IS NOT NULL THEN true ELSE false END as is_subscribed,
                r.reaction_type as user_reaction
            `;
        }

        query += `
            FROM forum_topics t
            JOIN forum_categories c ON t.category_id = c.id
            JOIN usuarios u ON t.author_id = u.id
        `;

        if (userId) {
            query += `
                LEFT JOIN forum_subscriptions s ON t.id = s.topic_id AND s.user_id = $2
                LEFT JOIN forum_reactions r ON t.id = r.topic_id AND r.user_id = $2
            `;
            params.push(userId);
        }

        query += ` WHERE t.id = $1`;

        const results = await executeQuery(query, params);

        if (results.length === 0) return null;

        // Incrementar vistas
        await this.incrementViewCount(topicId);

        return results[0];
    }

    /**
     * Crea un nuevo tema
     */
    async createTopic(userId, topicData) {
        const {
            categoryId,
            title,
            content,
            topicType = 'discussion',
            tags
        } = topicData;

        // Generar slug
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
            '-' + Date.now().toString(36);

        const query = `
            INSERT INTO forum_topics (
                category_id, title, slug, content, author_id,
                topic_type, tags, xp_reward, coins_reward
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const results = await executeQuery(query, [
            categoryId, title, slug, content, userId,
            topicType, tags ? JSON.stringify(tags) : null, 5, 2
        ]);

        const topic = results[0];

        // Actualizar estadísticas del usuario
        await this.updateUserStats(userId, 'topics_created', 1);
        await this.grantReputation(userId, 'create_topic');

        // Suscribir al autor automáticamente
        await this.subscribeTopic(userId, topic.id);

        return topic;
    }

    /**
     * Actualiza un tema
     */
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

        values.push(topicId, userId);
        const query = `
            UPDATE forum_topics
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramIndex++} AND author_id = $${paramIndex}
            RETURNING *
        `;

        const results = await executeQuery(query, values);
        return results[0];
    }

    /**
     * Incrementa contador de vistas
     */
    async incrementViewCount(topicId) {
        const query = `UPDATE forum_topics SET view_count = view_count + 1 WHERE id = $1`;
        await executeQuery(query, [topicId]);
    }

    // =====================================
    // POSTS/RESPUESTAS
    // =====================================

    /**
     * Obtiene posts de un tema
     */
    async getTopicPosts(topicId, options = {}) {
        const { limit = 50, offset = 0, userId = null } = options;

        let query = `
            SELECT
                p.*,
                u.nombre as author_name,
                eu.nombre as edited_by_name
        `;

        const params = [topicId];

        if (userId) {
            query += `,
                r.reaction_type as user_reaction
            `;
        }

        query += `
            FROM forum_posts p
            JOIN usuarios u ON p.author_id = u.id
            LEFT JOIN usuarios eu ON p.edited_by = eu.id
        `;

        if (userId) {
            query += `
                LEFT JOIN forum_reactions r ON p.id = r.post_id AND r.user_id = $4
            `;
        }

        query += `
            WHERE p.topic_id = $1 AND p.is_hidden = false AND p.is_approved = true
            ORDER BY p.is_solution DESC, p.created_at ASC
            LIMIT $2 OFFSET $3
        `;

        params.push(limit, offset);
        if (userId) params.push(userId);

        return executeQuery(query, params);
    }

    /**
     * Crea una respuesta
     */
    async createPost(userId, postData) {
        const { topicId, content, parentPostId } = postData;

        const query = `
            INSERT INTO forum_posts (topic_id, parent_post_id, content, author_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const results = await executeQuery(query, [topicId, parentPostId, content, userId]);
        const post = results[0];

        // Actualizar estadísticas del usuario
        await this.updateUserStats(userId, 'posts_created', 1);
        await this.grantReputation(userId, 'create_post');

        // Procesar menciones
        await this.processMentions(post.id, content);

        // Notificar a suscriptores (se integraría con NotificationService)

        return post;
    }

    /**
     * Actualiza una respuesta
     */
    async updatePost(postId, userId, content) {
        const query = `
            UPDATE forum_posts
            SET content = $1, is_edited = true, edit_count = edit_count + 1,
                edited_at = NOW(), edited_by = $2, updated_at = NOW()
            WHERE id = $3 AND author_id = $2
            RETURNING *
        `;

        const results = await executeQuery(query, [content, userId, postId]);
        return results[0];
    }

    /**
     * Elimina una respuesta (soft delete)
     */
    async deletePost(postId, userId, reason = null) {
        const query = `
            UPDATE forum_posts
            SET is_hidden = true, hidden_by = $1, hidden_at = NOW(), hidden_reason = $2
            WHERE id = $3 AND (author_id = $1 OR EXISTS (
                SELECT 1 FROM usuarios WHERE id = $1 AND role IN ('admin', 'administrativo')
            ))
            RETURNING *
        `;

        const results = await executeQuery(query, [userId, reason, postId]);
        return results.length > 0;
    }

    /**
     * Marca post como solución
     */
    async markAsSolution(topicId, postId, userId) {
        // Verificar que el usuario es el autor del tema
        const topicQuery = `SELECT author_id FROM forum_topics WHERE id = $1`;
        const topicResult = await executeQuery(topicQuery, [topicId]);

        if (topicResult.length === 0 || topicResult[0].author_id !== userId) {
            throw new Error('Solo el autor del tema puede marcar soluciones');
        }

        // Quitar solución anterior
        await executeQuery(
            `UPDATE forum_posts SET is_solution = false WHERE topic_id = $1`,
            [topicId]
        );

        // Marcar nueva solución
        const updatePost = await executeQuery(
            `UPDATE forum_posts SET is_solution = true WHERE id = $1 RETURNING author_id`,
            [postId]
        );

        // Actualizar tema
        await executeQuery(
            `UPDATE forum_topics SET solution_post_id = $1, solved_at = NOW(), status = 'solved' WHERE id = $2`,
            [postId, topicId]
        );

        // Otorgar reputación al autor de la solución
        if (updatePost.length > 0) {
            await this.updateUserStats(updatePost[0].author_id, 'solutions_provided', 1);
            await this.grantReputation(updatePost[0].author_id, 'solution_accepted');
        }

        return true;
    }

    // =====================================
    // REACCIONES
    // =====================================

    /**
     * Reacciona a un tema
     */
    async reactToTopic(userId, topicId, reactionType) {
        // Verificar si ya tiene reacción
        const existing = await executeQuery(
            `SELECT id, reaction_type FROM forum_reactions WHERE user_id = $1 AND topic_id = $2`,
            [userId, topicId]
        );

        if (existing.length > 0) {
            if (existing[0].reaction_type === reactionType) {
                // Quitar reacción
                await executeQuery(
                    `DELETE FROM forum_reactions WHERE id = $1`,
                    [existing[0].id]
                );
                await this.updateLikeCount('topic', topicId, -1);
                return { action: 'removed' };
            } else {
                // Cambiar reacción
                await executeQuery(
                    `UPDATE forum_reactions SET reaction_type = $1 WHERE id = $2`,
                    [reactionType, existing[0].id]
                );
                return { action: 'changed', type: reactionType };
            }
        }

        // Nueva reacción
        await executeQuery(
            `INSERT INTO forum_reactions (user_id, topic_id, reaction_type) VALUES ($1, $2, $3)`,
            [userId, topicId, reactionType]
        );

        if (reactionType === 'like') {
            await this.updateLikeCount('topic', topicId, 1);

            // Otorgar reputación al autor
            const topic = await executeQuery(`SELECT author_id FROM forum_topics WHERE id = $1`, [topicId]);
            if (topic.length > 0 && topic[0].author_id !== userId) {
                await this.grantReputation(topic[0].author_id, 'receive_like');
            }
        }

        return { action: 'added', type: reactionType };
    }

    /**
     * Reacciona a un post
     */
    async reactToPost(userId, postId, reactionType) {
        const existing = await executeQuery(
            `SELECT id, reaction_type FROM forum_reactions WHERE user_id = $1 AND post_id = $2`,
            [userId, postId]
        );

        if (existing.length > 0) {
            if (existing[0].reaction_type === reactionType) {
                await executeQuery(`DELETE FROM forum_reactions WHERE id = $1`, [existing[0].id]);
                await this.updateLikeCount('post', postId, -1);
                return { action: 'removed' };
            } else {
                await executeQuery(
                    `UPDATE forum_reactions SET reaction_type = $1 WHERE id = $2`,
                    [reactionType, existing[0].id]
                );
                return { action: 'changed', type: reactionType };
            }
        }

        await executeQuery(
            `INSERT INTO forum_reactions (user_id, post_id, reaction_type) VALUES ($1, $2, $3)`,
            [userId, postId, reactionType]
        );

        if (reactionType === 'like') {
            await this.updateLikeCount('post', postId, 1);

            const post = await executeQuery(`SELECT author_id FROM forum_posts WHERE id = $1`, [postId]);
            if (post.length > 0 && post[0].author_id !== userId) {
                await this.grantReputation(post[0].author_id, 'receive_like');
            }
        }

        return { action: 'added', type: reactionType };
    }

    /**
     * Actualiza contador de likes
     */
    async updateLikeCount(type, id, delta) {
        const table = type === 'topic' ? 'forum_topics' : 'forum_posts';
        await executeQuery(
            `UPDATE ${table} SET like_count = GREATEST(0, like_count + $1) WHERE id = $2`,
            [delta, id]
        );
    }

    // =====================================
    // SUSCRIPCIONES
    // =====================================

    /**
     * Suscribirse a un tema
     */
    async subscribeTopic(userId, topicId) {
        const query = `
            INSERT INTO forum_subscriptions (user_id, topic_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, topic_id) DO UPDATE SET is_muted = false
            RETURNING *
        `;

        const results = await executeQuery(query, [userId, topicId]);
        return results[0];
    }

    /**
     * Desuscribirse de un tema
     */
    async unsubscribeTopic(userId, topicId) {
        await executeQuery(
            `DELETE FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2`,
            [userId, topicId]
        );
        return true;
    }

    /**
     * Obtener suscripciones del usuario
     */
    async getUserSubscriptions(userId, limit = 50) {
        const query = `
            SELECT
                s.*,
                t.title,
                t.slug,
                t.reply_count,
                t.last_reply_at
            FROM forum_subscriptions s
            JOIN forum_topics t ON s.topic_id = t.id
            WHERE s.user_id = $1 AND s.is_muted = false
            ORDER BY t.last_reply_at DESC NULLS LAST
            LIMIT $2
        `;

        return executeQuery(query, [userId, limit]);
    }

    // =====================================
    // MENCIONES
    // =====================================

    /**
     * Procesa menciones en contenido
     */
    async processMentions(postId, content) {
        // Buscar @menciones
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }

        if (mentions.length === 0) return;

        for (const username of mentions) {
            // Buscar usuario
            const userResult = await executeQuery(
                `SELECT id FROM usuarios WHERE username = $1 OR email LIKE $2 LIMIT 1`,
                [username, `${username}@%`]
            );

            if (userResult.length > 0) {
                await executeQuery(
                    `INSERT INTO forum_mentions (post_id, mentioned_user_id)
                     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [postId, userResult[0].id]
                );
            }
        }
    }

    /**
     * Obtiene menciones no leídas
     */
    async getUnreadMentions(userId) {
        const query = `
            SELECT
                m.*,
                p.content,
                p.created_at as post_created_at,
                t.title as topic_title,
                t.slug as topic_slug,
                u.nombre as author_name
            FROM forum_mentions m
            JOIN forum_posts p ON m.post_id = p.id
            JOIN forum_topics t ON p.topic_id = t.id
            JOIN usuarios u ON p.author_id = u.id
            WHERE m.mentioned_user_id = $1 AND m.is_read = false
            ORDER BY m.created_at DESC
        `;

        return executeQuery(query, [userId]);
    }

    /**
     * Marca menciones como leídas
     */
    async markMentionsAsRead(userId, mentionIds = null) {
        if (mentionIds && mentionIds.length > 0) {
            await executeQuery(
                `UPDATE forum_mentions SET is_read = true, read_at = NOW()
                 WHERE mentioned_user_id = $1 AND id = ANY($2)`,
                [userId, mentionIds]
            );
        } else {
            await executeQuery(
                `UPDATE forum_mentions SET is_read = true, read_at = NOW()
                 WHERE mentioned_user_id = $1 AND is_read = false`,
                [userId]
            );
        }
        return true;
    }

    // =====================================
    // REPORTES
    // =====================================

    /**
     * Reportar contenido
     */
    async reportContent(userId, reportData) {
        const { topicId, postId, reason, description } = reportData;

        const query = `
            INSERT INTO forum_reports (reporter_id, topic_id, post_id, reason, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const results = await executeQuery(query, [userId, topicId, postId, reason, description]);
        return results[0];
    }

    /**
     * Obtiene reportes pendientes (admin)
     */
    async getPendingReports(limit = 50) {
        const query = `
            SELECT
                r.*,
                u.nombre as reporter_name,
                t.title as topic_title,
                p.content as post_content
            FROM forum_reports r
            JOIN usuarios u ON r.reporter_id = u.id
            LEFT JOIN forum_topics t ON r.topic_id = t.id
            LEFT JOIN forum_posts p ON r.post_id = p.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
            LIMIT $1
        `;

        return executeQuery(query, [limit]);
    }

    // =====================================
    // ENCUESTAS
    // =====================================

    /**
     * Crea encuesta en un tema
     */
    async createPoll(topicId, pollData) {
        const { question, options, allowsMultiple, endsAt } = pollData;

        const formattedOptions = options.map((text, index) => ({
            id: index + 1,
            text,
            votes: 0
        }));

        const query = `
            INSERT INTO forum_polls (topic_id, question, options, allows_multiple, ends_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const results = await executeQuery(query, [
            topicId, question, JSON.stringify(formattedOptions), allowsMultiple, endsAt
        ]);

        // Marcar tema como tipo poll
        await executeQuery(
            `UPDATE forum_topics SET topic_type = 'poll' WHERE id = $1`,
            [topicId]
        );

        return results[0];
    }

    /**
     * Votar en encuesta
     */
    async votePoll(userId, pollId, optionIds) {
        // Verificar si ya votó
        const existing = await executeQuery(
            `SELECT id FROM forum_poll_votes WHERE poll_id = $1 AND user_id = $2`,
            [pollId, userId]
        );

        if (existing.length > 0) {
            throw new Error('Ya has votado en esta encuesta');
        }

        // Registrar voto
        await executeQuery(
            `INSERT INTO forum_poll_votes (poll_id, user_id, option_ids) VALUES ($1, $2, $3)`,
            [pollId, userId, optionIds]
        );

        // Actualizar contadores
        const poll = await executeQuery(`SELECT options FROM forum_polls WHERE id = $1`, [pollId]);
        if (poll.length > 0) {
            const options = poll[0].options;
            for (const optId of optionIds) {
                const opt = options.find(o => o.id === optId);
                if (opt) opt.votes++;
            }

            await executeQuery(
                `UPDATE forum_polls SET options = $1, total_votes = total_votes + $2, voter_count = voter_count + 1 WHERE id = $3`,
                [JSON.stringify(options), optionIds.length, pollId]
            );
        }

        return true;
    }

    // =====================================
    // ESTADÍSTICAS Y REPUTACIÓN
    // =====================================

    /**
     * Actualiza estadísticas del usuario
     */
    async updateUserStats(userId, field, increment = 1) {
        // Asegurar que existe el registro
        await executeQuery(
            `INSERT INTO forum_user_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        const query = `
            UPDATE forum_user_stats
            SET ${field} = ${field} + $1, last_activity_at = NOW(), updated_at = NOW()
            WHERE user_id = $2
        `;

        await executeQuery(query, [increment, userId]);
    }

    /**
     * Otorga reputación
     */
    async grantReputation(userId, action) {
        const points = this.reputationPoints[action] || 0;
        if (points === 0) return;

        await this.updateUserStats(userId, 'reputation_score', points);

        // Actualizar nivel de reputación
        const stats = await this.getUserStats(userId);
        if (stats) {
            const level = this.getReputationLevel(stats.reputation_score);
            if (level !== stats.reputation_level) {
                await executeQuery(
                    `UPDATE forum_user_stats SET reputation_level = $1 WHERE user_id = $2`,
                    [level, userId]
                );
            }
        }
    }

    /**
     * Obtiene nivel de reputación
     */
    getReputationLevel(score) {
        for (const level of this.reputationLevels) {
            if (score >= level.min && score <= level.max) {
                return level.name;
            }
        }
        return 'Novato';
    }

    /**
     * Obtiene estadísticas del usuario
     */
    async getUserStats(userId) {
        const query = `SELECT * FROM forum_user_stats WHERE user_id = $1`;
        const results = await executeQuery(query, [userId]);
        return results[0] || null;
    }

    /**
     * Obtiene leaderboard de reputación
     */
    async getReputationLeaderboard(limit = 10) {
        const query = `
            SELECT
                s.*,
                u.nombre,
                u.apellido_paterno
            FROM forum_user_stats s
            JOIN usuarios u ON s.user_id = u.id
            ORDER BY s.reputation_score DESC
            LIMIT $1
        `;

        return executeQuery(query, [limit]);
    }

    // =====================================
    // BÚSQUEDA
    // =====================================

    /**
     * Búsqueda de temas
     */
    async searchTopics(searchTerm, options = {}) {
        const { categoryId, limit = 20, offset = 0 } = options;

        let query = `
            SELECT
                t.*,
                c.name as category_name,
                u.nombre as author_name,
                ts_rank(t.search_vector, plainto_tsquery('spanish', $1)) as rank
            FROM forum_topics t
            JOIN forum_categories c ON t.category_id = c.id
            JOIN usuarios u ON t.author_id = u.id
            WHERE t.search_vector @@ plainto_tsquery('spanish', $1)
            AND t.is_approved = true
        `;

        const params = [searchTerm];
        let paramIndex = 2;

        if (categoryId) {
            query += ` AND t.category_id = $${paramIndex++}`;
            params.push(categoryId);
        }

        query += ` ORDER BY rank DESC, t.created_at DESC`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Obtiene temas trending
     */
    async getTrendingTopics(limit = 10) {
        const query = `
            SELECT
                t.*,
                c.name as category_name,
                u.nombre as author_name
            FROM forum_topics t
            JOIN forum_categories c ON t.category_id = c.id
            JOIN usuarios u ON t.author_id = u.id
            WHERE t.is_approved = true
            AND t.created_at > NOW() - INTERVAL '7 days'
            ORDER BY (t.reply_count * 2 + t.view_count + t.like_count * 3) DESC
            LIMIT $1
        `;

        return executeQuery(query, [limit]);
    }
}

module.exports = new ForumsService();

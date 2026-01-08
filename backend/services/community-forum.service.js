const { executeQuery } = require('../config/database');

class CommunityForumService {

    // Obtener lista de foros
    async getForums() {
        return await executeQuery('SELECT * FROM forums WHERE is_active = TRUE ORDER BY display_order ASC');
    }

    // Obtener hilos de un foro
    async getThreads(forumId, limit = 20, offset = 0) {
        const query = `
            SELECT t.*, u.nombre as author_name, u.avatar_url,
            (SELECT COUNT(*) FROM forum_replies r WHERE r.thread_id = t.id) as reply_count,
            (SELECT COALESCE(SUM(v.vote_value), 0) FROM forum_votes v WHERE v.reference_type = 'thread' AND v.reference_id = t.id) as score
            FROM forum_threads t
            JOIN usuarios u ON t.author_id = u.id
            WHERE t.forum_id = $1
            ORDER BY t.is_pinned DESC, t.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        return await executeQuery(query, [forumId, limit, offset]);
    }

    // Crear Hilo
    async createThread(userId, threadData) {
        const query = `
            INSERT INTO forum_threads (forum_id, author_id, title, content)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title
        `;
        const res = await executeQuery(query, [threadData.forumId, userId, threadData.title, threadData.content]);
        return res[0];
    }

    // Ver Hilo y sus respuestas
    async getThreadDetails(threadId) {
        // Increment View Count
        await executeQuery('UPDATE forum_threads SET view_count = view_count + 1 WHERE id = $1', [threadId]);

        const threads = await executeQuery(`
            SELECT t.*, u.nombre as author_name, f.title as forum_title 
            FROM forum_threads t 
            JOIN usuarios u ON t.author_id = u.id
            JOIN forums f ON t.forum_id = f.id
            WHERE t.id = $1
        `, [threadId]);

        if (threads.length === 0) throw new Error('Hilo no encontrado');

        const replies = await executeQuery(`
            SELECT r.*, u.nombre as author_name, u.avatar_url,
            (SELECT COALESCE(SUM(v.vote_value), 0) FROM forum_votes v WHERE v.reference_type = 'reply' AND v.reference_id = r.id) as score
            FROM forum_replies r
            JOIN usuarios u ON r.author_id = u.id
            WHERE r.thread_id = $1
            ORDER BY r.is_solution DESC, r.created_at ASC
        `, [threadId]);

        return { thread: threads[0], replies };
    }

    // Responder
    async createReply(userId, replyData) {
        const query = `
            INSERT INTO forum_replies (thread_id, author_id, content)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        return await executeQuery(query, [replyData.threadId, userId, replyData.content]);
    }

    // Votar
    async vote(userId, type, id, value) {
        // Upsert vote
        const query = `
            INSERT INTO forum_votes (user_id, reference_type, reference_id, vote_value)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, reference_type, reference_id) 
            DO UPDATE SET vote_value = $4, created_at = NOW()
        `;
        await executeQuery(query, [userId, type, id, value]);

        // Return new score
        const scoreQuery = `SELECT COALESCE(SUM(vote_value), 0) as score FROM forum_votes WHERE reference_type = $1 AND reference_id = $2`;
        const scoreRes = await executeQuery(scoreQuery, [type, id]);
        return scoreRes[0].score;
    }
}

module.exports = new CommunityForumService();

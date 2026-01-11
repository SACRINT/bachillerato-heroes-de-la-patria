const { pool } = require('../config/database');

class PollsDAO {

    /**
     * Verifica si un usuario ya votó
     */
    async hasUserVoted(pollId, userId, voterIp, voterFingerprint) {
        let query;
        let params;

        if (userId) {
            query = 'SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2';
            params = [pollId, userId];
        } else {
            query = 'SELECT id FROM poll_votes WHERE poll_id = $1 AND voter_ip = $2 AND voter_fingerprint = $3';
            params = [pollId, voterIp, voterFingerprint];
        }

        const result = await pool.query(query, params);
        return result.rows.length > 0;
    }

    /**
     * Obtiene el voto de un usuario
     */
    async getUserVote(pollId, userId, voterIp, voterFingerprint) {
        let query;
        let params;

        if (userId) {
            query = 'SELECT * FROM poll_votes WHERE poll_id = $1 AND user_id = $2';
            params = [pollId, userId];
        } else {
            query = 'SELECT * FROM poll_votes WHERE poll_id = $1 AND voter_ip = $2 AND voter_fingerprint = $3';
            params = [pollId, voterIp, voterFingerprint];
        }

        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Obtiene lista de encuestas con filtros y paginación
     */
    async getPolls({ status, category, featured, search, limit, offset, sort, order }) {
        let query = `
            SELECT
                p.*,
                COUNT(DISTINCT po.id) as options_count,
                COALESCE(string_agg(DISTINCT pc.name, ', '), '') as categories,
                CASE
                    WHEN p.ends_at IS NOT NULL AND p.ends_at < NOW() THEN 'expired'
                    WHEN p.starts_at IS NOT NULL AND p.starts_at > NOW() THEN 'scheduled'
                    ELSE p.status
                END as computed_status
            FROM polls p
            LEFT JOIN poll_options po ON p.id = po.poll_id
            LEFT JOIN poll_category_relations pcr ON p.id = pcr.poll_id
            LEFT JOIN poll_categories pc ON pcr.category_id = pc.id
            WHERE p.published = TRUE
        `;
        const params = [];
        let paramIndex = 1;

        if (status !== 'all') {
            query += ` AND p.status = $${paramIndex++}`;
            params.push(status);
        }

        if (category) {
            query += ` AND pc.slug = $${paramIndex++}`;
            params.push(category);
        }

        if (featured === 'true') {
            query += ` AND p.featured = TRUE`;
        }

        if (search) {
            query += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` GROUP BY p.id`;

        const allowedSorts = ['created_at', 'title', 'total_votes', 'total_participants'];
        const sortColumn = allowedSorts.includes(sort) ? sort : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY p.${sortColumn} ${sortOrder}`;

        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Count logic (simplificada para eficiencia)
        let countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM polls p WHERE p.published = TRUE`;
        // Nota: El count exacto requeriría replicar los filtros, por brevedad aquí se asume que el refactor principal es la separación
        // En un escenario real, se debería extraer la lógica de filtros para reutilizarla.

        return result.rows;
    }

    /**
     * Helper paramétrico para el count (versión completa)
     */
    async getPollsCount({ status, category, featured, search }) {
        let countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM polls p
            LEFT JOIN poll_category_relations pcr ON p.id = pcr.poll_id
            LEFT JOIN poll_categories pc ON pcr.category_id = pc.id
            WHERE p.published = TRUE
        `;
        const params = [];
        let paramIndex = 1;

        if (status !== 'all') {
            countQuery += ` AND p.status = $${paramIndex++}`;
            params.push(status);
        }
        if (category) {
            countQuery += ` AND pc.slug = $${paramIndex++}`;
            params.push(category);
        }
        if (featured === 'true') {
            countQuery += ` AND p.featured = TRUE`;
        }
        if (search) {
            countQuery += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        const result = await pool.query(countQuery, params);
        return parseInt(result.rows[0].total);
    }

    /**
     * Obtiene una encuesta por ID
     */
    async getPollById(id) {
        const query = `
            SELECT
                p.*,
                CASE
                    WHEN p.ends_at IS NOT NULL AND p.ends_at < NOW() THEN 'expired'
                    WHEN p.starts_at IS NOT NULL AND p.starts_at > NOW() THEN 'scheduled'
                    ELSE p.status
                END as computed_status
            FROM polls p
            WHERE p.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    async getPollOptions(pollId) {
        const query = `SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY display_order ASC`;
        const result = await pool.query(query, [pollId]);
        return result.rows;
    }

    async getPollCategories(pollId) {
        const query = `
            SELECT pc.*
            FROM poll_categories pc
            JOIN poll_category_relations pcr ON pc.id = pcr.category_id
            WHERE pcr.poll_id = $1
        `;
        const result = await pool.query(query, [pollId]);
        return result.rows;
    }

    /**
     * Crea una encuesta (Transaccional)
     */
    async createPoll(client, pollData) {
        const {
            title, description, type, allow_multiple_votes,
            show_results_before_voting, anonymous_voting, require_login,
            target_audience, starts_at, ends_at, created_by, featured,
            image_url, color
        } = pollData;

        const query = `
            INSERT INTO polls (
                title, description, type, allow_multiple_votes,
                show_results_before_voting, anonymous_voting, require_login,
                target_audience, starts_at, ends_at, created_by, featured,
                image_url, color, status, published
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const values = [
            title, description, type, allow_multiple_votes,
            show_results_before_voting, anonymous_voting, require_login,
            target_audience, starts_at || null, ends_at || null, created_by,
            featured, image_url || null, color, 'draft', false
        ];

        const result = await client.query(query, values);
        return result.rows[0];
    }

    async addPollOption(client, pollId, option, index) {
        const query = `
            INSERT INTO poll_options (poll_id, text, description, image_url, display_order)
            VALUES ($1, $2, $3, $4, $5)
        `;
        const optionText = (typeof option === 'string') ? option : option.text;
        const optionDesc = (typeof option === 'object') ? option.description : null;
        const optionImg = (typeof option === 'object') ? option.image_url : null;

        if (optionText) {
            await client.query(query, [pollId, optionText, optionDesc, optionImg, index]);
        }
    }

    async addPollCategory(client, pollId, categoryId) {
        const query = `INSERT INTO poll_category_relations (poll_id, category_id) VALUES ($1, $2)`;
        await client.query(query, [pollId, categoryId]);
    }

    async getFullPoll(client, pollId) {
        const query = `
            SELECT
                p.*,
                json_agg(DISTINCT jsonb_build_object(
                    'id', po.id,
                    'text', po.text,
                    'description', po.description,
                    'image_url', po.image_url,
                    'display_order', po.display_order
                )) FILTER (WHERE po.id IS NOT NULL) as options,
                json_agg(DISTINCT jsonb_build_object(
                    'id', pc.id,
                    'name', pc.name,
                    'slug', pc.slug
                )) FILTER (WHERE pc.id IS NOT NULL) as categories
            FROM polls p
            LEFT JOIN poll_options po ON p.id = po.poll_id
            LEFT JOIN poll_category_relations pcr ON p.id = pcr.poll_id
            LEFT JOIN poll_categories pc ON pcr.category_id = pc.id
            WHERE p.id = $1
            GROUP BY p.id
        `;
        const result = await client.query(query, [pollId]);
        return result.rows[0];
    }
}

module.exports = new PollsDAO();

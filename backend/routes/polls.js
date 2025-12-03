/**
 * API REST - SISTEMA DE ENCUESTAS Y VOTACIONES
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 *
 * Endpoints:
 * - GET    /api/polls              - Listar encuestas (con filtros)
 * - GET    /api/polls/:id          - Obtener encuesta específica
 * - POST   /api/polls              - Crear nueva encuesta
 * - PUT    /api/polls/:id          - Actualizar encuesta
 * - DELETE /api/polls/:id          - Eliminar encuesta
 * - POST   /api/polls/:id/vote     - Votar en encuesta
 * - GET    /api/polls/:id/results  - Obtener resultados
 * - GET    /api/polls/:id/export   - Exportar resultados (CSV/JSON)
 * - POST   /api/polls/:id/close    - Cerrar encuesta
 * - GET    /api/polls/categories   - Listar categorías
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const { pool } = require('../config/database');

const router = express.Router();

// Helper para ejecutar queries
const db = {
    query: async (text, params) => {
        const client = await pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    },
    pool: pool
};

// ============================================
// UTILIDADES Y HELPERS
// ============================================

/**
 * Obtiene el fingerprint del votante para votaciones anónimas
 */
function getVoterFingerprint(req) {
    const userAgent = req.get('user-agent') || '';
    const acceptLanguage = req.get('accept-language') || '';
    const acceptEncoding = req.get('accept-encoding') || '';

    return Buffer.from(`${userAgent}-${acceptLanguage}-${acceptEncoding}`).toString('base64');
}

/**
 * Obtiene el tipo de dispositivo
 */
function getDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
}

/**
 * Valida si una encuesta está activa
 */
function isPollActive(poll) {
    const now = new Date();

    if (poll.status !== 'active') return false;
    if (!poll.published) return false;
    if (poll.starts_at && new Date(poll.starts_at) > now) return false;
    if (poll.ends_at && new Date(poll.ends_at) < now) return false;

    return true;
}

/**
 * Verifica si el usuario ya votó
 */
async function hasUserVoted(pollId, userId, voterIp, voterFingerprint) {
    let query;
    let params;

    if (userId) {
        query = 'SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2';
        params = [pollId, userId];
    } else {
        query = 'SELECT id FROM poll_votes WHERE poll_id = $1 AND voter_ip = $2 AND voter_fingerprint = $3';
        params = [pollId, voterIp, voterFingerprint];
    }

    const result = await db.query(query, params);
    return result.rows.length > 0;
}

// ============================================
// LISTAR ENCUESTAS
// ============================================

router.get('/', async (req, res) => {
    try {
        const {
            status = 'active',
            category,
            featured,
            search,
            limit = 20,
            offset = 0,
            sort = 'created_at',
            order = 'DESC'
        } = req.query;

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

        // Filtro por estado
        if (status !== 'all') {
            query += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Filtro por categoría
        if (category) {
            query += ` AND pc.slug = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        // Filtro por destacado
        if (featured === 'true') {
            query += ` AND p.featured = TRUE`;
        }

        // Búsqueda por texto
        if (search) {
            query += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` GROUP BY p.id`;

        // Ordenamiento
        const allowedSorts = ['created_at', 'title', 'total_votes', 'total_participants'];
        const sortColumn = allowedSorts.includes(sort) ? sort : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY p.${sortColumn} ${sortOrder}`;

        // Paginación
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);

        // Obtener total de resultados (reconstruir query con mismos filtros)
        let countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM polls p
            LEFT JOIN poll_category_relations pcr ON p.id = pcr.poll_id
            LEFT JOIN poll_categories pc ON pcr.category_id = pc.id
            WHERE p.published = TRUE
        `;

        const countParams = [];
        let countParamIndex = 1;

        // Aplicar los mismos filtros que el query principal
        if (status !== 'all') {
            countQuery += ` AND p.status = $${countParamIndex}`;
            countParams.push(status);
            countParamIndex++;
        }

        if (category) {
            countQuery += ` AND pc.slug = $${countParamIndex}`;
            countParams.push(category);
            countParamIndex++;
        }

        if (featured === 'true') {
            countQuery += ` AND p.featured = TRUE`;
        }

        if (search) {
            countQuery += ` AND (p.title ILIKE $${countParamIndex} OR p.description ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + result.rows.length < total
            }
        });

    } catch (error) {
        debugLog.error('POLLS', 'Error al listar encuestas (DB missing? Returning empty):', sanitizeError(error, 'polls'));
        // Graceful degradation: return empty list instead of 500
        res.json({
            success: true,
            data: [],
            pagination: {
                total: 0,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: false
            }
        });
    }
});

// ============================================
// OBTENER ENCUESTA ESPECÍFICA
// ============================================

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session?.userId;
        const voterIp = req.ip;
        const voterFingerprint = getVoterFingerprint(req);

        // Obtener encuesta
        const pollQuery = `
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

        const pollResult = await db.query(pollQuery, [id]);

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Encuesta no encontrada'
            });
        }

        const poll = pollResult.rows[0];

        // Obtener opciones
        const optionsQuery = `
            SELECT *
            FROM poll_options
            WHERE poll_id = $1
            ORDER BY display_order ASC
        `;

        const optionsResult = await db.query(optionsQuery, [id]);

        // Obtener categorías
        const categoriesQuery = `
            SELECT pc.*
            FROM poll_categories pc
            JOIN poll_category_relations pcr ON pc.id = pcr.category_id
            WHERE pcr.poll_id = $1
        `;

        const categoriesResult = await db.query(categoriesQuery, [id]);

        // Verificar si el usuario ya votó
        const hasVoted = await hasUserVoted(id, userId, voterIp, voterFingerprint);

        // Obtener el voto del usuario si existe
        let userVote = null;
        if (hasVoted) {
            const voteQuery = userId
                ? 'SELECT * FROM poll_votes WHERE poll_id = $1 AND user_id = $2'
                : 'SELECT * FROM poll_votes WHERE poll_id = $1 AND voter_ip = $2 AND voter_fingerprint = $3';

            const voteParams = userId ? [id, userId] : [id, voterIp, voterFingerprint];
            const voteResult = await db.query(voteQuery, voteParams);
            userVote = voteResult.rows[0] || null;
        }

        res.json({
            success: true,
            data: {
                ...poll,
                options: optionsResult.rows,
                categories: categoriesResult.rows,
                user_has_voted: hasVoted,
                user_vote: userVote
            }
        });

    } catch (error) {
        debugLog.error('POLLS', 'Error al obtener encuesta:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la encuesta',
            details: error.message
        });
    }
});

// ============================================
// CREAR NUEVA ENCUESTA
// ============================================

router.post('/', async (req, res) => {
    try {
        // TODO: Agregar middleware de autenticación
        const userId = req.session?.userId || 1; // Temporal

        const {
            title,
            description,
            type = 'single_choice',
            options = [],
            categories = [],
            starts_at,
            ends_at,
            allow_multiple_votes = false,
            show_results_before_voting = false,
            anonymous_voting = true,
            require_login = false,
            target_audience = 'public',
            featured = false,
            image_url,
            color = '#3498db'
        } = req.body;

        // Validaciones
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El título es requerido'
            });
        }

        if (!options || options.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar al menos 2 opciones'
            });
        }

        // Iniciar transacción
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Insertar encuesta
            const pollQuery = `
                INSERT INTO polls (
                    title, description, type, allow_multiple_votes,
                    show_results_before_voting, anonymous_voting, require_login,
                    target_audience, starts_at, ends_at, created_by, featured,
                    image_url, color, status, published
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `;

            const pollValues = [
                title,
                description,
                type,
                allow_multiple_votes,
                show_results_before_voting,
                anonymous_voting,
                require_login,
                target_audience,
                starts_at || null,
                ends_at || null,
                userId,
                featured,
                image_url || null,
                color,
                'draft',
                false
            ];

            const pollResult = await client.query(pollQuery, pollValues);
            const poll = pollResult.rows[0];

            // Insertar opciones
            const optionQuery = `
                INSERT INTO poll_options (poll_id, text, description, image_url, display_order)
                VALUES ($1, $2, $3, $4, $5)
            `;
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                // La opción puede ser un string o un objeto {text: '...'}
                const optionText = (typeof option === 'string') ? option : option.text;
                const optionDesc = (typeof option === 'object') ? option.description : null;
                const optionImg = (typeof option === 'object') ? option.image_url : null;

                if (optionText) { // Solo insertar si hay texto
                    await client.query(optionQuery, [
                        poll.id,
                        optionText,
                        optionDesc,
                        optionImg,
                        i
                    ]);
                }
            }

            // Asociar categorías
            if (categories && categories.length > 0) {
                for (const categoryId of categories) {
                    const categoryQuery = `
                        INSERT INTO poll_category_relations (poll_id, category_id)
                        VALUES ($1, $2)
                    `;
                    await client.query(categoryQuery, [poll.id, categoryId]);
                }
            }

            // Obtener encuesta completa ANTES de hacer commit
            const fullPollQuery = `
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

            const fullPollResult = await client.query(fullPollQuery, [poll.id]);

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Encuesta creada exitosamente',
                data: fullPollResult.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        debugLog.error('POLLS', 'Error al crear encuesta:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al crear la encuesta',
            details: error.message
        });
    }
});

// ============================================
// ACTUALIZAR ENCUESTA
// ============================================

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            status,
            published,
            featured,
            starts_at,
            ends_at,
            image_url,
            color
        } = req.body;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(title);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(description);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(status);
        }
        if (published !== undefined) {
            updates.push(`published = $${paramIndex++}`);
            values.push(published);
        }
        if (featured !== undefined) {
            updates.push(`featured = $${paramIndex++}`);
            values.push(featured);
        }
        if (starts_at !== undefined) {
            updates.push(`starts_at = $${paramIndex++}`);
            values.push(starts_at || null);
        }
        if (ends_at !== undefined) {
            updates.push(`ends_at = $${paramIndex++}`);
            values.push(ends_at || null);
        }
        if (image_url !== undefined) {
            updates.push(`image_url = $${paramIndex++}`);
            values.push(image_url);
        }
        if (color !== undefined) {
            updates.push(`color = $${paramIndex++}`);
            values.push(color);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron campos para actualizar'
            });
        }

        values.push(id);
        const query = `
            UPDATE polls
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Encuesta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Encuesta actualizada exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        debugLog.error('POLLS', 'Error al actualizar encuesta:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la encuesta',
            details: error.message
        });
    }
});

// ============================================
// ELIMINAR ENCUESTA
// ============================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la encuesta no tenga votos
        const votesQuery = 'SELECT COUNT(*) as count FROM poll_votes WHERE poll_id = $1';
        const votesResult = await db.query(votesQuery, [id]);
        const votesCount = parseInt(votesResult.rows[0].count);

        if (votesCount > 0) {
            return res.status(400).json({
                success: false,
                error: 'No se puede eliminar una encuesta con votos. Considere archivarla en su lugar.',
                votes_count: votesCount
            });
        }

        const query = 'DELETE FROM polls WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Encuesta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Encuesta eliminada exitosamente'
        });

    } catch (error) {
        debugLog.error('POLLS', 'Error al eliminar encuesta:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la encuesta',
            details: error.message
        });
    }
});

// ============================================
// VOTAR EN ENCUESTA
// ============================================

router.post('/:id/vote', async (req, res) => {
    try {
        const { id: pollId } = req.params;
        const { option_id, rating_value, open_text } = req.body;

        const userId = req.session?.userId || null;
        const voterIp = req.ip;
        const voterFingerprint = getVoterFingerprint(req);
        const userAgent = req.get('user-agent') || '';
        const deviceType = getDeviceType(userAgent);

        // Obtener encuesta
        const pollQuery = 'SELECT * FROM polls WHERE id = $1';
        const pollResult = await db.query(pollQuery, [pollId]);

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Encuesta no encontrada'
            });
        }

        const poll = pollResult.rows[0];

        // Validar que la encuesta está activa
        if (!isPollActive(poll)) {
            return res.status(400).json({
                success: false,
                error: 'Esta encuesta no está activa o ya ha finalizado'
            });
        }

        // Verificar si requiere login
        if (poll.require_login && !userId) {
            return res.status(401).json({
                success: false,
                error: 'Debe iniciar sesión para votar en esta encuesta'
            });
        }

        // Verificar si ya votó
        const hasVoted = await hasUserVoted(pollId, userId, voterIp, voterFingerprint);
        if (hasVoted && !poll.allow_multiple_votes) {
            return res.status(400).json({
                success: false,
                error: 'Ya ha votado en esta encuesta'
            });
        }

        // Validar datos según tipo de encuesta
        if ((poll.type === 'single_choice' || poll.type === 'multiple_choice') && !option_id) {
            return res.status(400).json({
                success: false,
                error: 'Debe seleccionar una opción'
            });
        }

        if (poll.type === 'rating' && !rating_value) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar una calificación'
            });
        }

        if (poll.type === 'open_ended' && !open_text) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar una respuesta'
            });
        }

        // Insertar voto
        const voteQuery = `
            INSERT INTO poll_votes (
                poll_id, option_id, user_id, voter_ip, voter_fingerprint,
                rating_value, open_text, user_agent, device_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const voteValues = [
            pollId,
            option_id || null,
            userId,
            voterIp,
            voterFingerprint,
            rating_value || null,
            open_text || null,
            userAgent,
            deviceType
        ];

        const voteResult = await db.query(voteQuery, voteValues);

        // Calcular porcentajes
        await db.query('SELECT calculate_poll_percentages($1)', [pollId]);

        res.status(201).json({
            success: true,
            message: 'Voto registrado exitosamente',
            data: voteResult.rows[0]
        });

    } catch (error) {
        // Detectar violación de constraint de voto único
        if (error.code === '23505') { // unique_violation
            return res.status(400).json({
                success: false,
                error: 'Ya ha votado en esta encuesta'
            });
        }

        debugLog.error('POLLS', 'Error al registrar voto:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al registrar el voto',
            details: error.message
        });
    }
});

// ============================================
// OBTENER RESULTADOS
// ============================================

router.get('/:id/results', async (req, res) => {
    try {
        const { id: pollId } = req.params;

        // Obtener encuesta
        const pollQuery = 'SELECT * FROM polls WHERE id = $1';
        const pollResult = await db.query(pollQuery, [pollId]);

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Encuesta no encontrada'
            });
        }

        const poll = pollResult.rows[0];

        // Obtener resultados detallados
        const resultsQuery = `
            SELECT
                po.id,
                po.text,
                po.description,
                po.votes_count,
                po.percentage,
                po.display_order
            FROM poll_options po
            WHERE po.poll_id = $1
            ORDER BY po.display_order ASC
        `;

        const resultsResult = await db.query(resultsQuery, [pollId]);

        // Obtener estadísticas adicionales
        const statsQuery = `
            SELECT
                COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id ELSE voter_ip || voter_fingerprint END) as unique_voters,
                COUNT(*) as total_votes,
                AVG(rating_value) FILTER (WHERE rating_value IS NOT NULL) as average_rating,
                COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_votes,
                COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_votes,
                COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet_votes
            FROM poll_votes
            WHERE poll_id = $1
        `;

        const statsResult = await db.query(statsQuery, [pollId]);

        res.json({
            success: true,
            data: {
                poll: {
                    id: poll.id,
                    title: poll.title,
                    description: poll.description,
                    type: poll.type,
                    total_votes: poll.total_votes,
                    total_participants: poll.total_participants
                },
                options: resultsResult.rows,
                statistics: statsResult.rows[0]
            }
        });

    } catch (error) {
        debugLog.error('POLLS', 'Error al obtener resultados:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener los resultados',
            details: error.message
        });
    }
});

// ============================================
// CERRAR ENCUESTA
// ============================================

router.post('/:id/close', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            UPDATE polls
            SET status = 'closed', ends_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Encuesta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Encuesta cerrada exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        debugLog.error('POLLS', 'Error al cerrar encuesta:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al cerrar la encuesta',
            details: error.message
        });
    }
});

// ============================================
// LISTAR CATEGORÍAS
// ============================================

router.get('/categories/list', async (req, res) => {
    try {
        const query = `
            SELECT *
            FROM poll_categories
            WHERE active = TRUE
            ORDER BY display_order ASC
        `;

        const result = await db.query(query);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        debugLog.error('POLLS', 'Error al obtener categorías (DB missing? Returning empty):', sanitizeError(error, 'polls'));
        // Graceful degradation
        res.json({
            success: true,
            data: []
        });
    }
});

// ============================================
// EXPORTAR RESULTADOS
// ============================================

router.get('/:id/export', async (req, res) => {
    try {
        const { id: pollId } = req.params;
        const { format = 'json' } = req.query;

        // Obtener encuesta completa con resultados
        const pollQuery = 'SELECT * FROM polls WHERE id = $1';
        const pollResult = await db.query(pollQuery, [pollId]);

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Encuesta no encontrada'
            });
        }

        const poll = pollResult.rows[0];

        // Obtener opciones con votos
        const optionsQuery = `
            SELECT
                po.*,
                json_agg(
                    json_build_object(
                        'id', pv.id,
                        'user_id', pv.user_id,
                        'voted_at', pv.voted_at,
                        'device_type', pv.device_type
                    )
                ) FILTER (WHERE pv.id IS NOT NULL) as votes
            FROM poll_options po
            LEFT JOIN poll_votes pv ON po.id = pv.option_id
            WHERE po.poll_id = $1
            GROUP BY po.id
            ORDER BY po.display_order ASC
        `;

        const optionsResult = await db.query(optionsQuery, [pollId]);

        const exportData = {
            poll,
            options: optionsResult.rows,
            exported_at: new Date().toISOString()
        };

        if (format === 'csv') {
            // Generar CSV
            let csv = 'Opción,Votos,Porcentaje\n';
            optionsResult.rows.forEach(option => {
                csv += `"${option.text}",${option.votes_count},${option.percentage}%\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="encuesta-${pollId}-resultados.csv"`);
            res.send(csv);
        } else {
            // Formato JSON
            res.json({
                success: true,
                data: exportData
            });
        }

    } catch (error) {
        debugLog.error('POLLS', 'Error al exportar resultados:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al exportar los resultados',
            details: error.message
        });
    }
});

module.exports = router;

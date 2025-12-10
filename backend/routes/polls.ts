/**
 * API REST - SISTEMA DE ENCUESTAS Y VOTACIONES - TypeScript
 * BGE Héroes de la Patria
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { sanitizeError } from '../utils/sanitized-errors';
// @ts-ignore
import { pool } from '../config/database';

const router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Poll {
    id: number;
    title: string;
    description?: string;
    type: 'single_choice' | 'multiple_choice' | 'rating' | 'open_ended';
    status: 'draft' | 'active' | 'closed' | 'archived';
    published: boolean;
    featured: boolean;
    starts_at?: Date;
    ends_at?: Date;
    created_by: number;
    allow_multiple_votes: boolean;
    show_results_before_voting: boolean;
    anonymous_voting: boolean;
    require_login: boolean;
    target_audience: 'public' | 'students' | 'parents' | 'teachers';
    image_url?: string;
    color?: string;
}

// Helper para ejecutar queries
const db = {
    query: async (text: string, params?: any[]) => {
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
function getVoterFingerprint(req: Request): string {
    const userAgent = req.get('user-agent') || '';
    const acceptLanguage = req.get('accept-language') || '';
    // @ts-ignore
    const acceptEncoding = req.get('accept-encoding') || '';

    return Buffer.from(`${userAgent}-${acceptLanguage}-${acceptEncoding}`).toString('base64');
}

/**
 * Obtiene el tipo de dispositivo
 */
function getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
}

/**
 * Valida si una encuesta está activa
 */
function isPollActive(poll: Poll): boolean {
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
async function hasUserVoted(pollId: string, userId: number | null, voterIp: string, voterFingerprint: string): Promise<boolean> {
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

router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            status = 'active',
            category,
            featured,
            search,
            limit = '20',
            offset = '0',
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

        const params: any[] = [];
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
        const sortColumn = allowedSorts.includes(sort as string) ? sort : 'created_at';
        const sortOrder = (order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY p.${sortColumn} ${sortOrder}`;

        // Paginación
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), parseInt(offset as string));

        const result = await db.query(query, params);

        // Obtener total de resultados (reconstruir query con mismos filtros)
        let countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM polls p
            LEFT JOIN poll_category_relations pcr ON p.id = pcr.poll_id
            LEFT JOIN poll_categories pc ON pcr.category_id = pc.id
            WHERE p.published = TRUE
        `;

        const countParams: any[] = [];
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
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: parseInt(offset as string) + result.rows.length < total
            }
        });

    } catch (error: any) {
        debugLog.error('POLLS', 'Error al listar encuestas:', sanitizeError(error, 'polls'));
        res.json({
            success: true,
            data: [],
            pagination: {
                total: 0,
                limit: parseInt(req.query.limit as string || '20'),
                offset: parseInt(req.query.offset as string || '0'),
                hasMore: false
            }
        });
    }
});

// ============================================
// OBTENER ENCUESTA ESPECÍFICA
// ============================================

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).session?.userId;
        const voterIp = req.ip || 'unknown';
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
            res.status(404).json({
                success: false,
                error: 'Encuesta no encontrada'
            });
            return;
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

            const voteParams: any[] = userId ? [id, userId] : [id, voterIp, voterFingerprint];
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

    } catch (error: any) {
        debugLog.error('POLLS', 'Error al obtener encuesta:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la encuesta',
            details: error.message
        });
    }
});

/**
 * POST /api/polls
 * Crear nueva encuesta
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        // TODO: Agregar middleware de autenticación
        const userId = (req as any).session?.userId || 1; // Temporal

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
            res.status(400).json({
                success: false,
                error: 'El título es requerido'
            });
            return;
        }

        if (!options || options.length < 2) {
            res.status(400).json({
                success: false,
                error: 'Debe proporcionar al menos 2 opciones'
            });
            return;
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

    } catch (error: any) {
        debugLog.error('POLLS', 'Error al crear encuesta:', sanitizeError(error, 'polls'));
        res.status(500).json({
            success: false,
            error: 'Error al crear la encuesta',
            details: error.message
        });
    }
});

// @ts-ignore
export = router;

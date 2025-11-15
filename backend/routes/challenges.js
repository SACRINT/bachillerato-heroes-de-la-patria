/**
 * 🏆 CHALLENGES ROUTES - SISTEMA DE RETOS
 * Gestión de desafíos educativos y recompensas
 */

const express = require('express');
const { Pool } = require('pg');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// ENDPOINT 1: GET /api/challenges
// Listar todos los retos disponibles
// ============================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, status = 'active' } = req.query;

        debugLog.log('CHALLENGES', `[CHALLENGES] Listando retos para usuario ${userId}`);

        let query = `
            SELECT
                c.id,
                c.title,
                c.description,
                c.challenge_type,
                c.difficulty,
                c.reward_iacoins,
                c.reward_xp,
                c.max_completions,
                c.starts_at,
                c.ends_at,
                c.is_active,
                c.icon,
                c.completion_criteria,
                uc.id as user_challenge_id,
                uc.is_completed,
                uc.progress,
                uc.completed_at,
                uc.times_completed
            FROM challenges c
            LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = $1
            WHERE 1=1
        `;
        const params = [userId];

        // Filtro por tipo
        if (type && ['daily', 'weekly', 'monthly', 'special'].includes(type)) {
            query += ` AND c.challenge_type = $${params.length + 1}`;
            params.push(type);
        }

        // Filtro por estado
        if (status === 'active') {
            query += ` AND c.is_active = true`;
            query += ` AND (c.starts_at IS NULL OR c.starts_at <= NOW())`;
            query += ` AND (c.ends_at IS NULL OR c.ends_at >= NOW())`;
        }

        query += ` ORDER BY c.challenge_type, c.difficulty, c.id`;

        const result = await pool.query(query, params);

        // Agrupar por tipo
        const challengesByType = {
            all: result.rows,
            daily: result.rows.filter(c => c.challenge_type === 'daily'),
            weekly: result.rows.filter(c => c.challenge_type === 'weekly'),
            monthly: result.rows.filter(c => c.challenge_type === 'monthly'),
            special: result.rows.filter(c => c.challenge_type === 'special')
        };

        res.json({
            challenges: type ? challengesByType[type] : challengesByType.all,
            summary: {
                total: result.rows.length,
                completed: result.rows.filter(c => c.is_completed).length,
                in_progress: result.rows.filter(c => c.user_challenge_id && !c.is_completed).length,
                available: result.rows.filter(c => !c.user_challenge_id).length
            }
        });

    } catch (error) {
        debugLog.error('CHALLENGES', '[CHALLENGES] Error al listar retos:', error.message);
        res.status(500).json({
            error: 'Error al obtener retos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINT 2: GET /api/challenges/:id
// Obtener detalles de un reto específico
// ============================================
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        debugLog.log('CHALLENGES', `[CHALLENGES] Obteniendo detalles del reto ${id} para usuario ${userId}`);

        const result = await pool.query(
            `SELECT
                c.id,
                c.title,
                c.description,
                c.challenge_type,
                c.difficulty,
                c.reward_iacoins,
                c.reward_xp,
                c.max_completions,
                c.starts_at,
                c.ends_at,
                c.is_active,
                c.icon,
                c.completion_criteria,
                c.instructions,
                c.created_at,
                uc.id as user_challenge_id,
                uc.is_completed,
                uc.progress,
                uc.completed_at,
                uc.times_completed,
                uc.started_at
            FROM challenges c
            LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = $1
            WHERE c.id = $2`,
            [userId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Reto no encontrado'
            });
        }

        // Obtener estadísticas del reto
        const statsResult = await pool.query(
            `SELECT
                COUNT(*) as total_participants,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as total_completions
            FROM user_challenges
            WHERE challenge_id = $1`,
            [id]
        );

        res.json({
            challenge: result.rows[0],
            stats: statsResult.rows[0]
        });

    } catch (error) {
        debugLog.error('CHALLENGES', '[CHALLENGES] Error al obtener detalles del reto:', error.message);
        res.status(500).json({
            error: 'Error al obtener detalles del reto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINT 3: POST /api/challenges/:id/complete
// Completar un reto y reclamar recompensas
// ============================================
router.post('/:id/complete', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { progress = {} } = req.body;

        debugLog.log('CHALLENGES', `[CHALLENGES] Usuario ${userId} completando reto ${id}`);

        await client.query('BEGIN');

        // Obtener información del reto
        const challengeResult = await client.query(
            `SELECT * FROM challenges WHERE id = $1 AND is_active = true`,
            [id]
        );

        if (challengeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Reto no encontrado o inactivo'
            });
        }

        const challenge = challengeResult.rows[0];

        // Verificar si el reto está dentro del período válido
        const now = new Date();
        if (challenge.starts_at && new Date(challenge.starts_at) > now) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'El reto aún no ha comenzado'
            });
        }

        if (challenge.ends_at && new Date(challenge.ends_at) < now) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'El reto ha expirado'
            });
        }

        // Verificar si el usuario ya completó este reto
        const userChallengeResult = await client.query(
            `SELECT * FROM user_challenges
            WHERE user_id = $1 AND challenge_id = $2`,
            [userId, id]
        );

        let userChallenge = userChallengeResult.rows[0];

        if (userChallenge) {
            // Verificar límite de completaciones
            if (userChallenge.times_completed >= challenge.max_completions) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Has alcanzado el límite de completaciones (${challenge.max_completions})`,
                    times_completed: userChallenge.times_completed
                });
            }

            // Actualizar completación existente
            await client.query(
                `UPDATE user_challenges
                SET is_completed = true,
                    progress = $1,
                    completed_at = NOW(),
                    times_completed = times_completed + 1
                WHERE id = $2`,
                [JSON.stringify(progress), userChallenge.id]
            );
        } else {
            // Crear nuevo registro de completación
            await client.query(
                `INSERT INTO user_challenges
                (user_id, challenge_id, is_completed, progress, started_at, completed_at, times_completed)
                VALUES ($1, $2, true, $3, NOW(), NOW(), 1)`,
                [userId, id, JSON.stringify(progress)]
            );
        }

        // Otorgar recompensas - IACoins
        if (challenge.reward_iacoins > 0) {
            // Actualizar wallet
            await client.query(
                `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
                VALUES ($1, $2, $2, 0, 0)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    balance = wallet.balance + $2,
                    total_earned = wallet.total_earned + $2,
                    updated_at = NOW()`,
                [userId, challenge.reward_iacoins]
            );

            // Registrar en historial
            const walletResult = await client.query(
                `SELECT balance FROM wallet WHERE user_id = $1`,
                [userId]
            );

            await client.query(
                `INSERT INTO wallet_history
                (user_id, transaction_type, amount, balance_after, description, metadata)
                VALUES ($1, 'earn', $2, $3, $4, $5)`,
                [
                    userId,
                    challenge.reward_iacoins,
                    walletResult.rows[0].balance,
                    `Completar reto: ${challenge.title}`,
                    JSON.stringify({ challenge_id: id, challenge_type: challenge.challenge_type })
                ]
            );
        }

        // TODO: Otorgar recompensas - XP (cuando se implemente sistema de niveles)

        await client.query('COMMIT');

        res.json({
            success: true,
            challenge: {
                id: challenge.id,
                title: challenge.title
            },
            rewards: {
                iacoins: challenge.reward_iacoins,
                xp: challenge.reward_xp
            },
            message: `¡Reto completado! Has ganado ${challenge.reward_iacoins} IA Coins y ${challenge.reward_xp} XP`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('CHALLENGES', '[CHALLENGES] Error al completar reto:', error.message);
        res.status(500).json({
            error: 'Error al completar el reto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINT 4: POST /api/challenges (ADMIN)
// Crear un nuevo reto (solo administradores)
// ============================================
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Verificar que sea administrador
        if (req.user.role !== 'admin' && req.user.role !== 'administrativo') {
            return res.status(403).json({
                error: 'Acceso denegado. Solo administradores pueden crear retos.'
            });
        }

        const {
            title,
            description,
            challenge_type = 'special',
            difficulty = 'medium',
            reward_iacoins = 10,
            reward_xp = 100,
            max_completions = 1,
            starts_at = null,
            ends_at = null,
            icon = '🎯',
            completion_criteria = {},
            instructions = null
        } = req.body;

        // Validaciones
        if (!title || title.length < 3) {
            return res.status(400).json({
                error: 'El título debe tener al menos 3 caracteres'
            });
        }

        if (!description || description.length < 10) {
            return res.status(400).json({
                error: 'La descripción debe tener al menos 10 caracteres'
            });
        }

        if (!['daily', 'weekly', 'monthly', 'special'].includes(challenge_type)) {
            return res.status(400).json({
                error: 'Tipo de reto no válido'
            });
        }

        if (!['easy', 'medium', 'hard', 'expert'].includes(difficulty)) {
            return res.status(400).json({
                error: 'Dificultad no válida'
            });
        }

        debugLog.log('CHALLENGES', `[CHALLENGES] Admin ${req.user.id} creando nuevo reto: ${title}`);

        const result = await pool.query(
            `INSERT INTO challenges
            (title, description, challenge_type, difficulty, reward_iacoins, reward_xp,
             max_completions, starts_at, ends_at, icon, completion_criteria, instructions, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
            RETURNING *`,
            [
                title,
                description,
                challenge_type,
                difficulty,
                reward_iacoins,
                reward_xp,
                max_completions,
                starts_at,
                ends_at,
                icon,
                JSON.stringify(completion_criteria),
                instructions
            ]
        );

        res.status(201).json({
            success: true,
            challenge: result.rows[0],
            message: 'Reto creado exitosamente'
        });

    } catch (error) {
        debugLog.error('CHALLENGES', '[CHALLENGES] Error al crear reto:', error.message);
        res.status(500).json({
            error: 'Error al crear el reto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

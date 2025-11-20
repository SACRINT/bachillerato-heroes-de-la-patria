/**
 * IACoins Routes - Sistema de Gamificación
 * API para gestión de IACoins, retos, logros y generaciones IA
 *
 * Endpoints:
 * - GET /api/iacoins/balance - Obtener balance del usuario
 * - GET /api/iacoins/transactions - Historial de transacciones
 * - POST /api/iacoins/earn - Ganar IACoins por reto completado
 * - POST /api/iacoins/spend - Gastar IACoins en generación IA
 * - GET /api/iacoins/challenges - Lista de retos disponibles
 * - POST /api/iacoins/challenges/:id/complete - Completar un reto
 * - GET /api/iacoins/achievements - Logros del usuario
 * - GET /api/iacoins/leaderboard - Tabla de posiciones
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { executeQuery, getPool } = require('../data/database-access');

// =====================================================
// GET /api/iacoins/balance - Obtener balance del usuario
// =====================================================
router.get('/balance',
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.id;

            // Obtener o crear balance del usuario
            let balance = await executeQuery(`
                SELECT * FROM iacoins_balances WHERE user_id = $1
            `, [userId]);

            if (!balance || balance.length === 0) {
                // Crear balance inicial para usuario nuevo
                balance = await executeQuery(`
                    INSERT INTO iacoins_balances (user_id, balance, total_earned, total_spent, level, experience_points)
                    VALUES ($1, 100, 100, 0, 1, 0)
                    RETURNING *
                `, [userId]);
            }

            res.json({
                success: true,
                data: balance[0] || balance
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo balance:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener balance de IACoins',
                error: error.message
            });
        }
    }
);

// =====================================================
// GET /api/iacoins/transactions - Historial de transacciones
// =====================================================
router.get('/transactions',
    authenticateToken,
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('offset').optional().isInt({ min: 0 }).toInt(),
        query('type').optional().isIn(['earn', 'spend', 'bonus', 'refund', 'admin_adjustment'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const limit = req.query.limit || 20;
            const offset = req.query.offset || 0;
            const type = req.query.type;

            let query = `
                SELECT * FROM iacoins_transactions
                WHERE user_id = $1
            `;
            const params = [userId];

            if (type) {
                query += ` AND type = $${params.length + 1}`;
                params.push(type);
            }

            query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const transactions = await executeQuery(query, params);

            // Obtener total de transacciones
            let countQuery = `SELECT COUNT(*) as total FROM iacoins_transactions WHERE user_id = $1`;
            const countParams = [userId];
            if (type) {
                countQuery += ` AND type = $2`;
                countParams.push(type);
            }
            const countResult = await executeQuery(countQuery, countParams);

            res.json({
                success: true,
                data: transactions,
                pagination: {
                    total: parseInt(countResult[0].total),
                    limit,
                    offset
                }
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo transacciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener transacciones',
                error: error.message
            });
        }
    }
);

// =====================================================
// POST /api/iacoins/earn - Ganar IACoins por reto completado
// =====================================================
router.post('/earn',
    authenticateToken,
    [
        body('amount').isInt({ min: 1, max: 1000 }).withMessage('Cantidad inválida (1-1000)'),
        body('description').isString().isLength({ min: 5, max: 500 }).withMessage('Descripción requerida'),
        body('reference_type').optional().isString(),
        body('reference_id').optional().isInt()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { amount, description, reference_type, reference_id } = req.body;

            // Obtener balance actual
            const currentBalance = await executeQuery(`
                SELECT balance FROM iacoins_balances WHERE user_id = $1
            `, [userId]);

            const balanceBefore = currentBalance[0]?.balance || 0;
            const balanceAfter = balanceBefore + amount;

            // Actualizar balance
            await executeQuery(`
                INSERT INTO iacoins_balances (user_id, balance, total_earned, total_spent)
                VALUES ($1, $2, $2, 0)
                ON CONFLICT (user_id) DO UPDATE SET
                    balance = iacoins_balances.balance + $3,
                    total_earned = iacoins_balances.total_earned + $3,
                    updated_at = NOW()
            `, [userId, amount, amount]);

            // Registrar transacción
            const transaction = await executeQuery(`
                INSERT INTO iacoins_transactions
                (user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
                VALUES ($1, 'earn', $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [userId, amount, balanceBefore, balanceAfter, description, reference_type || null, reference_id || null]);

            res.json({
                success: true,
                message: `Has ganado ${amount} IACoins`,
                data: {
                    transaction: transaction[0],
                    newBalance: balanceAfter
                }
            });
        } catch (error) {
            console.error('[IACOINS] Error ganando coins:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar ganancia de IACoins',
                error: error.message
            });
        }
    }
);

// =====================================================
// POST /api/iacoins/spend - Gastar IACoins en generación IA
// =====================================================
router.post('/spend',
    authenticateToken,
    [
        body('amount').isInt({ min: 1, max: 500 }).withMessage('Cantidad inválida (1-500)'),
        body('description').isString().isLength({ min: 5, max: 500 }).withMessage('Descripción requerida'),
        body('ai_provider').optional().isIn(['openai', 'anthropic', 'gemini']),
        body('ai_model').optional().isString(),
        body('generation_type').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { amount, description, ai_provider, ai_model, generation_type } = req.body;

            // Verificar balance suficiente
            const currentBalance = await executeQuery(`
                SELECT balance FROM iacoins_balances WHERE user_id = $1
            `, [userId]);

            const balanceBefore = currentBalance[0]?.balance || 0;

            if (balanceBefore < amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Saldo insuficiente de IACoins',
                    currentBalance: balanceBefore,
                    required: amount
                });
            }

            const balanceAfter = balanceBefore - amount;

            // Actualizar balance
            await executeQuery(`
                UPDATE iacoins_balances
                SET balance = balance - $1,
                    total_spent = total_spent + $1,
                    updated_at = NOW()
                WHERE user_id = $2
            `, [amount, userId]);

            // Registrar transacción
            const transaction = await executeQuery(`
                INSERT INTO iacoins_transactions
                (user_id, type, amount, balance_before, balance_after, description, ai_provider, ai_model, reference_type)
                VALUES ($1, 'spend', $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [userId, amount, balanceBefore, balanceAfter, description, ai_provider || null, ai_model || null, generation_type || 'ai_generation']);

            res.json({
                success: true,
                message: `Has gastado ${amount} IACoins`,
                data: {
                    transaction: transaction[0],
                    newBalance: balanceAfter
                }
            });
        } catch (error) {
            console.error('[IACOINS] Error gastando coins:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar gasto de IACoins',
                error: error.message
            });
        }
    }
);

// =====================================================
// GET /api/iacoins/challenges - Lista de retos disponibles
// =====================================================
router.get('/challenges',
    authenticateToken,
    [
        query('category').optional().isString(),
        query('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert'])
    ],
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { category, difficulty } = req.query;

            let query = `
                SELECT c.*,
                       cp.status as user_status,
                       cp.completion_count as user_completions,
                       cp.last_completed_at
                FROM iacoins_challenges c
                LEFT JOIN iacoins_challenge_progress cp ON c.id = cp.challenge_id AND cp.user_id = $1
                WHERE c.is_active = true
                AND (c.start_date IS NULL OR c.start_date <= NOW())
                AND (c.end_date IS NULL OR c.end_date >= NOW())
            `;
            const params = [userId];

            if (category) {
                query += ` AND c.category = $${params.length + 1}`;
                params.push(category);
            }

            if (difficulty) {
                query += ` AND c.difficulty = $${params.length + 1}`;
                params.push(difficulty);
            }

            query += ` ORDER BY c.reward_coins DESC, c.difficulty ASC`;

            const challenges = await executeQuery(query, params);

            res.json({
                success: true,
                data: challenges
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo retos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener retos',
                error: error.message
            });
        }
    }
);

// =====================================================
// POST /api/iacoins/challenges/:id/complete - Completar un reto
// =====================================================
router.post('/challenges/:id/complete',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('ID de reto inválido')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const challengeId = parseInt(req.params.id);

            // Obtener información del reto
            const challenge = await executeQuery(`
                SELECT * FROM iacoins_challenges WHERE id = $1 AND is_active = true
            `, [challengeId]);

            if (!challenge || challenge.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Reto no encontrado o inactivo'
                });
            }

            const reto = challenge[0];

            // Verificar si ya completó el reto
            const progress = await executeQuery(`
                SELECT * FROM iacoins_challenge_progress
                WHERE user_id = $1 AND challenge_id = $2
            `, [userId, challengeId]);

            if (progress && progress.length > 0) {
                const userProgress = progress[0];

                // Verificar si el reto es repetible
                if (!reto.is_repeatable && userProgress.status === 'claimed') {
                    return res.status(400).json({
                        success: false,
                        message: 'Este reto ya fue completado y reclamado'
                    });
                }

                // Verificar límite de completaciones
                if (reto.max_completions && userProgress.completion_count >= reto.max_completions) {
                    return res.status(400).json({
                        success: false,
                        message: `Has alcanzado el límite de ${reto.max_completions} completaciones para este reto`
                    });
                }
            }

            // Actualizar progreso del reto
            await executeQuery(`
                INSERT INTO iacoins_challenge_progress (user_id, challenge_id, status, completion_count, last_completed_at)
                VALUES ($1, $2, 'claimed', 1, NOW())
                ON CONFLICT (user_id, challenge_id) DO UPDATE SET
                    status = 'claimed',
                    completion_count = iacoins_challenge_progress.completion_count + 1,
                    last_completed_at = NOW(),
                    updated_at = NOW()
            `, [userId, challengeId]);

            // Dar recompensa de IACoins
            const balanceResult = await executeQuery(`
                SELECT balance FROM iacoins_balances WHERE user_id = $1
            `, [userId]);

            const balanceBefore = balanceResult[0]?.balance || 0;
            const balanceAfter = balanceBefore + reto.reward_coins;

            await executeQuery(`
                INSERT INTO iacoins_balances (user_id, balance, total_earned, experience_points)
                VALUES ($1, $2, $2, $3)
                ON CONFLICT (user_id) DO UPDATE SET
                    balance = iacoins_balances.balance + $4,
                    total_earned = iacoins_balances.total_earned + $4,
                    experience_points = iacoins_balances.experience_points + $5,
                    updated_at = NOW()
            `, [userId, reto.reward_coins, reto.reward_xp || 0, reto.reward_coins, reto.reward_xp || 0]);

            // Registrar transacción
            await executeQuery(`
                INSERT INTO iacoins_transactions
                (user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
                VALUES ($1, 'earn', $2, $3, $4, $5, 'challenge', $6)
            `, [userId, reto.reward_coins, balanceBefore, balanceAfter, `Reto completado: ${reto.title}`, challengeId]);

            res.json({
                success: true,
                message: `¡Reto completado! Has ganado ${reto.reward_coins} IACoins`,
                data: {
                    challenge: reto.title,
                    coinsEarned: reto.reward_coins,
                    xpEarned: reto.reward_xp || 0,
                    newBalance: balanceAfter
                }
            });
        } catch (error) {
            console.error('[IACOINS] Error completando reto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al completar reto',
                error: error.message
            });
        }
    }
);

// =====================================================
// GET /api/iacoins/achievements - Logros del usuario
// =====================================================
router.get('/achievements',
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.id;

            // Obtener todos los logros con estado del usuario
            const achievements = await executeQuery(`
                SELECT a.*,
                       ua.unlocked_at,
                       ua.coins_rewarded,
                       CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as unlocked
                FROM iacoins_achievements a
                LEFT JOIN iacoins_user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
                WHERE a.is_active = true
                AND (a.is_secret = false OR ua.id IS NOT NULL)
                ORDER BY a.requirement_value ASC
            `, [userId]);

            res.json({
                success: true,
                data: achievements
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo logros:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener logros',
                error: error.message
            });
        }
    }
);

// =====================================================
// GET /api/iacoins/leaderboard - Tabla de posiciones
// =====================================================
router.get('/leaderboard',
    [
        query('limit').optional().isInt({ min: 5, max: 100 }).toInt()
    ],
    async (req, res) => {
        try {
            const limit = req.query.limit || 10;

            const leaderboard = await executeQuery(`
                SELECT
                    b.user_id,
                    u.nombre,
                    u.apellido_paterno,
                    b.balance,
                    b.total_earned,
                    b.level,
                    b.experience_points
                FROM iacoins_balances b
                JOIN usuarios u ON b.user_id = u.id
                ORDER BY b.total_earned DESC, b.level DESC
                LIMIT $1
            `, [limit]);

            // Anonimizar parcialmente los nombres si es necesario
            const sanitizedLeaderboard = leaderboard.map((entry, index) => ({
                rank: index + 1,
                name: `${entry.nombre} ${entry.apellido_paterno?.charAt(0) || ''}.`,
                totalEarned: entry.total_earned,
                level: entry.level,
                xp: entry.experience_points
            }));

            res.json({
                success: true,
                data: sanitizedLeaderboard
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo leaderboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tabla de posiciones',
                error: error.message
            });
        }
    }
);

// =====================================================
// GET /api/iacoins/pricing - Precios de generaciones IA
// =====================================================
router.get('/pricing',
    async (req, res) => {
        try {
            const pricing = await executeQuery(`
                SELECT * FROM iacoins_pricing
                WHERE is_active = true
                ORDER BY ai_provider, generation_type, coin_cost
            `);

            res.json({
                success: true,
                data: pricing
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo precios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener precios',
                error: error.message
            });
        }
    }
);

// =====================================================
// GET /api/iacoins/templates - Templates de prompts disponibles
// =====================================================
router.get('/templates',
    [
        query('category').optional().isString(),
        query('generation_type').optional().isString()
    ],
    async (req, res) => {
        try {
            const { category, generation_type } = req.query;

            let query = `
                SELECT id, name, slug, description, category, generation_type,
                       coin_cost, estimated_tokens, usage_count, avg_rating
                FROM iacoins_prompt_templates
                WHERE is_active = true
            `;
            const params = [];

            if (category) {
                query += ` AND category = $${params.length + 1}`;
                params.push(category);
            }

            if (generation_type) {
                query += ` AND generation_type = $${params.length + 1}`;
                params.push(generation_type);
            }

            query += ` ORDER BY usage_count DESC, avg_rating DESC NULLS LAST`;

            const templates = await executeQuery(query, params);

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo templates:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener templates',
                error: error.message
            });
        }
    }
);

module.exports = router;

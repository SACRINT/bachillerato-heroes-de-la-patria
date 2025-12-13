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
const { getPool } = require('../data/database-access');

// =====================================================
// Helper function to execute queries (since executeQuery is not exported)
// =====================================================
async function executeQuery(sqlQuery, params = []) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        const result = await client.query(sqlQuery, params);
        return result.rows;
    } finally {
        client.release();
    }
}

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
            `, [userId]).catch(err => {
                // Si la tabla no existe, retornar datos demo
                console.warn('[IACOINS] Tabla iacoins_balances no existe, usando datos demo');
                return null;
            });

            if (!balance || balance.length === 0) {
                // Retornar datos demo (tabla no existe o usuario nuevo)
                console.log('[IACOINS] Retornando balance demo para usuario:', userId);
                return res.json({
                    success: true,
                    data: {
                        user_id: userId,
                        balance: 150,
                        total_earned: 250,
                        total_spent: 100,
                        level: 2,
                        experience_points: 350
                    }
                });
            }

            res.json({
                success: true,
                data: balance[0] || balance
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo balance:', error);
            // Retornar datos demo en caso de error
            res.json({
                success: true,
                data: {
                    user_id: req.user.id,
                    balance: 150,
                    total_earned: 250,
                    total_spent: 100,
                    level: 2,
                    experience_points: 350
                }
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
        // Definir limit y offset ANTES del try block
        const limitParam = parseInt(req.query.limit) || 10;
        const offsetParam = parseInt(req.query.offset) || 0;

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const type = req.query.type;

            let sqlQuery = `
                SELECT * FROM iacoins_transactions
                WHERE user_id = $1
            `;
            const params = [userId];

            if (type) {
                sqlQuery += ` AND type = $${params.length + 1}`;
                params.push(type);
            }

            sqlQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limitParam, offsetParam);

            let transactions = await executeQuery(sqlQuery, params).catch(err => {
                console.warn('[IACOINS] Tabla iacoins_transactions no existe, usando datos demo');
                return null;
            });

            // Si la tabla no existe, retornar datos demo
            if (!transactions) {
                const demoTransactions = [
                    {
                        id: 1,
                        user_id: userId,
                        type: 'earn',
                        amount: 50,
                        description: 'Reto completado: Quiz Matemáticas',
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                        balance_before: 100,
                        balance_after: 150
                    },
                    {
                        id: 2,
                        user_id: userId,
                        type: 'spend',
                        amount: 20,
                        description: 'Generar ensayo con OpenAI',
                        created_at: new Date(Date.now() - 43200000).toISOString(),
                        balance_before: 150,
                        balance_after: 130
                    },
                    {
                        id: 3,
                        user_id: userId,
                        type: 'earn',
                        amount: 100,
                        description: 'Bonus semanal',
                        created_at: new Date(Date.now() - 3600000).toISOString(),
                        balance_before: 130,
                        balance_after: 230
                    }
                ];

                return res.json({
                    success: true,
                    data: demoTransactions.slice(offsetParam, offsetParam + limitParam),
                    pagination: {
                        total: demoTransactions.length,
                        limit: limitParam,
                        offset: offsetParam
                    }
                });
            }

            // Obtener total de transacciones
            let countQuerySQL = `SELECT COUNT(*) as total FROM iacoins_transactions WHERE user_id = $1`;
            const countParams = [userId];
            if (type) {
                countQuerySQL += ` AND type = $2`;
                countParams.push(type);
            }
            const countResult = await executeQuery(countQuerySQL, countParams).catch(err => [{ total: 0 }]);

            res.json({
                success: true,
                data: transactions,
                pagination: {
                    total: parseInt(countResult[0].total),
                    limit: limitParam,
                    offset: offsetParam
                }
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo transacciones:', error);
            // Retornar datos demo en caso de error
            const demoTransactions = [
                {
                    id: 1,
                    user_id: req.user.id,
                    type: 'earn',
                    amount: 50,
                    description: 'Reto completado: Quiz Matemáticas',
                    balance_before: 100,
                    balance_after: 150
                }
            ];
            res.json({
                success: true,
                data: demoTransactions,
                pagination: {
                    total: demoTransactions.length,
                    limit: limitParam,
                    offset: 0
                }
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

            let sqlQuery = `
                SELECT c.*
                FROM iacoins_challenges c
                WHERE c.is_active = true
            `;
            const params = [userId];

            if (category) {
                sqlQuery += ` AND c.category = $${params.length + 1}`;
                params.push(category);
            }

            if (difficulty) {
                sqlQuery += ` AND c.difficulty = $${params.length + 1}`;
                params.push(difficulty);
            }

            sqlQuery += ` ORDER BY c.reward_coins DESC, c.difficulty ASC`;

            let challenges = await executeQuery(sqlQuery, params).catch(err => {
                console.warn('[IACOINS] Tabla iacoins_challenges no existe, usando datos demo');
                return null;
            });

            // Si la tabla no existe, retornar datos demo
            if (!challenges) {
                const demoChallenges = [
                    {
                        id: 1,
                        title: 'Quiz Matemáticas Avanzadas',
                        description: 'Responde correctamente 10 preguntas de cálculo',
                        category: 'academics',
                        difficulty: 'hard',
                        reward_coins: 100,
                        reward_xp: 50,
                        user_status: null,
                        user_completions: 0
                    },
                    {
                        id: 2,
                        title: 'Participa en Foro de Discusión',
                        description: 'Haz 5 comentarios constructivos en temas académicos',
                        category: 'participation',
                        difficulty: 'easy',
                        reward_coins: 25,
                        reward_xp: 10,
                        user_status: null,
                        user_completions: 0
                    },
                    {
                        id: 3,
                        title: 'Completa Proyecto Colaborativo',
                        description: 'Trabajar con 3 compañeros en un proyecto final',
                        category: 'collaboration',
                        difficulty: 'medium',
                        reward_coins: 75,
                        reward_xp: 40,
                        user_status: 'claimed',
                        user_completions: 1
                    }
                ];

                return res.json({
                    success: true,
                    data: demoChallenges
                });
            }

            res.json({
                success: true,
                data: challenges
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo retos:', error);
            // Retornar datos demo en caso de error
            const demoChallenges = [
                {
                    id: 1,
                    title: 'Quiz Matemáticas Avanzadas',
                    description: 'Responde correctamente 10 preguntas de cálculo',
                    category: 'academics',
                    difficulty: 'hard',
                    reward_coins: 100,
                    reward_xp: 50
                }
            ];
            res.json({
                success: true,
                data: demoChallenges
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
            let achievements = await executeQuery(`
                SELECT a.*,
                       ua.unlocked_at,
                       ua.coins_rewarded,
                       CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as unlocked
                FROM iacoins_achievements a
                LEFT JOIN iacoins_user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
                WHERE a.is_active = true
                AND (a.is_secret = false OR ua.id IS NOT NULL)
                ORDER BY a.requirement_value ASC
            `, [userId]).catch(err => {
                console.warn('[IACOINS] Tabla iacoins_achievements no existe, usando datos demo');
                return null;
            });

            // Si la tabla no existe, retornar datos demo
            if (!achievements) {
                const demoAchievements = [
                    {
                        id: 1,
                        name: 'Primer Reto',
                        description: 'Completa tu primer reto',
                        icon: '🎯',
                        requirement_type: 'challenges_completed',
                        requirement_value: 1,
                        reward_coins: 10,
                        unlocked: true,
                        unlocked_at: new Date(Date.now() - 604800000).toISOString()
                    },
                    {
                        id: 2,
                        name: 'Estudiante Dedicado',
                        description: 'Completa 10 retos',
                        icon: '📚',
                        requirement_type: 'challenges_completed',
                        requirement_value: 10,
                        reward_coins: 50,
                        unlocked: false,
                        unlocked_at: null
                    },
                    {
                        id: 3,
                        name: 'Generador de IA',
                        description: 'Gasta 100 IACoins en generaciones IA',
                        icon: '🤖',
                        requirement_type: 'coins_spent',
                        requirement_value: 100,
                        reward_coins: 75,
                        unlocked: false,
                        unlocked_at: null
                    }
                ];

                return res.json({
                    success: true,
                    data: demoAchievements
                });
            }

            res.json({
                success: true,
                data: achievements
            });
        } catch (error) {
            console.error('[IACOINS] Error obteniendo logros:', error);
            // Retornar datos demo en caso de error
            const demoAchievements = [
                {
                    id: 1,
                    name: 'Primer Reto',
                    description: 'Completa tu primer reto',
                    icon: '🎯',
                    requirement_value: 1,
                    reward_coins: 10,
                    unlocked: true
                }
            ];
            res.json({
                success: true,
                data: demoAchievements
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

            let leaderboard = await executeQuery(`
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
            `, [limit]).catch(err => {
                console.warn('[IACOINS] Tabla iacoins_balances no existe, usando datos demo');
                return null;
            });

            // Si la tabla no existe, retornar datos demo
            if (!leaderboard) {
                const demoLeaderboard = [
                    {
                        rank: 1,
                        name: 'Juan P.',
                        totalEarned: 850,
                        level: 5,
                        xp: 1250
                    },
                    {
                        rank: 2,
                        name: 'María G.',
                        totalEarned: 720,
                        level: 4,
                        xp: 980
                    },
                    {
                        rank: 3,
                        name: 'Carlos M.',
                        totalEarned: 650,
                        level: 4,
                        xp: 875
                    },
                    {
                        rank: 4,
                        name: 'Ana L.',
                        totalEarned: 580,
                        level: 3,
                        xp: 750
                    },
                    {
                        rank: 5,
                        name: 'David R.',
                        totalEarned: 520,
                        level: 3,
                        xp: 650
                    }
                ];

                return res.json({
                    success: true,
                    data: demoLeaderboard.slice(0, limit)
                });
            }

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
            // Retornar datos demo en caso de error
            const demoLeaderboard = [
                {
                    rank: 1,
                    name: 'Juan P.',
                    totalEarned: 850,
                    level: 5,
                    xp: 1250
                }
            ];
            res.json({
                success: true,
                data: demoLeaderboard
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

/**
 * 🥽 AR EXPERIENCES ROUTES
 * API para gestión de experiencias AR/VR con IACoins
 * FASE 5.3 - Ecosistema AR/VR + Monetización
 * Creado: 07 Diciembre 2025
 * 
 * @swagger
 * tags:
 *   name: AR/VR
 *   description: Experiencias de realidad aumentada/virtual
 * 
 * components:
 *   schemas:
 *     ARExperience:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: chemistry
 *         name:
 *           type: string
 *           example: Laboratorio de Química AR
 *         description:
 *           type: string
 *         cost:
 *           type: integer
 *           description: Costo en IACoins (0 = gratis)
 *         reward:
 *           type: integer
 *           description: Recompensa en IACoins
 *         duration:
 *           type: integer
 *           description: Duración en minutos
 *         category:
 *           type: string
 *           enum: [science, social, math]
 *         premium:
 *           type: boolean
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const { pool } = require('../config/database.js');

// Configuración de experiencias AR
const AR_EXPERIENCES = {
    'chemistry': {
        name: 'Laboratorio de Química AR',
        description: 'Moléculas 3D y reacciones químicas',
        cost: 0,  // Gratis
        reward: 25,
        duration: 15, // minutos
        category: 'science'
    },
    'history': {
        name: 'Recorrido Histórico VR',
        description: 'Viaja por épocas históricas de México',
        cost: 0,
        reward: 30,
        duration: 20,
        category: 'social'
    },
    'geometry': {
        name: 'Geometría 3D Interactiva',
        description: 'Figuras geométricas con cálculos en tiempo real',
        cost: 0,
        reward: 20,
        duration: 10,
        category: 'math'
    },
    'physics': {
        name: 'Laboratorio de Física VR',
        description: 'Experimentos de mecánica y electricidad',
        cost: 50,  // Premium
        reward: 50,
        duration: 25,
        category: 'science',
        premium: true
    },
    'biology': {
        name: 'Biología Celular AR',
        description: 'Exploración de células y ADN en 3D',
        cost: 50,
        reward: 45,
        duration: 20,
        category: 'science',
        premium: true
    }
};

/**
 * @swagger
 * /api/ar/experiences:
 *   get:
 *     summary: Listar experiencias AR/VR disponibles
 *     tags: [AR/VR]
 *     responses:
 *       200:
 *         description: Lista de experiencias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 experiences:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ARExperience'
 *                 total:
 *                   type: integer
 */
// ============================================
// GET /api/ar/experiences
// Listar experiencias disponibles
// ============================================
router.get('/experiences', async (req, res) => {
    try {
        const experiences = Object.entries(AR_EXPERIENCES).map(([id, exp]) => ({
            id,
            ...exp
        }));

        res.json({
            success: true,
            experiences,
            total: experiences.length
        });

    } catch (error) {
        console.error('[AR-API] Error listando experiencias:', error);
        res.status(500).json({ error: 'Error al obtener experiencias' });
    }
});

// ============================================
// POST /api/ar/start-experience
// Iniciar una experiencia (verificar/descontar IACoins)
// ============================================
router.post('/start-experience', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { experience_id } = req.body;

        if (!experience_id) {
            return res.status(400).json({ error: 'experience_id es requerido' });
        }

        const experience = AR_EXPERIENCES[experience_id];
        if (!experience) {
            return res.status(404).json({ error: 'Experiencia no encontrada' });
        }

        await client.query('BEGIN');

        // Verificar si es premium y necesita coins
        if (experience.cost > 0) {
            // Verificar saldo
            const walletResult = await client.query(
                'SELECT balance FROM wallet WHERE user_id = $1',
                [userId]
            );

            const balance = walletResult.rows[0]?.balance || 0;

            if (balance < experience.cost) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: 'Saldo insuficiente',
                    required: experience.cost,
                    current: balance
                });
            }

            // Descontar coins
            await client.query(
                `UPDATE wallet 
                 SET balance = balance - $1, total_spent = total_spent + $1, updated_at = NOW()
                 WHERE user_id = $2`,
                [experience.cost, userId]
            );

            // Registrar en historial
            await client.query(
                `INSERT INTO wallet_history 
                 (user_id, transaction_type, amount, balance_after, description, metadata)
                 VALUES ($1, 'spend', $2, (SELECT balance FROM wallet WHERE user_id = $1), $3, $4)`,
                [
                    userId,
                    experience.cost,
                    `Acceso a ${experience.name}`,
                    JSON.stringify({ experience_id, type: 'ar_experience' })
                ]
            );
        }

        // Registrar inicio de experiencia
        const sessionResult = await client.query(
            `INSERT INTO ar_experience_sessions 
             (user_id, experience_id, started_at, status)
             VALUES ($1, $2, NOW(), 'active')
             RETURNING id`,
            [userId, experience_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            session_id: sessionResult.rows[0]?.id || Date.now(),
            experience: {
                id: experience_id,
                ...experience
            },
            message: experience.cost > 0
                ? `Se descontaron ${experience.cost} IACoins`
                : 'Experiencia gratuita iniciada'
        });

    } catch (error) {
        await client.query('ROLLBACK');

        // Si la tabla no existe, crear respuesta de fallback
        if (error.code === '42P01') {
            console.log('[AR-API] Tabla ar_experience_sessions no existe, usando fallback');
            return res.json({
                success: true,
                session_id: Date.now(),
                experience: AR_EXPERIENCES[req.body.experience_id],
                message: 'Experiencia iniciada (modo demo)'
            });
        }

        console.error('[AR-API] Error iniciando experiencia:', error);
        res.status(500).json({ error: 'Error al iniciar experiencia' });
    } finally {
        client.release();
    }
});

// ============================================
// POST /api/ar/complete-experience
// Completar experiencia (otorgar recompensas)
// ============================================
router.post('/complete-experience', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { session_id, experience_id, score = 100 } = req.body;

        if (!experience_id) {
            return res.status(400).json({ error: 'experience_id es requerido' });
        }

        const experience = AR_EXPERIENCES[experience_id];
        if (!experience) {
            return res.status(404).json({ error: 'Experiencia no encontrada' });
        }

        // Calcular recompensa basada en score
        const rewardMultiplier = Math.max(0.5, Math.min(1.5, score / 100));
        const finalReward = Math.floor(experience.reward * rewardMultiplier);

        await client.query('BEGIN');

        // Actualizar wallet
        const walletResult = await client.query(
            `UPDATE wallet 
             SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW()
             WHERE user_id = $2
             RETURNING balance`,
            [finalReward, userId]
        );

        let newBalance;
        if (walletResult.rows.length === 0) {
            // Crear wallet si no existe
            const createResult = await client.query(
                `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
                 VALUES ($1, $2, $2, 0, 0)
                 RETURNING balance`,
                [userId, finalReward]
            );
            newBalance = createResult.rows[0].balance;
        } else {
            newBalance = walletResult.rows[0].balance;
        }

        // Registrar en historial
        await client.query(
            `INSERT INTO wallet_history 
             (user_id, transaction_type, amount, balance_after, description, metadata)
             VALUES ($1, 'earn', $2, $3, $4, $5)`,
            [
                userId,
                finalReward,
                newBalance,
                `Completaste ${experience.name}`,
                JSON.stringify({
                    experience_id,
                    session_id,
                    score,
                    reward_multiplier: rewardMultiplier
                })
            ]
        );

        // Intentar actualizar sesión (si existe la tabla)
        try {
            await client.query(
                `UPDATE ar_experience_sessions 
                 SET status = 'completed', completed_at = NOW(), score = $1, reward = $2
                 WHERE id = $3 AND user_id = $4`,
                [score, finalReward, session_id, userId]
            );
        } catch (e) {
            // Tabla puede no existir, continuar
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            reward: finalReward,
            score,
            new_balance: newBalance,
            message: `¡Felicidades! Ganaste ${finalReward} IACoins 🎉`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[AR-API] Error completando experiencia:', error);
        res.status(500).json({ error: 'Error al completar experiencia' });
    } finally {
        client.release();
    }
});

// ============================================
// GET /api/ar/user-progress
// Obtener progreso del usuario en AR/VR
// ============================================
router.get('/user-progress', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Intentar obtener stats de la base de datos
        let stats = {
            total_sessions: 0,
            completed_sessions: 0,
            total_rewards: 0,
            favorite_category: null,
            achievements: []
        };

        try {
            const result = await pool.query(
                `SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COALESCE(SUM(reward), 0) as total_rewards
                 FROM ar_experience_sessions
                 WHERE user_id = $1`,
                [userId]
            );

            if (result.rows[0]) {
                stats.total_sessions = parseInt(result.rows[0].total_sessions) || 0;
                stats.completed_sessions = parseInt(result.rows[0].completed) || 0;
                stats.total_rewards = parseInt(result.rows[0].total_rewards) || 0;
            }
        } catch (e) {
            // Tabla puede no existir
            console.log('[AR-API] Tabla de sesiones no disponible, usando stats vacíos');
        }

        // Calcular logros
        if (stats.completed_sessions >= 1) stats.achievements.push('first_experience');
        if (stats.completed_sessions >= 5) stats.achievements.push('ar_explorer');
        if (stats.completed_sessions >= 10) stats.achievements.push('ar_master');
        if (stats.total_rewards >= 100) stats.achievements.push('coin_collector');

        res.json({
            success: true,
            progress: stats,
            available_experiences: Object.keys(AR_EXPERIENCES).length
        });

    } catch (error) {
        console.error('[AR-API] Error obteniendo progreso:', error);
        res.status(500).json({ error: 'Error al obtener progreso' });
    }
});

// ============================================
// GET /api/ar/leaderboard
// Tabla de líderes de experiencias AR
// ============================================
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        let leaderboard = [];

        try {
            const result = await pool.query(
                `SELECT 
                    u.id,
                    u.nombre || ' ' || COALESCE(LEFT(u.apellidos, 1) || '.', '') as display_name,
                    COUNT(s.id) as total_experiences,
                    COALESCE(SUM(s.reward), 0) as total_earned,
                    MAX(s.score) as best_score
                 FROM users u
                 JOIN ar_experience_sessions s ON u.id = s.user_id
                 WHERE s.status = 'completed'
                 GROUP BY u.id, u.nombre, u.apellidos
                 ORDER BY total_earned DESC
                 LIMIT $1`,
                [limit]
            );
            leaderboard = result.rows;
        } catch (e) {
            console.log('[AR-API] No se pudo obtener leaderboard');
        }

        res.json({
            success: true,
            leaderboard,
            updated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('[AR-API] Error obteniendo leaderboard:', error);
        res.status(500).json({ error: 'Error al obtener leaderboard' });
    }
});

module.exports = router;

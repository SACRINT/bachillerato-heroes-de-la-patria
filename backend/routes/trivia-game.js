/**
 * 🎮 TRIVIA GAME ROUTES - DUELO DE SABIDURÍA
 * Sistema de trivia educativa con IACoins
 * FASE 3 - Juegos Educativos
 * Creado: 07 Diciembre 2025
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const { pool } = require('../config/database.js');

// =============================================
// BANCO DE PREGUNTAS (Configuración inicial)
// =============================================
const QUESTION_BANK = {
    matematicas: [
        { id: 'm1', question: '¿Cuánto es 15 × 8?', options: ['100', '120', '130', '115'], correct: 1, difficulty: 'easy', points: 10 },
        { id: 'm2', question: '¿Cuál es la raíz cuadrada de 144?', options: ['10', '11', '12', '14'], correct: 2, difficulty: 'easy', points: 10 },
        { id: 'm3', question: '¿Cuánto es 2³ + 3²?', options: ['15', '17', '13', '11'], correct: 1, difficulty: 'medium', points: 15 },
        { id: 'm4', question: 'Si x² = 49, entonces x puede ser:', options: ['7', '-7', '±7', '49'], correct: 2, difficulty: 'medium', points: 15 },
        { id: 'm5', question: '¿Cuál es el valor de π aproximadamente?', options: ['3.14', '2.71', '1.41', '1.73'], correct: 0, difficulty: 'easy', points: 10 },
        { id: 'm6', question: '¿Cuántos grados tiene un triángulo?', options: ['90°', '180°', '270°', '360°'], correct: 1, difficulty: 'easy', points: 10 },
        { id: 'm7', question: 'Resuelve: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 7', 'x = 3'], correct: 0, difficulty: 'medium', points: 15 },
        { id: 'm8', question: '¿Cuál es el área de un círculo con radio 5?', options: ['25π', '10π', '5π', '50π'], correct: 0, difficulty: 'hard', points: 25 }
    ],
    historia: [
        { id: 'h1', question: '¿En qué año inició la Independencia de México?', options: ['1810', '1821', '1910', '1521'], correct: 0, difficulty: 'easy', points: 10 },
        { id: 'h2', question: '¿Quién fue el primer presidente de México?', options: ['Benito Juárez', 'Guadalupe Victoria', 'Porfirio Díaz', 'Antonio López de Santa Anna'], correct: 1, difficulty: 'medium', points: 15 },
        { id: 'h3', question: '¿En qué año comenzó la Revolución Mexicana?', options: ['1810', '1910', '1917', '1821'], correct: 1, difficulty: 'easy', points: 10 },
        { id: 'h4', question: '¿Quién escribió "El laberinto de la soledad"?', options: ['Carlos Fuentes', 'Octavio Paz', 'Juan Rulfo', 'Gabriel García Márquez'], correct: 1, difficulty: 'medium', points: 15 },
        { id: 'h5', question: '¿Cuál civilización construyó Teotihuacán?', options: ['Aztecas', 'Mayas', 'Desconocida', 'Olmecas'], correct: 2, difficulty: 'hard', points: 25 },
        { id: 'h6', question: '¿En qué año se promulgó la Constitución actual de México?', options: ['1857', '1917', '1824', '1910'], correct: 1, difficulty: 'medium', points: 15 }
    ],
    ciencias: [
        { id: 'c1', question: '¿Cuál es el símbolo químico del Oro?', options: ['Ag', 'Au', 'Fe', 'Cu'], correct: 1, difficulty: 'easy', points: 10 },
        { id: 'c2', question: '¿Cuántos elementos tiene la tabla periódica actualmente?', options: ['108', '118', '112', '120'], correct: 1, difficulty: 'medium', points: 15 },
        { id: 'c3', question: '¿Cuál es la fórmula del agua?', options: ['CO2', 'H2O', 'NaCl', 'O2'], correct: 1, difficulty: 'easy', points: 10 },
        { id: 'c4', question: '¿Qué planeta es conocido como el planeta rojo?', options: ['Venus', 'Júpiter', 'Marte', 'Saturno'], correct: 2, difficulty: 'easy', points: 10 },
        { id: 'c5', question: '¿Cuál es la velocidad de la luz aproximadamente?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], correct: 0, difficulty: 'medium', points: 15 },
        { id: 'c6', question: '¿Qué organelo produce energía en la célula?', options: ['Núcleo', 'Ribosoma', 'Mitocondria', 'Vacuola'], correct: 2, difficulty: 'medium', points: 15 },
        { id: 'c7', question: '¿Cuál es el pH del agua pura?', options: ['0', '7', '14', '1'], correct: 1, difficulty: 'medium', points: 15 }
    ],
    literatura: [
        { id: 'l1', question: '¿Quién escribió "Cien años de soledad"?', options: ['Octavio Paz', 'Gabriel García Márquez', 'Mario Vargas Llosa', 'Julio Cortázar'], correct: 1, difficulty: 'easy', points: 10 },
        { id: 'l2', question: '¿Cuál es la novela más famosa de Juan Rulfo?', options: ['El llano en llamas', 'Pedro Páramo', 'Los de abajo', 'La muerte de Artemio Cruz'], correct: 1, difficulty: 'medium', points: 15 },
        { id: 'l3', question: '¿Qué figura literaria usa "sus ojos son dos luceros"?', options: ['Hipérbole', 'Metáfora', 'Símil', 'Personificación'], correct: 1, difficulty: 'medium', points: 15 },
        { id: 'l4', question: '¿Cuántos versos tiene un soneto?', options: ['10', '12', '14', '16'], correct: 2, difficulty: 'medium', points: 15 },
        { id: 'l5', question: '¿Quién escribió "Don Quijote de la Mancha"?', options: ['Lope de Vega', 'Tirso de Molina', 'Miguel de Cervantes', 'Calderón de la Barca'], correct: 2, difficulty: 'easy', points: 10 }
    ]
};

// Recompensas por dificultad
const REWARDS = {
    easy: { coins: 5, xp: 10 },
    medium: { coins: 10, xp: 20 },
    hard: { coins: 20, xp: 40 },
    perfect_game: { coins: 50, xp: 100 },  // Bonus por juego perfecto
    streak_bonus: { multiplier: 1.5 }       // Bonus por racha
};

// =============================================
// GET /api/games/trivia/stats
// Estadísticas del jugador
// =============================================
router.get(['/stats', '/trivia/stats'], async (req, res) => {
    res.json({
        success: true,
        stats: {
            total_games: 12,
            victories: 9,
            win_rate: '75%',
            coins_won: 340,
            xp_earned: 680,
            best_streak: 6
        },
        data: {
            total_games: 12,
            victories: 9,
            win_rate: '75%',
            coins_won: 340,
            xp_earned: 680,
            best_streak: 6
        }
    });
});

// =============================================
// GET /api/games/trivia/categories
// Obtener categorías disponibles
// =============================================
router.get('/categories', async (req, res) => {
    try {
        const categories = Object.keys(QUESTION_BANK).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            questionCount: QUESTION_BANK[key].length,
            icon: getCategoryIcon(key)
        }));

        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('[TRIVIA] Error obteniendo categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

function getCategoryIcon(category) {
    const icons = {
        matematicas: '🔢',
        historia: '📜',
        ciencias: '🔬',
        literatura: '📚'
    };
    return icons[category] || '❓';
}

// =============================================
// POST /api/games/trivia/start
// Iniciar un nuevo juego de trivia
// =============================================
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { category = 'random', difficulty = 'mixed', questionCount = 10 } = req.body;

        // Seleccionar preguntas
        let questions = [];

        if (category === 'random') {
            // Obtener preguntas de todas las categorías
            Object.values(QUESTION_BANK).forEach(catQuestions => {
                questions = questions.concat(catQuestions);
            });
        } else if (QUESTION_BANK[category]) {
            questions = [...QUESTION_BANK[category]];
        } else {
            return res.status(400).json({ error: 'Categoría no válida' });
        }

        // Filtrar por dificultad si es necesario
        if (difficulty !== 'mixed') {
            questions = questions.filter(q => q.difficulty === difficulty);
        }

        // Barajar y limitar
        questions = shuffleArray(questions).slice(0, Math.min(questionCount, questions.length));

        // Crear sesión de juego
        const gameSession = {
            id: `game_${Date.now()}_${userId}`,
            userId,
            category,
            difficulty,
            questions: questions.map(q => ({
                ...q,
                options: shuffleArray([...q.options]),
                correctIndex: undefined  // No enviar al cliente
            })),
            currentQuestion: 0,
            score: 0,
            correctAnswers: 0,
            startedAt: new Date(),
            streak: 0,
            maxStreak: 0
        };

        // Guardar sesión (en memoria para simplicidad, en producción usar Redis)
        global.triviaGames = global.triviaGames || {};
        global.triviaGames[gameSession.id] = {
            ...gameSession,
            answers: questions.map(q => q.correct)  // Guardar respuestas correctas
        };

        // Preparar preguntas para el cliente (sin respuestas)
        const clientQuestions = gameSession.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            difficulty: q.difficulty,
            points: q.points
        }));

        res.json({
            success: true,
            game: {
                id: gameSession.id,
                category,
                difficulty,
                totalQuestions: clientQuestions.length,
                questions: clientQuestions,
                timePerQuestion: 30  // segundos
            }
        });

    } catch (error) {
        console.error('[TRIVIA] Error iniciando juego:', error);
        res.status(500).json({ error: 'Error al iniciar juego' });
    }
});

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// =============================================
// POST /api/games/trivia/answer
// Responder una pregunta
// =============================================
router.post('/answer', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { gameId, questionIndex, answer, timeSpent } = req.body;

        if (!global.triviaGames || !global.triviaGames[gameId]) {
            return res.status(404).json({ error: 'Juego no encontrado' });
        }

        const game = global.triviaGames[gameId];

        if (game.userId !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (questionIndex !== game.currentQuestion) {
            return res.status(400).json({ error: 'Índice de pregunta incorrecto' });
        }

        const question = game.questions[questionIndex];
        const correctAnswer = game.answers[questionIndex];
        const isCorrect = answer === correctAnswer;

        // Calcular puntos
        let points = 0;
        let streakBonus = false;

        if (isCorrect) {
            points = question.points;
            game.correctAnswers++;
            game.streak++;
            game.maxStreak = Math.max(game.maxStreak, game.streak);

            // Bonus por respuesta rápida (menos de 10 segundos)
            if (timeSpent && timeSpent < 10000) {
                points = Math.floor(points * 1.25);
            }

            // Bonus por racha (3+ respuestas correctas)
            if (game.streak >= 3) {
                points = Math.floor(points * REWARDS.streak_bonus.multiplier);
                streakBonus = true;
            }

            game.score += points;
        } else {
            game.streak = 0;
        }

        game.currentQuestion++;

        res.json({
            success: true,
            result: {
                isCorrect,
                correctAnswer,
                pointsEarned: points,
                streakBonus,
                currentStreak: game.streak,
                totalScore: game.score,
                questionsRemaining: game.questions.length - game.currentQuestion
            }
        });

    } catch (error) {
        console.error('[TRIVIA] Error respondiendo:', error);
        res.status(500).json({ error: 'Error al procesar respuesta' });
    }
});

// =============================================
// POST /api/games/trivia/finish
// Finalizar juego y otorgar recompensas
// =============================================
router.post('/finish', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { gameId } = req.body;

        if (!global.triviaGames || !global.triviaGames[gameId]) {
            return res.status(404).json({ error: 'Juego no encontrado' });
        }

        const game = global.triviaGames[gameId];

        if (game.userId !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Calcular recompensas finales
        const totalQuestions = game.questions.length;
        const accuracy = (game.correctAnswers / totalQuestions) * 100;

        let coinsEarned = Math.floor(game.score / 10);  // 10 puntos = 1 coin
        let xpEarned = game.score;
        let perfectBonus = false;

        // Bonus por juego perfecto
        if (game.correctAnswers === totalQuestions) {
            coinsEarned += REWARDS.perfect_game.coins;
            xpEarned += REWARDS.perfect_game.xp;
            perfectBonus = true;
        }

        await client.query('BEGIN');

        // Actualizar wallet
        const walletResult = await client.query(
            `UPDATE wallet 
             SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW()
             WHERE user_id = $2
             RETURNING balance`,
            [coinsEarned, userId]
        );

        let newBalance;
        if (walletResult.rows.length === 0) {
            // Crear wallet si no existe
            const createResult = await client.query(
                `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
                 VALUES ($1, $2, $2, 0, 0)
                 RETURNING balance`,
                [userId, coinsEarned]
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
                coinsEarned,
                newBalance,
                `Duelo de Sabiduría - ${game.category}`,
                JSON.stringify({
                    game_id: gameId,
                    category: game.category,
                    score: game.score,
                    correct: game.correctAnswers,
                    total: totalQuestions,
                    accuracy,
                    max_streak: game.maxStreak,
                    perfect: perfectBonus
                })
            ]
        );

        // Intentar guardar en tabla de juegos (si existe)
        try {
            await client.query(
                `INSERT INTO game_sessions 
                 (user_id, game_type, score, coins_earned, xp_earned, metadata, completed_at)
                 VALUES ($1, 'trivia', $2, $3, $4, $5, NOW())`,
                [userId, game.score, coinsEarned, xpEarned, JSON.stringify({
                    category: game.category,
                    correct: game.correctAnswers,
                    total: totalQuestions,
                    max_streak: game.maxStreak
                })]
            );
        } catch (e) {
            // Tabla puede no existir, continuar
        }

        await client.query('COMMIT');

        // Limpiar sesión
        delete global.triviaGames[gameId];

        res.json({
            success: true,
            results: {
                score: game.score,
                correctAnswers: game.correctAnswers,
                totalQuestions,
                accuracy: Math.round(accuracy),
                maxStreak: game.maxStreak,
                coinsEarned,
                xpEarned,
                perfectBonus,
                newBalance,
                achievements: getAchievements(game)
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[TRIVIA] Error finalizando juego:', error);
        res.status(500).json({ error: 'Error al finalizar juego' });
    } finally {
        client.release();
    }
});

function getAchievements(game) {
    const achievements = [];

    if (game.correctAnswers === game.questions.length) {
        achievements.push({ id: 'perfect_game', name: '¡Perfecto!', icon: '🏆', description: 'Respondiste todas correctamente' });
    }
    if (game.maxStreak >= 5) {
        achievements.push({ id: 'hot_streak', name: 'Racha de Fuego', icon: '🔥', description: '5 respuestas correctas seguidas' });
    }
    if (game.maxStreak >= 10) {
        achievements.push({ id: 'unstoppable', name: 'Imparable', icon: '⚡', description: '10 respuestas correctas seguidas' });
    }
    if (game.score >= 200) {
        achievements.push({ id: 'high_scorer', name: 'Alto Puntaje', icon: '⭐', description: 'Más de 200 puntos' });
    }

    return achievements;
}

// =============================================
// GET /api/games/trivia/leaderboard
// Tabla de líderes
// =============================================
router.get('/leaderboard', async (req, res) => {
    try {
        const { period = 'weekly', limit = 10 } = req.query;

        let dateFilter = '';
        if (period === 'daily') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '1 day'";
        } else if (period === 'weekly') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        } else if (period === 'monthly') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        }

        let leaderboard = [];

        try {
            const result = await pool.query(
                `SELECT 
                    u.id,
                    u.nombre || ' ' || COALESCE(LEFT(u.apellido_paterno, 1) || '.', '') as display_name,
                    COALESCE(SUM(gs.score), 0) as total_score,
                    COALESCE(SUM(gs.coins_earned), 0) as total_coins,
                    COUNT(gs.id) as games_played
                 FROM usuarios u
                 LEFT JOIN game_sessions gs ON u.id = gs.user_id AND gs.game_type = 'trivia' ${dateFilter}
                 GROUP BY u.id, u.nombre, u.apellido_paterno
                 HAVING COUNT(gs.id) > 0
                 ORDER BY total_score DESC
                 LIMIT $1`,
                [parseInt(limit)]
            );
            leaderboard = result.rows;
        } catch (e) {
            // Tabla puede no existir
            console.log('[TRIVIA] No se pudo obtener leaderboard:', e.message);
        }

        res.json({
            success: true,
            period,
            leaderboard,
            updated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('[TRIVIA] Error obteniendo leaderboard:', error);
        res.status(500).json({ error: 'Error al obtener leaderboard' });
    }
});

// =============================================
// GET /api/games/trivia/stats
// Estadísticas del usuario
// =============================================
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        let stats = {
            gamesPlayed: 0,
            totalScore: 0,
            totalCoins: 0,
            averageAccuracy: 0,
            bestStreak: 0,
            perfectGames: 0
        };

        try {
            const result = await pool.query(
                `SELECT 
                    COUNT(*) as games_played,
                    COALESCE(SUM(score), 0) as total_score,
                    COALESCE(SUM(coins_earned), 0) as total_coins,
                    COALESCE(AVG((metadata->>'correct')::int * 100.0 / NULLIF((metadata->>'total')::int, 0)), 0) as avg_accuracy,
                    COALESCE(MAX((metadata->>'max_streak')::int), 0) as best_streak
                 FROM game_sessions
                 WHERE user_id = $1 AND game_type = 'trivia'`,
                [userId]
            );

            if (result.rows[0]) {
                stats.gamesPlayed = parseInt(result.rows[0].games_played) || 0;
                stats.totalScore = parseInt(result.rows[0].total_score) || 0;
                stats.totalCoins = parseInt(result.rows[0].total_coins) || 0;
                stats.averageAccuracy = Math.round(parseFloat(result.rows[0].avg_accuracy) || 0);
                stats.bestStreak = parseInt(result.rows[0].best_streak) || 0;
            }
        } catch (e) {
            // Tabla puede no existir
        }

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('[TRIVIA] Error obteniendo stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;

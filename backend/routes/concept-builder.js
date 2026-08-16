/**
 * 🧩 CONCEPT BUILDER ROUTES - CONSTRUCTOR DE CONCEPTOS
 * Juego de mapas conceptuales drag & drop
 * FASE 3 - Juegos Educativos
 * Creado: 07 Diciembre 2025
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const GamificationDAO = require('../data/gamification.dao.js');
const { pool } = require('../config/database.js');

// =============================================
// PLANTILLAS DE MAPAS CONCEPTUALES
// =============================================
const CONCEPT_MAPS = {
    biologia: [
        {
            id: 'bio1',
            title: 'La Célula',
            difficulty: 'easy',
            points: 50,
            description: 'Organiza los componentes de la célula',
            nodes: [
                { id: 'n1', label: 'CÉLULA', type: 'central', x: 50, y: 50 },
                { id: 'n2', label: 'Núcleo', type: 'concept', x: 25, y: 30 },
                { id: 'n3', label: 'Mitocondria', type: 'concept', x: 75, y: 30 },
                { id: 'n4', label: 'Ribosomas', type: 'concept', x: 25, y: 70 },
                { id: 'n5', label: 'Membrana', type: 'concept', x: 75, y: 70 }
            ],
            connections: [
                { from: 'n1', to: 'n2', label: 'contiene' },
                { from: 'n1', to: 'n3', label: 'tiene' },
                { from: 'n1', to: 'n4', label: 'posee' },
                { from: 'n1', to: 'n5', label: 'está cubierta por' }
            ],
            shuffledLabels: ['energía', 'síntesis de proteínas', 'ADN', 'protección']
        },
        {
            id: 'bio2',
            title: 'Fotosíntesis',
            difficulty: 'medium',
            points: 75,
            description: 'Completa el proceso de fotosíntesis',
            nodes: [
                { id: 'n1', label: 'LUZ SOLAR', type: 'input', x: 10, y: 50 },
                { id: 'n2', label: 'CO₂', type: 'input', x: 20, y: 20 },
                { id: 'n3', label: 'H₂O', type: 'input', x: 20, y: 80 },
                { id: 'n4', label: 'CLOROPLASTO', type: 'central', x: 50, y: 50 },
                { id: 'n5', label: 'Glucosa', type: 'output', x: 80, y: 40 },
                { id: 'n6', label: 'O₂', type: 'output', x: 80, y: 60 }
            ],
            connections: [
                { from: 'n1', to: 'n4', label: 'entra en' },
                { from: 'n2', to: 'n4', label: 'absorbido por' },
                { from: 'n3', to: 'n4', label: 'usado por' },
                { from: 'n4', to: 'n5', label: 'produce' },
                { from: 'n4', to: 'n6', label: 'libera' }
            ],
            shuffledLabels: ['energía', 'alimento', 'respiración', 'oxígeno']
        }
    ],
    historia: [
        {
            id: 'his1',
            title: 'Causas de la Independencia',
            difficulty: 'medium',
            points: 75,
            description: 'Conecta las causas y efectos',
            nodes: [
                { id: 'n1', label: 'INDEPENDENCIA', type: 'central', x: 50, y: 50 },
                { id: 'n2', label: 'Invasión Napoleónica', type: 'cause', x: 20, y: 20 },
                { id: 'n3', label: 'Ideas Ilustradas', type: 'cause', x: 80, y: 20 },
                { id: 'n4', label: 'Crisis Económica', type: 'cause', x: 20, y: 80 },
                { id: 'n5', label: 'Desigualdad Social', type: 'cause', x: 80, y: 80 }
            ],
            connections: [
                { from: 'n2', to: 'n1', label: 'provoca' },
                { from: 'n3', to: 'n1', label: 'influye en' },
                { from: 'n4', to: 'n1', label: 'impulsa' },
                { from: 'n5', to: 'n1', label: 'motiva' }
            ],
            shuffledLabels: ['libertad', 'igualdad', 'autonomía', 'revolución']
        }
    ],
    matematicas: [
        {
            id: 'mat1',
            title: 'Tipos de Triángulos',
            difficulty: 'easy',
            points: 50,
            description: 'Clasifica los triángulos por sus lados',
            nodes: [
                { id: 'n1', label: 'TRIÁNGULOS', type: 'central', x: 50, y: 20 },
                { id: 'n2', label: 'Equilátero', type: 'concept', x: 25, y: 50 },
                { id: 'n3', label: 'Isósceles', type: 'concept', x: 50, y: 50 },
                { id: 'n4', label: 'Escaleno', type: 'concept', x: 75, y: 50 },
                { id: 'n5', label: '3 lados iguales', type: 'property', x: 25, y: 80 },
                { id: 'n6', label: '2 lados iguales', type: 'property', x: 50, y: 80 },
                { id: 'n7', label: '0 lados iguales', type: 'property', x: 75, y: 80 }
            ],
            connections: [
                { from: 'n1', to: 'n2', label: 'tipo' },
                { from: 'n1', to: 'n3', label: 'tipo' },
                { from: 'n1', to: 'n4', label: 'tipo' },
                { from: 'n2', to: 'n5', label: 'tiene' },
                { from: 'n3', to: 'n6', label: 'tiene' },
                { from: 'n4', to: 'n7', label: 'tiene' }
            ],
            shuffledLabels: ['60°', '90°', 'perímetro', 'área']
        }
    ],
    quimica: [
        {
            id: 'qui1',
            title: 'Estados de la Materia',
            difficulty: 'easy',
            points: 50,
            description: 'Organiza los cambios de estado',
            nodes: [
                { id: 'n1', label: 'SÓLIDO', type: 'state', x: 20, y: 50 },
                { id: 'n2', label: 'LÍQUIDO', type: 'state', x: 50, y: 50 },
                { id: 'n3', label: 'GASEOSO', type: 'state', x: 80, y: 50 }
            ],
            connections: [
                { from: 'n1', to: 'n2', label: 'fusión' },
                { from: 'n2', to: 'n3', label: 'evaporación' },
                { from: 'n3', to: 'n2', label: 'condensación' },
                { from: 'n2', to: 'n1', label: 'solidificación' }
            ],
            shuffledLabels: ['sublimación', 'deposición', 'temperatura', 'presión']
        }
    ]
};

// Recompensas
const REWARDS = {
    easy: { coins: 15, xp: 30 },
    medium: { coins: 25, xp: 50 },
    hard: { coins: 40, xp: 80 },
    perfect: { bonus: 20 }
};

// =============================================
// GET /api/games/concepts/topics
// Obtener temas disponibles
// =============================================
router.get('/topics', async (req, res) => {
    try {
        const topics = Object.keys(CONCEPT_MAPS).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            mapCount: CONCEPT_MAPS[key].length,
            icon: getTopicIcon(key)
        }));

        res.json({
            success: true,
            topics
        });
    } catch (error) {
        console.error('[CONCEPTS] Error:', error);
        res.status(500).json({ error: 'Error al obtener temas' });
    }
});

function getTopicIcon(topic) {
    const icons = {
        biologia: '🧬',
        historia: '📜',
        matematicas: '📐',
        quimica: '⚗️'
    };
    return icons[topic] || '📚';
}

// =============================================
// GET /api/games/concepts/maps/:topic
// Obtener mapas de un tema
// =============================================
router.get('/maps/:topic', async (req, res) => {
    try {
        const { topic } = req.params;
        const maps = CONCEPT_MAPS[topic];

        if (!maps) {
            return res.status(404).json({ error: 'Tema no encontrado' });
        }

        // Enviar info sin soluciones
        const safeMaps = maps.map(m => ({
            id: m.id,
            title: m.title,
            difficulty: m.difficulty,
            points: m.points,
            description: m.description
        }));

        res.json({
            success: true,
            topic,
            maps: safeMaps
        });
    } catch (error) {
        console.error('[CONCEPTS] Error:', error);
        res.status(500).json({ error: 'Error al obtener mapas' });
    }
});

// =============================================
// POST /api/games/concepts/start
// Iniciar un mapa conceptual
// =============================================
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { topic, mapId } = req.body;

        const maps = CONCEPT_MAPS[topic];
        if (!maps) {
            return res.status(404).json({ error: 'Tema no encontrado' });
        }

        const map = maps.find(m => m.id === mapId);
        if (!map) {
            return res.status(404).json({ error: 'Mapa no encontrado' });
        }

        // Crear sesión
        const sessionId = `concept_${Date.now()}_${userId}`;

        global.conceptGames = global.conceptGames || {};
        global.conceptGames[sessionId] = {
            userId,
            topic,
            mapId,
            map: { ...map },
            startedAt: new Date(),
            attempts: 0,
            hints: 3
        };

        // Preparar para cliente (sin respuestas completas)
        const clientMap = {
            id: map.id,
            title: map.title,
            difficulty: map.difficulty,
            points: map.points,
            description: map.description,
            nodes: map.nodes,
            connections: map.connections.map(c => ({
                from: c.from,
                to: c.to,
                label: '' // Sin etiqueta, el usuario debe llenarla
            })),
            availableLabels: shuffleArray([
                ...map.connections.map(c => c.label),
                ...map.shuffledLabels
            ])
        };

        res.json({
            success: true,
            sessionId,
            map: clientMap,
            hints: 3
        });

    } catch (error) {
        console.error('[CONCEPTS] Error:', error);
        res.status(500).json({ error: 'Error al iniciar mapa' });
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
// POST /api/games/concepts/submit
// Enviar solución
// =============================================
router.post('/submit', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { sessionId, userConnections } = req.body;

        if (!global.conceptGames || !global.conceptGames[sessionId]) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        const session = global.conceptGames[sessionId];

        if (session.userId !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        session.attempts++;
        const map = session.map;

        // Verificar respuestas
        let correct = 0;
        const total = map.connections.length;
        const results = [];

        map.connections.forEach(correctConn => {
            const userConn = userConnections.find(
                u => u.from === correctConn.from && u.to === correctConn.to
            );

            const isCorrect = userConn && userConn.label.toLowerCase() === correctConn.label.toLowerCase();

            results.push({
                from: correctConn.from,
                to: correctConn.to,
                userLabel: userConn ? userConn.label : '',
                correctLabel: correctConn.label,
                isCorrect
            });

            if (isCorrect) correct++;
        });

        const accuracy = (correct / total) * 100;
        const isPerfect = correct === total;

        // Si es correcto, calcular recompensas
        if (isPerfect) {
            const baseReward = REWARDS[map.difficulty];
            let coinsEarned = baseReward.coins;
            let xpEarned = baseReward.xp;

            // Bonus por pocos intentos
            if (session.attempts === 1) {
                coinsEarned += REWARDS.perfect.bonus;
            }

            // Penalización por pistas usadas
            const hintsUsed = 3 - session.hints;
            coinsEarned = Math.max(5, coinsEarned - (hintsUsed * 5));

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

            // Registrar transacción
            await client.query(
                `INSERT INTO wallet_history 
                 (user_id, transaction_type, amount, balance_after, description, metadata)
                 VALUES ($1, 'earn', $2, $3, $4, $5)`,
                [
                    userId,
                    coinsEarned,
                    newBalance,
                    `Constructor de Conceptos - ${map.title}`,
                    JSON.stringify({
                        map_id: map.id,
                        topic: session.topic,
                        attempts: session.attempts,
                        hints_used: hintsUsed
                    })
                ]
            );

            // Guardar en game_sessions
            try {
                await client.query(
                    `INSERT INTO game_sessions 
                     (user_id, game_type, score, coins_earned, xp_earned, metadata, completed_at)
                     VALUES ($1, 'concept_builder', $2, $3, $4, $5, NOW())`,
                    [userId, map.points, coinsEarned, xpEarned, JSON.stringify({
                        map_id: map.id,
                        topic: session.topic,
                        attempts: session.attempts
                    })]
                );
            } catch (e) {
                // Tabla puede no existir
            }

            await client.query('COMMIT');

            // Limpiar sesión
            delete global.conceptGames[sessionId];

            res.json({
                success: true,
                completed: true,
                results,
                correct,
                total,
                accuracy: Math.round(accuracy),
                attempts: session.attempts,
                coinsEarned,
                xpEarned,
                newBalance,
                firstTry: session.attempts === 1
            });

        } else {
            res.json({
                success: true,
                completed: false,
                results,
                correct,
                total,
                accuracy: Math.round(accuracy),
                attempts: session.attempts,
                hintsRemaining: session.hints
            });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[CONCEPTS] Error:', error);
        res.status(500).json({ error: 'Error al procesar' });
    } finally {
        client.release();
    }
});

// =============================================
// POST /api/games/concepts/hint
// Obtener pista
// =============================================
router.post('/hint', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId, connectionIndex } = req.body;

        if (!global.conceptGames || !global.conceptGames[sessionId]) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        const session = global.conceptGames[sessionId];

        if (session.userId !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (session.hints <= 0) {
            return res.status(400).json({ error: 'No quedan pistas' });
        }

        session.hints--;

        const connection = session.map.connections[connectionIndex];
        if (!connection) {
            return res.status(400).json({ error: 'Conexión no válida' });
        }

        // Dar pista parcial
        const label = connection.label;
        const hint = label.charAt(0) + '...' + label.charAt(label.length - 1);

        res.json({
            success: true,
            hint,
            hintsRemaining: session.hints
        });

    } catch (error) {
        console.error('[CONCEPTS] Error:', error);
        res.status(500).json({ error: 'Error al obtener pista' });
    }
});

// =============================================
// GET /api/games/concepts/stats
// Estadísticas del usuario
// =============================================
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        let stats = {
            mapsCompleted: 0,
            totalCoins: 0,
            perfectMaps: 0,
            averageAttempts: 0
        };

        try {
            const row = await GamificationDAO.getConceptBuilderStats(userId);
            if (row) {
                stats.mapsCompleted = parseInt(row.maps_completed) || 0;
                stats.totalCoins = parseInt(row.total_coins) || 0;
                stats.averageAttempts = Math.round(parseFloat(row.avg_attempts) || 0);
            }
        } catch (e) {
            console.log('[CONCEPTS] No se pudo obtener stats:', e.message);
        }

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('[CONCEPTS] Error:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;

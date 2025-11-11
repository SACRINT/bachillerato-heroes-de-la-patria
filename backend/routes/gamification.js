/**
 * 🎮 RUTAS DE GAMIFICACIÓN
 * Sistema de logros, puntuaciones y mecánicas educativas
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// ============================================
// SISTEMA DE PUNTUACIONES Y LOGROS
// ============================================

/**
 * GET /api/gamification/profile/:userId
 * Obtener perfil de gamificación del usuario
 */
router.get('/profile/:userId', authenticateToken, async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Verificar que el usuario puede acceder a este perfil
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Solo puedes ver tu propio perfil'
            });
        }

        devLogger.log(`🎮 [GAMIFICATION] Obteniendo perfil de gamificación para usuario ${userId}`);

        // Simular datos de gamificación (hasta tener base de datos real)
        const gamificationProfile = {
            userId: parseInt(userId),
            level: Math.floor(Math.random() * 20) + 1,
            totalPoints: Math.floor(Math.random() * 5000) + 500,
            weeklyPoints: Math.floor(Math.random() * 200) + 50,
            streak: Math.floor(Math.random() * 30) + 1,
            rank: Math.floor(Math.random() * 100) + 1,
            badges: [
                {
                    id: 'early_bird',
                    name: 'Madrugador',
                    description: 'Accede al sistema antes de las 8:00 AM',
                    icon: '🌅',
                    rarity: 'common',
                    earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'homework_master',
                    name: 'Maestro de Tareas',
                    description: 'Completa 10 tareas consecutivas a tiempo',
                    icon: '📚',
                    rarity: 'rare',
                    earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'social_learner',
                    name: 'Aprendiz Social',
                    description: 'Participa en 5 discusiones de clase',
                    icon: '👥',
                    rarity: 'uncommon',
                    earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                }
            ],
            recentAchievements: [
                {
                    id: 'perfect_attendance',
                    name: 'Asistencia Perfecta',
                    description: 'No faltar en toda la semana',
                    points: 100,
                    earnedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'quick_learner',
                    name: 'Aprendizaje Rápido',
                    description: 'Completar una lección en menos de 5 minutos',
                    points: 50,
                    earnedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
                }
            ],
            stats: {
                tasksCompleted: Math.floor(Math.random() * 150) + 50,
                lessonsFinished: Math.floor(Math.random() * 80) + 20,
                forumPosts: Math.floor(Math.random() * 30) + 5,
                studyTimeHours: Math.floor(Math.random() * 200) + 50
            }
        };

        devLogger.log('✅ Perfil de gamificación consultado', {
            userId: userId,
            requestedBy: req.user.id
        });

        res.json({
            success: true,
            data: gamificationProfile
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification/leaderboard
 * Obtener tabla de clasificación
 */
router.get('/leaderboard', authenticateToken, async (req, res, next) => {
    try {
        const { type = 'weekly', limit = 10 } = req.query;

        devLogger.log(`🏆 [GAMIFICATION] Obteniendo leaderboard tipo: ${type}`);

        // Simular leaderboard
        const leaderboard = [];
        const users = [];  // Datos simulados sin acceso a BD

        for (let i = 0; i < Math.min(limit, users.length + 7); i++) {
            const baseUser = users[i % users.length];
            leaderboard.push({
                rank: i + 1,
                userId: baseUser?.id || i + 100,
                username: baseUser?.username || `Usuario${i + 1}`,
                displayName: baseUser?.nombre || `Estudiante ${i + 1}`,
                role: baseUser?.role || 'student',
                points: Math.floor(Math.random() * 2000) + (1000 - i * 50),
                level: Math.floor(Math.random() * 15) + 5,
                badges: Math.floor(Math.random() * 8) + 2,
                trend: Math.random() > 0.5 ? 'up' : 'down',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${baseUser?.username || `user${i}`}`
            });
        }

        // Ordenar por puntos
        leaderboard.sort((a, b) => b.points - a.points);

        // Actualizar ranks
        leaderboard.forEach((user, index) => {
            user.rank = index + 1;
        });

        res.json({
            success: true,
            data: {
                type: type,
                period: type === 'weekly' ? 'Esta semana' : type === 'monthly' ? 'Este mes' : 'Todo el tiempo',
                lastUpdated: new Date().toISOString(),
                leaderboard: leaderboard
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/gamification/award-points
 * Otorgar puntos por actividad
 */
router.post('/award-points', authenticateToken, async (req, res, next) => {
    try {
        const { activity, points, metadata } = req.body;

        devLogger.log(`⭐ [GAMIFICATION] Otorgando ${points} puntos por actividad: ${activity}`);

        // Validar actividad
        const validActivities = [
            'login', 'task_completed', 'lesson_finished', 'forum_post',
            'attendance', 'quiz_passed', 'homework_submitted', 'collaboration'
        ];

        if (!validActivities.includes(activity)) {
            return res.status(400).json({
                error: 'Actividad inválida',
                message: 'La actividad especificada no es válida'
            });
        }

        // Calcular puntos basados en la actividad
        const pointsMap = {
            login: 5,
            task_completed: 25,
            lesson_finished: 50,
            forum_post: 15,
            attendance: 10,
            quiz_passed: 75,
            homework_submitted: 100,
            collaboration: 30
        };

        const earnedPoints = points || pointsMap[activity] || 10;

        // Simular actualización de puntos
        const result = {
            success: true,
            activity: activity,
            pointsEarned: earnedPoints,
            newTotal: Math.floor(Math.random() * 5000) + earnedPoints,
            achievements: []
        };

        // Verificar si se desbloquearon logros
        const achievements = [
            {
                condition: () => result.newTotal >= 1000,
                achievement: {
                    id: 'first_milestone',
                    name: 'Primer Hito',
                    description: 'Alcanzar 1000 puntos',
                    icon: '🎯',
                    points: 100
                }
            },
            {
                condition: () => activity === 'quiz_passed' && earnedPoints >= 75,
                achievement: {
                    id: 'quiz_master',
                    name: 'Maestro de Exámenes',
                    description: 'Obtener puntuación perfecta en un quiz',
                    icon: '🧠',
                    points: 150
                }
            }
        ];

        achievements.forEach(({ condition, achievement }) => {
            if (condition()) {
                result.achievements.push(achievement);
                result.newTotal += achievement.points;
            }
        });

        devLogger.log('⭐ Puntos otorgados en gamificación', {
            userId: req.user.id,
            activity: activity,
            points: earnedPoints,
            metadata: metadata
        });

        res.json(result);

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification/achievements
 * Obtener lista de logros disponibles
 */
router.get('/achievements', authenticateToken, async (req, res, next) => {
    try {
        devLogger.log('🏅 [GAMIFICATION] Obteniendo lista de logros disponibles');

        const achievements = [
            {
                id: 'early_bird',
                name: 'Madrugador',
                description: 'Accede al sistema antes de las 8:00 AM durante 5 días consecutivos',
                icon: '🌅',
                category: 'attendance',
                rarity: 'common',
                points: 50,
                progress: {
                    current: Math.floor(Math.random() * 5),
                    required: 5
                }
            },
            {
                id: 'homework_master',
                name: 'Maestro de Tareas',
                description: 'Completa 20 tareas consecutivas a tiempo',
                icon: '📚',
                category: 'academic',
                rarity: 'rare',
                points: 200,
                progress: {
                    current: Math.floor(Math.random() * 20),
                    required: 20
                }
            },
            {
                id: 'social_learner',
                name: 'Aprendiz Social',
                description: 'Participa en 10 discusiones de clase',
                icon: '👥',
                category: 'social',
                rarity: 'uncommon',
                points: 100,
                progress: {
                    current: Math.floor(Math.random() * 10),
                    required: 10
                }
            },
            {
                id: 'perfect_week',
                name: 'Semana Perfecta',
                description: 'Completa todas las actividades de la semana',
                icon: '⭐',
                category: 'achievement',
                rarity: 'epic',
                points: 500,
                progress: {
                    current: Math.floor(Math.random() * 7),
                    required: 7
                }
            },
            {
                id: 'knowledge_seeker',
                name: 'Buscador de Conocimiento',
                description: 'Completa 50 lecciones',
                icon: '🔍',
                category: 'learning',
                rarity: 'rare',
                points: 300,
                progress: {
                    current: Math.floor(Math.random() * 50),
                    required: 50
                }
            },
            {
                id: 'collaboration_king',
                name: 'Rey de la Colaboración',
                description: 'Ayuda a 15 compañeros en proyectos',
                icon: '👑',
                category: 'social',
                rarity: 'legendary',
                points: 750,
                progress: {
                    current: Math.floor(Math.random() * 15),
                    required: 15
                }
            }
        ];

        res.json({
            success: true,
            data: {
                achievements: achievements,
                categories: ['attendance', 'academic', 'social', 'learning', 'achievement'],
                rarities: {
                    common: { color: '#6c757d', multiplier: 1 },
                    uncommon: { color: '#28a745', multiplier: 1.5 },
                    rare: { color: '#007bff', multiplier: 2 },
                    epic: { color: '#6f42c1', multiplier: 3 },
                    legendary: { color: '#fd7e14', multiplier: 5 }
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification/daily-challenges
 * Obtener desafíos diarios
 */
router.get('/daily-challenges', authenticateToken, async (req, res, next) => {
    try {
        devLogger.log('📅 [GAMIFICATION] Obteniendo desafíos diarios');

        // Generar desafíos dinámicos basados en el día
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

        const challengePool = [
            {
                id: 'early_login',
                title: 'Madrugador',
                description: 'Inicia sesión antes de las 8:00 AM',
                icon: '🌅',
                points: 25,
                difficulty: 'easy',
                category: 'attendance'
            },
            {
                id: 'complete_tasks',
                title: 'Productivo',
                description: 'Completa 3 tareas diferentes',
                icon: '✅',
                points: 75,
                difficulty: 'medium',
                category: 'academic'
            },
            {
                id: 'forum_participation',
                title: 'Participativo',
                description: 'Haz 2 comentarios constructivos en el foro',
                icon: '💬',
                points: 50,
                difficulty: 'medium',
                category: 'social'
            },
            {
                id: 'study_streak',
                title: 'Constante',
                description: 'Estudia por al menos 30 minutos',
                icon: '📖',
                points: 40,
                difficulty: 'easy',
                category: 'learning'
            },
            {
                id: 'perfect_quiz',
                title: 'Perfeccionista',
                description: 'Obtén 100% en un quiz',
                icon: '🎯',
                points: 100,
                difficulty: 'hard',
                category: 'academic'
            }
        ];

        // Seleccionar 3 desafíos para hoy
        const dailyChallenges = [];
        const selectedIndices = new Set();

        while (dailyChallenges.length < 3 && selectedIndices.size < challengePool.length) {
            const index = (dayOfYear + dailyChallenges.length * 7) % challengePool.length;
            if (!selectedIndices.has(index)) {
                selectedIndices.add(index);
                const challenge = {
                    ...challengePool[index],
                    progress: Math.floor(Math.random() * 100),
                    completed: Math.random() > 0.7,
                    expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
                };
                dailyChallenges.push(challenge);
            }
        }

        res.json({
            success: true,
            data: {
                date: today.toISOString().split('T')[0],
                challenges: dailyChallenges,
                totalPossiblePoints: dailyChallenges.reduce((sum, c) => sum + c.points, 0),
                completedToday: dailyChallenges.filter(c => c.completed).length,
                streakDays: Math.floor(Math.random() * 10) + 1
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/gamification/complete-challenge
 * Completar un desafío
 */
router.post('/complete-challenge', authenticateToken, async (req, res, next) => {
    try {
        const { challengeId, evidence } = req.body;

        devLogger.log(`🎯 [GAMIFICATION] Completando desafío: ${challengeId}`);

        // Simular verificación y completado del desafío
        const challenge = {
            id: challengeId,
            completed: true,
            completedAt: new Date().toISOString(),
            pointsEarned: Math.floor(Math.random() * 100) + 25,
            bonusMultiplier: Math.random() > 0.8 ? 2 : 1
        };

        const totalPoints = challenge.pointsEarned * challenge.bonusMultiplier;

        devLogger.log('🎯 Desafío completado', {
            userId: req.user.id,
            challengeId: challengeId,
            points: totalPoints
        });

        res.json({
            success: true,
            message: '¡Desafío completado!',
            data: {
                challenge: challenge,
                totalPointsEarned: totalPoints,
                newTotalPoints: Math.floor(Math.random() * 5000) + totalPoints,
                bonusApplied: challenge.bonusMultiplier > 1
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification/profile/:userId (Versión Pública)
 * Obtener perfil de gamificación sin autenticación requerida
 */
router.get('/profile/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;

        devLogger.log(`🎮 [GAMIFICATION PUBLIC] Obteniendo perfil de gamificación para usuario ${userId}`);

        // Datos simulados públicos
        const gamificationProfile = {
            userId: parseInt(userId),
            level: Math.floor(Math.random() * 20) + 1,
            totalPoints: Math.floor(Math.random() * 5000) + 500,
            weeklyPoints: Math.floor(Math.random() * 200) + 50,
            streak: Math.floor(Math.random() * 30) + 1,
            rank: Math.floor(Math.random() * 100) + 1,
            badges: [
                {
                    id: 'early_bird',
                    name: 'Madrugador',
                    description: 'Accede al sistema antes de las 8:00 AM',
                    icon: '🌅',
                    rarity: 'common',
                    earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
        };

        res.json({
            success: true,
            data: gamificationProfile
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification/daily-challenges (Versión Pública)
 * Obtener desafíos diarios sin autenticación requerida
 */
router.get('/daily-challenges', async (req, res, next) => {
    try {
        devLogger.log('🎯 [GAMIFICATION PUBLIC] Obteniendo desafíos diarios');

        const challenges = [
            {
                id: 'login_daily',
                title: 'Acceso Diario',
                description: 'Inicia sesión en el sistema',
                icon: '🔐',
                points: 5,
                difficulty: 'easy',
                completed: false,
                completedAt: null
            },
            {
                id: 'lesson_complete',
                title: 'Completar Lección',
                description: 'Completa al menos una lección',
                icon: '📚',
                points: 25,
                difficulty: 'medium',
                completed: false,
                completedAt: null
            },
            {
                id: 'quiz_challenge',
                title: 'Quiz Magistral',
                description: 'Obtén 100% en un quiz',
                icon: '🧠',
                points: 50,
                difficulty: 'hard',
                completed: false,
                completedAt: null
            }
        ];

        res.json({
            success: true,
            data: {
                date: new Date().toISOString().split('T')[0],
                challenges: challenges,
                totalPointsAvailable: challenges.reduce((sum, c) => sum + c.points, 0)
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
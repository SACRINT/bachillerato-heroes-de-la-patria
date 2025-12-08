/**
 * 🎮 RUTAS DE GAMIFICACIÓN - TypeScript
 * Sistema de logros, puntuaciones y mecánicas educativas
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        role: string;
    };
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    earnedAt: string;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    points: number;
    progress?: { current: number; required: number };
}

interface GamificationProfile {
    userId: number;
    level: number;
    totalPoints: number;
    weeklyPoints: number;
    streak: number;
    rank: number;
    badges: Badge[];
    recentAchievements?: Achievement[];
    stats?: Record<string, number>;
}

interface LeaderboardEntry {
    rank: number;
    userId: number;
    username: string;
    displayName: string;
    role: string;
    points: number;
    level: number;
    badges: number;
    trend: 'up' | 'down';
    avatar: string;
}

interface DailyChallenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    progress?: number;
    completed?: boolean;
    expiresAt?: string;
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/gamification/profile/:userId
 */
router.get('/profile/:userId', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { userId } = req.params;

        if (authReq.user.id !== parseInt(userId) && authReq.user.role !== 'admin') {
            res.status(403).json({ error: 'Acceso denegado', message: 'Solo puedes ver tu propio perfil' });
            return;
        }

        debugLog.log('GAMIFICATION', `🎮 [GAMIFICATION] Obteniendo perfil de gamificación para usuario ${userId}`);

        const gamificationProfile: GamificationProfile = {
            userId: parseInt(userId),
            level: Math.floor(Math.random() * 20) + 1,
            totalPoints: Math.floor(Math.random() * 5000) + 500,
            weeklyPoints: Math.floor(Math.random() * 200) + 50,
            streak: Math.floor(Math.random() * 30) + 1,
            rank: Math.floor(Math.random() * 100) + 1,
            badges: [
                { id: 'early_bird', name: 'Madrugador', description: 'Accede al sistema antes de las 8:00 AM', icon: '🌅', rarity: 'common', earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
                { id: 'homework_master', name: 'Maestro de Tareas', description: 'Completa 10 tareas consecutivas a tiempo', icon: '📚', rarity: 'rare', earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
                { id: 'social_learner', name: 'Aprendiz Social', description: 'Participa en 5 discusiones de clase', icon: '👥', rarity: 'uncommon', earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            recentAchievements: [
                { id: 'perfect_attendance', name: 'Asistencia Perfecta', description: 'No faltar en toda la semana', icon: '✅', category: 'attendance', rarity: 'common', points: 100 },
                { id: 'quick_learner', name: 'Aprendizaje Rápido', description: 'Completar una lección en menos de 5 minutos', icon: '⚡', category: 'learning', rarity: 'uncommon', points: 50 }
            ],
            stats: { tasksCompleted: Math.floor(Math.random() * 150) + 50, lessonsFinished: Math.floor(Math.random() * 80) + 20, forumPosts: Math.floor(Math.random() * 30) + 5, studyTimeHours: Math.floor(Math.random() * 200) + 50 }
        };

        res.json({ success: true, data: gamificationProfile });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification/leaderboard
 */
router.get('/leaderboard', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { type = 'weekly', limit = '10' } = req.query as { type?: string; limit?: string };
        const limitNum = parseInt(limit);

        debugLog.log('GAMIFICATION', `🏆 [GAMIFICATION] Obteniendo leaderboard tipo: ${type}`);

        const leaderboard: LeaderboardEntry[] = [];
        for (let i = 0; i < Math.min(limitNum, 10); i++) {
            leaderboard.push({
                rank: i + 1,
                userId: i + 100,
                username: `Usuario${i + 1}`,
                displayName: `Estudiante ${i + 1}`,
                role: 'student',
                points: Math.floor(Math.random() * 2000) + (1000 - i * 50),
                level: Math.floor(Math.random() * 15) + 5,
                badges: Math.floor(Math.random() * 8) + 2,
                trend: Math.random() > 0.5 ? 'up' : 'down',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`
            });
        }
        leaderboard.sort((a, b) => b.points - a.points);
        leaderboard.forEach((user, index) => { user.rank = index + 1; });

        res.json({ success: true, data: { type, period: type === 'weekly' ? 'Esta semana' : type === 'monthly' ? 'Este mes' : 'Todo el tiempo', lastUpdated: new Date().toISOString(), leaderboard } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/gamification/award-points
 */
router.post('/award-points', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { activity, points, metadata } = req.body as { activity: string; points?: number; metadata?: Record<string, unknown> };

        debugLog.log('GAMIFICATION', `⭐ [GAMIFICATION] Otorgando puntos por actividad: ${activity}`);

        const validActivities = ['login', 'task_completed', 'lesson_finished', 'forum_post', 'attendance', 'quiz_passed', 'homework_submitted', 'collaboration'];
        if (!validActivities.includes(activity)) {
            res.status(400).json({ error: 'Actividad inválida', message: 'La actividad especificada no es válida' });
            return;
        }

        const pointsMap: Record<string, number> = { login: 5, task_completed: 25, lesson_finished: 50, forum_post: 15, attendance: 10, quiz_passed: 75, homework_submitted: 100, collaboration: 30 };
        const earnedPoints = points || pointsMap[activity] || 10;

        const result = { success: true, activity, pointsEarned: earnedPoints, newTotal: Math.floor(Math.random() * 5000) + earnedPoints, achievements: [] as Achievement[] };

        debugLog.log('GAMIFICATION', '⭐ Puntos otorgados', { userId: authReq.user.id, activity, points: earnedPoints });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification/achievements
 */
router.get('/achievements', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        debugLog.log('GAMIFICATION', '🏅 [GAMIFICATION] Obteniendo lista de logros disponibles');

        const achievements: Achievement[] = [
            { id: 'early_bird', name: 'Madrugador', description: 'Accede al sistema antes de las 8:00 AM durante 5 días consecutivos', icon: '🌅', category: 'attendance', rarity: 'common', points: 50, progress: { current: Math.floor(Math.random() * 5), required: 5 } },
            { id: 'homework_master', name: 'Maestro de Tareas', description: 'Completa 20 tareas consecutivas a tiempo', icon: '📚', category: 'academic', rarity: 'rare', points: 200, progress: { current: Math.floor(Math.random() * 20), required: 20 } },
            { id: 'social_learner', name: 'Aprendiz Social', description: 'Participa en 10 discusiones de clase', icon: '👥', category: 'social', rarity: 'uncommon', points: 100, progress: { current: Math.floor(Math.random() * 10), required: 10 } },
            { id: 'perfect_week', name: 'Semana Perfecta', description: 'Completa todas las actividades de la semana', icon: '⭐', category: 'achievement', rarity: 'epic', points: 500, progress: { current: Math.floor(Math.random() * 7), required: 7 } },
            { id: 'knowledge_seeker', name: 'Buscador de Conocimiento', description: 'Completa 50 lecciones', icon: '🔍', category: 'learning', rarity: 'rare', points: 300, progress: { current: Math.floor(Math.random() * 50), required: 50 } },
            { id: 'collaboration_king', name: 'Rey de la Colaboración', description: 'Ayuda a 15 compañeros en proyectos', icon: '👑', category: 'social', rarity: 'legendary', points: 750, progress: { current: Math.floor(Math.random() * 15), required: 15 } }
        ];

        res.json({ success: true, data: { achievements, categories: ['attendance', 'academic', 'social', 'learning', 'achievement'], rarities: { common: { color: '#6c757d', multiplier: 1 }, uncommon: { color: '#28a745', multiplier: 1.5 }, rare: { color: '#007bff', multiplier: 2 }, epic: { color: '#6f42c1', multiplier: 3 }, legendary: { color: '#fd7e14', multiplier: 5 } } } });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/gamification/daily-challenges
 */
router.get('/daily-challenges', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        debugLog.log('GAMIFICATION', '📅 [GAMIFICATION] Obteniendo desafíos diarios');

        const today = new Date();
        const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

        const challengePool: DailyChallenge[] = [
            { id: 'early_login', title: 'Madrugador', description: 'Inicia sesión antes de las 8:00 AM', icon: '🌅', points: 25, difficulty: 'easy', category: 'attendance' },
            { id: 'complete_tasks', title: 'Productivo', description: 'Completa 3 tareas diferentes', icon: '✅', points: 75, difficulty: 'medium', category: 'academic' },
            { id: 'forum_participation', title: 'Participativo', description: 'Haz 2 comentarios constructivos en el foro', icon: '💬', points: 50, difficulty: 'medium', category: 'social' },
            { id: 'study_streak', title: 'Constante', description: 'Estudia por al menos 30 minutos', icon: '📖', points: 40, difficulty: 'easy', category: 'learning' },
            { id: 'perfect_quiz', title: 'Perfeccionista', description: 'Obtén 100% en un quiz', icon: '🎯', points: 100, difficulty: 'hard', category: 'academic' }
        ];

        const dailyChallenges: DailyChallenge[] = [];
        for (let i = 0; i < 3; i++) {
            const index = (dayOfYear + i * 7) % challengePool.length;
            dailyChallenges.push({ ...challengePool[index], progress: Math.floor(Math.random() * 100), completed: Math.random() > 0.7, expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString() });
        }

        res.json({ success: true, data: { date: today.toISOString().split('T')[0], challenges: dailyChallenges, totalPossiblePoints: dailyChallenges.reduce((sum, c) => sum + c.points, 0), completedToday: dailyChallenges.filter(c => c.completed).length, streakDays: Math.floor(Math.random() * 10) + 1 } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/gamification/complete-challenge
 */
router.post('/complete-challenge', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { challengeId, evidence } = req.body as { challengeId: string; evidence?: string };

        debugLog.log('GAMIFICATION', `🎯 [GAMIFICATION] Completando desafío: ${challengeId}`);

        const challenge = { id: challengeId, completed: true, completedAt: new Date().toISOString(), pointsEarned: Math.floor(Math.random() * 100) + 25, bonusMultiplier: Math.random() > 0.8 ? 2 : 1 };
        const totalPoints = challenge.pointsEarned * challenge.bonusMultiplier;

        debugLog.log('GAMIFICATION', '🎯 Desafío completado', { userId: authReq.user.id, challengeId, points: totalPoints });
        res.json({ success: true, message: '¡Desafío completado!', data: { challenge, totalPointsEarned: totalPoints, newTotalPoints: Math.floor(Math.random() * 5000) + totalPoints, bonusApplied: challenge.bonusMultiplier > 1 } });
    } catch (error) {
        next(error);
    }
});

export default router;

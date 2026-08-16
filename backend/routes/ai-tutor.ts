/**
 * Rutas de Tutor IA Personalizado - TypeScript
 * BGE Héroes de la Patria
 * FASE 3 - Semana 17-18
 * Migrado: 08 Diciembre 2025
 *
 * Endpoints para sistema de tutoría adaptativa con IA
 */

import express, { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
// @ts-ignore
import aiTutorService from '../services/ai-tutor.service';
// @ts-ignore
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Helper para manejar errores de validación
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            errors: errors.array()
        });
        return;
    }
    next();
};

// ========================================
// PERFIL DE APRENDIZAJE
// ========================================

/**
 * GET /api/tutor/profile
 * Obtener perfil de aprendizaje del usuario
 */
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const profile = await aiTutorService.getProfileWithStats(userId);

        res.json({
            success: true,
            data: profile
        });
    } catch (error: any) {
        console.error('[AI-TUTOR] Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil de aprendizaje'
        });
    }
});

/**
 * PUT /api/tutor/profile
 * Actualizar perfil de aprendizaje
 */
router.put('/profile',
    authenticateToken,
    [
        body('learning_style').optional().isIn(['visual', 'auditory', 'reading', 'kinesthetic', 'multimodal']),
        body('preferred_difficulty').optional().isIn(['easy', 'medium', 'hard', 'adaptive']),
        body('daily_goal_minutes').optional().isInt({ min: 5, max: 480 }),
        body('preferred_session_length').optional().isInt({ min: 5, max: 120 }),
        body('notification_preferences').optional().isObject(),
        body('learning_goals').optional().isArray()
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const profileData = req.body;

            const updatedProfile = await aiTutorService.updateProfile(userId, profileData);

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: updatedProfile
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error actualizando perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar perfil'
            });
        }
    }
);

/**
 * PUT /api/tutor/profile/proficiency
 * Actualizar proficiencia en una materia
 */
router.put('/profile/proficiency',
    authenticateToken,
    [
        body('subject').notEmpty().withMessage('Materia requerida'),
        body('score').isFloat({ min: 0, max: 1 }).withMessage('Score debe estar entre 0 y 1')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { subject, score } = req.body;

            const result = await aiTutorService.updateSubjectProficiency(userId, subject, score);

            res.json({
                success: true,
                message: 'Proficiencia actualizada',
                data: result
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error actualizando proficiencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar proficiencia'
            });
        }
    }
);

// ========================================
// SESIONES DE TUTORÍA
// ========================================

/**
 * POST /api/tutor/sessions
 * Iniciar nueva sesión de tutoría
 */
router.post('/sessions',
    authenticateToken,
    [
        body('subject').notEmpty().withMessage('Materia requerida'),
        body('topic').notEmpty().withMessage('Tema requerido'),
        body('session_type').isIn(['lesson', 'quiz', 'practice', 'review']).withMessage('Tipo de sesión inválido'),
        body('initial_difficulty').optional().isIn(['easy', 'medium', 'hard', 'adaptive'])
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const sessionData = req.body;

            const session = await aiTutorService.startSession(userId, sessionData);

            res.status(201).json({
                success: true,
                message: 'Sesión iniciada',
                data: session
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error iniciando sesión:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar sesión'
            });
        }
    }
);

/**
 * POST /api/tutor/sessions/:sessionId/messages
 * Agregar mensaje a sesión de tutoría
 */
router.post('/sessions/:sessionId/messages',
    authenticateToken,
    [
        param('sessionId').isInt().withMessage('ID de sesión inválido'),
        body('role').isIn(['user', 'assistant', 'system']).withMessage('Rol inválido'),
        body('content').notEmpty().withMessage('Contenido requerido')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            const { content } = req.body;
            const userId = (req as any).user.id;

            // Validar que el usuario es dueño de la sesión
            const session = await aiTutorService.getSessionById(sessionId);
            if (!session || session.user_id !== userId) {
                res.status(403).json({ success: false, message: 'Acceso no autorizado a esta sesión.' });
                return;
            }

            const aiResponse = await aiTutorService.processUserMessage(sessionId, content);

            res.status(201).json({
                success: true,
                message: 'Respuesta generada',
                data: aiResponse
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error procesando mensaje:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar el mensaje'
            });
        }
    }
);

/**
 * POST /api/tutor/sessions/:sessionId/end
 * Finalizar sesión de tutoría
 */
router.post('/sessions/:sessionId/end',
    authenticateToken,
    [
        param('sessionId').isInt().withMessage('ID de sesión inválido'),
        body('quiz_score').optional().isFloat({ min: 0, max: 100 }),
        body('concepts_learned').optional().isArray(),
        body('feedback').optional().isString()
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            const sessionResults = req.body;

            const result = await aiTutorService.endSession(sessionId, sessionResults);

            res.json({
                success: true,
                message: 'Sesión finalizada',
                data: result
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error finalizando sesión:', error);
            res.status(500).json({
                success: false,
                message: 'Error al finalizar sesión'
            });
        }
    }
);

/**
 * GET /api/tutor/sessions
 * Obtener historial de sesiones
 */
router.get('/sessions',
    authenticateToken,
    [
        query('subject').optional().isString(),
        query('session_type').optional().isIn(['lesson', 'quiz', 'practice', 'review']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const options = {
                subject: req.query.subject,
                sessionType: req.query.session_type,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20
            };

            const sessions = await aiTutorService.getSessionHistory(userId, options);

            res.json({
                success: true,
                data: sessions
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo historial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial de sesiones'
            });
        }
    }
);

/**
 * GET /api/tutor/sessions/:sessionId
 * Obtener detalles de una sesión específica
 */
router.get('/sessions/:sessionId',
    authenticateToken,
    [
        param('sessionId').isInt().withMessage('ID de sesión inválido')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            const session = await aiTutorService.getSessionById(sessionId);

            if (!session) {
                res.status(404).json({
                    success: false,
                    message: 'Sesión no encontrada'
                });
                return;
            }

            res.json({
                success: true,
                data: session
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo sesión:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener sesión'
            });
        }
    }
);

// ========================================
// RUTAS DE APRENDIZAJE
// ========================================

/**
 * GET /api/tutor/paths
 * Obtener rutas de aprendizaje disponibles
 */
router.get('/paths',
    authenticateToken,
    [
        query('subject').optional().isString(),
        query('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            // Unused
            const userId = (req as any).user.id;
            const options = {
                subject: req.query.subject,
                level: req.query.level,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20
            };

            const paths = await aiTutorService.getLearningPaths(options);

            res.json({
                success: true,
                data: paths
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo rutas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener rutas de aprendizaje'
            });
        }
    }
);

/**
 * GET /api/tutor/paths/:pathId
 * Obtener detalles de una ruta específica
 */
router.get('/paths/:pathId',
    authenticateToken,
    [
        param('pathId').isInt().withMessage('ID de ruta inválido')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { pathId } = req.params;

            const path = await aiTutorService.getPathById(pathId, userId);

            if (!path) {
                res.status(404).json({
                    success: false,
                    message: 'Ruta no encontrada'
                });
                return;
            }

            res.json({
                success: true,
                data: path
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo ruta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ruta'
            });
        }
    }
);

/**
 * POST /api/tutor/paths/:pathId/start
 * Iniciar una ruta de aprendizaje
 */
router.post('/paths/:pathId/start',
    authenticateToken,
    [
        param('pathId').isInt().withMessage('ID de ruta inválido')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { pathId } = req.params;

            const progress = await aiTutorService.startLearningPath(userId, pathId);

            res.status(201).json({
                success: true,
                message: 'Ruta iniciada',
                data: progress
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error iniciando ruta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar ruta'
            });
        }
    }
);

/**
 * PUT /api/tutor/paths/:pathId/progress
 * Actualizar progreso en una ruta
 */
router.put('/paths/:pathId/progress',
    authenticateToken,
    [
        param('pathId').isInt().withMessage('ID de ruta inválido'),
        body('current_module_index').optional().isInt({ min: 0 }),
        body('current_topic_index').optional().isInt({ min: 0 }),
        body('completed_topics').optional().isArray(),
        body('time_spent').optional().isInt({ min: 0 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { pathId } = req.params;
            const progressData = req.body;

            const result = await aiTutorService.updatePathProgress(userId, pathId, progressData);

            res.json({
                success: true,
                message: 'Progreso actualizado',
                data: result
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error actualizando progreso:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar progreso'
            });
        }
    }
);

/**
 * GET /api/tutor/paths/in-progress
 * Obtener rutas en progreso del usuario
 */
router.get('/paths/in-progress', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const paths = await aiTutorService.getUserPathsInProgress(userId);

        res.json({
            success: true,
            data: paths
        });
    } catch (error: any) {
        console.error('[AI-TUTOR] Error obteniendo rutas en progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener rutas en progreso'
        });
    }
});

// ========================================
// RECOMENDACIONES
// ========================================

/**
 * GET /api/tutor/recommendations
 * Obtener recomendaciones activas
 */
router.get('/recommendations',
    authenticateToken,
    [
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const limit = parseInt(req.query.limit as string) || 10;

            const recommendations = await aiTutorService.getActiveRecommendations(userId, limit);

            res.json({
                success: true,
                data: recommendations
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo recomendaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener recomendaciones'
            });
        }
    }
);

/**
 * POST /api/tutor/recommendations/generate
 * Generar nuevas recomendaciones
 */
router.post('/recommendations/generate', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const recommendations = await aiTutorService.generateRecommendations(userId);

        res.json({
            success: true,
            message: 'Recomendaciones generadas',
            data: recommendations
        });
    } catch (error: any) {
        console.error('[AI-TUTOR] Error generando recomendaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar recomendaciones'
        });
    }
});

/**
 * PUT /api/tutor/recommendations/:id/status
 * Actualizar estado de recomendación
 */
router.put('/recommendations/:id/status',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido'),
        body('status').isIn(['viewed', 'started', 'completed', 'dismissed']).withMessage('Estado inválido')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { status } = req.body;

            const result = await aiTutorService.updateRecommendationStatus(userId, id, status);

            res.json({
                success: true,
                message: 'Estado actualizado',
                data: result
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error actualizando recomendación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar recomendación'
            });
        }
    }
);

// ========================================
// DOMINIO DE CONCEPTOS (Spaced Repetition)
// ========================================

/**
 * GET /api/tutor/concepts/review
 * Obtener conceptos para revisar (spaced repetition)
 */
router.get('/concepts/review',
    authenticateToken,
    [
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const limit = parseInt(req.query.limit as string) || 10;

            const concepts = await aiTutorService.getConceptsToReview(userId, limit);

            res.json({
                success: true,
                data: concepts
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo conceptos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener conceptos para revisar'
            });
        }
    }
);

/**
 * PUT /api/tutor/concepts/mastery
 * Actualizar dominio de un concepto
 */
router.put('/concepts/mastery',
    authenticateToken,
    [
        body('subject').notEmpty().withMessage('Materia requerida'),
        body('concept').notEmpty().withMessage('Concepto requerido'),
        body('is_correct').isBoolean().withMessage('is_correct debe ser booleano')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { subject, concept, is_correct } = req.body;

            const result = await aiTutorService.updateConceptMastery(userId, subject, concept, is_correct);

            res.json({
                success: true,
                message: 'Dominio actualizado',
                data: result
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error actualizando dominio:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar dominio'
            });
        }
    }
);

/**
 * GET /api/tutor/concepts/mastery
 * Obtener todos los conceptos dominados por el usuario
 */
router.get('/concepts/mastery',
    authenticateToken,
    [
        query('subject').optional().isString(),
        query('min_mastery').optional().isFloat({ min: 0, max: 1 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const options = {
                subject: req.query.subject,
                minMastery: parseFloat(req.query.min_mastery as string) || 0
            };

            const concepts = await aiTutorService.getUserConceptMastery(userId, options);

            res.json({
                success: true,
                data: concepts
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo dominio:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener dominio de conceptos'
            });
        }
    }
);

// ========================================
// PREGUNTAS Y RESPUESTAS
// ========================================

/**
 * POST /api/tutor/questions
 * Crear una pregunta para el tutor
 */
router.post('/questions',
    authenticateToken,
    [
        body('subject').notEmpty().withMessage('Materia requerida'),
        body('topic').notEmpty().withMessage('Tema requerido'),
        body('question_text').notEmpty().withMessage('Texto de pregunta requerido'),
        body('context').optional().isString()
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const questionData = req.body;

            const question = await aiTutorService.createQuestion(userId, questionData);

            res.status(201).json({
                success: true,
                message: 'Pregunta creada',
                data: question
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error creando pregunta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear pregunta'
            });
        }
    }
);

/**
 * GET /api/tutor/questions
 * Obtener historial de preguntas
 */
router.get('/questions',
    authenticateToken,
    [
        query('subject').optional().isString(),
        query('status').optional().isIn(['pending', 'answered', 'follow_up']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const options = {
                subject: req.query.subject,
                status: req.query.status,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20
            };

            const questions = await aiTutorService.getUserQuestions(userId, options);

            res.json({
                success: true,
                data: questions
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo preguntas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener preguntas'
            });
        }
    }
);

/**
 * POST /api/tutor/questions/:questionId/rate
 * Calificar respuesta del tutor
 */
router.post('/questions/:questionId/rate',
    authenticateToken,
    [
        param('questionId').isInt().withMessage('ID inválido'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe ser 1-5'),
        body('feedback').optional().isString()
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { questionId } = req.params;
            const { rating, feedback } = req.body;

            const result = await aiTutorService.rateAnswer(userId, questionId, rating, feedback);

            res.json({
                success: true,
                message: 'Respuesta calificada',
                data: result
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error calificando respuesta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calificar respuesta'
            });
        }
    }
);

// ========================================
// ESTADÍSTICAS Y ANALYTICS
// ========================================

/**
 * GET /api/tutor/stats
 * Obtener estadísticas detalladas del usuario
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const stats = await aiTutorService.getDetailedStats(userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('[AI-TUTOR] Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

/**
 * GET /api/tutor/stats/weekly
 * Obtener estadísticas semanales
 */
router.get('/stats/weekly', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const stats = await aiTutorService.getWeeklyStats(userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('[AI-TUTOR] Error obteniendo estadísticas semanales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas semanales'
        });
    }
});

/**
 * GET /api/tutor/stats/subjects
 * Obtener estadísticas por materia
 */
router.get('/stats/subjects', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const stats = await aiTutorService.getSubjectStats(userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('[AI-TUTOR] Error obteniendo estadísticas por materia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas por materia'
        });
    }
});

/**
 * GET /api/tutor/difficulty/:subject
 * Calcular dificultad adaptativa para una materia
 */
router.get('/difficulty/:subject',
    authenticateToken,
    [
        param('subject').notEmpty().withMessage('Materia requerida')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { subject } = req.params;

            const difficulty = await aiTutorService.calculateAdaptiveDifficulty(userId, subject);

            res.json({
                success: true,
                data: {
                    subject,
                    recommended_difficulty: difficulty
                }
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error calculando dificultad:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calcular dificultad'
            });
        }
    }
);

// ========================================
// LEADERBOARD Y GAMIFICACIÓN
// ========================================

/**
 * GET /api/tutor/leaderboard
 * Obtener tabla de posiciones del tutor
 */
router.get('/leaderboard',
    authenticateToken,
    [
        query('period').optional().isIn(['weekly', 'monthly', 'all_time']),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const options = {
                period: req.query.period || 'weekly',
                limit: parseInt(req.query.limit as string) || 20
            };

            const leaderboard = await aiTutorService.getLeaderboard(options, userId);

            res.json({
                success: true,
                data: leaderboard
            });
        } catch (error: any) {
            console.error('[AI-TUTOR] Error obteniendo leaderboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener leaderboard'
            });
        }
    }
);

/**
 * GET /api/tutor/achievements
 * Obtener logros del usuario
 */
router.get('/achievements', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const achievements = await aiTutorService.getUserAchievements(userId);

        res.json({
            success: true,
            data: achievements
        });
    } catch (error: any) {
        console.error('[AI-TUTOR] Error obteniendo logros:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logros'
        });
    }
});

// @ts-ignore
export = router;

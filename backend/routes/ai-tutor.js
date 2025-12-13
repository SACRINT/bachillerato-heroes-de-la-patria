"use strict";
/**
 * Rutas de Tutor IA Personalizado - TypeScript
 * BGE Héroes de la Patria
 * FASE 3 - Semana 17-18
 * Migrado: 08 Diciembre 2025
 *
 * Endpoints para sistema de tutoría adaptativa con IA
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// @ts-ignore
const AITutorService_1 = __importDefault(require("../services/AITutorService"));
// @ts-ignore
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Helper para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await AITutorService_1.default.getProfileWithStats(userId);
        res.json({
            success: true,
            data: profile
        });
    }
    catch (error) {
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
router.put('/profile', auth_1.authenticateToken, [
    (0, express_validator_1.body)('learning_style').optional().isIn(['visual', 'auditory', 'reading', 'kinesthetic', 'multimodal']),
    (0, express_validator_1.body)('preferred_difficulty').optional().isIn(['easy', 'medium', 'hard', 'adaptive']),
    (0, express_validator_1.body)('daily_goal_minutes').optional().isInt({ min: 5, max: 480 }),
    (0, express_validator_1.body)('preferred_session_length').optional().isInt({ min: 5, max: 120 }),
    (0, express_validator_1.body)('notification_preferences').optional().isObject(),
    (0, express_validator_1.body)('learning_goals').optional().isArray()
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const profileData = req.body;
        const updatedProfile = await AITutorService_1.default.updateProfile(userId, profileData);
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: updatedProfile
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil'
        });
    }
});
/**
 * PUT /api/tutor/profile/proficiency
 * Actualizar proficiencia en una materia
 */
router.put('/profile/proficiency', auth_1.authenticateToken, [
    (0, express_validator_1.body)('subject').notEmpty().withMessage('Materia requerida'),
    (0, express_validator_1.body)('score').isFloat({ min: 0, max: 1 }).withMessage('Score debe estar entre 0 y 1')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject, score } = req.body;
        const result = await AITutorService_1.default.updateSubjectProficiency(userId, subject, score);
        res.json({
            success: true,
            message: 'Proficiencia actualizada',
            data: result
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error actualizando proficiencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar proficiencia'
        });
    }
});
// ========================================
// SESIONES DE TUTORÍA
// ========================================
/**
 * POST /api/tutor/sessions
 * Iniciar nueva sesión de tutoría
 */
router.post('/sessions', auth_1.authenticateToken, [
    (0, express_validator_1.body)('subject').notEmpty().withMessage('Materia requerida'),
    (0, express_validator_1.body)('topic').notEmpty().withMessage('Tema requerido'),
    (0, express_validator_1.body)('session_type').isIn(['lesson', 'quiz', 'practice', 'review']).withMessage('Tipo de sesión inválido'),
    (0, express_validator_1.body)('initial_difficulty').optional().isIn(['easy', 'medium', 'hard', 'adaptive'])
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionData = req.body;
        const session = await AITutorService_1.default.startSession(userId, sessionData);
        res.status(201).json({
            success: true,
            message: 'Sesión iniciada',
            data: session
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error iniciando sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
});
/**
 * POST /api/tutor/sessions/:sessionId/messages
 * Agregar mensaje a sesión de tutoría
 */
router.post('/sessions/:sessionId/messages', auth_1.authenticateToken, [
    (0, express_validator_1.param)('sessionId').isInt().withMessage('ID de sesión inválido'),
    (0, express_validator_1.body)('role').isIn(['user', 'assistant', 'system']).withMessage('Rol inválido'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Contenido requerido')
], handleValidationErrors, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        // Validar que el usuario es dueño de la sesión
        const session = await AITutorService_1.default.getSessionById(sessionId);
        if (!session || session.user_id !== userId) {
            res.status(403).json({ success: false, message: 'Acceso no autorizado a esta sesión.' });
            return;
        }
        const aiResponse = await AITutorService_1.default.processUserMessage(sessionId, content);
        res.status(201).json({
            success: true,
            message: 'Respuesta generada',
            data: aiResponse
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error procesando mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar el mensaje'
        });
    }
});
/**
 * POST /api/tutor/sessions/:sessionId/end
 * Finalizar sesión de tutoría
 */
router.post('/sessions/:sessionId/end', auth_1.authenticateToken, [
    (0, express_validator_1.param)('sessionId').isInt().withMessage('ID de sesión inválido'),
    (0, express_validator_1.body)('quiz_score').optional().isFloat({ min: 0, max: 100 }),
    (0, express_validator_1.body)('concepts_learned').optional().isArray(),
    (0, express_validator_1.body)('feedback').optional().isString()
], handleValidationErrors, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const sessionResults = req.body;
        const result = await AITutorService_1.default.endSession(sessionId, sessionResults);
        res.json({
            success: true,
            message: 'Sesión finalizada',
            data: result
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error finalizando sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al finalizar sesión'
        });
    }
});
/**
 * GET /api/tutor/sessions
 * Obtener historial de sesiones
 */
router.get('/sessions', auth_1.authenticateToken, [
    (0, express_validator_1.query)('subject').optional().isString(),
    (0, express_validator_1.query)('session_type').optional().isIn(['lesson', 'quiz', 'practice', 'review']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const options = {
            subject: req.query.subject,
            sessionType: req.query.session_type,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20
        };
        const sessions = await AITutorService_1.default.getSessionHistory(userId, options);
        res.json({
            success: true,
            data: sessions
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de sesiones'
        });
    }
});
/**
 * GET /api/tutor/sessions/:sessionId
 * Obtener detalles de una sesión específica
 */
router.get('/sessions/:sessionId', auth_1.authenticateToken, [
    (0, express_validator_1.param)('sessionId').isInt().withMessage('ID de sesión inválido')
], handleValidationErrors, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await AITutorService_1.default.getSessionById(sessionId);
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
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener sesión'
        });
    }
});
// ========================================
// RUTAS DE APRENDIZAJE
// ========================================
/**
 * GET /api/tutor/paths
 * Obtener rutas de aprendizaje disponibles
 */
router.get('/paths', auth_1.authenticateToken, [
    (0, express_validator_1.query)('subject').optional().isString(),
    (0, express_validator_1.query)('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
    try {
        // Unused
        const userId = req.user.id;
        const options = {
            subject: req.query.subject,
            level: req.query.level,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20
        };
        const paths = await AITutorService_1.default.getLearningPaths(options);
        res.json({
            success: true,
            data: paths
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo rutas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener rutas de aprendizaje'
        });
    }
});
/**
 * GET /api/tutor/paths/:pathId
 * Obtener detalles de una ruta específica
 */
router.get('/paths/:pathId', auth_1.authenticateToken, [
    (0, express_validator_1.param)('pathId').isInt().withMessage('ID de ruta inválido')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pathId } = req.params;
        const path = await AITutorService_1.default.getPathById(pathId, userId);
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
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo ruta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ruta'
        });
    }
});
/**
 * POST /api/tutor/paths/:pathId/start
 * Iniciar una ruta de aprendizaje
 */
router.post('/paths/:pathId/start', auth_1.authenticateToken, [
    (0, express_validator_1.param)('pathId').isInt().withMessage('ID de ruta inválido')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pathId } = req.params;
        const progress = await AITutorService_1.default.startLearningPath(userId, pathId);
        res.status(201).json({
            success: true,
            message: 'Ruta iniciada',
            data: progress
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error iniciando ruta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar ruta'
        });
    }
});
/**
 * PUT /api/tutor/paths/:pathId/progress
 * Actualizar progreso en una ruta
 */
router.put('/paths/:pathId/progress', auth_1.authenticateToken, [
    (0, express_validator_1.param)('pathId').isInt().withMessage('ID de ruta inválido'),
    (0, express_validator_1.body)('current_module_index').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('current_topic_index').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('completed_topics').optional().isArray(),
    (0, express_validator_1.body)('time_spent').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pathId } = req.params;
        const progressData = req.body;
        const result = await AITutorService_1.default.updatePathProgress(userId, pathId, progressData);
        res.json({
            success: true,
            message: 'Progreso actualizado',
            data: result
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error actualizando progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar progreso'
        });
    }
});
/**
 * GET /api/tutor/paths/in-progress
 * Obtener rutas en progreso del usuario
 */
router.get('/paths/in-progress', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const paths = await AITutorService_1.default.getUserPathsInProgress(userId);
        res.json({
            success: true,
            data: paths
        });
    }
    catch (error) {
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
router.get('/recommendations', auth_1.authenticateToken, [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        const recommendations = await AITutorService_1.default.getActiveRecommendations(userId, limit);
        res.json({
            success: true,
            data: recommendations
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo recomendaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recomendaciones'
        });
    }
});
/**
 * POST /api/tutor/recommendations/generate
 * Generar nuevas recomendaciones
 */
router.post('/recommendations/generate', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const recommendations = await AITutorService_1.default.generateRecommendations(userId);
        res.json({
            success: true,
            message: 'Recomendaciones generadas',
            data: recommendations
        });
    }
    catch (error) {
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
router.put('/recommendations/:id/status', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt().withMessage('ID inválido'),
    (0, express_validator_1.body)('status').isIn(['viewed', 'started', 'completed', 'dismissed']).withMessage('Estado inválido')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;
        const result = await AITutorService_1.default.updateRecommendationStatus(userId, id, status);
        res.json({
            success: true,
            message: 'Estado actualizado',
            data: result
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error actualizando recomendación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar recomendación'
        });
    }
});
// ========================================
// DOMINIO DE CONCEPTOS (Spaced Repetition)
// ========================================
/**
 * GET /api/tutor/concepts/review
 * Obtener conceptos para revisar (spaced repetition)
 */
router.get('/concepts/review', auth_1.authenticateToken, [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        const concepts = await AITutorService_1.default.getConceptsToReview(userId, limit);
        res.json({
            success: true,
            data: concepts
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo conceptos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conceptos para revisar'
        });
    }
});
/**
 * PUT /api/tutor/concepts/mastery
 * Actualizar dominio de un concepto
 */
router.put('/concepts/mastery', auth_1.authenticateToken, [
    (0, express_validator_1.body)('subject').notEmpty().withMessage('Materia requerida'),
    (0, express_validator_1.body)('concept').notEmpty().withMessage('Concepto requerido'),
    (0, express_validator_1.body)('is_correct').isBoolean().withMessage('is_correct debe ser booleano')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject, concept, is_correct } = req.body;
        const result = await AITutorService_1.default.updateConceptMastery(userId, subject, concept, is_correct);
        res.json({
            success: true,
            message: 'Dominio actualizado',
            data: result
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error actualizando dominio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar dominio'
        });
    }
});
/**
 * GET /api/tutor/concepts/mastery
 * Obtener todos los conceptos dominados por el usuario
 */
router.get('/concepts/mastery', auth_1.authenticateToken, [
    (0, express_validator_1.query)('subject').optional().isString(),
    (0, express_validator_1.query)('min_mastery').optional().isFloat({ min: 0, max: 1 })
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const options = {
            subject: req.query.subject,
            minMastery: parseFloat(req.query.min_mastery) || 0
        };
        const concepts = await AITutorService_1.default.getUserConceptMastery(userId, options);
        res.json({
            success: true,
            data: concepts
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo dominio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener dominio de conceptos'
        });
    }
});
// ========================================
// PREGUNTAS Y RESPUESTAS
// ========================================
/**
 * POST /api/tutor/questions
 * Crear una pregunta para el tutor
 */
router.post('/questions', auth_1.authenticateToken, [
    (0, express_validator_1.body)('subject').notEmpty().withMessage('Materia requerida'),
    (0, express_validator_1.body)('topic').notEmpty().withMessage('Tema requerido'),
    (0, express_validator_1.body)('question_text').notEmpty().withMessage('Texto de pregunta requerido'),
    (0, express_validator_1.body)('context').optional().isString()
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const questionData = req.body;
        const question = await AITutorService_1.default.createQuestion(userId, questionData);
        res.status(201).json({
            success: true,
            message: 'Pregunta creada',
            data: question
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error creando pregunta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pregunta'
        });
    }
});
/**
 * GET /api/tutor/questions
 * Obtener historial de preguntas
 */
router.get('/questions', auth_1.authenticateToken, [
    (0, express_validator_1.query)('subject').optional().isString(),
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'answered', 'follow_up']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const options = {
            subject: req.query.subject,
            status: req.query.status,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20
        };
        const questions = await AITutorService_1.default.getUserQuestions(userId, options);
        res.json({
            success: true,
            data: questions
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo preguntas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener preguntas'
        });
    }
});
/**
 * POST /api/tutor/questions/:questionId/rate
 * Calificar respuesta del tutor
 */
router.post('/questions/:questionId/rate', auth_1.authenticateToken, [
    (0, express_validator_1.param)('questionId').isInt().withMessage('ID inválido'),
    (0, express_validator_1.body)('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe ser 1-5'),
    (0, express_validator_1.body)('feedback').optional().isString()
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { questionId } = req.params;
        const { rating, feedback } = req.body;
        const result = await AITutorService_1.default.rateAnswer(userId, questionId, rating, feedback);
        res.json({
            success: true,
            message: 'Respuesta calificada',
            data: result
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error calificando respuesta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calificar respuesta'
        });
    }
});
// ========================================
// ESTADÍSTICAS Y ANALYTICS
// ========================================
/**
 * GET /api/tutor/stats
 * Obtener estadísticas detalladas del usuario
 */
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await AITutorService_1.default.getDetailedStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
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
router.get('/stats/weekly', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await AITutorService_1.default.getWeeklyStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
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
router.get('/stats/subjects', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await AITutorService_1.default.getSubjectStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
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
router.get('/difficulty/:subject', auth_1.authenticateToken, [
    (0, express_validator_1.param)('subject').notEmpty().withMessage('Materia requerida')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject } = req.params;
        const difficulty = await AITutorService_1.default.calculateAdaptiveDifficulty(userId, subject);
        res.json({
            success: true,
            data: {
                subject,
                recommended_difficulty: difficulty
            }
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error calculando dificultad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular dificultad'
        });
    }
});
// ========================================
// LEADERBOARD Y GAMIFICACIÓN
// ========================================
/**
 * GET /api/tutor/leaderboard
 * Obtener tabla de posiciones del tutor
 */
router.get('/leaderboard', auth_1.authenticateToken, [
    (0, express_validator_1.query)('period').optional().isIn(['weekly', 'monthly', 'all_time']),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const options = {
            period: req.query.period || 'weekly',
            limit: parseInt(req.query.limit) || 20
        };
        const leaderboard = await AITutorService_1.default.getLeaderboard(options, userId);
        res.json({
            success: true,
            data: leaderboard
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener leaderboard'
        });
    }
});
/**
 * GET /api/tutor/achievements
 * Obtener logros del usuario
 */
router.get('/achievements', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const achievements = await AITutorService_1.default.getUserAchievements(userId);
        res.json({
            success: true,
            data: achievements
        });
    }
    catch (error) {
        console.error('[AI-TUTOR] Error obteniendo logros:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logros'
        });
    }
});
module.exports = router;
//# sourceMappingURL=ai-tutor.js.map
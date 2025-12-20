/**
 * 🎓 AI TUTOR ALPHA ROUTES - Semana 10
 * 
 * Endpoints para el Sistema de Tutoría IA (Fase Alpha):
 * - Chat con el tutor
 * - Generación de quizzes
 * - Progreso del estudiante
 * - Sugerencias personalizadas
 * - Verificación de límites
 * 
 * @author AI Architect Agent
 * @date Diciembre 2025
 */

const express = require('express');
const router = express.Router();
const devLogger = require('../../utils/devLogger');
const tutorService = require('./tutor_alpha_service');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('AI_TUTOR_API', `${req.method} ${req.path}`);
    next();
});

/**
 * POST /api/ai/tutor-alpha/chat
 * Enviar mensaje al tutor IA
 */
router.post('/chat', async (req, res) => {
    try {
        const {
            studentId,
            message,
            subject,
            history,
            studentAge,
            userRole
        } = req.body;

        if (!studentId || !message) {
            return res.status(400).json({
                success: false,
                error: 'studentId y message son requeridos'
            });
        }

        const result = await tutorService.processTutorMessage({
            studentId,
            message,
            subject: subject || 'general',
            history: history || [],
            studentAge: studentAge || 16,
            userRole: userRole || 'student'
        });

        res.json(result);
    } catch (error) {
        devLogger.error('AI_TUTOR_API', 'Error en /chat:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error procesando mensaje del tutor'
        });
    }
});

/**
 * POST /api/ai/tutor-alpha/quiz
 * Generar quiz personalizado
 */
router.post('/quiz', async (req, res) => {
    try {
        const {
            subject,
            topic,
            difficulty,
            questionCount
        } = req.body;

        if (!subject || !topic) {
            return res.status(400).json({
                success: false,
                error: 'subject y topic son requeridos'
            });
        }

        const quiz = await tutorService.generateQuiz(
            subject,
            topic,
            difficulty || 'medium',
            questionCount || 5
        );

        res.json({
            success: true,
            data: quiz
        });
    } catch (error) {
        devLogger.error('AI_TUTOR_API', 'Error en /quiz:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error generando quiz'
        });
    }
});

/**
 * GET /api/ai/tutor-alpha/progress/:studentId
 * Obtener progreso de aprendizaje del estudiante
 */
router.get('/progress/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject } = req.query;

        const progress = await tutorService.getLearningProgress(studentId, subject);

        res.json({
            success: true,
            data: {
                studentId,
                progress,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        devLogger.error('AI_TUTOR_API', 'Error en /progress:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo progreso'
        });
    }
});

/**
 * GET /api/ai/tutor-alpha/suggestions/:studentId
 * Obtener sugerencias de temas basadas en calificaciones
 */
router.get('/suggestions/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const suggestions = await tutorService.suggestTopics(studentId);

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        devLogger.error('AI_TUTOR_API', 'Error en /suggestions:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo sugerencias'
        });
    }
});

/**
 * GET /api/ai/tutor-alpha/limit/:userId
 * Verificar límite de uso diario
 */
router.get('/limit/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.query;

        const limitInfo = await tutorService.checkDailyLimit(userId, role || 'student');

        res.json({
            success: true,
            data: limitInfo
        });
    } catch (error) {
        devLogger.error('AI_TUTOR_API', 'Error en /limit:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error verificando límite'
        });
    }
});

/**
 * GET /api/ai/tutor-alpha/subjects
 * Obtener materias soportadas
 */
router.get('/subjects', (req, res) => {
    res.json({
        success: true,
        data: {
            subjects: tutorService.subjects,
            count: Object.keys(tutorService.subjects).length
        }
    });
});

/**
 * POST /api/ai/tutor-alpha/detect-risk
 * Detectar riesgo en un mensaje (útil para moderación)
 */
router.post('/detect-risk', (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'message es requerido'
            });
        }

        const riskAssessment = tutorService.detectRisk(message);

        res.json({
            success: true,
            data: riskAssessment
        });
    } catch (error) {
        devLogger.error('AI_TUTOR_API', 'Error en /detect-risk:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error detectando riesgo'
        });
    }
});

/**
 * GET /api/ai/tutor-alpha/follow-up/:subject
 * Obtener preguntas de seguimiento para un tema
 */
router.get('/follow-up/:subject', (req, res) => {
    try {
        const { subject } = req.params;
        const { topic } = req.query;

        const followUps = tutorService.generateFollowUpQuestions(subject, topic, null);

        res.json({
            success: true,
            data: {
                subject,
                topic: topic || 'general',
                questions: followUps
            }
        });
    } catch (error) {
        devLogger.error('AI_TUTOR_API', 'Error en /follow-up:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error generando preguntas'
        });
    }
});

/**
 * GET /api/ai/tutor-alpha/health
 * Health check del servicio de tutoría
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'AI Tutor Alpha Service',
        version: '1.0.0-alpha',
        features: [
            'Tutoría Socrática',
            'Generación de Quizzes',
            'Detección de Riesgo',
            'Límites de Uso',
            'Sugerencias Personalizadas'
        ],
        subjects: Object.keys(tutorService.subjects),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

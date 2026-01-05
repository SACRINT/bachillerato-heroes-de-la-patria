/**
 * 🛤️ LEARNING PATH API ROUTES - Semana 18
 * 
 * Endpoints para la Personalización del Aprendizaje:
 * - Grafo de conocimiento
 * - Rutas personalizadas
 * - Evaluación diagnóstica
 * - Micro-credenciales
 * - Adaptación de dificultad
 * - Repaso espaciado
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const learningPathService = require('./learning_path_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('LEARNING_PATH_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/learning-path/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await learningPathService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/learning-path/knowledge-graph
 * Obtener grafo de conocimiento completo
 */
router.get('/knowledge-graph', (req, res) => {
    try {
        const { subject } = req.query;
        const graph = subject
            ? learningPathService.getKnowledgeGraphForSubject(subject)
            : learningPathService.getFullKnowledgeGraph();
        res.json({ success: true, data: graph });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/learning-path/generate
 * Generar ruta de aprendizaje personalizada
 */
router.post('/generate', async (req, res) => {
    try {
        const { userId, targetNodeId, options } = req.body;
        if (!userId || !targetNodeId) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren userId y targetNodeId'
            });
        }
        const path = await learningPathService.generateLearningPath(userId, targetNodeId, options);
        if (path.error) {
            return res.status(400).json({ success: false, error: path.error });
        }
        res.json({ success: true, data: path });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/learning-path/progress/:userId
 * Obtener visualización de progreso
 */
router.get('/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const progress = await learningPathService.getProgressVisualization(parseInt(userId));
        res.json({ success: true, data: progress });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/learning-path/diagnostic
 * Iniciar evaluación diagnóstica
 */
router.post('/diagnostic', async (req, res) => {
    try {
        const { userId, subject } = req.body;
        if (!userId || !subject) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren userId y subject'
            });
        }
        const assessment = await learningPathService.runDiagnosticAssessment(userId, subject);
        res.json({ success: true, data: assessment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/learning-path/diagnostic/results
 * Procesar resultados de evaluación diagnóstica
 */
router.post('/diagnostic/results', async (req, res) => {
    try {
        const { userId, subject, answers } = req.body;
        if (!userId || !subject || !answers) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren userId, subject y answers'
            });
        }
        const results = await learningPathService.processDiagnosticResults(userId, subject, answers);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/learning-path/credentials/:userId
 * Obtener micro-credenciales del usuario
 */
router.get('/credentials/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const credentials = await learningPathService.checkMicroCredentials(parseInt(userId));
        res.json({ success: true, data: credentials });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/learning-path/adapt-difficulty
 * Adaptar dificultad basada en performance
 */
router.post('/adapt-difficulty', async (req, res) => {
    try {
        const { userId, nodeId, performance } = req.body;
        if (!userId || !nodeId || !performance) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren userId, nodeId y performance'
            });
        }
        const adaptation = await learningPathService.adaptDifficulty(userId, nodeId, performance);
        res.json({ success: true, data: adaptation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/learning-path/review/:userId
 * Obtener ítems para repaso espaciado
 */
router.get('/review/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const review = await learningPathService.getSpacedRepetitionReview(parseInt(userId));
        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/learning-path/sync-assignments
 * Sincronizar con tareas docentes
 */
router.post('/sync-assignments', async (req, res) => {
    try {
        const { userId, assignments } = req.body;
        if (!userId || !assignments) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren userId y assignments'
            });
        }
        const sync = await learningPathService.syncWithTeacherAssignments(userId, assignments);
        res.json({ success: true, data: sync });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

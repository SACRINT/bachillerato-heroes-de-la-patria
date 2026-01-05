/**
 * 👨‍🏫 TEACHER TOOLS API ROUTES - Semana 19
 * 
 * Endpoints para las Herramientas IA Docentes:
 * - Generador de Syllabus
 * - Generador de Rúbricas
 * - Generador de Quizzes
 * - Corrector de Textos
 * - Detector de Plagio
 * - Dashboard de Grupo
 * - Sugerencias de Actividades
 * - Generador de Material
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const teacherToolsService = require('./teacher_tools_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('TEACHER_TOOLS_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/teacher-tools/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await teacherToolsService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/teacher-tools/metrics
 * Obtener métricas de uso
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = teacherToolsService.getMetrics();
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/teacher-tools/syllabus
 * Generar syllabus de clase
 */
router.post('/syllabus', async (req, res) => {
    try {
        const params = req.body;
        if (!params.subject) {
            return res.status(400).json({ success: false, error: 'Se requiere subject' });
        }
        const syllabus = await teacherToolsService.generateSyllabus(params);
        res.json({ success: true, data: syllabus });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/teacher-tools/rubric
 * Generar rúbrica de evaluación
 */
router.post('/rubric', async (req, res) => {
    try {
        const params = req.body;
        if (!params.title) {
            return res.status(400).json({ success: false, error: 'Se requiere title' });
        }
        const rubric = await teacherToolsService.generateRubric(params);
        res.json({ success: true, data: rubric });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/teacher-tools/quiz
 * Generar quiz/examen
 */
router.post('/quiz', async (req, res) => {
    try {
        const params = req.body;
        if (!params.subject || !params.topic) {
            return res.status(400).json({ success: false, error: 'Se requieren subject y topic' });
        }
        const quiz = await teacherToolsService.generateQuiz(params);
        res.json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/teacher-tools/analyze-text
 * Analizar y corregir texto
 */
router.post('/analyze-text', async (req, res) => {
    try {
        const { text, options } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere text' });
        }
        const analysis = await teacherToolsService.analyzeText(text, options);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/teacher-tools/plagiarism
 * Verificar plagio en texto
 */
router.post('/plagiarism', async (req, res) => {
    try {
        const { text, options } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere text' });
        }
        const result = await teacherToolsService.checkPlagiarism(text, options);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/teacher-tools/group-health/:groupId
 * Obtener salud del grupo
 */
router.get('/group-health/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const health = await teacherToolsService.getGroupHealth(parseInt(groupId));
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/teacher-tools/suggest-activities
 * Sugerir actividades para clase
 */
router.post('/suggest-activities', async (req, res) => {
    try {
        const params = req.body;
        if (!params.subject) {
            return res.status(400).json({ success: false, error: 'Se requiere subject' });
        }
        const suggestions = await teacherToolsService.suggestActivities(params);
        res.json({ success: true, data: suggestions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/teacher-tools/generate-material
 * Generar material didáctico
 */
router.post('/generate-material', async (req, res) => {
    try {
        const params = req.body;
        if (!params.type || !params.topic) {
            return res.status(400).json({ success: false, error: 'Se requieren type y topic' });
        }
        const material = await teacherToolsService.generateMaterial(params);
        res.json({ success: true, data: material });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

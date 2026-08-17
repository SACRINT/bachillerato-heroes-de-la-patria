/**
 * 🕸️ KNOWLEDGE GRAPH & GAPS DETECTION ROUTES
 * Bachillerato General Estatal "Héroes de la Patria"
 * FASE 5 (Semanas 18-20)
 */

const express = require('express');
const router = express.Router();
const graphService = require('../services/knowledge-graph.service.js');
const devLogger = require('../utils/devLogger.js');

// 1. Obtener el Grafo Curricular con Mastery del Alumno
router.get('/graph', async (req, res) => {
    try {
        const userId = req.user?.id || parseInt(req.query.userId) || 1;
        const graphData = await graphService.getUserGraph(userId);
        res.json({
            success: true,
            data: graphData
        });
    } catch (error) {
        devLogger.error('[KNOWLEDGE-ROUTE] Error in /graph:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Obtener Brechas Detectadas (Gaps) para un estudiante
router.get('/gaps/:studentId', async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId) || 1;
        const failedTopicId = req.query.failedTopicId || 'mat_calc_4';
        
        const gapAnalysis = await graphService.detectGaps(studentId, failedTopicId);
        res.json({
            success: true,
            data: gapAnalysis
        });
    } catch (error) {
        devLogger.error('[KNOWLEDGE-ROUTE] Error in /gaps:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Alias genérico /gaps
router.get('/gaps', async (req, res) => {
    try {
        const userId = req.user?.id || parseInt(req.query.userId) || 1;
        const gapsResult = await graphService.getStudentGaps(userId);
        res.json({
            success: true,
            data: gapsResult
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Detectar Brecha específica tras fallo en examen
router.post('/detect-gap', async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || 1;
        const { failedTopicId = 'mat_calc_4' } = req.body;

        const gapAnalysis = await graphService.detectGaps(userId, failedTopicId);
        res.json({
            success: true,
            data: gapAnalysis
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Actualizar Maestría de un Nodo
router.post('/mastery', async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || 1;
        const { nodeId = 'mat_alg_1', score = 85 } = req.body;

        const updatedState = await graphService.updateNodeMastery(userId, nodeId, score);
        res.json({
            success: true,
            data: updatedState
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

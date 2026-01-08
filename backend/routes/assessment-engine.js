/**
 * 📝 ASSESSMENT ENGINE ROUTES
 * Propósito: Endpoints para exámenes y evaluaciones (Fase 5 - Semana 37)
 */

const express = require('express');
const router = express.Router();
const assessmentService = require('../services/assessment-engine.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Listar blueprints disponibles
router.get('/blueprints', async (req, res) => {
    try {
        const blueprints = await assessmentService.getBlueprints();
        res.json({ success: true, data: blueprints });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Generar/Asignar examen
router.post('/generate', async (req, res) => {
    try {
        const { blueprintId } = req.body;
        const assessment = await assessmentService.generateAssessment(req.user.id, blueprintId);
        res.json({ success: true, data: assessment });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Obtener examen activo
router.get('/:id', async (req, res) => {
    try {
        const assessment = await assessmentService.getAssessment(req.params.id, req.user.id);
        if (!assessment) return res.status(404).json({ success: false, error: 'Examen no encontrado' });
        res.json({ success: true, data: assessment });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Enviar respuestas
router.post('/:id/submit', async (req, res) => {
    try {
        const { answers } = req.body; // Array of { index, answer }
        const result = await assessmentService.submitAssessment(req.params.id, req.user.id, answers);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

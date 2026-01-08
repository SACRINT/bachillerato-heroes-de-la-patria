/**
 * 🧮 PRACTICE PROBLEMS ROUTES
 * Propósito: Endpoints para la generación y resolución de problemas (Fase 5 - Semana 35)
 */

const express = require('express');
const router = express.Router();
const problemsService = require('../services/practice-problems.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Generar un nuevo problema
router.get('/generate', async (req, res) => {
    try {
        const { topic, difficulty } = req.query;
        if (!topic) return res.status(400).json({ success: false, error: 'Topic is required' });

        const problem = await problemsService.generateProblem(topic, parseInt(difficulty) || 1);
        res.json({ success: true, data: problem });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Enviar respuesta
router.post('/:id/submit', async (req, res) => {
    try {
        const userId = req.user.id;
        const problemId = req.params.id;
        const { answer, timeSpent } = req.body;

        const result = await problemsService.submitAnswer(userId, problemId, answer, timeSpent || 0);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

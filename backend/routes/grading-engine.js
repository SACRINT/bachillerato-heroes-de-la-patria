/**
 * 📝 GRADING ENGINE ROUTES
 * Propósito: API para envío y calificación de ensayos (Fase 6 - Semana 45)
 */

const express = require('express');
const router = express.Router();
const gradingService = require('../services/grading-engine.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

router.post('/submit', async (req, res) => {
    try {
        const { questionId, text } = req.body;
        const result = await gradingService.submitEssay(req.user.id, questionId, text);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/submission/:id', async (req, res) => {
    try {
        const result = await gradingService.getSubmission(req.params.id);
        if (!result) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

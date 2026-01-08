/**
 * 📚 MULTI-FORMAT ROUTES
 * Propósito: API para contenido enriquecido (Fase 5 - Semana 39)
 */

const express = require('express');
const router = express.Router();
const multiService = require('../services/multi-format.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Listar contenidos por tipo
router.get('/:type', async (req, res) => {
    try {
        const list = await multiService.getList(req.params.type);
        res.json({ success: true, data: list });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Obtener detalle de contenido
router.get('/:type/:id', async (req, res) => {
    try {
        const content = await multiService.getContent(req.params.type, req.params.id);
        if (!content) return res.status(404).json({ success: false, error: 'Content not found' });

        // Append user progress
        const progress = await multiService.getProgress(req.user.id, req.params.type, req.params.id);

        res.json({ success: true, data: { ...content, userProgress: progress } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Actualizar progreso
router.post('/:type/:id/progress', async (req, res) => {
    try {
        const { progressData, percentComplete } = req.body;
        const result = await multiService.updateProgress(
            req.user.id,
            req.params.type,
            req.params.id,
            progressData,
            percentComplete
        );
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

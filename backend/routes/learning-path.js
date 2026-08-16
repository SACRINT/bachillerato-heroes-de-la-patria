/**
 * 🛣️ LEARNING PATH ROUTES
 * Propósito: API para rutas de aprendizaje dinámicas (Fase 6 - Semana 43)
 */

const express = require('express');
const router = express.Router();
const pathService = require('../services/learning-path.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

router.post('/assign', async (req, res) => {
    try {
        const { pathId } = req.body;
        const result = await pathService.assignPath(req.user.id, pathId);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/optimize/:pathId', async (req, res) => {
    try {
        const result = await pathService.optimizePath(req.user.id, req.params.pathId);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/:pathId', async (req, res) => {
    try {
        const result = await pathService.getUserPath(req.user.id, req.params.pathId);
        if (!result) return res.status(404).json({ success: false, error: 'Path not found' });
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

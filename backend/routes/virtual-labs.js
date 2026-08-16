/**
 * 🧪 VIRTUAL LABS ROUTES
 * Propósito: API para laboratorios y simulaciones (Fase 5 - Semana 36)
 */

const express = require('express');
const router = express.Router();
const labsService = require('../services/virtual-labs.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

// Catálogo de Labs
router.get('/', async (req, res) => {
    try {
        const labs = await labsService.getLabs(req.query.subject);
        res.json({ success: true, data: labs });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Iniciar sesión de laboratorio
router.post('/:id/start', async (req, res) => {
    try {
        const session = await labsService.startSession(req.user.id, req.params.id);
        res.json({ success: true, data: session });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Guardar estado (Autosave)
router.post('/session/:sessionId/state', async (req, res) => {
    try {
        await labsService.saveState(req.params.sessionId, req.user.id, req.body.state);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Registrar medición (Data Logging)
router.post('/session/:sessionId/log', async (req, res) => {
    try {
        const measurement = await labsService.logMeasurement(req.params.sessionId, req.user.id, req.body);
        res.json({ success: true, data: measurement });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Enviar reporte final
router.post('/session/:sessionId/submit', async (req, res) => {
    try {
        const report = await labsService.submitReport(req.params.sessionId, req.user.id, req.body);
        res.json({ success: true, data: report });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

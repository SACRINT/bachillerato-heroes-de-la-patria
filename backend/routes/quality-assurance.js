/**
 * 🛡️ QUALITY ASSURANCE ROUTES
 * Propósito: API para reportes de calidad y monitoreo (Fase 5 - Semana 40)
 */

const express = require('express');
const router = express.Router();
const qaService = require('../services/quality-assurance.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

// Crear reporte (Estudiantes/Docentes)
router.post('/report', async (req, res) => {
    try {
        const report = await qaService.createReport(req.user.id, req.body);
        res.json({ success: true, data: report });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Admin: Listar reportes
router.get('/reports', async (req, res) => {
    try {
        // En producción verificar rol admin
        const reports = await qaService.getReports(req.query);
        res.json({ success: true, data: reports });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Admin: Resolver reporte
router.post('/reports/:id/resolve', async (req, res) => {
    try {
        const { note } = req.body;
        const result = await qaService.resolveReport(req.params.id, req.user.id, note);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Admin: Estado del sistema
router.get('/health', async (req, res) => {
    try {
        const health = await qaService.getHealthStatus();
        res.json({ success: true, data: health });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Admin: Ejecutar scan manual
router.post('/scan', async (req, res) => {
    try {
        const { type } = req.body;
        const result = await qaService.runHealthCheck(type);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

/**
 * 🎨 CONTENT STUDIO ROUTES
 * Propósito: Endpoints para el creador de contenido interactivo (Fase 5 - Semana 33)
 */

const express = require('express');
const router = express.Router();
const studioService = require('../services/content-studio.service');
const { authenticateToken } = require('../middleware/auth');

// Todos los endpoints del studio requieren autenticación de docente/admin
router.use(authenticateToken);

// --- TEMPLATES & ELEMENTS ---

// Obtener plantillas
router.get('/templates', async (req, res) => {
    try {
        const { category } = req.query;
        const templates = await studioService.getTemplates(category);
        res.json({ success: true, data: templates });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Obtener elementos disponibles
router.get('/elements', async (req, res) => {
    try {
        const elements = await studioService.getElements();
        res.json({ success: true, data: elements });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- CONTENT MANAGEMENT ---

// Crear nuevo contenido (Tarea 4)
router.post('/content/create', async (req, res) => {
    try {
        const userId = req.user.id;
        const content = await studioService.createContent(userId, req.body);
        res.status(201).json({ success: true, data: content });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Obtener contenido por ID
router.get('/content/:id', async (req, res) => {
    try {
        const content = await studioService.getContentById(req.params.id);
        if (!content) return res.status(404).json({ success: false, error: 'Contenido no encontrado' });
        res.json({ success: true, data: content });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Actualizar contenido
router.patch('/content/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const content = await studioService.updateContent(req.params.id, userId, req.body);
        res.json({ success: true, data: content });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Obtener historial de versiones
router.get('/content/:id/versions', async (req, res) => {
    try {
        const versions = await studioService.getVersions(req.params.id);
        res.json({ success: true, data: versions });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Obtener historial de edición
router.get('/content/:id/history', async (req, res) => {
    try {
        const history = await studioService.getEditHistory(req.params.id);
        res.json({ success: true, data: history });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Exportar contenido (JSON)
router.get('/content/:id/export', async (req, res) => {
    try {
        const content = await studioService.getContentById(req.params.id);
        if (!content) return res.status(404).json({ success: false, error: 'Contenido no encontrado' });

        res.setHeader('Content-disposition', `attachment; filename=studio-content-${req.params.id}.json`);
        res.setHeader('Content-type', 'application/json');
        res.send(JSON.stringify(content, null, 2));
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

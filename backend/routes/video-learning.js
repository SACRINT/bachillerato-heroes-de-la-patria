/**
 * 🎬 VIDEO LEARNING ROUTES
 * Propósito: Endpoints para la visualización de videos interactivos (Fase 5 - Semana 34)
 */

const express = require('express');
const router = express.Router();
const videoService = require('../services/video-learning.service.js');
const { authenticateToken } = require('../middleware/auth.js');

// Todos los endpoints requieren autenticación (estudiantes/docentes)
router.use(authenticateToken);

// Obtener lista de videos disponibles
router.get('/', async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const videos = await videoService.getAllVideos(limit, offset);
        res.json({ success: true, data: videos });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Obtener datos completos de un video para el player interactivo
router.get('/:id/interactive', async (req, res) => {
    try {
        const userId = req.user.id;
        const videoData = await videoService.getVideoById(req.params.id, userId);

        if (!videoData) {
            return res.status(404).json({ success: false, error: 'Video no encontrado' });
        }

        res.json({ success: true, data: videoData });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Actualizar progreso de visualización (Heartbeat)
router.post('/:id/progress', async (req, res) => {
    try {
        const userId = req.user.id;
        const { position, completed } = req.body;

        const progress = await videoService.updateProgress(userId, req.params.id, position, completed);
        res.json({ success: true, data: progress });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Crear bookmark
router.post('/:id/bookmark', async (req, res) => {
    try {
        const userId = req.user.id;
        const { timestamp, note } = req.body;

        const bookmark = await videoService.addBookmark(userId, req.params.id, timestamp, note);
        res.json({ success: true, data: bookmark });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Eliminar bookmark
router.delete('/bookmark/:bookmarkId', async (req, res) => {
    try {
        const userId = req.user.id;
        await videoService.removeBookmark(userId, req.params.bookmarkId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

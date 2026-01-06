const express = require('express');
const router = express.Router();
const microlearningService = require('../services/microlearning.service');
const { authenticateToken } = require('../middleware/auth');

// GET /api/microlearning/feed
// Obtiene un feed de lecciones para swipear
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        const feed = await microlearningService.getLessonFeed(req.user.id);
        res.json({ success: true, data: feed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/microlearning/next
// Obtiene la siguiente lección específica
router.get('/next', authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.query;
        const lesson = await microlearningService.getNextLesson(req.user.id, topicId);
        res.json({ success: true, data: lesson });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/microlearning/progress
// Actualiza el progreso
router.post('/progress', authenticateToken, async (req, res) => {
    try {
        const { lessonId, status, progress, timeSpent } = req.body;
        await microlearningService.updateProgress(req.user.id, lessonId, status, progress, timeSpent || 0);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

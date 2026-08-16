const express = require('express');
const router = express.Router();
const mobileSocialService = require('../../services/mobile-social.service.js');
const { authenticateToken } = require('../../middleware/auth.js');

// POST /api/social/stories
// Crear historia
router.post('/stories', authenticateToken, async (req, res) => {
    try {
        const { mediaUrl, mediaType, caption, achievementId } = req.body;
        if (!mediaUrl || !mediaType) {
            return res.status(400).json({ success: false, error: 'Media URL and Type required' });
        }
        const result = await mobileSocialService.createStory(req.user.id, mediaUrl, mediaType, caption, achievementId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/social/stories/feed
// Ver feed
router.get('/stories/feed', authenticateToken, async (req, res) => {
    try {
        const feed = await mobileSocialService.getStoriesFeed(req.user.id);
        res.json({ success: true, data: feed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/social/stories/:id/react
// Reaccionar
router.post('/stories/:id/react', authenticateToken, async (req, res) => {
    try {
        const { reactionType } = req.body; // 'like', 'fire', etc.
        await mobileSocialService.reactToStory(req.user.id, req.params.id, reactionType);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/social/rooms
// Listar salas de estudio
router.get('/rooms', authenticateToken, async (req, res) => {
    try {
        const rooms = await mobileSocialService.getActiveStudyRooms();
        res.json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/social/rooms
// Crear sala
router.post('/rooms', authenticateToken, async (req, res) => {
    try {
        const { topic, description } = req.body;
        const result = await mobileSocialService.createStudyRoom(req.user.id, topic, description);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

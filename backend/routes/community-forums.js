const express = require('express');
const router = express.Router();
const forumService = require('../services/community-forum.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

// Listar Foros
router.get('/', async (req, res) => {
    try {
        const forums = await forumService.getForums();
        res.json({ success: true, data: forums });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Listar Hilos de un Foro
router.get('/forums/:id/threads', async (req, res) => {
    try {
        const threads = await forumService.getThreads(req.params.id);
        res.json({ success: true, data: threads });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Crear Hilo
router.post('/threads', async (req, res) => {
    try {
        const result = await forumService.createThread(req.user.id, req.body);
        res.status(201).json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Detalle Hilo
router.get('/threads/:id', async (req, res) => {
    try {
        const details = await forumService.getThreadDetails(req.params.id);
        res.json({ success: true, data: details });
    } catch (e) {
        res.status(404).json({ success: false, error: e.message });
    }
});

// Responder
router.post('/threads/:id/replies', async (req, res) => {
    try {
        const result = await forumService.createReply(req.user.id, {
            threadId: req.params.id,
            content: req.body.content
        });
        res.status(201).json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Votar
router.post('/vote', async (req, res) => {
    try {
        const { type, id, value } = req.body; // value: 1 or -1
        const newScore = await forumService.vote(req.user.id, type, id, value);
        res.json({ success: true, score: newScore });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

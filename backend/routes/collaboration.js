const express = require('express');
const router = express.Router();
const collaborationService = require('../services/collaboration.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

// Crear sesión
router.post('/sessions', async (req, res) => {
    try {
        const session = await collaborationService.createSession(req.user.id, req.body);
        res.status(201).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creando sesión' });
    }
});

// Unirse/Obtener sesión
router.post('/sessions/:id/join', async (req, res) => {
    try {
        const result = await collaborationService.joinSession(req.params.id, req.user.id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

// Snapshots manuales (generalmente vía WebSocket, pero útil para backup)
router.post('/sessions/:id/snapshot', async (req, res) => {
    try {
        await collaborationService.saveState(req.params.id, req.body.state);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error guardando estado' });
    }
});

module.exports = router;

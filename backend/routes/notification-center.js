/**
 * 🔔 NOTIFICATION CENTER ROUTES
 * Propósito: API para leer notificaciones (Fase 7 - Semana 51)
 */

const express = require('express');
const router = express.Router();
const notifService = require('../services/notification-center.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const list = await notifService.getUnread(req.user.id);
        res.json({ success: true, data: list });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/:id/read', async (req, res) => {
    try {
        await notifService.markRead(req.params.id, req.user.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

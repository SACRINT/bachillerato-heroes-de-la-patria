/**
 * 🆘 HELPDESK ROUTES
 * Propósito: API para soporte técnico (Fase 7 - Semana 54)
 */

const express = require('express');
const router = express.Router();
const helpdeskService = require('../services/helpdesk.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', async (req, res) => {
    try {
        const { category, subject, message } = req.body;
        const result = await helpdeskService.createTicket(req.user.id, category, subject, message);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/my', async (req, res) => {
    try {
        const tickets = await helpdeskService.getMyTickets(req.user.id);
        res.json({ success: true, data: tickets });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await helpdeskService.getTicketDetails(req.params.id, req.user.id);
        if (!result) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/:id/reply', async (req, res) => {
    try {
        const { message } = req.body;
        const result = await helpdeskService.addMessage(req.params.id, req.user.id, message);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

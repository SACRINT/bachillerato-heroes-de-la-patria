const express = require('express');
const router = express.Router();
const mentorshipService = require('../services/mentorship.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

// Aplicar para ser mentor
router.post('/apply', async (req, res) => {
    try {
        const result = await mentorshipService.respondToMentorCall(req.user.id, req.body);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Buscar Mentores
router.get('/mentors', async (req, res) => {
    try {
        const mentors = await mentorshipService.findMentors(req.query.specialty);
        res.json({ success: true, data: mentors });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Solicitar Mentoría
router.post('/request', async (req, res) => {
    try {
        const { mentorId, goals } = req.body;
        const result = await mentorshipService.requestMentorship(req.user.id, mentorId, goals);
        res.status(201).json({ success: true, data: result });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// Gestionar Solicitud (Aceptar/Rechazar)
router.post('/requests/:id/:action', async (req, res) => {
    try {
        await mentorshipService.respondToRequest(req.user.id, req.params.id, req.params.action);
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// Mis Mentorías
router.get('/my-mentorships', async (req, res) => {
    try {
        const result = await mentorshipService.getMyMentorships(req.user.id);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

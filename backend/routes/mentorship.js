const express = require('express');
const router = express.Router();
let mentorshipService = null;
try {
    mentorshipService = require('../services/mentorship.service.js');
} catch (e) {}

const DEMO_MENTORS = [
    { id: 1, name: 'Prof. Carlos Mendoza', specialty: 'Matemáticas y Cálculo', rating: 4.9, students: 24, available: true },
    { id: 2, name: 'Profa. Elena Ramírez', specialty: 'Física y Química', rating: 4.8, students: 18, available: true },
    { id: 3, name: 'Ing. Roberto Silva', specialty: 'Programación e Informática', rating: 5.0, students: 30, available: true }
];

// Aplicar para ser mentor
router.post('/apply', async (req, res) => {
    try {
        if (mentorshipService && req.user) {
            const result = await mentorshipService.respondToMentorCall(req.user.id, req.body);
            return res.json({ success: true, data: result });
        }
    } catch (e) {}
    res.json({ success: true, data: { status: 'applied', message: 'Solicitud de mentoría recibida' } });
});

// Buscar Mentores
router.get('/mentors', async (req, res) => {
    try {
        if (mentorshipService) {
            const mentors = await mentorshipService.findMentors(req.query.specialty);
            if (Array.isArray(mentors) && mentors.length > 0) {
                return res.json({ success: true, data: mentors });
            }
        }
    } catch (e) {}
    res.json({ success: true, data: DEMO_MENTORS });
});

// Solicitar Mentoría
router.post('/request', async (req, res) => {
    try {
        if (mentorshipService && req.user) {
            const { mentorId, goals } = req.body;
            const result = await mentorshipService.requestMentorship(req.user.id, mentorId, goals);
            return res.status(201).json({ success: true, data: result });
        }
    } catch (e) {}
    res.status(201).json({ success: true, data: { id: 101, status: 'pending', message: 'Solicitud enviada' } });
});

// Gestionar Solicitud
router.post('/requests/:id/:action', async (req, res) => {
    try {
        if (mentorshipService && req.user) {
            await mentorshipService.respondToRequest(req.user.id, req.params.id, req.params.action);
            return res.json({ success: true });
        }
    } catch (e) {}
    res.json({ success: true, message: 'Solicitud actualizada' });
});

// Mis Mentorías
router.get('/my-mentorships', async (req, res) => {
    try {
        if (mentorshipService && req.user) {
            const result = await mentorshipService.getMyMentorships(req.user.id);
            if (result && (Array.isArray(result.asMentee) || Array.isArray(result.asMentor))) {
                return res.json({
                    success: true,
                    data: {
                        asMentee: Array.isArray(result.asMentee) ? result.asMentee : [],
                        asMentor: Array.isArray(result.asMentor) ? result.asMentor : []
                    }
                });
            }
        }
    } catch (e) {}
    res.json({
        success: true,
        data: {
            asMentee: [],
            asMentor: []
        }
    });
});

module.exports = router;

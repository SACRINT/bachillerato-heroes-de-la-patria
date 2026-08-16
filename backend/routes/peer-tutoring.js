const express = require('express');
const router = express.Router();
const peerTutoringService = require('../services/peer-tutoring.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

// Registrarse como tutor
router.post('/register', async (req, res) => {
    try {
        const result = await peerTutoringService.registerTutor(req.user.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error registrando perfil de tutor' });
    }
});

// Buscar Tutores (AI Matching)
router.get('/match', async (req, res) => {
    try {
        const { subject, minRating, maxRate } = req.query;
        const tutors = await peerTutoringService.findTutors(subject, minRating, maxRate);
        res.json({ success: true, data: tutors });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error buscando tutores' });
    }
});

// Solicitar sesión
router.post('/session', async (req, res) => {
    try {
        const { tutorId, ...sessionData } = req.body;
        const session = await peerTutoringService.requestSession(req.user.id, tutorId, sessionData);
        res.status(201).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error solicitando sesión' });
    }
});

// Gestionar sesión (Aceptar/Completar)
router.put('/session/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const result = await peerTutoringService.updateSessionStatus(req.params.id, req.user.id, status);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando sesión' });
    }
});

// Calificar sesión
router.post('/session/:id/review', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        await peerTutoringService.reviewTutor(req.params.id, req.user.id, rating, comment);
        res.json({ success: true, message: 'Reseña guardada exitosamente' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;

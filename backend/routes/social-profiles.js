const express = require('express');
const router = express.Router();
const socialProfileService = require('../services/social-profile.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

// Ver mi perfil o el de otro usuario
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId === 'me' ? req.user.id : parseInt(req.params.userId);
        const profile = await socialProfileService.getProfile(userId, req.user.id);
        res.json({ success: true, data: profile });
    } catch (e) {
        res.status(404).json({ success: false, error: e.message });
    }
});

// Actualizar mi perfil
router.put('/me', async (req, res) => {
    try {
        const result = await socialProfileService.updateProfile(req.user.id, req.body);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Agregar al Portafolio
router.post('/portfolio', async (req, res) => {
    try {
        const result = await socialProfileService.addPortfolioItem(req.user.id, req.body);
        res.status(201).json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Solicitud de Amistad
router.post('/friends/:id/:action', async (req, res) => {
    try {
        // action: request, accept, reject
        await socialProfileService.manageFriendship(req.user.id, req.params.id, req.params.action);
        res.json({ success: true, message: 'Action processed' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const teamService = require('../services/team-competition.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Crear Equipo
router.post('/teams', async (req, res) => {
    try {
        const team = await teamService.createTeam(req.user.id, req.body);
        res.status(201).json({ success: true, data: team });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// Obtener mi equipo
router.get('/my-team', async (req, res) => {
    try {
        const team = await teamService.getMyTeam(req.user.id);
        res.json({ success: true, data: team });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Unirse a equipo
router.post('/teams/:id/join', async (req, res) => {
    try {
        await teamService.joinTeam(req.user.id, req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// Listar Competencias
router.get('/competitions', async (req, res) => {
    try {
        const comps = await teamService.getActiveCompetitions();
        res.json({ success: true, data: comps });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Leaderboard global
router.get('/leaderboard', async (req, res) => {
    try {
        const ranking = await teamService.getLeaderboard();
        res.json({ success: true, data: ranking });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

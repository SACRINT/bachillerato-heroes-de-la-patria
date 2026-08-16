const express = require('express');
const router = express.Router();
const studyGroupService = require('../services/study-group.service.js');
const { authenticateToken } = require('../middleware/auth.js');

// Middleware para verificar token en todas las rutas de grupos
router.use(authenticateToken);

// Crear Grupo
router.post('/create', async (req, res) => {
    try {
        const group = await studyGroupService.createGroup(req.user.id, req.body);
        res.status(201).json({ success: true, data: group });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al crear grupo', details: error.message });
    }
});

// Mis Grupos
router.get('/my-groups', async (req, res) => {
    try {
        const groups = await studyGroupService.getUserGroups(req.user.id);
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo tus grupos' });
    }
});

// Buscar Grupos Públicos
router.get('/search', async (req, res) => {
    try {
        const { subject, topic } = req.query;
        const groups = await studyGroupService.searchGroups(subject, topic);
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error buscando grupos' });
    }
});

// Unirse a Grupo
router.post('/join', async (req, res) => {
    try {
        const { groupId, joinCode } = req.body;
        const result = await studyGroupService.joinGroup(req.user.id, groupId, joinCode);
        res.json({ success: true, message: 'Te has unido al grupo', data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Crear Sesión
router.post('/:id/sessions', async (req, res) => {
    try {
        const session = await studyGroupService.createSession(req.user.id, req.params.id, req.body);
        res.status(201).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creando sesión' });
    }
});

// Obtener Sesiones
router.get('/:id/sessions', async (req, res) => {
    try {
        const sessions = await studyGroupService.getGroupSessions(req.params.id);
        res.json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo sesiones' });
    }
});


module.exports = router;

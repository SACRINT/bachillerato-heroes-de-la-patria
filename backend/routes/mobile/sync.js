const express = require('express');
const router = express.Router();
const offlineSyncService = require('../../services/offline-sync.service');
const { authenticateToken } = require('../../middleware/auth');

// POST /api/sync/up
// Subir cambios realizados offline
router.post('/up', authenticateToken, async (req, res) => {
    try {
        const { changes } = req.body; // Array de objetos { localId, entity, operation, data }
        if (!changes || !Array.isArray(changes)) {
            return res.status(400).json({ success: false, error: 'Invalid payload' });
        }

        const result = await offlineSyncService.processSyncQueue(req.user.id, changes);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/sync/versions
// Consultar versiones para saber si bajar datos
router.get('/versions', authenticateToken, async (req, res) => {
    try {
        const versions = await offlineSyncService.getDataVersions();
        res.json({ success: true, data: versions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

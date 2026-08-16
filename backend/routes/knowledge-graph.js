const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const graphService = require('../services/knowledge-graph.service.js');

// GET /api/knowledge/graph
// Obtiene el grafo personal del usuario
router.get('/graph', authenticateToken, async (req, res) => {
    try {
        const graphData = await graphService.getUserGraph(req.user.id);
        res.json({ success: true, data: graphData });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching knowledge graph' });
    }
});

// GET /api/knowledge/gaps
// Placeholder para futura detección de brechas
router.get('/gaps', authenticateToken, async (req, res) => {
    res.json({ success: true, daa: [] });
});

module.exports = router;

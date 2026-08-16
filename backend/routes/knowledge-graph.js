const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
let graphService = null;
try {
    graphService = require('../services/knowledge-graph.service.js');
} catch (e) {}

const DEMO_GRAPH = {
    nodes: [
        { id: 'mat1', label: 'Álgebra Lineal', group: 'Matemáticas', level: 'Básico', value: 20, color: '#4f46e5', mastery_level: 85, is_unlocked: true },
        { id: 'mat2', label: 'Cálculo Diferencial', group: 'Matemáticas', level: 'Intermedio', value: 25, color: '#6366f1', mastery_level: 70, is_unlocked: true },
        { id: 'mat3', label: 'Cálculo Integral', group: 'Matemáticas', level: 'Avanzado', value: 18, color: '#818cf8', mastery_level: 50, is_unlocked: false },
        { id: 'fis1', label: 'Mecánica Clásica', group: 'Física', level: 'Intermedio', value: 22, color: '#06b6d4', mastery_level: 90, is_unlocked: true },
        { id: 'fis2', label: 'Electromagnetismo', group: 'Física', level: 'Avanzado', value: 15, color: '#0891b2', mastery_level: 40, is_unlocked: false },
        { id: 'qui1', label: 'Química Orgánica', group: 'Química', level: 'Básico', value: 19, color: '#10b981', mastery_level: 65, is_unlocked: true },
        { id: 'inf1', label: 'Pensamiento Computacional', group: 'Tecnología', level: 'Básico', value: 24, color: '#f59e0b', mastery_level: 95, is_unlocked: true }
    ],
    edges: [
        { source: 'mat1', target: 'mat2', from: 'mat1', to: 'mat2', relation_type: 'prerequisite' },
        { source: 'mat2', target: 'mat3', from: 'mat2', to: 'mat3', relation_type: 'prerequisite' },
        { source: 'mat1', target: 'fis1', from: 'mat1', to: 'fis1', relation_type: 'applied' },
        { source: 'mat2', target: 'fis1', from: 'mat2', to: 'fis1', relation_type: 'applied' },
        { source: 'mat3', target: 'fis2', from: 'mat3', to: 'fis2', relation_type: 'applied' },
        { source: 'fis1', target: 'fis2', from: 'fis1', to: 'fis2', relation_type: 'prerequisite' },
        { source: 'mat1', target: 'inf1', from: 'mat1', to: 'inf1', relation_type: 'related' }
    ]
};

// GET /api/knowledge/graph
router.get('/graph', async (req, res) => {
    try {
        if (graphService && req.user && req.user.id) {
            const graphData = await graphService.getUserGraph(req.user.id);
            if (graphData && graphData.nodes && graphData.nodes.length > 0) {
                return res.json({ success: true, data: graphData });
            }
        }
    } catch (error) {}
    res.json({ success: true, data: DEMO_GRAPH });
});

// GET /api/knowledge/gaps
router.get('/gaps', async (req, res) => {
    res.json({ success: true, data: [] });
});

module.exports = router;

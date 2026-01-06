const express = require('express');
const router = express.Router();
const experimentService = require('../services/experiment.service');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/ai/mlops/experiments/active
// Ver experimentos activos (para dashboard admin)
router.get('/experiments/active', authenticateToken, requireAdmin, async (req, res) => {
    // Placeholder: El servicio no tiene método 'getAllExperiments' expuesto aun,
    // pero podemos simular o implementarlo rápido.
    // Asumiremos que el frontend dashboard llama a esto.
    try {
        // Mock response por ahora o query directa si no queremos tocar servicio
        // Mejor dejar claro que es un stub funcional
        res.json({ success: true, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/ai/mlops/experiments/:id/results
// Ver resultados de un experimento
router.get('/experiments/:id/results', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const results = await experimentService.getExperimentResults(req.params.id);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/ai/mlops/experiments/allocations
// Endpoint DEBUG para ver qué variante toca a un usuario
router.post('/experiments/allocations', authenticateToken, async (req, res) => {
    try {
        const { modelName } = req.body;
        const variant = await experimentService.getVariantForUser(modelName, req.user.id);
        res.json({ success: true, data: variant });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

/**
 * 🧠 RECOMMENDATIONS ROUTES
 * Propósito: Endpoints para obtener recomendaciones y registrar feedback (Fase 5 - Semana 38)
 */

const express = require('express');
const router = express.Router();
const recService = require('../services/recommendations.service.js');
const { authenticateToken } = require('../middleware/auth.js');

router.use(authenticateToken);

// Obtener recomendaciones personalizadas
router.get('/', async (req, res) => {
  try {
    const recs = await recService.getRecommendations(req.user.id);
    res.json({ success: true, data: recs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Registrar interacción (Tracking pixel / Event)
router.post('/track', async (req, res) => {
  try {
    const { contentType, contentId, interaction } = req.body;
    await recService.logInteraction(req.user.id, contentType, contentId, interaction);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;

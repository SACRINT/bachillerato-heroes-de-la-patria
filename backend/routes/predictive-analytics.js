/**
 * 🔮 PREDICTIVE ANALYTICS ROUTES
 * Propósito: API para reportes de riesgo y retención (Fase 6 - Semana 41)
 */

const express = require('express');
const router = express.Router();
const predictiveService = require('../services/predictive-analytics.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Trigger recalculation (Admin/Cron)
router.post('/recalculate/:userId', async (req, res) => {
  try {
    // Check admin perm in real impl
    const result = await predictiveService.updateRiskScore(req.params.userId || req.user.id);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin Dashboard: List at-risk students
router.get('/at-risk', async (req, res) => {
  try {
    const threshold = req.query.threshold || 50;
    const students = await predictiveService.getAtRiskStudents(threshold);
    res.json({ success: true, data: students });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;

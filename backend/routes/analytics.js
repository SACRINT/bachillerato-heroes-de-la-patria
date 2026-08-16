const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth.js');
const predictiveService = require('../services/predictive-analytics.service.js');

// POST /api/analytics/predict/run - Run prediction cycle
router.post('/predict/run', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const result = await predictiveService.updateAllStudentRisks();
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error running predictions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/dashboard/risk - Get dashboard data
router.get('/dashboard/risk', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const stats = await predictiveService.getDashboardStats();
        const atRiskStudents = await predictiveService.getAtRiskStudents();
        res.json({
            success: true,
            data: {
                stats,
                atRiskStudents
            }
        });
    } catch (error) {
        console.error('Error fetching risk dashboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
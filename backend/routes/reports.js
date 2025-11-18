/**
 * 📊 REPORTS ROUTES - SEMANA 7
 * Endpoints para generación y exportación de reportes
 */

const express = require('express');
const router = express.Router();
const reportingService = require('../services/reporting-service');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar rol admin
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo administradores' });
    }
    next();
};

/**
 * GET /api/reports/students
 * Generar reporte de estudiantes
 */
router.get('/students', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { period, grade, status } = req.query;
        const report = await reportingService.generateStudentsReport({ period, grade, status });
        res.json(report);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/reports/financial
 * Generar reporte financiero
 */
router.get('/financial', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const report = await reportingService.generateFinancialReport({ from: dateFrom, to: dateTo });
        res.json(report);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/reports/approvals
 * Generar reporte de aprobaciones pendientes
 */
router.get('/approvals', authenticateToken, adminOnly, async (req, res) => {
    try {
        const report = await reportingService.generateApprovalsReport();
        res.json(report);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/reports/attendance
 * Generar reporte de asistencia
 */
router.get('/attendance', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { studentId, dateFrom, dateTo } = req.query;
        const report = await reportingService.generateAttendanceReport({
            studentId: studentId ? parseInt(studentId) : undefined,
            dateRange: { from: dateFrom, to: dateTo }
        });
        res.json(report);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/reports/predict/:metric
 * Predicción de tendencias (ML básico)
 */
router.get('/predict/:metric', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { metric } = req.params;
        const prediction = await reportingService.predictTrend(metric);
        res.json(prediction);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/reports/schedule
 * Programar envío de reporte
 */
router.post('/schedule', authenticateToken, adminOnly, async (req, res) => {
    try {
        const schedule = await reportingService.scheduleReport(req.body);
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

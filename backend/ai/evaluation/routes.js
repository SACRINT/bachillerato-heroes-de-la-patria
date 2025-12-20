/**
 * 📊 EVALUATION API ROUTES - Semana 12
 * 
 * Endpoints generar reportes de evaluación y auditoría.
 */

const express = require('express');
const router = express.Router();
const evaluationService = require('./evaluation_service');
const devLogger = require('../../utils/devLogger');

router.use((req, res, next) => {
    devLogger.log('EVAL_API', `${req.method} ${req.path}`);
    next();
});

router.get('/full-report', async (req, res) => {
    try {
        const report = await evaluationService.generateFullQuarterlyReport();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/roi', async (req, res) => {
    try {
        const roi = await evaluationService.generateROIReport();
        res.json({ success: true, data: roi });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/tech-debt', async (req, res) => {
    try {
        const debt = await evaluationService.assessTechnicalDebt();
        res.json({ success: true, data: debt });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

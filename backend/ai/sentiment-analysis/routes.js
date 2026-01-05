/**
 * 🌡️ SENTIMENT ANALYSIS API ROUTES - Semana 14
 * 
 * Endpoints para el Análisis de Sentimiento Institucional:
 * - Termómetro institucional
 * - Análisis de texto individual
 * - Detección de tendencias
 * - Alertas de alto riesgo
 * - Reportes mensuales
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const sentimentService = require('./sentiment_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('SENTIMENT_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/sentiment/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await sentimentService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/sentiment/thermometer
 * Obtener el Termómetro Institucional
 */
router.get('/thermometer', async (req, res) => {
    try {
        const { days } = req.query;
        const thermometer = await sentimentService.getInstitutionalThermometer(
            parseInt(days) || 30
        );
        res.json({ success: true, data: thermometer });
    } catch (error) {
        devLogger.error('SENTIMENT_API', 'Error en thermometer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/sentiment/analyze
 * Analizar un texto específico
 */
router.post('/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere el campo text' });
        }
        const analysis = await sentimentService.analyzeText(text);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/sentiment/trends
 * Detectar tendencias de sentimiento
 */
router.get('/trends', async (req, res) => {
    try {
        const trends = await sentimentService.detectNegativeTrends();
        res.json({ success: true, data: trends });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/sentiment/alerts
 * Obtener alertas de alto riesgo
 */
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await sentimentService.getHighRiskAlerts();
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/sentiment/report
 * Generar reporte mensual
 */
router.get('/report', async (req, res) => {
    try {
        const { month } = req.query;
        const report = await sentimentService.generateMonthlyReport(month);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/sentiment/analyze-complaint/:id
 * Analizar una queja específica
 */
router.get('/analyze-complaint/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const analysis = await sentimentService.analyzeComplaint(parseInt(id));
        if (analysis.error) {
            return res.status(404).json({ success: false, error: analysis.error });
        }
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/sentiment/calendar-correlation
 * Correlacionar sentimiento con calendario escolar
 */
router.get('/calendar-correlation', async (req, res) => {
    try {
        const correlation = await sentimentService.correlateWithCalendar();
        res.json({ success: true, data: correlation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/sentiment/collect-feedback
 * Recopilar feedback de todas las fuentes
 */
router.post('/collect-feedback', async (req, res) => {
    try {
        const { source } = req.body;
        const feedback = await sentimentService.collectFeedback(source || 'all');
        res.json({
            success: true,
            data: {
                count: feedback.length,
                sources: [...new Set(feedback.map(f => f.source))]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/sentiment/batch-analyze
 * Analizar múltiples textos
 */
router.post('/batch-analyze', async (req, res) => {
    try {
        const { texts } = req.body;
        if (!texts || !Array.isArray(texts)) {
            return res.status(400).json({ success: false, error: 'Se requiere un array de texts' });
        }

        const analyses = await Promise.all(
            texts.slice(0, 50).map(text => sentimentService.analyzeText(text))
        );

        // Resumen
        const positive = analyses.filter(a => a.sentiment.label === 'positive').length;
        const negative = analyses.filter(a => a.sentiment.label === 'negative').length;
        const neutral = analyses.filter(a => a.sentiment.label === 'neutral').length;

        res.json({
            success: true,
            data: {
                total: analyses.length,
                summary: { positive, negative, neutral },
                analyses
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

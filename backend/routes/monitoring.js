/**
 * 📊 MONITORING ROUTES - SEMANA 31-32
 * Endpoints para monitoring y health checks
 *
 * Endpoints:
 * - GET /metrics - Prometheus-compatible metrics
 * - GET /health - Health check detallado
 * - GET /health/live - Liveness probe (K8s)
 * - GET /health/ready - Readiness probe (K8s)
 * - GET /monitoring/stats - Estadísticas completas
 * - GET /monitoring/alerts - Alertas activas
 *
 * Fecha: 20 Noviembre 2025
 */

const express = require('express');
const router = express.Router();
const productionMonitor = require('../services/productionMonitor');
const devLogger = require('../utils/devLogger');

/**
 * PROMETHEUS METRICS
 * GET /metrics
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = productionMonitor.exportPrometheusMetrics();
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        res.send(metrics);
    } catch (error) {
        devLogger.error('MONITORING', 'Error exporting metrics:', error);
        res.status(500).send('# Error exporting metrics\n');
    }
});

/**
 * HEALTH CHECK DETALLADO
 * GET /health
 */
router.get('/health', async (req, res) => {
    try {
        const health = productionMonitor.getHealth();
        const statusCode = health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 200 : 503;
        res.status(statusCode).json({
            status: health.overall,
            timestamp: health.timestamp,
            checks: health.checks,
            version: '5.6.0'
        });
    } catch (error) {
        devLogger.error('MONITORING', 'Error in health check:', error);
        res.status(503).json({ status: 'unhealthy', error: error.message, timestamp: Date.now() });
    }
});

/**
 * LIVENESS PROBE (K8s)
 * GET /health/live
 */
router.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive', timestamp: Date.now() });
});

/**
 * READINESS PROBE (K8s)
 * GET /health/ready
 */
router.get('/health/ready', async (req, res) => {
    try {
        const health = productionMonitor.getHealth();
        const ready = health.overall !== 'unhealthy';
        if (ready) {
            res.status(200).json({ status: 'ready', timestamp: Date.now() });
        } else {
            res.status(503).json({ status: 'not_ready', reason: 'System unhealthy', timestamp: Date.now() });
        }
    } catch (error) {
        res.status(503).json({ status: 'not_ready', error: error.message, timestamp: Date.now() });
    }
});

/**
 * MONITORING STATS (ADMIN ONLY)
 * GET /monitoring/stats
 */
router.get('/monitoring/stats', (req, res) => {
    try {
        const metrics = productionMonitor.getMetrics();
        res.json({ success: true, metrics });
    } catch (error) {
        devLogger.error('MONITORING', 'Error getting stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * MONITORING ALERTS (ADMIN ONLY)
 * GET /monitoring/alerts
 */
router.get('/monitoring/alerts', (req, res) => {
    try {
        const alerts = productionMonitor.getAlerts();
        const activeAlerts = alerts.filter(a => !a.resolved);
        res.json({ success: true, total: alerts.length, active: activeAlerts.length, alerts });
    } catch (error) {
        devLogger.error('MONITORING', 'Error getting alerts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

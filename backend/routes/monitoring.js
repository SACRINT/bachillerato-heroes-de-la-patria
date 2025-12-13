"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// @ts-ignore
const productionMonitor_1 = __importDefault(require("../services/productionMonitor"));
// @ts-ignore
const devLogger_1 = __importDefault(require("../utils/devLogger"));
const router = express_1.default.Router();
/**
 * PROMETHEUS METRICS
 * GET /metrics
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = productionMonitor_1.default.exportPrometheusMetrics();
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        res.send(metrics);
    }
    catch (error) {
        devLogger_1.default.error('MONITORING', 'Error exporting metrics:', error);
        res.status(500).send('# Error exporting metrics\n');
    }
});
/**
 * HEALTH CHECK DETALLADO
 * GET /health
 */
router.get('/health', async (req, res) => {
    try {
        const health = productionMonitor_1.default.getHealth();
        // @ts-ignore - 'overall' probably exists on health object based on d.ts
        const statusCode = health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 200 : 503;
        res.status(statusCode).json({
            // @ts-ignore
            status: health.overall,
            // @ts-ignore
            timestamp: health.timestamp,
            // @ts-ignore
            checks: health.checks,
            version: '5.6.0'
        });
    }
    catch (error) {
        devLogger_1.default.error('MONITORING', 'Error in health check:', error);
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
        const health = productionMonitor_1.default.getHealth();
        // @ts-ignore
        const ready = health.overall !== 'unhealthy';
        if (ready) {
            res.status(200).json({ status: 'ready', timestamp: Date.now() });
        }
        else {
            res.status(503).json({ status: 'not_ready', reason: 'System unhealthy', timestamp: Date.now() });
        }
    }
    catch (error) {
        res.status(503).json({ status: 'not_ready', error: error.message, timestamp: Date.now() });
    }
});
/**
 * MONITORING STATS (ADMIN ONLY)
 * GET /monitoring/stats
 */
router.get('/monitoring/stats', (req, res) => {
    try {
        const metrics = productionMonitor_1.default.getMetrics();
        res.json({ success: true, metrics });
    }
    catch (error) {
        devLogger_1.default.error('MONITORING', 'Error getting stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * MONITORING ALERTS (ADMIN ONLY)
 * GET /monitoring/alerts
 */
router.get('/monitoring/alerts', (req, res) => {
    try {
        const alerts = productionMonitor_1.default.getAlerts();
        const activeAlerts = alerts.filter((a) => !a.resolved);
        res.json({ success: true, total: alerts.length, active: activeAlerts.length, alerts });
    }
    catch (error) {
        devLogger_1.default.error('MONITORING', 'Error getting alerts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=monitoring.js.map
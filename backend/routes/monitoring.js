/**
 * Rutas de Monitoreo
 * BGE Héroes de la Patria
 * FASE 4 - Semana 31-32
 *
 * Endpoints para monitoreo, métricas y health checks
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const monitoring = require('../services/MonitoringService');

// Middleware para verificar rol admin
const requireAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'administrativo')) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador.'
        });
    }
    next();
};

// ========================================
// HEALTH CHECKS
// ========================================

/**
 * GET /api/monitoring/health
 * Health check público (básico)
 */
router.get('/health', async (req, res) => {
    try {
        const health = await monitoring.healthCheck();

        const statusCode = health.status === 'healthy' ? 200 :
            health.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json({
            success: health.status !== 'unhealthy',
            data: health
        });
    } catch (error) {
        console.error('[MONITORING] Error en health check:', error);
        res.status(503).json({
            success: false,
            data: {
                status: 'unhealthy',
                error: error.message
            }
        });
    }
});

/**
 * GET /api/monitoring/health/detailed
 * Health check detallado (admin)
 */
router.get('/health/detailed', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const health = await monitoring.healthCheck();
        const system = monitoring.getSystemMetrics();

        res.json({
            success: true,
            data: {
                ...health,
                system,
                metrics: {
                    requests: monitoring.metrics.requests.total,
                    errors: monitoring.metrics.requests.errors,
                    avgResponseTime: monitoring.metrics.performance.avgResponseTime
                }
            }
        });
    } catch (error) {
        console.error('[MONITORING] Error en health check detallado:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo health check',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/ready
 * Readiness probe (para Kubernetes)
 */
router.get('/ready', async (req, res) => {
    try {
        const health = await monitoring.healthCheck();

        if (health.status === 'unhealthy') {
            return res.status(503).json({ ready: false });
        }

        res.json({ ready: true });
    } catch (error) {
        res.status(503).json({ ready: false, error: error.message });
    }
});

/**
 * GET /api/monitoring/live
 * Liveness probe (para Kubernetes)
 */
router.get('/live', (req, res) => {
    res.json({ alive: true });
});

// ========================================
// DASHBOARD Y MÉTRICAS
// ========================================

/**
 * GET /api/monitoring/dashboard
 * Dashboard completo de métricas
 */
router.get('/dashboard', authenticateToken, requireAdmin, (req, res) => {
    try {
        const dashboard = monitoring.getDashboard();

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        console.error('[MONITORING] Error obteniendo dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo dashboard',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/metrics
 * Métricas en formato Prometheus
 */
router.get('/metrics', authenticateToken, requireAdmin, (req, res) => {
    try {
        const metrics = monitoring.getPrometheusMetrics();

        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    } catch (error) {
        console.error('[MONITORING] Error obteniendo métricas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo métricas',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/system
 * Métricas del sistema operativo
 */
router.get('/system', authenticateToken, requireAdmin, (req, res) => {
    try {
        const system = monitoring.getSystemMetrics();

        res.json({
            success: true,
            data: system
        });
    } catch (error) {
        console.error('[MONITORING] Error obteniendo métricas del sistema:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo métricas del sistema',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/history
 * Historial de métricas
 */
router.get('/history', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { hours = 24 } = req.query;
        const history = monitoring.getHistory(parseInt(hours));

        res.json({
            success: true,
            data: {
                period: `${hours} hours`,
                dataPoints: history.length,
                history
            }
        });
    } catch (error) {
        console.error('[MONITORING] Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo historial',
            error: error.message
        });
    }
});

// ========================================
// REQUESTS Y ERRORES
// ========================================

/**
 * GET /api/monitoring/requests
 * Estadísticas de requests
 */
router.get('/requests', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { limit = 20 } = req.query;

        res.json({
            success: true,
            data: {
                total: monitoring.metrics.requests.total,
                success: monitoring.metrics.requests.success,
                errors: monitoring.metrics.requests.errors,
                errorRate: monitoring.metrics.requests.total > 0
                    ? ((monitoring.metrics.requests.errors / monitoring.metrics.requests.total) * 100).toFixed(2) + '%'
                    : '0%',
                topEndpoints: monitoring.getTopEndpoints(parseInt(limit)),
                byStatusCode: Object.fromEntries(monitoring.metrics.requests.byStatusCode)
            }
        });
    } catch (error) {
        console.error('[MONITORING] Error obteniendo stats de requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/errors
 * Errores recientes
 */
router.get('/errors', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const errors = monitoring.getRecentErrors(parseInt(limit));

        res.json({
            success: true,
            data: {
                total: monitoring.metrics.errors.length,
                errors
            }
        });
    } catch (error) {
        console.error('[MONITORING] Error obteniendo errores:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo errores',
            error: error.message
        });
    }
});

// ========================================
// ALERTAS
// ========================================

/**
 * GET /api/monitoring/alerts
 * Alertas activas
 */
router.get('/alerts', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { acknowledged = 'false' } = req.query;

        let alerts = monitoring.activeAlerts;
        if (acknowledged === 'false') {
            alerts = alerts.filter(a => !a.acknowledged);
        }

        res.json({
            success: true,
            data: {
                total: alerts.length,
                alerts
            }
        });
    } catch (error) {
        console.error('[MONITORING] Error obteniendo alertas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo alertas',
            error: error.message
        });
    }
});

/**
 * PUT /api/monitoring/alerts/:id/acknowledge
 * Reconocer alerta
 */
router.put('/alerts/:id/acknowledge', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const success = monitoring.acknowledgeAlert(id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Alerta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Alerta reconocida'
        });
    } catch (error) {
        console.error('[MONITORING] Error reconociendo alerta:', error);
        res.status(500).json({
            success: false,
            message: 'Error reconociendo alerta',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/alerts/config
 * Configuración de alertas
 */
router.get('/alerts/config', authenticateToken, requireAdmin, (req, res) => {
    try {
        res.json({
            success: true,
            data: monitoring.alertConfig
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo configuración',
            error: error.message
        });
    }
});

/**
 * PUT /api/monitoring/alerts/config
 * Actualizar configuración de alertas
 */
router.put('/alerts/config', authenticateToken, requireAdmin, (req, res) => {
    try {
        const config = req.body;

        // Validar valores
        if (config.errorRateThreshold !== undefined) {
            monitoring.alertConfig.errorRateThreshold = parseFloat(config.errorRateThreshold);
        }
        if (config.avgResponseTimeThreshold !== undefined) {
            monitoring.alertConfig.avgResponseTimeThreshold = parseInt(config.avgResponseTimeThreshold);
        }
        if (config.memoryThreshold !== undefined) {
            monitoring.alertConfig.memoryThreshold = parseFloat(config.memoryThreshold);
        }
        if (config.cpuThreshold !== undefined) {
            monitoring.alertConfig.cpuThreshold = parseFloat(config.cpuThreshold);
        }

        res.json({
            success: true,
            data: monitoring.alertConfig
        });
    } catch (error) {
        console.error('[MONITORING] Error actualizando configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando configuración',
            error: error.message
        });
    }
});

// ========================================
// ADMINISTRACIÓN
// ========================================

/**
 * POST /api/monitoring/reset
 * Resetear métricas
 */
router.post('/reset', authenticateToken, requireAdmin, (req, res) => {
    try {
        monitoring.reset();

        res.json({
            success: true,
            message: 'Métricas reseteadas'
        });
    } catch (error) {
        console.error('[MONITORING] Error reseteando métricas:', error);
        res.status(500).json({
            success: false,
            message: 'Error reseteando métricas',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/uptime
 * Uptime de la aplicación
 */
router.get('/uptime', (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - monitoring.metrics.uptime) / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    res.json({
        success: true,
        data: {
            seconds: uptimeSeconds,
            formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
            since: new Date(monitoring.metrics.uptime).toISOString()
        }
    });
});

console.log('[MONITORING-ROUTES] Rutas de monitoreo cargadas');

module.exports = router;

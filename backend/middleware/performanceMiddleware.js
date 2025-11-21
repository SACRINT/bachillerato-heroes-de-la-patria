/**
 * 📊 PERFORMANCE MIDDLEWARE - SEMANA 26
 * Middleware para tracking automático de performance
 *
 * Features:
 * - Automatic request timing
 * - Response time headers
 * - Performance metric collection
 * - Slow request detection
 * - Error tracking
 * - Portable y modular
 *
 * Uso:
 * ```javascript
 * const performanceMiddleware = require('./middleware/performanceMiddleware');
 *
 * // Apply globally
 * app.use(performanceMiddleware());
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const performanceMonitor = require('../services/performanceMonitor');
const devLogger = require('../utils/devLogger');

/**
 * PERFORMANCE TRACKING MIDDLEWARE
 */
function performanceMiddleware(options = {}) {
    return (req, res, next) => {
        // Start tracking
        const metric = performanceMonitor.startRequest(req);

        // Intercept response to end tracking
        const originalSend = res.send.bind(res);
        const originalJson = res.json.bind(res);

        const endTracking = () => {
            performanceMonitor.endRequest(metric, res.statusCode);

            // Add performance headers
            res.setHeader('X-Response-Time', `${metric.latency}ms`);
            res.setHeader('X-Request-ID', metric.id);
        };

        res.send = function (data) {
            endTracking();
            return originalSend(data);
        };

        res.json = function (data) {
            endTracking();
            return originalJson(data);
        };

        // Handle errors
        res.on('error', (error) => {
            performanceMonitor.endRequest(metric, 500, error);
            devLogger.error('PERF-MW', `Request error: ${error.message}`);
        });

        next();
    };
}

module.exports = performanceMiddleware;

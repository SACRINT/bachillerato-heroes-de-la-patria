/**
 * ⚡ SCALABILITY API ROUTES - Semana 23
 * 
 * Endpoints para Escalabilidad y Performance:
 * - Auto-scaling
 * - Model optimization
 * - Caché
 * - Database optimization
 * - Load testing
 * - Async processing
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const scalabilityService = require('./scalability_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('SCALABILITY_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/scalability/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await scalabilityService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Auto-scaling ============

/**
 * GET /api/ai/scalability/auto-scaling/evaluate
 * Evaluar necesidad de auto-scaling
 */
router.get('/auto-scaling/evaluate', async (req, res) => {
    try {
        const decision = await scalabilityService.evaluateAutoScaling();
        res.json({ success: true, data: decision });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/scalability/auto-scaling/history
 * Historial de eventos de scaling
 */
router.get('/auto-scaling/history', async (req, res) => {
    try {
        const history = await scalabilityService.getScalingHistory();
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/scalability/metrics
 * Métricas actuales del sistema
 */
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await scalabilityService.getCurrentMetrics();
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Model Optimization ============

/**
 * GET /api/ai/scalability/model-optimization/:modelId
 * Analizar optimizaciones disponibles
 */
router.get('/model-optimization/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const analysis = await scalabilityService.analyzeModelOptimization(modelId);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/scalability/onnx-convert/:modelId
 * Convertir modelo a ONNX
 */
router.post('/onnx-convert/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const result = await scalabilityService.convertToONNX(modelId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Cache ============

/**
 * GET /api/ai/scalability/cache/stats
 * Estadísticas del caché
 */
router.get('/cache/stats', async (req, res) => {
    try {
        const stats = await scalabilityService.getCacheStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/ai/scalability/cache/invalidate
 * Invalidar entradas del caché
 */
router.delete('/cache/invalidate', async (req, res) => {
    try {
        const { pattern } = req.body;
        const result = await scalabilityService.invalidateCache(pattern || '*');
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Vector DB ============

/**
 * GET /api/ai/scalability/vector-db/analyze
 * Analizar performance de vector DB
 */
router.get('/vector-db/analyze', async (req, res) => {
    try {
        const analysis = await scalabilityService.analyzeVectorDBPerformance();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/scalability/vector-db/reindex
 * Reindexar vectores
 */
router.post('/vector-db/reindex', async (req, res) => {
    try {
        const { namespace } = req.body;
        const result = await scalabilityService.reindexVectors(namespace || 'default');
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Edge / CDN ============

/**
 * GET /api/ai/scalability/edge-deployment
 * Analizar opciones de edge deployment
 */
router.get('/edge-deployment', async (req, res) => {
    try {
        const analysis = await scalabilityService.analyzeEdgeDeployment();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Load Testing ============

/**
 * POST /api/ai/scalability/load-test
 * Ejecutar prueba de carga
 */
router.post('/load-test', async (req, res) => {
    try {
        const config = req.body;
        const results = await scalabilityService.runLoadTest(config);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Database ============

/**
 * GET /api/ai/scalability/database/bottlenecks
 * Analizar cuellos de botella
 */
router.get('/database/bottlenecks', async (req, res) => {
    try {
        const analysis = await scalabilityService.analyzeDatabaseBottlenecks();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/ai/scalability/connection-pool
 * Optimizar connection pool
 */
router.put('/connection-pool', async (req, res) => {
    try {
        const newConfig = req.body;
        const result = await scalabilityService.optimizeConnectionPool(newConfig);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Async Processing ============

/**
 * GET /api/ai/scalability/queues/status
 * Estado de colas de procesamiento
 */
router.get('/queues/status', async (req, res) => {
    try {
        const status = await scalabilityService.getAsyncQueueStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/scalability/queues/enqueue
 * Encolar tarea
 */
router.post('/queues/enqueue', async (req, res) => {
    try {
        const { queue, data } = req.body;
        const result = await scalabilityService.enqueueTask(queue, data);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ High Availability ============

/**
 * GET /api/ai/scalability/ha-status
 * Estado de alta disponibilidad
 */
router.get('/ha-status', async (req, res) => {
    try {
        const status = await scalabilityService.getHAStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

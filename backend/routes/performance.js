"use strict";
/**
 * Rutas de Monitoreo de Performance
 * BGE Héroes de la Patria
 * FASE 4 - Semana 25-26
 * ✅ FASE 3 DAL - Refactorizado para usar DAO donde aplicable
 *
 * Endpoints para monitorear y optimizar el rendimiento del sistema
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// @ts-ignore
const auth_1 = require('../middleware/auth.js');
const CacheService_1 = require('../services/CacheService.js');
const QueryOptimizer_1 = __importDefault(require('../services/QueryOptimizer.js'));
// pool is not used directly in endpoints, we skip import or rely on DAOs
const analytics_dao_1 = __importDefault(require('../data/analytics.dao.js'));
const router = express_1.default.Router();
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
// ENDPOINTS DE CACHÉ
// ========================================
/**
 * GET /api/performance/cache/stats
 * Obtener estadísticas del caché
 */
router.get('/cache/stats', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const stats = CacheService_1.cache.getStats();
        res.json({
            success: true,
            data: {
                ...stats,
                hitRate: stats.hits + stats.misses > 0
                    ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
                    : '0%',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error obteniendo stats de caché:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de caché',
            error: error.message
        });
    }
});
/**
 * POST /api/performance/cache/clear
 * Limpiar el caché (todo o por patrón)
 */
router.post('/cache/clear', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const { pattern } = req.body;
        if (pattern) {
            // Limpiar por patrón
            const deleted = CacheService_1.cache.invalidatePattern(pattern);
            res.json({
                success: true,
                message: `Eliminadas ${deleted} entradas con patrón: ${pattern}`,
                deletedCount: deleted
            });
        }
        else {
            // Limpiar todo
            CacheService_1.cache.clear();
            res.json({
                success: true,
                message: 'Caché limpiado completamente'
            });
        }
    }
    catch (error) {
        console.error('[PERFORMANCE] Error limpiando caché:', error);
        res.status(500).json({
            success: false,
            message: 'Error al limpiar caché',
            error: error.message
        });
    }
});
/**
 * GET /api/performance/cache/keys
 * Obtener lista de keys en caché (para debugging)
 */
router.get('/cache/keys', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const { pattern, limit = '100' } = req.query;
        let keys = CacheService_1.cache.keys();
        if (pattern) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            keys = keys.filter((key) => regex.test(key));
        }
        res.json({
            success: true,
            data: {
                total: keys.length,
                keys: keys.slice(0, parseInt(limit)),
                truncated: keys.length > parseInt(limit)
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error obteniendo keys:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener keys de caché',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE QUERIES
// ========================================
/**
 * GET /api/performance/queries/stats
 * Obtener estadísticas de queries
 */
router.get('/queries/stats', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const stats = QueryOptimizer_1.default.getPerformanceStats();
        res.json({
            success: true,
            data: {
                ...stats,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error obteniendo stats de queries:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de queries',
            error: error.message
        });
    }
});
/**
 * POST /api/performance/queries/clear
 * Limpiar estadísticas de queries
 */
router.post('/queries/clear', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        QueryOptimizer_1.default.clearStats();
        res.json({
            success: true,
            message: 'Estadísticas de queries limpiadas'
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error limpiando stats de queries:', error);
        res.status(500).json({
            success: false,
            message: 'Error al limpiar estadísticas',
            error: error.message
        });
    }
});
/**
 * POST /api/performance/queries/analyze
 * Analizar una query y obtener sugerencias
 */
router.post('/queries/analyze', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el campo query'
            });
        }
        const suggestions = await QueryOptimizer_1.default.analyze(query);
        res.json({
            success: true,
            data: {
                query: query.substring(0, 500),
                suggestions,
                analyzedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error analizando query:', error);
        res.status(500).json({
            success: false,
            message: 'Error al analizar query',
            error: error.message
        });
    }
});
/**
 * POST /api/performance/queries/explain
 * Obtener plan de ejecución de una query
 */
router.post('/queries/explain', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { query, params = [] } = req.body;
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el campo query'
            });
        }
        // Solo permitir SELECT queries por seguridad
        if (!/^\s*SELECT/i.test(query)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se permite EXPLAIN en queries SELECT'
            });
        }
        const plan = await QueryOptimizer_1.default.explain(query, params);
        res.json({
            success: true,
            data: {
                query: query.substring(0, 500),
                executionPlan: plan,
                analyzedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error obteniendo EXPLAIN:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener plan de ejecución',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE BASE DE DATOS
// ========================================
/**
 * GET /api/performance/database/pool
 * Obtener estado del pool de conexiones
 */
router.get('/database/pool', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const poolStatus = QueryOptimizer_1.default.getPoolStatus();
        res.json({
            success: true,
            data: {
                ...poolStatus,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error obteniendo estado del pool:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado del pool',
            error: error.message
        });
    }
});
/**
 * GET /api/performance/database/tables
 * Obtener estadísticas de tablas
 */
router.get('/database/tables', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table } = req.query;
        // ✅ FASE 3: Using AnalyticsDAO
        const tableStats = await analytics_dao_1.default.getTableStats(table || null);
        res.json({
            success: true,
            data: {
                tables: tableStats,
                count: tableStats.length
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error obteniendo stats de tablas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de tablas',
            error: error.message
        });
    }
});
/**
 * GET /api/performance/database/indexes
 * Obtener uso de índices
 */
router.get('/database/indexes', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table, unused = false } = req.query;
        // ✅ FASE 3: Using AnalyticsDAO
        const indexes = await analytics_dao_1.default.getIndexUsage(table || null, unused === 'true');
        res.json({
            success: true,
            data: {
                indexes: indexes,
                count: indexes.length
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error obteniendo uso de índices:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener uso de índices',
            error: error.message
        });
    }
});
/**
 * POST /api/performance/database/indexes/suggest
 * Sugerir índices para una tabla
 */
router.post('/database/indexes/suggest', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table } = req.body;
        if (!table) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el nombre de la tabla'
            });
        }
        const suggestions = await QueryOptimizer_1.default.suggestIndexes(table);
        res.json({
            success: true,
            data: {
                table,
                columns: suggestions,
                analyzedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error sugiriendo índices:', error);
        res.status(500).json({
            success: false,
            message: 'Error al sugerir índices',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE SALUD Y DASHBOARD
// ========================================
/**
 * GET /api/performance/health
 * Health check completo del sistema
 */
router.get('/health', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const dbHealth = await QueryOptimizer_1.default.healthCheck();
        const cacheStats = CacheService_1.cache.getStats();
        const queryStats = QueryOptimizer_1.default.getPerformanceStats();
        const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'degraded';
        res.json({
            success: true,
            data: {
                status: overallStatus,
                database: dbHealth,
                cache: {
                    size: cacheStats.size,
                    hitRate: cacheStats.hits + cacheStats.misses > 0
                        ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%'
                        : 'N/A'
                },
                queries: {
                    totalExecuted: queryStats.totalQueries,
                    avgDuration: queryStats.avgDuration + 'ms',
                    errorRate: queryStats.totalQueries > 0
                        ? ((queryStats.totalErrors / queryStats.totalQueries) * 100).toFixed(2) + '%'
                        : '0%'
                },
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error en health check:', error);
        res.status(500).json({
            success: false,
            message: 'Error en health check',
            error: error.message
        });
    }
});
/**
 * GET /api/performance/dashboard
 * Datos completos para dashboard de performance
 */
router.get('/dashboard', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Obtener todas las métricas
        const [dbHealth, cacheStats, queryStats, poolStatus] = await Promise.all([
            QueryOptimizer_1.default.healthCheck(),
            CacheService_1.cache.getStats(),
            QueryOptimizer_1.default.getPerformanceStats(),
            QueryOptimizer_1.default.getPoolStatus()
        ]);
        // ✅ FASE 3: Using AnalyticsDAO
        const systemHealth = await analytics_dao_1.default.getSystemHealth();
        res.json({
            success: true,
            data: {
                overview: {
                    status: dbHealth.status,
                    dbResponseTime: dbHealth.responseTime + 'ms',
                    cacheHitRate: cacheStats.hits + cacheStats.misses > 0
                        ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2)
                        : 0,
                    avgQueryTime: parseFloat(queryStats.avgDuration) || 0
                },
                database: {
                    ...dbHealth,
                    pool: poolStatus,
                    topTables: systemHealth.top_tables,
                    unusedIndexes: systemHealth.unused_indexes_count
                },
                cache: {
                    ...cacheStats,
                    hitRate: cacheStats.hits + cacheStats.misses > 0
                        ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2)
                        : 0
                },
                queries: queryStats,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error obteniendo dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos del dashboard',
            error: error.message
        });
    }
});
/**
 * GET /api/performance/metrics
 * Métricas en formato Prometheus (para integración con monitoring)
 */
router.get('/metrics', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const cacheStats = CacheService_1.cache.getStats();
        const queryStats = QueryOptimizer_1.default.getPerformanceStats();
        const poolStatus = QueryOptimizer_1.default.getPoolStatus();
        // Formato texto simple para métricas
        let metrics = '';
        // Cache metrics
        metrics += `# HELP bge_cache_hits_total Total cache hits\n`;
        metrics += `# TYPE bge_cache_hits_total counter\n`;
        metrics += `bge_cache_hits_total ${cacheStats.hits}\n\n`;
        metrics += `# HELP bge_cache_misses_total Total cache misses\n`;
        metrics += `# TYPE bge_cache_misses_total counter\n`;
        metrics += `bge_cache_misses_total ${cacheStats.misses}\n\n`;
        metrics += `# HELP bge_cache_size Current cache size\n`;
        metrics += `# TYPE bge_cache_size gauge\n`;
        metrics += `bge_cache_size ${cacheStats.size}\n\n`;
        // Query metrics
        metrics += `# HELP bge_queries_total Total queries executed\n`;
        metrics += `# TYPE bge_queries_total counter\n`;
        metrics += `bge_queries_total ${queryStats.totalQueries}\n\n`;
        metrics += `# HELP bge_query_errors_total Total query errors\n`;
        metrics += `# TYPE bge_query_errors_total counter\n`;
        metrics += `bge_query_errors_total ${queryStats.totalErrors}\n\n`;
        metrics += `# HELP bge_query_duration_avg_ms Average query duration\n`;
        metrics += `# TYPE bge_query_duration_avg_ms gauge\n`;
        metrics += `bge_query_duration_avg_ms ${queryStats.avgDuration}\n\n`;
        // Pool metrics
        metrics += `# HELP bge_pool_total_connections Total pool connections\n`;
        metrics += `# TYPE bge_pool_total_connections gauge\n`;
        metrics += `bge_pool_total_connections ${poolStatus.totalCount || 0}\n\n`;
        metrics += `# HELP bge_pool_idle_connections Idle pool connections\n`;
        metrics += `# TYPE bge_pool_idle_connections gauge\n`;
        metrics += `bge_pool_idle_connections ${poolStatus.idleCount || 0}\n\n`;
        metrics += `# HELP bge_pool_waiting_connections Waiting pool connections\n`;
        metrics += `# TYPE bge_pool_waiting_connections gauge\n`;
        metrics += `bge_pool_waiting_connections ${poolStatus.waitingCount || 0}\n\n`;
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    }
    catch (error) {
        console.error('[PERFORMANCE] Error generando métricas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar métricas',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE OPTIMIZACIÓN AUTOMÁTICA
// ========================================
/**
 * POST /api/performance/optimize/vacuum
 * Ejecutar VACUUM en una tabla
 */
router.post('/optimize/vacuum', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table, analyze = true } = req.body;
        if (!table) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el nombre de la tabla'
            });
        }
        // ✅ FASE 3: Using AnalyticsDAO
        const exists = await analytics_dao_1.default.tableExists(table);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: `Tabla ${table} no encontrada`
            });
        }
        // Ejecutar VACUUM (nota: no se puede usar en transacción)
        const command = analyze ? `VACUUM ANALYZE ${table}` : `VACUUM ${table}`;
        await analytics_dao_1.default.executeMaintenanceCommand(command);
        res.json({
            success: true,
            message: `VACUUM ${analyze ? 'ANALYZE ' : ''}ejecutado en ${table}`,
            table,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error ejecutando VACUUM:', error);
        res.status(500).json({
            success: false,
            message: 'Error al ejecutar VACUUM',
            error: error.message
        });
    }
});
/**
 * POST /api/performance/optimize/reindex
 * Reconstruir índices de una tabla
 */
router.post('/optimize/reindex', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table } = req.body;
        if (!table) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el nombre de la tabla'
            });
        }
        // ✅ FASE 3: Using AnalyticsDAO
        const exists = await analytics_dao_1.default.tableExists(table);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: `Tabla ${table} no encontrada`
            });
        }
        await analytics_dao_1.default.executeMaintenanceCommand(`REINDEX TABLE ${table}`);
        res.json({
            success: true,
            message: `Índices de ${table} reconstruidos`,
            table,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[PERFORMANCE] Error ejecutando REINDEX:', error);
        res.status(500).json({
            success: false,
            message: 'Error al reconstruir índices',
            error: error.message
        });
    }
});
console.log('[PERFORMANCE-ROUTES] Rutas de monitoreo de performance cargadas');
exports.default = router;
//# sourceMappingURL=performance.js.map
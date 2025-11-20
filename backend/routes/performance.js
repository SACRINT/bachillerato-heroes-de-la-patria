/**
 * Rutas de Monitoreo de Performance
 * BGE Héroes de la Patria
 * FASE 4 - Semana 25-26
 *
 * Endpoints para monitorear y optimizar el rendimiento del sistema
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { cache, cacheKeys } = require('../services/CacheService');
const queryOptimizer = require('../services/QueryOptimizer');
const pool = require('../data/database-access').pool;

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
router.get('/cache/stats', authenticateToken, requireAdmin, (req, res) => {
    try {
        const stats = cache.getStats();

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
    } catch (error) {
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
router.post('/cache/clear', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { pattern } = req.body;

        if (pattern) {
            // Limpiar por patrón
            const deleted = cache.invalidatePattern(pattern);
            res.json({
                success: true,
                message: `Eliminadas ${deleted} entradas con patrón: ${pattern}`,
                deletedCount: deleted
            });
        } else {
            // Limpiar todo
            cache.clear();
            res.json({
                success: true,
                message: 'Caché limpiado completamente'
            });
        }
    } catch (error) {
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
router.get('/cache/keys', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { pattern, limit = 100 } = req.query;
        let keys = cache.keys();

        if (pattern) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            keys = keys.filter(key => regex.test(key));
        }

        res.json({
            success: true,
            data: {
                total: keys.length,
                keys: keys.slice(0, parseInt(limit)),
                truncated: keys.length > parseInt(limit)
            }
        });
    } catch (error) {
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
router.get('/queries/stats', authenticateToken, requireAdmin, (req, res) => {
    try {
        const stats = queryOptimizer.getPerformanceStats();

        res.json({
            success: true,
            data: {
                ...stats,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
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
router.post('/queries/clear', authenticateToken, requireAdmin, (req, res) => {
    try {
        queryOptimizer.clearStats();

        res.json({
            success: true,
            message: 'Estadísticas de queries limpiadas'
        });
    } catch (error) {
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
router.post('/queries/analyze', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el campo query'
            });
        }

        const suggestions = await queryOptimizer.analyze(query);

        res.json({
            success: true,
            data: {
                query: query.substring(0, 500),
                suggestions,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
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
router.post('/queries/explain', authenticateToken, requireAdmin, async (req, res) => {
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

        const plan = await queryOptimizer.explain(query, params);

        res.json({
            success: true,
            data: {
                query: query.substring(0, 500),
                executionPlan: plan,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
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
router.get('/database/pool', authenticateToken, requireAdmin, (req, res) => {
    try {
        const poolStatus = queryOptimizer.getPoolStatus();

        res.json({
            success: true,
            data: {
                ...poolStatus,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
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
router.get('/database/tables', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table } = req.query;

        let query = `
            SELECT
                relname as table_name,
                n_live_tup as row_count,
                n_dead_tup as dead_tuples,
                last_vacuum,
                last_autovacuum,
                last_analyze,
                last_autoanalyze,
                pg_size_pretty(pg_total_relation_size(relid)) as total_size
            FROM pg_stat_user_tables
        `;

        const params = [];
        if (table) {
            query += ' WHERE relname = $1';
            params.push(table);
        }

        query += ' ORDER BY n_live_tup DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: {
                tables: result.rows,
                count: result.rowCount
            }
        });
    } catch (error) {
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
router.get('/database/indexes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table, unused = false } = req.query;

        let query = `
            SELECT
                schemaname,
                relname as table_name,
                indexrelname as index_name,
                idx_scan as times_used,
                idx_tup_read as tuples_read,
                idx_tup_fetch as tuples_fetched,
                pg_size_pretty(pg_relation_size(indexrelid)) as index_size
            FROM pg_stat_user_indexes
        `;

        const conditions = [];
        const params = [];

        if (table) {
            params.push(table);
            conditions.push(`relname = $${params.length}`);
        }

        if (unused === 'true') {
            conditions.push('idx_scan = 0');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY idx_scan ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: {
                indexes: result.rows,
                count: result.rowCount
            }
        });
    } catch (error) {
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
router.post('/database/indexes/suggest', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table } = req.body;

        if (!table) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el nombre de la tabla'
            });
        }

        const suggestions = await queryOptimizer.suggestIndexes(table);

        res.json({
            success: true,
            data: {
                table,
                columns: suggestions,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
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
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const dbHealth = await queryOptimizer.healthCheck();
        const cacheStats = cache.getStats();
        const queryStats = queryOptimizer.getPerformanceStats();

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
    } catch (error) {
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
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Obtener todas las métricas
        const [dbHealth, cacheStats, queryStats, poolStatus] = await Promise.all([
            queryOptimizer.healthCheck(),
            cache.getStats(),
            queryOptimizer.getPerformanceStats(),
            queryOptimizer.getPoolStatus()
        ]);

        // Obtener top tables por tamaño
        const tablesResult = await pool.query(`
            SELECT
                relname as name,
                n_live_tup as rows,
                pg_size_pretty(pg_total_relation_size(relid)) as size
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(relid) DESC
            LIMIT 10
        `);

        // Obtener índices sin usar
        const unusedIndexesResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM pg_stat_user_indexes
            WHERE idx_scan = 0
        `);

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
                    topTables: tablesResult.rows,
                    unusedIndexes: parseInt(unusedIndexesResult.rows[0].count)
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
    } catch (error) {
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
router.get('/metrics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const cacheStats = cache.getStats();
        const queryStats = queryOptimizer.getPerformanceStats();
        const poolStatus = queryOptimizer.getPoolStatus();

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
    } catch (error) {
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
router.post('/optimize/vacuum', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table, analyze = true } = req.body;

        if (!table) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el nombre de la tabla'
            });
        }

        // Validar que la tabla existe
        const tableCheck = await pool.query(`
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public' AND tablename = $1
        `, [table]);

        if (tableCheck.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: `Tabla ${table} no encontrada`
            });
        }

        // Ejecutar VACUUM (nota: no se puede usar en transacción)
        const command = analyze ? `VACUUM ANALYZE ${table}` : `VACUUM ${table}`;
        await pool.query(command);

        res.json({
            success: true,
            message: `VACUUM ${analyze ? 'ANALYZE ' : ''}ejecutado en ${table}`,
            table,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
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
router.post('/optimize/reindex', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { table } = req.body;

        if (!table) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el nombre de la tabla'
            });
        }

        // Validar que la tabla existe
        const tableCheck = await pool.query(`
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public' AND tablename = $1
        `, [table]);

        if (tableCheck.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: `Tabla ${table} no encontrada`
            });
        }

        await pool.query(`REINDEX TABLE ${table}`);

        res.json({
            success: true,
            message: `Índices de ${table} reconstruidos`,
            table,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[PERFORMANCE] Error ejecutando REINDEX:', error);
        res.status(500).json({
            success: false,
            message: 'Error al reconstruir índices',
            error: error.message
        });
    }
});

console.log('[PERFORMANCE-ROUTES] Rutas de monitoreo de performance cargadas');

module.exports = router;

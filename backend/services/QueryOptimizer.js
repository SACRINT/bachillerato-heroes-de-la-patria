/**
 * Servicio de Optimización de Consultas
 * BGE Héroes de la Patria
 * FASE 4 - Semana 25-26
 *
 * Utilidades para optimización de consultas SQL
 */

const pool = require('../data/database-access').pool;

class QueryOptimizer {
    constructor() {
        // Estadísticas de consultas
        this.queryStats = new Map();

        // Configuración
        this.slowQueryThreshold = 1000; // ms
        this.queryHistoryLimit = 1000;

        console.log('[QUERY-OPTIMIZER] Servicio inicializado');
    }

    /**
     * Ejecutar consulta con tracking de performance
     */
    async query(text, params = [], options = {}) {
        const startTime = Date.now();
        const queryId = this.generateQueryId(text);

        try {
            const result = await pool.query(text, params);
            const duration = Date.now() - startTime;

            // Registrar estadísticas
            this.recordQueryStats(queryId, text, duration, result.rowCount);

            // Log de consultas lentas
            if (duration > this.slowQueryThreshold) {
                console.warn(`[SLOW-QUERY] ${duration}ms: ${text.substring(0, 100)}...`);
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.recordQueryError(queryId, text, duration, error);
            throw error;
        }
    }

    /**
     * Ejecutar consulta con caché
     */
    async cachedQuery(cacheKey, text, params = [], ttlSeconds = 300) {
        const { cache } = require('./CacheService');

        return await cache.getOrSet(cacheKey, async () => {
            const result = await this.query(text, params);
            return result.rows;
        }, ttlSeconds);
    }

    /**
     * Ejecutar múltiples consultas en paralelo
     */
    async parallel(queries) {
        const promises = queries.map(q => {
            if (typeof q === 'string') {
                return this.query(q);
            }
            return this.query(q.text, q.params);
        });

        return Promise.all(promises);
    }

    /**
     * Ejecutar consultas en transacción
     */
    async transaction(callback) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtener plan de ejecución (EXPLAIN)
     */
    async explain(text, params = []) {
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${text}`;
        const result = await pool.query(explainQuery, params);
        return result.rows[0]['QUERY PLAN'];
    }

    /**
     * Analizar consulta y sugerir mejoras
     */
    async analyze(text) {
        const suggestions = [];

        // Verificar SELECT *
        if (/SELECT\s+\*/i.test(text)) {
            suggestions.push({
                type: 'warning',
                message: 'Evitar SELECT * - especificar columnas necesarias'
            });
        }

        // Verificar LIKE con wildcard al inicio
        if (/LIKE\s+['"]%/i.test(text)) {
            suggestions.push({
                type: 'warning',
                message: 'LIKE con % al inicio previene uso de índices'
            });
        }

        // Verificar funciones en WHERE
        if (/WHERE.*(?:LOWER|UPPER|DATE|EXTRACT)\(/i.test(text)) {
            suggestions.push({
                type: 'info',
                message: 'Funciones en WHERE pueden prevenir uso de índices'
            });
        }

        // Verificar ORDER BY sin LIMIT
        if (/ORDER\s+BY/i.test(text) && !/LIMIT/i.test(text)) {
            suggestions.push({
                type: 'info',
                message: 'Considerar agregar LIMIT para evitar ordenar muchos registros'
            });
        }

        // Verificar subconsultas en SELECT
        if (/SELECT\s+.*\(\s*SELECT/i.test(text)) {
            suggestions.push({
                type: 'warning',
                message: 'Subconsultas en SELECT pueden ser costosas - considerar JOINs'
            });
        }

        // Verificar NOT IN con subconsulta
        if (/NOT\s+IN\s*\(\s*SELECT/i.test(text)) {
            suggestions.push({
                type: 'warning',
                message: 'NOT IN con subconsulta puede ser lento - usar NOT EXISTS'
            });
        }

        return suggestions;
    }

    /**
     * Obtener índices recomendados para una tabla
     */
    async suggestIndexes(tableName) {
        // Obtener columnas más usadas en WHERE
        const result = await pool.query(`
            SELECT
                a.attname as column_name,
                t.typname as data_type,
                CASE WHEN i.indexrelid IS NOT NULL THEN true ELSE false END as has_index
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            JOIN pg_type t ON a.atttypid = t.oid
            LEFT JOIN pg_index i ON c.oid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE c.relname = $1 AND a.attnum > 0 AND NOT a.attisdropped
            ORDER BY a.attnum
        `, [tableName]);

        return result.rows;
    }

    /**
     * Obtener estadísticas de la tabla
     */
    async getTableStats(tableName) {
        const result = await pool.query(`
            SELECT
                relname as table_name,
                n_live_tup as row_count,
                n_dead_tup as dead_tuples,
                last_vacuum,
                last_autovacuum,
                last_analyze,
                last_autoanalyze
            FROM pg_stat_user_tables
            WHERE relname = $1
        `, [tableName]);

        return result.rows[0];
    }

    /**
     * Generar ID único para consulta
     */
    generateQueryId(text) {
        // Normalizar consulta
        const normalized = text
            .replace(/\s+/g, ' ')
            .replace(/\$\d+/g, '?')
            .trim()
            .toLowerCase();

        // Hash simple
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    /**
     * Registrar estadísticas de consulta
     */
    recordQueryStats(queryId, text, duration, rowCount) {
        let stats = this.queryStats.get(queryId);

        if (!stats) {
            stats = {
                query: text.substring(0, 200),
                count: 0,
                totalDuration: 0,
                avgDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                totalRows: 0
            };
            this.queryStats.set(queryId, stats);
        }

        stats.count++;
        stats.totalDuration += duration;
        stats.avgDuration = stats.totalDuration / stats.count;
        stats.minDuration = Math.min(stats.minDuration, duration);
        stats.maxDuration = Math.max(stats.maxDuration, duration);
        stats.totalRows += rowCount;
        stats.lastExecuted = new Date().toISOString();

        // Limitar historial
        if (this.queryStats.size > this.queryHistoryLimit) {
            const firstKey = this.queryStats.keys().next().value;
            this.queryStats.delete(firstKey);
        }
    }

    /**
     * Registrar error de consulta
     */
    recordQueryError(queryId, text, duration, error) {
        let stats = this.queryStats.get(queryId);

        if (!stats) {
            stats = {
                query: text.substring(0, 200),
                count: 0,
                errors: 0
            };
            this.queryStats.set(queryId, stats);
        }

        stats.errors = (stats.errors || 0) + 1;
        stats.lastError = error.message;
        stats.lastErrorAt = new Date().toISOString();
    }

    /**
     * Obtener estadísticas de rendimiento
     */
    getPerformanceStats() {
        const stats = Array.from(this.queryStats.values());

        // Ordenar por tiempo total
        const slowest = [...stats]
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, 10);

        // Ordenar por frecuencia
        const mostFrequent = [...stats]
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calcular totales
        const totals = stats.reduce((acc, s) => ({
            totalQueries: acc.totalQueries + s.count,
            totalDuration: acc.totalDuration + s.totalDuration,
            totalErrors: acc.totalErrors + (s.errors || 0)
        }), { totalQueries: 0, totalDuration: 0, totalErrors: 0 });

        return {
            uniqueQueries: stats.length,
            ...totals,
            avgDuration: totals.totalQueries > 0
                ? (totals.totalDuration / totals.totalQueries).toFixed(2)
                : 0,
            slowestQueries: slowest,
            mostFrequentQueries: mostFrequent
        };
    }

    /**
     * Limpiar estadísticas
     */
    clearStats() {
        this.queryStats.clear();
    }

    /**
     * Obtener estado del pool de conexiones
     */
    getPoolStatus() {
        return {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        };
    }

    /**
     * Verificar salud de la base de datos
     */
    async healthCheck() {
        const startTime = Date.now();
        try {
            const result = await pool.query('SELECT 1 as health');
            const duration = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime: duration,
                pool: this.getPoolStatus()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                pool: this.getPoolStatus()
            };
        }
    }
}

module.exports = new QueryOptimizer();

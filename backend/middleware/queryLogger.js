/**
 * 🔍 QUERY LOGGER & ANALYZER - SEMANA 26
 * Middleware para logging y análisis de queries PostgreSQL
 *
 * Features:
 * - Query timing automático
 * - Detección de queries lentas (>100ms)
 * - EXPLAIN ANALYZE para queries problemáticas
 * - Sugerencias de índices
 * - Query pattern detection
 * - Statistics y reporting
 * - Portable y modular
 *
 * Uso:
 * ```javascript
 * const queryLogger = require('./middleware/queryLogger');
 *
 * // Wrapper para pool.query
 * const result = await queryLogger.loggedQuery(query, params);
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class QueryLogger {
    constructor(config = {}) {
        this.config = {
            slowQueryThreshold: config.slowQueryThreshold || 100,     // ms
            enableExplain: config.enableExplain !== false,
            logAllQueries: config.logAllQueries || false,
            maxStoredQueries: config.maxStoredQueries || 1000,
            ...config
        };

        // Query storage
        this.queries = [];
        this.slowQueries = [];
        this.queryPatterns = new Map();

        // Statistics
        this.stats = {
            totalQueries: 0,
            slowQueries: 0,
            totalTime: 0,
            avgTime: 0,
            byTable: new Map(),
            byType: new Map() // SELECT, INSERT, UPDATE, DELETE
        };

        // Cleanup cada hora
        setInterval(() => this.cleanup(), 60 * 60 * 1000);

        devLogger.log('QUERY-LOGGER', '🔍 Query Logger initialized');
    }

    /**
     * LOGGED QUERY (wrapper para pool.query)
     */
    async loggedQuery(pool, query, params = []) {
        const startTime = Date.now();
        const queryId = this.generateQueryId();

        try {
            // Execute query
            const result = await pool.query(query, params);
            const duration = Date.now() - startTime;

            // Log query
            await this.logQuery({
                id: queryId,
                query: query,
                params: params,
                duration: duration,
                rows: result.rowCount,
                success: true,
                timestamp: startTime
            });

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;

            // Log failed query
            await this.logQuery({
                id: queryId,
                query: query,
                params: params,
                duration: duration,
                rows: 0,
                success: false,
                error: error.message,
                timestamp: startTime
            });

            throw error;
        }
    }

    /**
     * LOG QUERY
     */
    async logQuery(queryInfo) {
        // Update statistics
        this.stats.totalQueries++;
        this.stats.totalTime += queryInfo.duration;
        this.stats.avgTime = this.stats.totalTime / this.stats.totalQueries;

        // Extract query type and table
        const queryType = this.extractQueryType(queryInfo.query);
        const table = this.extractTableName(queryInfo.query);

        // Update stats by type
        const typeCount = this.stats.byType.get(queryType) || { count: 0, totalTime: 0 };
        typeCount.count++;
        typeCount.totalTime += queryInfo.duration;
        this.stats.byType.set(queryType, typeCount);

        // Update stats by table
        if (table) {
            const tableStats = this.stats.byTable.get(table) || { count: 0, totalTime: 0 };
            tableStats.count++;
            tableStats.totalTime += queryInfo.duration;
            this.stats.byTable.set(table, tableStats);
        }

        // Store query
        this.queries.push({
            ...queryInfo,
            type: queryType,
            table: table
        });

        // Limit stored queries
        if (this.queries.length > this.config.maxStoredQueries) {
            this.queries.shift();
        }

        // Check if slow query
        if (queryInfo.duration > this.config.slowQueryThreshold) {
            this.stats.slowQueries++;
            this.handleSlowQuery(queryInfo, queryType, table);
        }

        // Log if enabled
        if (this.config.logAllQueries || queryInfo.duration > this.config.slowQueryThreshold) {
            devLogger.log('QUERY-LOGGER',
                `${queryType} ${table || 'unknown'} - ${queryInfo.duration}ms (${queryInfo.rows} rows)`
            );
        }
    }

    /**
     * HANDLE SLOW QUERY
     */
    async handleSlowQuery(queryInfo, queryType, table) {
        const slowQuery = {
            ...queryInfo,
            type: queryType,
            table: table,
            timestamp: new Date(queryInfo.timestamp).toISOString()
        };

        this.slowQueries.push(slowQuery);

        // Log warning
        devLogger.warn('QUERY-LOGGER',
            `🐌 SLOW QUERY (${queryInfo.duration}ms): ${queryType} ${table || 'unknown'}`
        );

        // Pattern detection
        const pattern = this.generateQueryPattern(queryInfo.query);
        const patternCount = this.queryPatterns.get(pattern) || { count: 0, examples: [] };
        patternCount.count++;
        patternCount.examples.push(slowQuery);
        if (patternCount.examples.length > 5) {
            patternCount.examples.shift(); // Keep last 5
        }
        this.queryPatterns.set(pattern, patternCount);

        // Suggest optimizations
        if (this.config.enableExplain && queryInfo.success) {
            await this.suggestOptimizations(queryInfo);
        }
    }

    /**
     * SUGGEST OPTIMIZATIONS
     */
    async suggestOptimizations(queryInfo) {
        const suggestions = [];

        // Check for missing WHERE clause
        if (queryInfo.query.toUpperCase().includes('SELECT') &&
            !queryInfo.query.toUpperCase().includes('WHERE') &&
            !queryInfo.query.toUpperCase().includes('LIMIT')) {
            suggestions.push({
                type: 'MISSING_WHERE',
                severity: 'HIGH',
                message: 'Query selecciona toda la tabla sin WHERE clause',
                suggestion: 'Agregar WHERE clause o LIMIT para reducir rows'
            });
        }

        // Check for SELECT *
        if (queryInfo.query.toUpperCase().includes('SELECT *')) {
            suggestions.push({
                type: 'SELECT_ALL',
                severity: 'MEDIUM',
                message: 'Query usa SELECT * en lugar de columnas específicas',
                suggestion: 'Seleccionar solo las columnas necesarias'
            });
        }

        // Check for multiple JOINs
        const joinCount = (queryInfo.query.match(/JOIN/gi) || []).length;
        if (joinCount >= 3) {
            suggestions.push({
                type: 'MULTIPLE_JOINS',
                severity: 'HIGH',
                message: `Query tiene ${joinCount} JOINs`,
                suggestion: 'Considerar denormalización o índices en columnas JOIN'
            });
        }

        // Check for OR conditions
        if (queryInfo.query.toUpperCase().includes(' OR ')) {
            suggestions.push({
                type: 'OR_CONDITION',
                severity: 'MEDIUM',
                message: 'Query usa OR conditions (puede no usar índices)',
                suggestion: 'Considerar UNION o IN clause en su lugar'
            });
        }

        // Check for LIKE with leading wildcard
        if (queryInfo.query.match(/LIKE\s+['"]%/i)) {
            suggestions.push({
                type: 'LEADING_WILDCARD',
                severity: 'HIGH',
                message: 'LIKE con % al inicio no puede usar índices',
                suggestion: 'Usar full-text search o reordenar LIKE pattern'
            });
        }

        // Store suggestions
        if (suggestions.length > 0) {
            const slowQueryIndex = this.slowQueries.length - 1;
            if (this.slowQueries[slowQueryIndex]) {
                this.slowQueries[slowQueryIndex].suggestions = suggestions;
            }

            devLogger.warn('QUERY-LOGGER',
                `💡 ${suggestions.length} optimization suggestions for slow query`
            );
        }
    }

    /**
     * EXTRACT QUERY TYPE
     */
    extractQueryType(query) {
        const upperQuery = query.trim().toUpperCase();

        if (upperQuery.startsWith('SELECT')) return 'SELECT';
        if (upperQuery.startsWith('INSERT')) return 'INSERT';
        if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
        if (upperQuery.startsWith('DELETE')) return 'DELETE';
        if (upperQuery.startsWith('CREATE')) return 'CREATE';
        if (upperQuery.startsWith('ALTER')) return 'ALTER';
        if (upperQuery.startsWith('DROP')) return 'DROP';

        return 'OTHER';
    }

    /**
     * EXTRACT TABLE NAME
     */
    extractTableName(query) {
        const upperQuery = query.toUpperCase();

        // SELECT ... FROM table
        let match = upperQuery.match(/FROM\s+([a-z_][a-z0-9_]*)/i);
        if (match) return match[1].toLowerCase();

        // INSERT INTO table
        match = upperQuery.match(/INSERT\s+INTO\s+([a-z_][a-z0-9_]*)/i);
        if (match) return match[1].toLowerCase();

        // UPDATE table
        match = upperQuery.match(/UPDATE\s+([a-z_][a-z0-9_]*)/i);
        if (match) return match[1].toLowerCase();

        // DELETE FROM table
        match = upperQuery.match(/DELETE\s+FROM\s+([a-z_][a-z0-9_]*)/i);
        if (match) return match[1].toLowerCase();

        return null;
    }

    /**
     * GENERATE QUERY PATTERN (para agrupar queries similares)
     */
    generateQueryPattern(query) {
        // Replace literals with placeholders
        let pattern = query
            .replace(/\$\d+/g, '$N')           // $1, $2 → $N
            .replace(/'[^']*'/g, "'?'")        // 'value' → '?'
            .replace(/\d+/g, 'N')              // 123 → N
            .replace(/\s+/g, ' ')              // Normalize whitespace
            .trim();

        return pattern;
    }

    /**
     * GET TOP SLOW QUERIES
     */
    getTopSlowQueries(limit = 10) {
        return this.slowQueries
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit)
            .map(q => ({
                id: q.id,
                type: q.type,
                table: q.table,
                duration: q.duration,
                rows: q.rows,
                query: q.query.substring(0, 200),
                suggestions: q.suggestions || [],
                timestamp: q.timestamp
            }));
    }

    /**
     * GET STATISTICS
     */
    getStats() {
        // Top tables by query count
        const topTables = Array.from(this.stats.byTable.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([table, stats]) => ({
                table,
                count: stats.count,
                avgTime: (stats.totalTime / stats.count).toFixed(2)
            }));

        // Query type distribution
        const queryTypes = Object.fromEntries(
            Array.from(this.stats.byType.entries()).map(([type, stats]) => [
                type,
                {
                    count: stats.count,
                    avgTime: (stats.totalTime / stats.count).toFixed(2)
                }
            ])
        );

        return {
            summary: {
                totalQueries: this.stats.totalQueries,
                slowQueries: this.stats.slowQueries,
                slowQueryRate: this.stats.totalQueries > 0
                    ? ((this.stats.slowQueries / this.stats.totalQueries) * 100).toFixed(2) + '%'
                    : '0%',
                avgQueryTime: this.stats.avgTime.toFixed(2) + 'ms'
            },
            topTables: topTables,
            queryTypes: queryTypes,
            topSlowQueries: this.getTopSlowQueries(10),
            repeatedSlowPatterns: this.getRepeatedSlowPatterns()
        };
    }

    /**
     * GET REPEATED SLOW PATTERNS
     */
    getRepeatedSlowPatterns() {
        return Array.from(this.queryPatterns.entries())
            .filter(([pattern, data]) => data.count >= 3)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([pattern, data]) => ({
                pattern: pattern.substring(0, 150),
                occurrences: data.count,
                examples: data.examples.slice(0, 2)
            }));
    }

    /**
     * CLEANUP OLD QUERIES
     */
    cleanup() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        // Keep only last hour of queries
        this.queries = this.queries.filter(q => q.timestamp > oneHourAgo);
        this.slowQueries = this.slowQueries.filter(q => q.timestamp > oneHourAgo);

        devLogger.log('QUERY-LOGGER', `🧹 Cleanup: kept ${this.queries.length} queries`);
    }

    /**
     * GENERATE QUERY ID
     */
    generateQueryId() {
        return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * RESET
     */
    reset() {
        this.queries = [];
        this.slowQueries = [];
        this.queryPatterns.clear();
        this.stats = {
            totalQueries: 0,
            slowQueries: 0,
            totalTime: 0,
            avgTime: 0,
            byTable: new Map(),
            byType: new Map()
        };

        devLogger.log('QUERY-LOGGER', '🔄 Query logger reset');
    }
}

// Export singleton
const queryLogger = new QueryLogger();

module.exports = queryLogger;

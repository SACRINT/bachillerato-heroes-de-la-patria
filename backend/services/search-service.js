/**
 * 🔍 ADVANCED SEARCH SERVICE - SEMANA 6
 * Servicio de búsqueda avanzada con PostgreSQL Full-Text Search
 *
 * Características:
 * - Full-text search con tsvector/tsquery (mejor que LIKE)
 * - Filtros complejos (AND/OR/NOT, date ranges, multiple selects)
 * - Search analytics (tracking de términos buscados)
 * - Performance < 200ms
 * - Support para múltiples tablas (estudiantes, documentos, noticias, etc)
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

/**
 * CONFIGURACIÓN DE TABLAS SEARCHABLES
 */
const SEARCHABLE_TABLES = {
    estudiantes: {
        table: 'usuarios',
        columns: ['nombre', 'apellido_paterno', 'apellido_materno', 'email'],
        where: "role = 'estudiante'",
        type: 'estudiante',
        urlPattern: '/estudiantes/:id'
    },
    docentes: {
        table: 'usuarios',
        columns: ['nombre', 'apellido_paterno', 'apellido_materno', 'email'],
        where: "role = 'docente'",
        type: 'docente',
        urlPattern: '/docentes/:id'
    },
    noticias: {
        table: 'noticias',
        columns: ['titulo', 'resumen', 'contenido'],
        where: "estado = 'publicada'",
        type: 'noticia',
        urlPattern: '/noticias/:slug',
        dateColumn: 'fecha_publicacion'
    },
    eventos: {
        table: 'eventos',
        columns: ['titulo', 'descripcion', 'resumen'],
        where: "estado = 'publicado'",
        type: 'evento',
        urlPattern: '/eventos/:slug',
        dateColumn: 'fecha_inicio'
    },
    avisos: {
        table: 'avisos',
        columns: ['titulo', 'contenido'],
        where: "estado = 'publicada'",
        type: 'aviso',
        urlPattern: '/avisos/:slug',
        dateColumn: 'fecha_publicacion'
    },
    comunicados: {
        table: 'comunicados',
        columns: ['titulo', 'contenido', 'resumen'],
        where: "estado = 'publicada'",
        type: 'comunicado',
        urlPattern: '/comunicados/:slug',
        dateColumn: 'fecha_publicacion'
    },
    egresados: {
        table: 'egresados',
        columns: ['nombre_completo', 'carrera', 'empresa_actual'],
        where: "estado_perfil = 'aprobado'",
        type: 'egresado',
        urlPattern: '/egresados/:email',
        dateColumn: 'fecha_egreso'
    }
};

class SearchService {
    /**
     * Búsqueda avanzada con full-text search y filtros
     * @param {Object} options
     * @param {string} options.query - Término de búsqueda
     * @param {string[]} options.tables - Tablas donde buscar (default: todas)
     * @param {Object} options.filters - Filtros adicionales
     * @param {Object} options.dateRange - Rango de fechas {from, to}
     * @param {string} options.operator - 'AND' o 'OR' (default: 'AND')
     * @param {number} options.limit - Límite de resultados (default: 20)
     * @param {number} options.offset - Offset para paginación (default: 0)
     * @returns {Promise<Object>}
     */
    async advancedSearch(options = {}) {
        const {
            query,
            tables = Object.keys(SEARCHABLE_TABLES),
            filters = {},
            dateRange = {},
            operator = 'AND',
            limit = 20,
            offset = 0
        } = options;

        // Validar query
        if (!query || query.trim().length < 2) {
            return {
                success: true,
                query,
                results: {},
                total: 0,
                took: 0
            };
        }

        const startTime = Date.now();

        // Preparar término de búsqueda para full-text search
        const searchTerms = query.trim().split(/\s+/);
        const tsquery = searchTerms.join(` ${operator === 'OR' ? '|' : '&'} `);

        // Ejecutar búsquedas en paralelo
        const searchPromises = tables
            .filter(table => SEARCHABLE_TABLES[table])
            .map(table => this.searchInTable(
                SEARCHABLE_TABLES[table],
                tsquery,
                query,
                dateRange,
                filters,
                limit,
                offset
            ));

        const results = await Promise.all(searchPromises);

        // Combinar resultados
        const combined = {};
        let totalResults = 0;

        tables.forEach((table, index) => {
            if (SEARCHABLE_TABLES[table] && results[index]) {
                combined[table] = results[index];
                totalResults += results[index].length;
            }
        });

        const took = Date.now() - startTime;

        devLogger.log(`[SEARCH] Query: "${query}" | Tables: ${tables.join(',')} | Results: ${totalResults} | Took: ${took}ms`);

        // Track analytics
        await this.trackSearch(query, totalResults, took);

        return {
            success: true,
            query,
            results: combined,
            total: totalResults,
            took
        };
    }

    /**
     * Buscar en una tabla específica
     * @private
     */
    async searchInTable(tableConfig, tsquery, originalQuery, dateRange, filters, limit, offset) {
        try {
            const { table, columns, where, type, urlPattern, dateColumn } = tableConfig;

            // Construir query dinámicamente
            let sql = `
                SELECT
                    *,
                    '${type}' as result_type,
                    ts_rank(
                        to_tsvector('spanish', ${columns.map(c => `COALESCE(${c}, '')`).join(" || ' ' || ")}),
                        to_tsquery('spanish', $1)
                    ) as rank
                FROM ${table}
                WHERE
                    to_tsvector('spanish', ${columns.map(c => `COALESCE(${c}, '')`).join(" || ' ' || ")})
                    @@ to_tsquery('spanish', $1)
            `;

            const params = [tsquery];
            let paramIndex = 2;

            // Agregar WHERE conditions
            if (where) {
                sql += ` AND (${where})`;
            }

            // Filtro de fecha
            if (dateColumn && (dateRange.from || dateRange.to)) {
                if (dateRange.from) {
                    sql += ` AND ${dateColumn} >= $${paramIndex}`;
                    params.push(dateRange.from);
                    paramIndex++;
                }
                if (dateRange.to) {
                    sql += ` AND ${dateColumn} <= $${paramIndex}`;
                    params.push(dateRange.to);
                    paramIndex++;
                }
            }

            // Filtros adicionales
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null && value !== '') {
                    sql += ` AND ${key} = $${paramIndex}`;
                    params.push(value);
                    paramIndex++;
                }
            }

            // Order by relevance
            sql += ` ORDER BY rank DESC, ${dateColumn || 'id'} DESC`;

            // Paginación
            sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(sql, params);

            // Formatear resultados
            return result.rows.map(row => this.formatResult(row, tableConfig));

        } catch (error) {
            devLogger.error(`[SEARCH] Error en tabla ${tableConfig.table}:`, error);
            return [];
        }
    }

    /**
     * Formatear resultado para respuesta uniforme
     * @private
     */
    formatResult(row, tableConfig) {
        const { type, urlPattern } = tableConfig;

        // Extraer datos relevantes según tipo
        let formatted = {
            type,
            rank: parseFloat(row.rank || 0).toFixed(4),
            ...row
        };

        // Generar URL
        if (urlPattern) {
            if (row.slug) {
                formatted.url = urlPattern.replace(':slug', row.slug);
            } else if (row.email) {
                formatted.url = urlPattern.replace(':email', row.email);
            } else if (row.id) {
                formatted.url = urlPattern.replace(':id', row.id);
            }
        }

        return formatted;
    }

    /**
     * Autocomplete/Suggestions con debounce-friendly response
     * @param {string} query - Partial query
     * @param {string[]} tables - Tables to search (default: all)
     * @param {number} limit - Max suggestions (default: 10)
     * @returns {Promise<Array>}
     */
    async getSuggestions(query, tables = Object.keys(SEARCHABLE_TABLES), limit = 10) {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const searchTerm = `${query.toLowerCase()}%`; // Prefix search

        const suggestionPromises = tables
            .filter(table => SEARCHABLE_TABLES[table])
            .map(async (table) => {
                const config = SEARCHABLE_TABLES[table];
                const mainColumn = config.columns[0]; // Use first column for suggestions

                try {
                    const result = await pool.query(`
                        SELECT DISTINCT
                            ${mainColumn} as suggestion,
                            '${config.type}' as type
                        FROM ${config.table}
                        WHERE
                            LOWER(${mainColumn}) LIKE $1
                            ${config.where ? `AND (${config.where})` : ''}
                        LIMIT $2
                    `, [searchTerm, Math.ceil(limit / tables.length)]);

                    return result.rows;
                } catch (error) {
                    devLogger.error(`[SUGGESTIONS] Error en ${table}:`, error);
                    return [];
                }
            });

        const results = await Promise.all(suggestionPromises);
        const flattened = results.flat();

        // Deduplicate and limit
        const unique = Array.from(
            new Map(flattened.map(item => [item.suggestion, item])).values()
        ).slice(0, limit);

        return unique;
    }

    /**
     * Búsqueda con filtros complejos (AND/OR/NOT logic)
     * @param {Object} filterTree - Árbol de filtros con operadores lógicos
     * @param {string[]} tables - Tablas donde buscar
     * @returns {Promise<Object>}
     */
    async searchWithComplexFilters(filterTree, tables = Object.keys(SEARCHABLE_TABLES)) {
        // TODO: Implementar parser de árbol de filtros complejo
        // Por ahora, usar advancedSearch con operator
        devLogger.warn('[SEARCH] Complex filter tree not fully implemented yet');
        return this.advancedSearch({
            query: filterTree.query || '',
            tables,
            filters: filterTree.filters || {},
            operator: filterTree.operator || 'AND'
        });
    }

    /**
     * Track search query para analytics
     * @private
     */
    async trackSearch(query, resultsCount, timeMs) {
        try {
            // Guardar en tabla search_analytics
            await pool.query(`
                INSERT INTO search_analytics (query, results_count, time_ms, searched_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT DO NOTHING
            `, [query.toLowerCase().trim(), resultsCount, timeMs]);
        } catch (error) {
            // Si la tabla no existe, crear en próximo deployment
            devLogger.warn('[SEARCH-ANALYTICS] Tabla search_analytics no existe (crear en migración)');
        }
    }

    /**
     * Obtener términos más buscados (analytics)
     * @param {number} limit - Número de términos (default: 10)
     * @param {Object} dateRange - Rango de fechas {from, to}
     * @returns {Promise<Array>}
     */
    async getTopSearchTerms(limit = 10, dateRange = {}) {
        try {
            let sql = `
                SELECT
                    query,
                    COUNT(*) as search_count,
                    AVG(results_count) as avg_results,
                    AVG(time_ms) as avg_time_ms,
                    MAX(searched_at) as last_searched
                FROM search_analytics
                WHERE 1=1
            `;

            const params = [];
            let paramIndex = 1;

            if (dateRange.from) {
                sql += ` AND searched_at >= $${paramIndex}`;
                params.push(dateRange.from);
                paramIndex++;
            }

            if (dateRange.to) {
                sql += ` AND searched_at <= $${paramIndex}`;
                params.push(dateRange.to);
                paramIndex++;
            }

            sql += `
                GROUP BY query
                ORDER BY search_count DESC, last_searched DESC
                LIMIT $${paramIndex}
            `;
            params.push(limit);

            const result = await pool.query(sql, params);

            return result.rows.map(row => ({
                query: row.query,
                searchCount: parseInt(row.search_count),
                avgResults: parseFloat(row.avg_results).toFixed(1),
                avgTimeMs: parseFloat(row.avg_time_ms).toFixed(2),
                lastSearched: row.last_searched
            }));
        } catch (error) {
            devLogger.error('[SEARCH-ANALYTICS] Error al obtener top terms:', error);
            return [];
        }
    }

    /**
     * Get search analytics summary
     * @param {Object} dateRange - {from, to}
     * @returns {Promise<Object>}
     */
    async getSearchAnalytics(dateRange = {}) {
        try {
            let sql = `
                SELECT
                    COUNT(*) as total_searches,
                    COUNT(DISTINCT query) as unique_queries,
                    AVG(results_count) as avg_results_per_search,
                    AVG(time_ms) as avg_search_time_ms,
                    MAX(time_ms) as max_search_time_ms,
                    MIN(time_ms) as min_search_time_ms
                FROM search_analytics
                WHERE 1=1
            `;

            const params = [];
            let paramIndex = 1;

            if (dateRange.from) {
                sql += ` AND searched_at >= $${paramIndex}`;
                params.push(dateRange.from);
                paramIndex++;
            }

            if (dateRange.to) {
                sql += ` AND searched_at <= $${paramIndex}`;
                params.push(dateRange.to);
                paramIndex++;
            }

            const result = await pool.query(sql, params);
            const row = result.rows[0];

            return {
                totalSearches: parseInt(row.total_searches || 0),
                uniqueQueries: parseInt(row.unique_queries || 0),
                avgResultsPerSearch: parseFloat(row.avg_results_per_search || 0).toFixed(1),
                avgSearchTimeMs: parseFloat(row.avg_search_time_ms || 0).toFixed(2),
                maxSearchTimeMs: parseFloat(row.max_search_time_ms || 0).toFixed(2),
                minSearchTimeMs: parseFloat(row.min_search_time_ms || 0).toFixed(2)
            };
        } catch (error) {
            devLogger.error('[SEARCH-ANALYTICS] Error al obtener analytics:', error);
            return {
                totalSearches: 0,
                uniqueQueries: 0,
                avgResultsPerSearch: 0,
                avgSearchTimeMs: 0,
                maxSearchTimeMs: 0,
                minSearchTimeMs: 0
            };
        }
    }
}

// Exportar instancia singleton
module.exports = new SearchService();

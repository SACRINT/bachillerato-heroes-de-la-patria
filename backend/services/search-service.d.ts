declare const _exports: SearchService;
export = _exports;
declare class SearchService {
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
    advancedSearch(options?: {
        query: string;
        tables: string[];
        filters: any;
        dateRange: any;
        operator: string;
        limit: number;
        offset: number;
    }): Promise<any>;
    /**
     * Buscar en una tabla específica
     * @private
     */
    private searchInTable;
    /**
     * Formatear resultado para respuesta uniforme
     * @private
     */
    private formatResult;
    /**
     * Autocomplete/Suggestions con debounce-friendly response
     * @param {string} query - Partial query
     * @param {string[]} tables - Tables to search (default: all)
     * @param {number} limit - Max suggestions (default: 10)
     * @returns {Promise<Array>}
     */
    getSuggestions(query: string, tables?: string[], limit?: number): Promise<any[]>;
    /**
     * Búsqueda con filtros complejos (AND/OR/NOT logic)
     * @param {Object} filterTree - Árbol de filtros con operadores lógicos
     * @param {string[]} tables - Tablas donde buscar
     * @returns {Promise<Object>}
     */
    searchWithComplexFilters(filterTree: any, tables?: string[]): Promise<any>;
    /**
     * Track search query para analytics
     * @private
     */
    private trackSearch;
    /**
     * Obtener términos más buscados (analytics)
     * @param {number} limit - Número de términos (default: 10)
     * @param {Object} dateRange - Rango de fechas {from, to}
     * @returns {Promise<Array>}
     */
    getTopSearchTerms(limit?: number, dateRange?: any): Promise<any[]>;
    /**
     * Get search analytics summary
     * @param {Object} dateRange - {from, to}
     * @returns {Promise<Object>}
     */
    getSearchAnalytics(dateRange?: any): Promise<any>;
}
//# sourceMappingURL=search-service.d.ts.map
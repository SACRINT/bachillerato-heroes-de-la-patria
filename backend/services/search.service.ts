/**
 * 🔍 SEARCH SERVICE - TypeScript Version
 * Búsqueda full-text avanzada
 * Refactorizado: 07 Diciembre 2025
 */

const SearchDAO = require('../data/search.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface SearchableEntity {
    table: string;
    searchColumns: string[];
    returnColumns: string[];
    type: string;
}

export interface SearchableEntities {
    [key: string]: SearchableEntity;
}

export interface SearchOptions {
    entities?: string[];
    limit?: number;
    highlight?: boolean;
}

export interface SearchResult {
    id: number;
    _type: string;
    _score: number;
    [key: string]: any;
}

export interface SearchResponse {
    success: boolean;
    message?: string;
    query?: string;
    total?: number;
    data?: SearchResult[];
    facets?: Record<string, number>;
}

export interface SuggestOptions {
    limit?: number;
    entity?: string;
}

export interface Suggestion {
    text: string;
    type: string;
}

export interface SuggestResponse {
    success: boolean;
    suggestions: Suggestion[];
}

// ============================================
// SEARCH SERVICE CLASS
// ============================================

class SearchService {
    private searchableEntities: SearchableEntities;

    constructor() {
        this.searchableEntities = {
            estudiantes: {
                table: 'estudiantes',
                searchColumns: ['nombre', 'apellido_paterno', 'matricula', 'email'],
                returnColumns: ['id', 'nombre', 'apellido_paterno', 'matricula', 'email', 'semestre'],
                type: 'estudiante'
            },
            noticias: {
                table: 'noticias',
                searchColumns: ['titulo', 'contenido', 'resumen'],
                returnColumns: ['id', 'titulo', 'resumen', 'fecha_publicacion'],
                type: 'noticia'
            },
            docentes: {
                table: 'docentes',
                searchColumns: ['nombre', 'apellido_paterno', 'email', 'especialidad'],
                returnColumns: ['id', 'nombre', 'apellido_paterno', 'email', 'especialidad'],
                type: 'docente'
            }
        };
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
        const {
            entities = Object.keys(this.searchableEntities),
            limit = 20,
            highlight = true
        } = options;

        if (!query || query.length < 2) {
            return { success: false, message: 'Búsqueda muy corta' };
        }

        const results: SearchResult[] = [];
        const searchTerm = `%${query.toLowerCase()}%`;

        for (const entityName of entities) {
            const entity = this.searchableEntities[entityName];
            if (!entity) continue;

            try {
                const rows = await SearchDAO.searchEntity(
                    entity.table,
                    entity.searchColumns,
                    entity.returnColumns,
                    searchTerm,
                    limit
                );

                rows.forEach((row: any) => {
                    results.push({
                        ...row,
                        _type: entity.type,
                        _score: this.calculateScore(row, query, entity.searchColumns)
                    });
                });
            } catch (error: any) {
                devLogger.error(`[Search] Error en ${entityName}:`, error.message);
            }
        }

        // Sort by score descending
        results.sort((a, b) => b._score - a._score);

        // Apply highlighting
        if (highlight) {
            results.forEach(r => this.applyHighlight(r, query));
        }

        return {
            success: true,
            query,
            total: results.length,
            data: results.slice(0, limit),
            facets: this.getFacets(results)
        };
    }

    calculateScore(row: Record<string, any>, query: string, columns: string[]): number {
        const queryLower = query.toLowerCase();
        let score = 0;

        columns.forEach((col, index) => {
            const value = String(row[col] || '').toLowerCase();

            if (value === queryLower) {
                score += 100; // Exact match
            } else if (value.startsWith(queryLower)) {
                score += 50; // Starts with
            } else if (value.includes(queryLower)) {
                score += 25; // Contains
            }

            // Boost earlier columns
            score += (columns.length - index) * 5;
        });

        return score;
    }

    applyHighlight(row: SearchResult, query: string): void {
        const regex = new RegExp(`(${query})`, 'gi');

        Object.keys(row).forEach(key => {
            if (typeof row[key] === 'string' && !key.startsWith('_')) {
                row[`${key}_highlighted`] = row[key].replace(regex, '<mark>$1</mark>');
            }
        });
    }

    getFacets(results: SearchResult[]): Record<string, number> {
        const facets: Record<string, number> = {};

        results.forEach(r => {
            facets[r._type] = (facets[r._type] || 0) + 1;
        });

        return facets;
    }

    async suggest(query: string, options: SuggestOptions = {}): Promise<SuggestResponse> {
        const { limit = 5, entity = 'all' } = options;

        if (!query || query.length < 2) {
            return { success: true, suggestions: [] };
        }

        const suggestions: Suggestion[] = [];
        const searchTerm = `${query.toLowerCase()}%`;

        const entities = entity === 'all'
            ? Object.keys(this.searchableEntities)
            : [entity];

        for (const entityName of entities) {
            const entityConfig = this.searchableEntities[entityName];
            if (!entityConfig) continue;

            try {
                const rows = await SearchDAO.suggestEntity(
                    entityConfig.table,
                    entityConfig.searchColumns[0],
                    searchTerm,
                    limit
                );

                rows.forEach((row: any) => {
                    if (row.suggestion) {
                        suggestions.push({
                            text: row.suggestion,
                            type: entityConfig.type
                        });
                    }
                });
            } catch (error: any) {
                devLogger.error(`[Search] Suggest error:`, error.message);
            }
        }

        return {
            success: true,
            suggestions: suggestions.slice(0, limit)
        };
    }
}

// ============================================
// EXPORTS
// ============================================

const searchService = new SearchService();

export { SearchService };
export default searchService;

module.exports = searchService;
module.exports.SearchService = SearchService;

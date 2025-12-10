/**
 * 🔍 SEARCH SERVICE - TypeScript Version
 * Búsqueda full-text avanzada
 * Refactorizado: 07 Diciembre 2025
 */
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
declare class SearchService {
    private searchableEntities;
    constructor();
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    calculateScore(row: Record<string, any>, query: string, columns: string[]): number;
    applyHighlight(row: SearchResult, query: string): void;
    getFacets(results: SearchResult[]): Record<string, number>;
    suggest(query: string, options?: SuggestOptions): Promise<SuggestResponse>;
}
declare const searchService: SearchService;
export { SearchService };
export default searchService;
//# sourceMappingURL=search.service.d.ts.map
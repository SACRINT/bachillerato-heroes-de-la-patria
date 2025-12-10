/**
 * 🔍 SEARCH DAO - TypeScript
 * Data Access Object para búsqueda full-text
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface SearchResult {
    [key: string]: any;
}
export interface Suggestion {
    suggestion: string;
}
declare class SearchDAO {
    static searchEntity(table: string, searchColumns: string[], returnColumns: string[], searchTerm: string, limit: number): Promise<SearchResult[]>;
    static suggestEntity(table: string, primaryColumn: string, searchTerm: string, limit: number): Promise<Suggestion[]>;
}
export default SearchDAO;
//# sourceMappingURL=search.dao.d.ts.map
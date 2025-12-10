declare const _exports: SearchService;
export = _exports;
declare class SearchService {
    searchableEntities: {
        estudiantes: {
            table: string;
            searchColumns: string[];
            returnColumns: string[];
            type: string;
        };
        noticias: {
            table: string;
            searchColumns: string[];
            returnColumns: string[];
            type: string;
        };
        docentes: {
            table: string;
            searchColumns: string[];
            returnColumns: string[];
            type: string;
        };
    };
    search(query: any, options?: {}): Promise<{
        success: boolean;
        message: string;
        query?: undefined;
        total?: undefined;
        data?: undefined;
        facets?: undefined;
    } | {
        success: boolean;
        query: any;
        total: number;
        data: any[];
        facets: {};
        message?: undefined;
    }>;
    calculateScore(row: any, query: any, columns: any): number;
    applyHighlight(row: any, query: any): void;
    getFacets(results: any): {};
    suggest(query: any, options?: {}): Promise<{
        success: boolean;
        suggestions: any[];
    }>;
}
//# sourceMappingURL=searchService.d.ts.map
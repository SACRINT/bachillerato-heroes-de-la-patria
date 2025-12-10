export function buildPaginationQuery(options?: {}): {
    limit: number;
    offset: number;
    orderBy: any;
    orderDir: any;
};
export function paginatedQuery(pool: any, baseQuery: any, params: any, options: any): Promise<{
    data: any;
    pagination: {
        page: any;
        limit: number;
        total: any;
    };
}>;
//# sourceMappingURL=pagination.d.ts.map
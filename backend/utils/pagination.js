function buildPaginationQuery(options = {}) {
    const { page = 1, limit = 20, orderBy = 'created_at', orderDir = 'DESC' } = options;
    const offset = (page - 1) * limit;
    const safeLimit = Math.min(limit, 100);
    return { limit: safeLimit, offset, orderBy, orderDir };
}

async function paginatedQuery(pool, baseQuery, params, options) {
    const pagination = buildPaginationQuery(options);
    let query = baseQuery;
    query += ` ORDER BY ${pagination.orderBy} ${pagination.orderDir}`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pagination.limit, pagination.offset);
    const result = await pool.query(query, params);
    return {
        data: result.rows,
        pagination: { page: options.page || 1, limit: pagination.limit, total: result.rowCount }
    };
}

module.exports = { buildPaginationQuery, paginatedQuery };

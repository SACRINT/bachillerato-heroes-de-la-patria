"use strict";
/**
 * 🔍 SEARCH DAO - TypeScript
 * Data Access Object para búsqueda full-text
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// SEARCH DAO CLASS
// =====================================================
class SearchDAO {
    static async searchEntity(table, searchColumns, returnColumns, searchTerm, limit) {
        const whereConditions = searchColumns.map((col, i) => `LOWER(${col}) LIKE $${i + 1}`).join(' OR ');
        const params = searchColumns.map(() => searchTerm);
        const result = await database_1.pool.query(`SELECT ${returnColumns.join(', ')} FROM ${table} WHERE ${whereConditions} LIMIT ${limit}`, params);
        return result.rows;
    }
    static async suggestEntity(table, primaryColumn, searchTerm, limit) {
        const result = await database_1.pool.query(`SELECT DISTINCT ${primaryColumn} as suggestion FROM ${table} WHERE LOWER(${primaryColumn}) LIKE $1 LIMIT ${limit}`, [searchTerm]);
        return result.rows;
    }
}
exports.default = SearchDAO;
module.exports = SearchDAO;
//# sourceMappingURL=search.dao.js.map
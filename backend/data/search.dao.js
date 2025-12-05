/**
 * 🔍 SEARCH DAO
 * Data Access Object para búsqueda full-text
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class SearchDAO {

    static async searchEntity(table, searchColumns, returnColumns, searchTerm, limit) {
        const whereConditions = searchColumns.map((col, i) => `LOWER(${col}) LIKE $${i + 1}`).join(' OR ');
        const params = searchColumns.map(() => searchTerm);
        const result = await pool.query(`SELECT ${returnColumns.join(', ')} FROM ${table} WHERE ${whereConditions} LIMIT ${limit}`, params);
        return result.rows;
    }

    static async suggestEntity(table, primaryColumn, searchTerm, limit) {
        const result = await pool.query(`SELECT DISTINCT ${primaryColumn} as suggestion FROM ${table} WHERE LOWER(${primaryColumn}) LIKE $1 LIMIT ${limit}`, [searchTerm]);
        return result.rows;
    }
}

module.exports = SearchDAO;

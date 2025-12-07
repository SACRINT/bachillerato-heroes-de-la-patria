/**
 * 🔍 SEARCH DAO - TypeScript
 * Data Access Object para búsqueda full-text
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface SearchResult {
    [key: string]: any;
}

export interface Suggestion {
    suggestion: string;
}

// =====================================================
// SEARCH DAO CLASS
// =====================================================

class SearchDAO {

    static async searchEntity(
        table: string,
        searchColumns: string[],
        returnColumns: string[],
        searchTerm: string,
        limit: number
    ): Promise<SearchResult[]> {
        const whereConditions = searchColumns.map((col, i) => `LOWER(${col}) LIKE $${i + 1}`).join(' OR ');
        const params = searchColumns.map(() => searchTerm);
        const result = await pool.query(
            `SELECT ${returnColumns.join(', ')} FROM ${table} WHERE ${whereConditions} LIMIT ${limit}`,
            params
        );
        return result.rows;
    }

    static async suggestEntity(
        table: string,
        primaryColumn: string,
        searchTerm: string,
        limit: number
    ): Promise<Suggestion[]> {
        const result = await pool.query(
            `SELECT DISTINCT ${primaryColumn} as suggestion FROM ${table} WHERE LOWER(${primaryColumn}) LIKE $1 LIMIT ${limit}`,
            [searchTerm]
        );
        return result.rows;
    }
}

export default SearchDAO;
module.exports = SearchDAO;

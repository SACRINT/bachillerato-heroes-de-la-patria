"use strict";
/**
 * 💰 WALLET DAO - TypeScript
 * Data Access Object para sistema de IACoins
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// WALLET DAO CLASS
// =====================================================
class WalletDAO {
    static async getByUserId(userId) {
        const result = await database_1.pool.query(`SELECT user_id, balance, total_earned, total_spent, total_purchased, created_at, updated_at
             FROM wallet WHERE user_id = $1`, [userId]);
        return result.rows[0] || null;
    }
    static async create(userId, initialBalance = 0) {
        const result = await database_1.pool.query(`INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
             VALUES ($1, $2, $2, 0, 0)
             RETURNING *`, [userId, initialBalance]);
        return result.rows[0];
    }
    static async getHistory(userId, options = {}) {
        const { type, limit = 50, offset = 0 } = options;
        let query = `
            SELECT id, user_id, transaction_type, amount, balance_after, description, metadata, created_at
            FROM wallet_history
            WHERE user_id = $1
        `;
        const params = [userId];
        if (type && ['earn', 'spend', 'purchase'].includes(type)) {
            query += ` AND transaction_type = $${params.length + 1}`;
            params.push(type);
        }
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await database_1.pool.query(query, params);
        const countResult = await database_1.pool.query(`SELECT COUNT(*) as total FROM wallet_history WHERE user_id = $1`, [userId]);
        return {
            transactions: result.rows,
            total: parseInt(countResult.rows[0].total)
        };
    }
    static async getPurchaseHistory(userId, limit = 20) {
        const result = await database_1.pool.query(`SELECT * FROM wallet_history 
             WHERE user_id = $1 AND transaction_type = 'purchase'
             ORDER BY created_at DESC LIMIT $2`, [userId, limit]);
        return result.rows || [];
    }
    static async getConnection() {
        return database_1.pool.connect();
    }
}
exports.default = WalletDAO;
module.exports = WalletDAO;
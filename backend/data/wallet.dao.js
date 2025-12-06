/**
 * 💰 WALLET DAO
 * Data Access Object para sistema de IACoins
 * 
 * Refactorizado: 05 Diciembre 2025
 */

const { pool } = require('../config/database');

class WalletDAO {

    /**
     * Obtener wallet del usuario
     * @param {number} userId
     * @returns {Promise<Object|null>}
     */
    static async getByUserId(userId) {
        const result = await pool.query(
            `SELECT user_id, balance, total_earned, total_spent, total_purchased, created_at, updated_at
             FROM wallet WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Crear wallet para usuario
     * @param {number} userId
     * @param {number} initialBalance
     * @returns {Promise<Object>}
     */
    static async create(userId, initialBalance = 0) {
        const result = await pool.query(
            `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
             VALUES ($1, $2, $2, 0, 0)
             RETURNING *`,
            [userId, initialBalance]
        );
        return result.rows[0];
    }

    /**
     * Obtener historial de transacciones
     * @param {number} userId
     * @param {Object} options - type, limit, offset
     * @returns {Promise<{transactions: Array, total: number}>}
     */
    static async getHistory(userId, { type, limit = 50, offset = 0 } = {}) {
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
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM wallet_history WHERE user_id = $1`,
            [userId]
        );

        return {
            transactions: result.rows,
            total: parseInt(countResult.rows[0].total)
        };
    }

    /**
     * Helper para obtener conexión de pool (para transacciones)
     * @returns {Promise<PoolClient>}
     */
    static async getConnection() {
        return pool.connect();
    }
}

module.exports = WalletDAO;

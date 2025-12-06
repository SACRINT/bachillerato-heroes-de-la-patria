/**
 * 🛒 STORE DAO
 * Data Access Object para tienda virtual con IACoins
 * 
 * Refactorizado: 05 Diciembre 2025
 */

const { pool } = require('../config/database');

class StoreDAO {

    /**
     * Obtener items de la tienda con filtros
     * @param {Object} filters - category, is_available
     * @returns {Promise<Array>}
     */
    static async getItems({ category, is_available = true } = {}) {
        let query = `
            SELECT
                id, name, description, category, price_iacoins,
                icon, is_available, stock, max_per_user, metadata, created_at
            FROM store_items
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ` AND category = $${params.length + 1}`;
            params.push(category);
        }

        if (is_available === true || is_available === 'true') {
            query += ` AND is_available = true AND (stock IS NULL OR stock > 0)`;
        }

        query += ` ORDER BY category, price_iacoins`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Obtener item por ID
     * @param {number} itemId
     * @returns {Promise<Object|null>}
     */
    static async getItemById(itemId) {
        const result = await pool.query(
            `SELECT * FROM store_items WHERE id = $1`,
            [itemId]
        );
        return result.rows[0] || null;
    }

    /**
     * Contar compras del usuario para un item específico
     * @param {number} userId
     * @param {number} itemId
     * @returns {Promise<number>}
     */
    static async getUserPurchaseCount(userId, itemId) {
        const result = await pool.query(
            `SELECT COUNT(*) as times_purchased FROM user_items WHERE user_id = $1 AND item_id = $2`,
            [userId, itemId]
        );
        return parseInt(result.rows[0].times_purchased);
    }

    /**
     * Obtener items comprados por el usuario
     * @param {number} userId
     * @returns {Promise<Array>}
     */
    static async getUserItems(userId) {
        const result = await pool.query(
            `SELECT
                ui.id as purchase_id,
                ui.purchased_at,
                si.id as item_id,
                si.name,
                si.description,
                si.category,
                si.price_iacoins,
                si.icon,
                si.metadata
            FROM user_items ui
            JOIN store_items si ON ui.item_id = si.id
            WHERE ui.user_id = $1
            ORDER BY ui.purchased_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Crear nuevo item (admin)
     * @param {Object} itemData - name, description, category, price_iacoins, icon, stock, max_per_user, metadata
     * @returns {Promise<Object>}
     */
    static async createItem(itemData) {
        const { name, description, category, price_iacoins, icon, stock, max_per_user, metadata } = itemData;
        const result = await pool.query(
            `INSERT INTO store_items
            (name, description, category, price_iacoins, icon, stock, max_per_user, metadata, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING *`,
            [name, description, category, price_iacoins, icon, stock, max_per_user, JSON.stringify(metadata || {})]
        );
        return result.rows[0];
    }

    /**
     * Helper para obtener conexión de pool (para transacciones)
     * @returns {Promise<PoolClient>}
     */
    static async getConnection() {
        return pool.connect();
    }
}

module.exports = StoreDAO;

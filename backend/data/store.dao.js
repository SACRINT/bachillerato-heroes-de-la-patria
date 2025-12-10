"use strict";
/**
 * 🛒 STORE DAO - TypeScript
 * Data Access Object para tienda virtual con IACoins
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// STORE DAO CLASS
// =====================================================
class StoreDAO {
    static async getItems(filters = {}) {
        const { category, is_available = true } = filters;
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
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async getItemById(itemId) {
        const result = await database_1.pool.query(`SELECT * FROM store_items WHERE id = $1`, [itemId]);
        return result.rows[0] || null;
    }
    static async getUserPurchaseCount(userId, itemId) {
        const result = await database_1.pool.query(`SELECT COUNT(*) as times_purchased FROM user_items WHERE user_id = $1 AND item_id = $2`, [userId, itemId]);
        return parseInt(result.rows[0].times_purchased);
    }
    static async getUserItems(userId) {
        const result = await database_1.pool.query(`SELECT
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
            ORDER BY ui.purchased_at DESC`, [userId]);
        return result.rows;
    }
    static async createItem(itemData) {
        const { name, description, category, price_iacoins, icon, stock, max_per_user, metadata } = itemData;
        const result = await database_1.pool.query(`INSERT INTO store_items
            (name, description, category, price_iacoins, icon, stock, max_per_user, metadata, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING *`, [name, description, category, price_iacoins, icon, stock, max_per_user, JSON.stringify(metadata || {})]);
        return result.rows[0];
    }
    static async getConnection() {
        return database_1.pool.connect();
    }
}
exports.default = StoreDAO;
module.exports = StoreDAO;
//# sourceMappingURL=store.dao.js.map
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

    /**
     * Procesa la compra de un item de forma transaccional
     */
    static async processPurchase(userId, itemId) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener item y bloquear fila
            const itemRes = await client.query('SELECT * FROM store_items WHERE id = $1 FOR UPDATE', [itemId]);
            if (itemRes.rows.length === 0) throw { status: 404, message: 'Item no encontrado' };
            const item = itemRes.rows[0];

            // 2. Validaciones básicas
            if (!item.is_available) throw { status: 400, message: 'Item no disponible' };
            if (item.stock !== null && item.stock <= 0) throw { status: 400, message: 'Item agotado' };

            // 3. Verificar límite por usuario
            if (item.max_per_user !== null) {
                const countRes = await client.query(
                    'SELECT COUNT(*) as count FROM user_items WHERE user_id = $1 AND item_id = $2',
                    [userId, itemId]
                );
                if (parseInt(countRes.rows[0].count) >= item.max_per_user) {
                    throw { status: 400, message: `Límite alcanzado (${item.max_per_user})` };
                }
            }

            // 4. Verificar Wallet y Saldo
            const walletRes = await client.query('SELECT balance FROM wallet WHERE user_id = $1', [userId]);
            const balance = walletRes.rows[0]?.balance || 0;
            if (balance < item.price_iacoins) {
                throw { status: 400, message: 'Saldo insuficiente', details: { required: item.price_iacoins, current: balance } };
            }

            // 5. Ejecutar Compra: Descontar Saldo
            const updateWallet = await client.query(`
                UPDATE wallet SET balance = balance - $1, total_spent = total_spent + $1, updated_at = NOW()
                WHERE user_id = $2 RETURNING balance
            `, [item.price_iacoins, userId]);
            const newBalance = updateWallet.rows[0].balance;

            // 6. Registrar Historial
            await client.query(`
                INSERT INTO wallet_history (user_id, transaction_type, amount, balance_after, description, metadata)
                VALUES ($1, 'spend', $2, $3, $4, $5)
            `, [userId, item.price_iacoins, newBalance, `Compra: ${item.name}`, JSON.stringify({ itemId, category: item.category })]);

            // 7. Agregar al Inventario
            await client.query('INSERT INTO user_items (user_id, item_id, purchased_at) VALUES ($1, $2, NOW())', [userId, itemId]);

            // 8. Actualizar Stock
            if (item.stock !== null) {
                await client.query('UPDATE store_items SET stock = stock - 1, updated_at = NOW() WHERE id = $1', [itemId]);
            }

            await client.query('COMMIT');
            return { success: true, item, newBalance };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
exports.default = StoreDAO;
module.exports = StoreDAO;
//# sourceMappingURL=store.dao.js.map
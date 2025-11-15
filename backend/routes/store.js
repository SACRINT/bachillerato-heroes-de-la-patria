/**
 * 🛒 STORE ROUTES - TIENDA VIRTUAL
 * Gestión de items y compras con IACoins
 */

const express = require('express');
const { Pool } = require('pg');
const devLogger = require('../utils/devLogger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// ENDPOINT 1: GET /api/store/items
// Listar todos los items disponibles en la tienda
// ============================================
router.get('/items', authenticateToken, async (req, res) => {
    try {
        const { category, is_available = true } = req.query;

        devLogger.log('[STORE] Listando items de la tienda');

        let query = `
            SELECT
                id,
                name,
                description,
                category,
                price_iacoins,
                icon,
                is_available,
                stock,
                max_per_user,
                metadata,
                created_at
            FROM store_items
            WHERE 1=1
        `;
        const params = [];

        // Filtro por categoría
        if (category) {
            query += ` AND category = $${params.length + 1}`;
            params.push(category);
        }

        // Filtro por disponibilidad
        if (is_available === true || is_available === 'true') {
            query += ` AND is_available = true AND (stock IS NULL OR stock > 0)`;
        }

        query += ` ORDER BY category, price_iacoins`;

        const result = await pool.query(query, params);

        // Agrupar por categoría
        const itemsByCategory = result.rows.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        res.json({
            items: result.rows,
            items_by_category: itemsByCategory,
            summary: {
                total: result.rows.length,
                categories: Object.keys(itemsByCategory)
            }
        });

    } catch (error) {
        devLogger.error('[STORE] Error al listar items:', error.message);
        res.status(500).json({
            error: 'Error al obtener items de la tienda',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINT 2: GET /api/store/items/:id
// Obtener detalles de un item específico
// ============================================
router.get('/items/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        devLogger.log(`[STORE] Obteniendo detalles del item ${id}`);

        const itemResult = await pool.query(
            `SELECT * FROM store_items WHERE id = $1`,
            [id]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Item no encontrado'
            });
        }

        // Verificar cuántas veces el usuario ha comprado este item
        const purchaseResult = await pool.query(
            `SELECT COUNT(*) as times_purchased
            FROM user_items
            WHERE user_id = $1 AND item_id = $2`,
            [userId, id]
        );

        const item = itemResult.rows[0];
        const timesPurchased = parseInt(purchaseResult.rows[0].times_purchased);

        res.json({
            item,
            user_status: {
                times_purchased: timesPurchased,
                can_purchase: item.is_available &&
                             (item.stock === null || item.stock > 0) &&
                             (item.max_per_user === null || timesPurchased < item.max_per_user)
            }
        });

    } catch (error) {
        devLogger.error('[STORE] Error al obtener item:', error.message);
        res.status(500).json({
            error: 'Error al obtener detalles del item',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINT 3: POST /api/store/purchase
// Comprar un item con IACoins
// ============================================
router.post('/purchase', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { item_id } = req.body;

        if (!item_id) {
            return res.status(400).json({
                error: 'El item_id es requerido'
            });
        }

        devLogger.log(`[STORE] Usuario ${userId} comprando item ${item_id}`);

        await client.query('BEGIN');

        // Obtener información del item
        const itemResult = await client.query(
            `SELECT * FROM store_items WHERE id = $1 FOR UPDATE`,
            [item_id]
        );

        if (itemResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Item no encontrado'
            });
        }

        const item = itemResult.rows[0];

        // Validaciones del item
        if (!item.is_available) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Este item no está disponible'
            });
        }

        if (item.stock !== null && item.stock <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Item agotado'
            });
        }

        // Verificar límite por usuario
        if (item.max_per_user !== null) {
            const purchaseCountResult = await client.query(
                `SELECT COUNT(*) as count FROM user_items
                WHERE user_id = $1 AND item_id = $2`,
                [userId, item_id]
            );

            const purchaseCount = parseInt(purchaseCountResult.rows[0].count);

            if (purchaseCount >= item.max_per_user) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Has alcanzado el límite de compras para este item (${item.max_per_user})`,
                    times_purchased: purchaseCount
                });
            }
        }

        // Verificar saldo del wallet
        const walletResult = await client.query(
            `SELECT balance FROM wallet WHERE user_id = $1`,
            [userId]
        );

        if (walletResult.rows.length === 0 || walletResult.rows[0].balance < item.price_iacoins) {
            await client.query('ROLLBACK');
            const currentBalance = walletResult.rows[0]?.balance || 0;
            return res.status(400).json({
                error: 'Saldo insuficiente',
                current_balance: currentBalance,
                required: item.price_iacoins,
                missing: item.price_iacoins - currentBalance
            });
        }

        // Descontar IACoins del wallet
        const updateWalletResult = await client.query(
            `UPDATE wallet
            SET balance = balance - $1,
                total_spent = total_spent + $1,
                updated_at = NOW()
            WHERE user_id = $2
            RETURNING balance`,
            [item.price_iacoins, userId]
        );

        const newBalance = updateWalletResult.rows[0].balance;

        // Registrar compra en historial de wallet
        await client.query(
            `INSERT INTO wallet_history
            (user_id, transaction_type, amount, balance_after, description, metadata)
            VALUES ($1, 'spend', $2, $3, $4, $5)`,
            [
                userId,
                item.price_iacoins,
                newBalance,
                `Compra en tienda: ${item.name}`,
                JSON.stringify({ item_id, category: item.category })
            ]
        );

        // Agregar item al inventario del usuario
        await client.query(
            `INSERT INTO user_items (user_id, item_id, purchased_at)
            VALUES ($1, $2, NOW())`,
            [userId, item_id]
        );

        // Actualizar stock si aplica
        if (item.stock !== null) {
            await client.query(
                `UPDATE store_items
                SET stock = stock - 1,
                    updated_at = NOW()
                WHERE id = $1`,
                [item_id]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            item: {
                id: item.id,
                name: item.name,
                price: item.price_iacoins
            },
            new_balance: newBalance,
            message: `¡Compra exitosa! Has adquirido ${item.name}`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        devLogger.error('[STORE] Error al comprar item:', error.message);
        res.status(500).json({
            error: 'Error al procesar la compra',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINT 4: GET /api/store/my-items
// Obtener items comprados por el usuario
// ============================================
router.get('/my-items', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        devLogger.log(`[STORE] Obteniendo items comprados por usuario ${userId}`);

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

        // Agrupar por categoría
        const itemsByCategory = result.rows.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        res.json({
            items: result.rows,
            items_by_category: itemsByCategory,
            summary: {
                total: result.rows.length,
                categories: Object.keys(itemsByCategory),
                total_spent: result.rows.reduce((sum, item) => sum + item.price_iacoins, 0)
            }
        });

    } catch (error) {
        devLogger.error('[STORE] Error al obtener items del usuario:', error.message);
        res.status(500).json({
            error: 'Error al obtener tus items',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINT 5: POST /api/store/items (ADMIN)
// Crear un nuevo item en la tienda (solo administradores)
// ============================================
router.post('/items', authenticateToken, async (req, res) => {
    try {
        // Verificar que sea administrador
        if (req.user.role !== 'admin' && req.user.role !== 'administrativo') {
            return res.status(403).json({
                error: 'Acceso denegado. Solo administradores pueden crear items.'
            });
        }

        const {
            name,
            description,
            category = 'customization',
            price_iacoins,
            icon = '🎁',
            stock = null,
            max_per_user = null,
            metadata = {}
        } = req.body;

        // Validaciones
        if (!name || name.length < 3) {
            return res.status(400).json({
                error: 'El nombre debe tener al menos 3 caracteres'
            });
        }

        if (!description || description.length < 10) {
            return res.status(400).json({
                error: 'La descripción debe tener al menos 10 caracteres'
            });
        }

        if (!price_iacoins || price_iacoins < 1) {
            return res.status(400).json({
                error: 'El precio debe ser mayor a 0'
            });
        }

        const validCategories = ['customization', 'rewards', 'power_ups', 'cosmetics', 'special'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                error: 'Categoría no válida',
                valid_categories: validCategories
            });
        }

        devLogger.log(`[STORE] Admin ${req.user.id} creando nuevo item: ${name}`);

        const result = await pool.query(
            `INSERT INTO store_items
            (name, description, category, price_iacoins, icon, stock, max_per_user, metadata, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING *`,
            [name, description, category, price_iacoins, icon, stock, max_per_user, JSON.stringify(metadata)]
        );

        res.status(201).json({
            success: true,
            item: result.rows[0],
            message: 'Item creado exitosamente'
        });

    } catch (error) {
        devLogger.error('[STORE] Error al crear item:', error.message);
        res.status(500).json({
            error: 'Error al crear el item',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

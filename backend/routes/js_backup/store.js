/**
 * 🛒 STORE ROUTES - TIENDA VIRTUAL
 * Gestión de items y compras con IACoins
 * ✅ FASE 3 DAL - Refactorizado para usar DAO
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ✅ FASE 3: Using DAO layer instead of direct pool access
const StoreDAO = require('../data/store.dao');
const { pool } = require('../config/database');

// ============================================
// ENDPOINT 1: GET /api/store/items
// Listar todos los items disponibles en la tienda
// ============================================
router.get('/items', authenticateToken, async (req, res) => {
    try {
        const { category, is_available = true } = req.query;

        debugLog.log('STORE', '[STORE] Listando items de la tienda');

        // ✅ FASE 3: Using StoreDAO
        const items = await StoreDAO.getItems({ category, is_available });

        // Agrupar por categoría
        const itemsByCategory = items.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        res.json({
            items: items,
            items_by_category: itemsByCategory,
            summary: {
                total: items.length,
                categories: Object.keys(itemsByCategory)
            }
        });

    } catch (error) {
        debugLog.error('STORE', '[STORE] Error al listar items:', error.message);
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

        debugLog.log('STORE', `[STORE] Obteniendo detalles del item ${id}`);

        // ✅ FASE 3: Using StoreDAO
        const item = await StoreDAO.getItemById(id);

        if (!item) {
            return res.status(404).json({
                error: 'Item no encontrado'
            });
        }

        const timesPurchased = await StoreDAO.getUserPurchaseCount(userId, id);

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
        debugLog.error('STORE', '[STORE] Error al obtener item:', error.message);
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

        debugLog.log('STORE', `[STORE] Usuario ${userId} comprando item ${item_id}`);

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
        debugLog.error('STORE', '[STORE] Error al comprar item:', error.message);
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

        debugLog.log('STORE', `[STORE] Obteniendo items comprados por usuario ${userId}`);

        // ✅ FASE 3: Using StoreDAO
        const items = await StoreDAO.getUserItems(userId);

        // Agrupar por categoría
        const itemsByCategory = items.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        res.json({
            items: items,
            items_by_category: itemsByCategory,
            summary: {
                total: items.length,
                categories: Object.keys(itemsByCategory),
                total_spent: items.reduce((sum, item) => sum + item.price_iacoins, 0)
            }
        });

    } catch (error) {
        debugLog.error('STORE', '[STORE] Error al obtener items del usuario:', error.message);
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

        debugLog.log('STORE', `[STORE] Admin ${req.user.id} creando nuevo item: ${name}`);

        // ✅ FASE 3: Using StoreDAO
        const newItem = await StoreDAO.createItem({
            name, description, category, price_iacoins, icon, stock, max_per_user, metadata
        });

        res.status(201).json({
            success: true,
            item: newItem,
            message: 'Item creado exitosamente'
        });

    } catch (error) {
        debugLog.error('STORE', '[STORE] Error al crear item:', error.message);
        res.status(500).json({
            error: 'Error al crear el item',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

/**
 * 🛒 STORE ROUTES - TIENDA VIRTUAL - TypeScript
 * Gestión de items y compras con IACoins
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { authenticateToken } from '../middleware/auth';
// @ts-ignore
import StoreDAO from '../data/store.dao';
// @ts-ignore
import { pool } from '../config/database';

const router = express.Router();

// ============================================
// INTERFACES
// ============================================

// ============================================
// INTERFACES
// ============================================

/* 
// Interfaces inferidas del DAO o usadas como any por simplicidad en migración
interface StoreItem { ... }
interface UserItem { ... }
*/

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/store/items
 * Listar todos los items disponibles en la tienda
 */
router.get('/items', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, is_available = 'true' } = req.query;

        debugLog.log('STORE', '[STORE] Listando items de la tienda');

        // @ts-ignore
        const items = await StoreDAO.getItems({
            category: category as string,
            is_available: is_available === 'true'
        });

        // Agrupar por categoría
        const itemsByCategory = items.reduce((acc: any, item: any) => {
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

    } catch (error: any) {
        debugLog.error('STORE', '[STORE] Error al listar items:', error.message);
        res.status(500).json({
            error: 'Error al obtener items de la tienda',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/store/items/:id
 * Obtener detalles de un item específico
 */
router.get('/items/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const userId = (req as any).user.id;

        if (isNaN(id)) {
            res.status(400).json({ error: 'ID inválido' });
            return;
        }

        debugLog.log('STORE', `[STORE] Obteniendo detalles del item ${id}`);

        const item = await StoreDAO.getItemById(id);

        if (!item) {
            res.status(404).json({ error: 'Item no encontrado' });
            return;
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

    } catch (error: any) {
        debugLog.error('STORE', '[STORE] Error al obtener item:', error.message);
        res.status(500).json({
            error: 'Error al obtener detalles del item',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/store/purchase
 * Comprar un item con IACoins
 */
router.post('/purchase', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
        const userId = (req as any).user.id;
        const { item_id } = req.body;

        if (!item_id) {
            res.status(400).json({ error: 'El item_id es requerido' });
            return;
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
            res.status(404).json({ error: 'Item no encontrado' });
            return;
        }

        const item: any = itemResult.rows[0];

        // Validaciones del item
        if (!item.is_available) {
            await client.query('ROLLBACK');
            res.status(400).json({ error: 'Este item no está disponible' });
            return;
        }

        if (item.stock !== null && item.stock <= 0) {
            await client.query('ROLLBACK');
            res.status(400).json({ error: 'Item agotado' });
            return;
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
                res.status(400).json({
                    error: `Has alcanzado el límite de compras para este item (${item.max_per_user})`,
                    times_purchased: purchaseCount
                });
                return;
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
            res.status(400).json({
                error: 'Saldo insuficiente',
                current_balance: currentBalance,
                required: item.price_iacoins,
                missing: item.price_iacoins - currentBalance
            });
            return;
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

    } catch (error: any) {
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

/**
 * GET /api/store/my-items
 * Obtener items comprados por el usuario
 */
router.get('/my-items', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        debugLog.log('STORE', `[STORE] Obteniendo items comprados por usuario ${userId}`);

        const items = await StoreDAO.getUserItems(userId);

        // Agrupar por categoría
        const itemsByCategory = items.reduce((acc: any, item: any) => {
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

    } catch (error: any) {
        debugLog.error('STORE', '[STORE] Error al obtener items del usuario:', error.message);
        res.status(500).json({
            error: 'Error al obtener tus items',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/store/items (ADMIN)
 * Crear un nuevo item en la tienda (solo administradores)
 */
router.post('/items', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        // Verificar que sea administrador
        if (user.role !== 'admin' && user.role !== 'administrativo') {
            res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden crear items.' });
            return;
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
            res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
            return;
        }

        if (!description || description.length < 10) {
            res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
            return;
        }

        if (!price_iacoins || price_iacoins < 1) {
            res.status(400).json({ error: 'El precio debe ser mayor a 0' });
            return;
        }

        const validCategories = ['customization', 'rewards', 'power_ups', 'cosmetics', 'special'];
        if (!validCategories.includes(category)) {
            res.status(400).json({
                error: 'Categoría no válida',
                valid_categories: validCategories
            });
            return;
        }

        debugLog.log('STORE', `[STORE] Admin ${user.id} creando nuevo item: ${name}`);

        const newItem = await StoreDAO.createItem({
            name, description, category, price_iacoins, icon, stock, max_per_user, metadata
        });

        res.status(201).json({
            success: true,
            item: newItem,
            message: 'Item creado exitosamente'
        });

    } catch (error: any) {
        debugLog.error('STORE', '[STORE] Error al crear item:', error.message);
        res.status(500).json({
            error: 'Error al crear el item',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @ts-ignore
export = router;

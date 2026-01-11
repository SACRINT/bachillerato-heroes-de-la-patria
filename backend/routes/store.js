"use strict";
/**
 * 🛒 STORE ROUTES - TIENDA VIRTUAL - TypeScript
 * Gestión de items y compras con IACoins
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
// @ts-ignore
const debug_logger_1 = require("../utils/debug-logger");
// @ts-ignore
const auth_1 = require("../middleware/auth");
// @ts-ignore
const store_dao_1 = __importDefault(require("../data/store.dao"));
// @ts-ignore
const database_1 = require("../config/database");

const router = express_1.default.Router();

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/store/items
 * Listar todos los items disponibles en la tienda
 */
router.get('/items', auth_1.authenticateToken, async (req, res) => {
    try {
        const { category, is_available = 'true' } = req.query;
        debug_logger_1.debugLog.log('STORE', '[STORE] Listando items de la tienda');
        // @ts-ignore
        const items = await store_dao_1.default.getItems({
            category: category,
            is_available: is_available === 'true'
        });
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('STORE', '[STORE] Error al listar items:', error.message);
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
router.get('/items/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.id;
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID inválido' });
            return;
        }
        debug_logger_1.debugLog.log('STORE', `[STORE] Obteniendo detalles del item ${id}`);
        const item = await store_dao_1.default.getItemById(id);
        if (!item) {
            res.status(404).json({ error: 'Item no encontrado' });
            return;
        }
        const timesPurchased = await store_dao_1.default.getUserPurchaseCount(userId, id);
        res.json({
            item,
            user_status: {
                times_purchased: timesPurchased,
                can_purchase: item.is_available &&
                    (item.stock === null || item.stock > 0) &&
                    (item.max_per_user === null || timesPurchased < item.max_per_user)
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STORE', '[STORE] Error al obtener item:', error.message);
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
router.post('/purchase', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_id } = req.body;

        if (!item_id) {
            return res.status(400).json({ error: 'El item_id es requerido' });
        }

        debug_logger_1.debugLog.log('STORE', `[STORE] Usuario ${userId} comprando item ${item_id}`);

        // Delegar transacción al DAO
        const result = await store_dao_1.default.processPurchase(userId, item_id);

        res.json({
            success: true,
            item: {
                id: result.item.id,
                name: result.item.name,
                price: result.item.price_iacoins
            },
            new_balance: result.newBalance,
            message: `¡Compra exitosa! Has adquirido ${result.item.name}`
        });

    } catch (error) {
        debug_logger_1.debugLog.error('STORE', '[STORE] Error al comprar item:', error.message || error);

        // Manejo de errores controlados desde DAO
        if (error.status) {
            return res.status(error.status).json({
                error: error.message,
                details: error.details
            });
        }

        res.status(500).json({
            error: 'Error al procesar la compra',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/store/my-items
 * Obtener items comprados por el usuario
 */
router.get('/my-items', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        debug_logger_1.debugLog.log('STORE', `[STORE] Obteniendo items comprados por usuario ${userId}`);
        const items = await store_dao_1.default.getUserItems(userId);
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('STORE', '[STORE] Error al obtener items del usuario:', error.message);
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
router.post('/items', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // Verificar que sea administrador
        if (user.role !== 'admin' && user.role !== 'administrativo') {
            res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden crear items.' });
            return;
        }
        const { name, description, category = 'customization', price_iacoins, icon = '🎁', stock = null, max_per_user = null, metadata = {} } = req.body;
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
        debug_logger_1.debugLog.log('STORE', `[STORE] Admin ${user.id} creando nuevo item: ${name}`);
        const newItem = await store_dao_1.default.createItem({
            name, description, category, price_iacoins, icon, stock, max_per_user, metadata
        });
        res.status(201).json({
            success: true,
            item: newItem,
            message: 'Item creado exitosamente'
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STORE', '[STORE] Error al crear item:', error.message);
        res.status(500).json({
            error: 'Error al crear el item',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
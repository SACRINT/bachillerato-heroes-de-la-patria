/**
 * 💰 WALLET ROUTES - SISTEMA DE IACOINS
 * Gestión de monedero virtual de estudiantes
 * ✅ FASE 3 DAL - Refactorizado para usar DAO
 * 
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Sistema de IACoins - Monedero virtual
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ✅ FASE 3: Using DAO layer instead of direct pool access
const WalletDAO = require('../data/wallet.dao');
const { pool } = require('../config/database');

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Obtener saldo del wallet
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: integer
 *                       description: Saldo actual en IACoins
 *                     total_earned:
 *                       type: integer
 *                     total_spent:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// ============================================
// ENDPOINT 1: GET /api/wallet
// Obtener saldo actual del wallet
// ============================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        debugLog.log('WALLET', `[WALLET] Obteniendo saldo para usuario ${userId}`);

        // ✅ FASE 3: Using WalletDAO
        let wallet = await WalletDAO.getByUserId(userId);

        if (!wallet) {
            // Crear wallet si no existe
            wallet = await WalletDAO.create(userId, 0);
            return res.json({
                wallet,
                message: 'Wallet creado exitosamente'
            });
        }

        res.json({ wallet });

    } catch (error) {
        debugLog.error('WALLET', '[WALLET] Error al obtener saldo:', error.message);
        res.status(500).json({
            error: 'Error al obtener saldo del wallet',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINT 2: GET /api/wallet/history
// Obtener historial de transacciones
// ============================================
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0, type } = req.query;

        debugLog.log('WALLET', `[WALLET] Obteniendo historial para usuario ${userId}`);

        // ✅ FASE 3: Using WalletDAO
        const { transactions, total } = await WalletDAO.getHistory(userId, {
            type,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            transactions,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + transactions.length < total
            }
        });

    } catch (error) {
        debugLog.error('WALLET', '[WALLET] Error al obtener historial:', error.message);
        res.status(500).json({
            error: 'Error al obtener historial de transacciones',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINT 3: POST /api/wallet/earn
// Ganar IACoins (recompensas, logros, retos)
// ============================================
router.post('/earn', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { amount, description, metadata = {} } = req.body;

        // Validaciones
        if (!amount || amount <= 0) {
            return res.status(400).json({
                error: 'El monto debe ser mayor a 0'
            });
        }

        if (!description) {
            return res.status(400).json({
                error: 'La descripción es requerida'
            });
        }

        debugLog.log('WALLET', `[WALLET] Usuario ${userId} ganando ${amount} IACoins: ${description}`);

        await client.query('BEGIN');

        // Actualizar wallet
        const walletResult = await client.query(
            `UPDATE wallet
            SET balance = balance + $1,
                total_earned = total_earned + $1,
                updated_at = NOW()
            WHERE user_id = $2
            RETURNING balance`,
            [amount, userId]
        );

        if (walletResult.rows.length === 0) {
            // Crear wallet si no existe
            await client.query(
                `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
                VALUES ($1, $2, $2, 0, 0)`,
                [userId, amount]
            );
        }

        const newBalance = walletResult.rows[0]?.balance || amount;

        // Registrar en historial
        await client.query(
            `INSERT INTO wallet_history
            (user_id, transaction_type, amount, balance_after, description, metadata)
            VALUES ($1, 'earn', $2, $3, $4, $5)`,
            [userId, amount, newBalance, description, JSON.stringify(metadata)]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            new_balance: newBalance,
            earned: amount,
            message: `Has ganado ${amount} IA Coins`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('WALLET', '[WALLET] Error al ganar IACoins:', error.message);
        res.status(500).json({
            error: 'Error al procesar la ganancia',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINT 4: POST /api/wallet/spend
// Gastar IACoins (compras en tienda)
// ============================================
router.post('/spend', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { amount, description, metadata = {} } = req.body;

        // Validaciones
        if (!amount || amount <= 0) {
            return res.status(400).json({
                error: 'El monto debe ser mayor a 0'
            });
        }

        if (!description) {
            return res.status(400).json({
                error: 'La descripción es requerida'
            });
        }

        debugLog.log('WALLET', `[WALLET] Usuario ${userId} gastando ${amount} IACoins: ${description}`);

        await client.query('BEGIN');

        // Verificar saldo suficiente
        const walletResult = await client.query(
            `SELECT balance FROM wallet WHERE user_id = $1`,
            [userId]
        );

        if (walletResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Wallet no encontrado'
            });
        }

        const currentBalance = walletResult.rows[0].balance;

        if (currentBalance < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Saldo insuficiente',
                current_balance: currentBalance,
                required: amount,
                missing: amount - currentBalance
            });
        }

        // Actualizar wallet
        const updateResult = await client.query(
            `UPDATE wallet
            SET balance = balance - $1,
                total_spent = total_spent + $1,
                updated_at = NOW()
            WHERE user_id = $2
            RETURNING balance`,
            [amount, userId]
        );

        const newBalance = updateResult.rows[0].balance;

        // Registrar en historial
        await client.query(
            `INSERT INTO wallet_history
            (user_id, transaction_type, amount, balance_after, description, metadata)
            VALUES ($1, 'spend', $2, $3, $4, $5)`,
            [userId, amount, newBalance, description, JSON.stringify(metadata)]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            new_balance: newBalance,
            spent: amount,
            message: `Has gastado ${amount} IA Coins`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('WALLET', '[WALLET] Error al gastar IACoins:', error.message);
        res.status(500).json({
            error: 'Error al procesar el gasto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

// ============================================
// STRIPE INTEGRATION - Importar servicio
// ============================================
let stripePaymentsService;
try {
    stripePaymentsService = require('../services/stripePaymentsService.bridge');
} catch (error) {
    debugLog.warn('WALLET', '[WALLET] Stripe service no disponible, usando modo legacy');
    stripePaymentsService = null;
}

// ============================================
// ENDPOINT 5: GET /api/wallet/packages
// Obtener paquetes de IACoins disponibles
// ============================================
router.get('/packages', async (req, res) => {
    try {
        if (stripePaymentsService) {
            const packages = await stripePaymentsService.getAvailablePackages();
            return res.json({ packages });
        }

        // Fallback: paquetes estáticos
        const PACKAGES = [
            { id: 'starter', name: 'Starter', iacoins_base: 100, bonus_percentage: 0, price_mxn: 49, icon: '🌟' },
            { id: 'popular', name: 'Popular', iacoins_base: 500, bonus_percentage: 10, price_mxn: 199, icon: '🔥', is_featured: true },
            { id: 'pro', name: 'Pro', iacoins_base: 1200, bonus_percentage: 15, price_mxn: 399, icon: '💎' },
            { id: 'mega', name: 'Mega', iacoins_base: 3000, bonus_percentage: 25, price_mxn: 899, icon: '🚀' }
        ];
        res.json({ packages: PACKAGES });

    } catch (error) {
        debugLog.error('WALLET', '[WALLET] Error al obtener paquetes:', error.message);
        res.status(500).json({ error: 'Error al obtener paquetes' });
    }
});

// ============================================
// ENDPOINT 6: POST /api/wallet/create-checkout
// Crear sesión de checkout de Stripe
// ============================================
router.post('/create-checkout', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { package_id } = req.body;

        if (!package_id) {
            return res.status(400).json({ error: 'El package_id es requerido' });
        }

        debugLog.log('WALLET', `[WALLET] Usuario ${userId} iniciando checkout para paquete ${package_id}`);

        if (!stripePaymentsService) {
            return res.status(503).json({ error: 'Servicio de pagos no disponible' });
        }

        // URLs de retorno
        const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const successUrl = `${baseUrl}/iacoins-success.html`;
        const cancelUrl = `${baseUrl}/iacoins-store.html`;

        const session = await stripePaymentsService.createCheckoutSession(
            userId,
            package_id,
            successUrl,
            cancelUrl
        );

        res.json({
            success: true,
            session_id: session.sessionId,
            checkout_url: session.sessionUrl,
            package_id: session.packageId,
            amount: session.amount,
            iacoins: session.iacoins
        });

    } catch (error) {
        debugLog.error('WALLET', '[WALLET] Error al crear checkout:', error.message);
        res.status(500).json({
            error: 'Error al crear sesión de pago',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINT 7: GET /api/wallet/purchase-history
// Obtener historial de compras con dinero real
// ============================================
router.get('/purchase-history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20 } = req.query;

        if (stripePaymentsService) {
            const purchases = await stripePaymentsService.getUserPurchaseHistory(userId, parseInt(limit));
            return res.json({ purchases });
        }

        // Fallback desde wallet_history
        const result = await pool.query(
            `SELECT * FROM wallet_history 
             WHERE user_id = $1 AND transaction_type = 'purchase'
             ORDER BY created_at DESC LIMIT $2`,
            [userId, parseInt(limit)]
        );
        res.json({ purchases: result.rows });

    } catch (error) {
        debugLog.error('WALLET', '[WALLET] Error al obtener historial de compras:', error.message);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// ============================================
// ENDPOINT 8: POST /api/wallet/purchase (LEGACY)
// Comprar IACoins - Mantenido para compatibilidad
// ============================================
router.post('/purchase', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { package_id, payment_method, payment_reference } = req.body;

        // Si tiene Stripe disponible, redirigir al nuevo flujo
        if (stripePaymentsService && payment_method === 'stripe') {
            return res.status(400).json({
                error: 'Use /api/wallet/create-checkout para pagos con Stripe',
                redirect: '/api/wallet/create-checkout'
            });
        }

        // Validaciones
        if (!package_id) {
            return res.status(400).json({ error: 'El package_id es requerido' });
        }

        debugLog.log('WALLET', `[WALLET] Usuario ${userId} comprando paquete ${package_id} (legacy)`);

        // Configuración de paquetes legacy
        const PACKAGES = {
            'starter': { iacoins: 100, bonus_percentage: 0, price_mxn: 49 },
            'popular': { iacoins: 500, bonus_percentage: 10, price_mxn: 199 },
            'pro': { iacoins: 1200, bonus_percentage: 15, price_mxn: 399 },
            'mega': { iacoins: 3000, bonus_percentage: 25, price_mxn: 899 }
        };

        const pkg = PACKAGES[package_id];
        if (!pkg) {
            return res.status(400).json({ error: 'Paquete no válido' });
        }

        const totalCoins = Math.floor(pkg.iacoins * (1 + pkg.bonus_percentage / 100));

        await client.query('BEGIN');

        // Actualizar wallet
        const walletResult = await client.query(
            `UPDATE wallet
            SET balance = balance + $1,
                total_purchased = total_purchased + $1,
                updated_at = NOW()
            WHERE user_id = $2
            RETURNING balance`,
            [totalCoins, userId]
        );

        if (walletResult.rows.length === 0) {
            await client.query(
                `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
                VALUES ($1, $2, 0, 0, $2)`,
                [userId, totalCoins]
            );
        }

        const newBalance = walletResult.rows[0]?.balance || totalCoins;

        // Registrar en historial
        await client.query(
            `INSERT INTO wallet_history
            (user_id, transaction_type, amount, balance_after, description, metadata)
            VALUES ($1, 'purchase', $2, $3, $4, $5)`,
            [
                userId,
                totalCoins,
                newBalance,
                `Compra de paquete ${package_id}`,
                JSON.stringify({
                    package_id,
                    payment_method: payment_method || 'legacy',
                    payment_reference,
                    base_coins: pkg.iacoins,
                    bonus_percentage: pkg.bonus_percentage,
                    price_mxn: pkg.price_mxn
                })
            ]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            new_balance: newBalance,
            purchased: totalCoins,
            package: {
                id: package_id,
                base_coins: pkg.iacoins,
                bonus_coins: totalCoins - pkg.iacoins,
                total_coins: totalCoins
            },
            message: `¡Compra exitosa! Has recibido ${totalCoins} IA Coins`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('WALLET', '[WALLET] Error al comprar IACoins:', error.message);
        res.status(500).json({
            error: 'Error al procesar la compra',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

module.exports = router;

/**
 * 💰 WALLET ROUTES - SISTEMA DE IACOINS - TypeScript
 * Gestión de monedero virtual de estudiantes
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { authenticateToken } from '../middleware/auth';
// @ts-ignore
import WalletDAO from '../data/wallet.dao';
// @ts-ignore
import { pool } from '../config/database';

const router = express.Router();

let stripePaymentsService: any;
try {
    // @ts-ignore
    stripePaymentsService = require('../services/stripePaymentsService.bridge');
} catch (error) {
    debugLog.warn('WALLET', '[WALLET] Stripe service no disponible, usando modo legacy');
    stripePaymentsService = null;
}

// ============================================
// INTERFACES
// ============================================

interface Wallet {
    user_id: number;
    balance: number;
    total_earned: number;
    total_spent: number;
    total_purchased: number;
    created_at?: Date;
    updated_at?: Date;
}

interface WalletTransaction {
    id: number;
    user_id: number;
    transaction_type: 'earn' | 'spend' | 'purchase';
    amount: number;
    balance_after: number;
    description: string;
    metadata?: any;
    created_at: Date;
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/wallet
 * Obtener saldo actual del wallet
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        debugLog.log('WALLET', `[WALLET] Obteniendo saldo para usuario ${userId}`);

        let wallet: Wallet = await WalletDAO.getByUserId(userId);

        if (!wallet) {
            // Crear wallet si no existe
            wallet = await WalletDAO.create(userId, 0);
            res.json({
                wallet,
                message: 'Wallet creado exitosamente'
            });
            return;
        }

        res.json({ wallet });

    } catch (error: any) {
        debugLog.error('WALLET', '[WALLET] Error al obtener saldo:', error.message);
        res.status(500).json({
            error: 'Error al obtener saldo del wallet',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/wallet/history
 * Obtener historial de transacciones
 */
router.get('/history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { limit = '50', offset = '0', type } = req.query;

        debugLog.log('WALLET', `[WALLET] Obteniendo historial para usuario ${userId}`);

        const { transactions, total } = await WalletDAO.getHistory(userId, {
            type,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });

        res.json({
            transactions,
            pagination: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: parseInt(offset as string) + transactions.length < total
            }
        });

    } catch (error: any) {
        debugLog.error('WALLET', '[WALLET] Error al obtener historial:', error.message);
        res.status(500).json({
            error: 'Error al obtener historial de transacciones',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/wallet/earn
 * Ganar IACoins (recompensas, logros, retos)
 */
router.post('/earn', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
        const userId = (req as any).user.id;
        const { amount, description, metadata = {} } = req.body;

        // Validaciones
        if (!amount || amount <= 0) {
            res.status(400).json({ error: 'El monto debe ser mayor a 0' });
            return;
        }

        if (!description) {
            res.status(400).json({ error: 'La descripción es requerida' });
            return;
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

    } catch (error: any) {
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

/**
 * POST /api/wallet/spend
 * Gastar IACoins (compras en tienda)
 */
router.post('/spend', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
        const userId = (req as any).user.id;
        const { amount, description, metadata = {} } = req.body;

        // Validaciones
        if (!amount || amount <= 0) {
            res.status(400).json({ error: 'El monto debe ser mayor a 0' });
            return;
        }

        if (!description) {
            res.status(400).json({ error: 'La descripción es requerida' });
            return;
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
            res.status(404).json({ error: 'Wallet no encontrado' });
            return;
        }

        const currentBalance = walletResult.rows[0].balance;

        if (currentBalance < amount) {
            await client.query('ROLLBACK');
            res.status(400).json({
                error: 'Saldo insuficiente',
                current_balance: currentBalance,
                required: amount,
                missing: amount - currentBalance
            });
            return;
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

    } catch (error: any) {
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

/**
 * GET /api/wallet/packages
 * Obtener paquetes de IACoins disponibles
 */
router.get('/packages', async (req: Request, res: Response): Promise<void> => {
    try {
        if (stripePaymentsService) {
            const packages = await stripePaymentsService.getAvailablePackages();
            res.json({ packages });
            return;
        }

        // Fallback: paquetes estáticos
        const PACKAGES = [
            { id: 'starter', name: 'Starter', iacoins_base: 100, bonus_percentage: 0, price_mxn: 49, icon: '🌟' },
            { id: 'popular', name: 'Popular', iacoins_base: 500, bonus_percentage: 10, price_mxn: 199, icon: '🔥', is_featured: true },
            { id: 'pro', name: 'Pro', iacoins_base: 1200, bonus_percentage: 15, price_mxn: 399, icon: '💎' },
            { id: 'mega', name: 'Mega', iacoins_base: 3000, bonus_percentage: 25, price_mxn: 899, icon: '🚀' }
        ];
        res.json({ packages: PACKAGES });

    } catch (error: any) {
        debugLog.error('WALLET', '[WALLET] Error al obtener paquetes:', error.message);
        res.status(500).json({ error: 'Error al obtener paquetes' });
    }
});

/**
 * POST /api/wallet/create-checkout
 * Crear sesión de checkout de Stripe
 */
router.post('/create-checkout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { package_id } = req.body;

        if (!package_id) {
            res.status(400).json({ error: 'El package_id es requerido' });
            return;
        }

        debugLog.log('WALLET', `[WALLET] Usuario ${userId} iniciando checkout para paquete ${package_id}`);

        if (!stripePaymentsService) {
            res.status(503).json({ error: 'Servicio de pagos no disponible' });
            return;
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

    } catch (error: any) {
        debugLog.error('WALLET', '[WALLET] Error al crear checkout:', error.message);
        res.status(500).json({
            error: 'Error al crear sesión de pago',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/wallet/purchase-history
 * Obtener historial de compras con dinero real
 */
router.get('/purchase-history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { limit = '20' } = req.query;

        if (stripePaymentsService) {
            const purchases = await stripePaymentsService.getUserPurchaseHistory(userId, parseInt(limit as string));
            res.json({ purchases });
            return;
        }

        // Fallback desde wallet_history
        const result = await pool.query(
            `SELECT * FROM wallet_history 
             WHERE user_id = $1 AND transaction_type = 'purchase'
             ORDER BY created_at DESC LIMIT $2`,
            [userId, parseInt(limit as string)]
        );
        res.json({ purchases: result.rows });

    } catch (error: any) {
        debugLog.error('WALLET', '[WALLET] Error al obtener historial de compras:', error.message);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

/**
 * POST /api/wallet/purchase (LEGACY)
 * Comprar IACoins - Mantenido para compatibilidad
 */
router.post('/purchase', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
        const userId = (req as any).user.id;
        const { package_id, payment_method, payment_reference } = req.body;

        // Si tiene Stripe disponible, redirigir al nuevo flujo
        if (stripePaymentsService && payment_method === 'stripe') {
            res.status(400).json({
                error: 'Use /api/wallet/create-checkout para pagos con Stripe',
                redirect: '/api/wallet/create-checkout'
            });
            return;
        }

        // Validaciones
        if (!package_id) {
            res.status(400).json({ error: 'El package_id es requerido' });
            return;
        }

        debugLog.log('WALLET', `[WALLET] Usuario ${userId} comprando paquete ${package_id} (legacy)`);

        // Configuración de paquetes legacy
        const PACKAGES: Record<string, { iacoins: number; bonus_percentage: number; price_mxn: number }> = {
            'starter': { iacoins: 100, bonus_percentage: 0, price_mxn: 49 },
            'popular': { iacoins: 500, bonus_percentage: 10, price_mxn: 199 },
            'pro': { iacoins: 1200, bonus_percentage: 15, price_mxn: 399 },
            'mega': { iacoins: 3000, bonus_percentage: 25, price_mxn: 899 }
        };

        const pkg = PACKAGES[package_id];
        if (!pkg) {
            res.status(400).json({ error: 'Paquete no válido' });
            return;
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

    } catch (error: any) {
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

// @ts-ignore
export = router;

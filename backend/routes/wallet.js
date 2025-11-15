/**
 * 💰 WALLET ROUTES - SISTEMA DE IACOINS
 * Gestión de monedero virtual de estudiantes
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
// ENDPOINT 1: GET /api/wallet
// Obtener saldo actual del wallet
// ============================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        devLogger.log(`[WALLET] Obteniendo saldo para usuario ${userId}`);

        const result = await pool.query(
            `SELECT
                user_id,
                balance,
                total_earned,
                total_spent,
                total_purchased,
                created_at,
                updated_at
            FROM wallet
            WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Crear wallet si no existe
            const newWallet = await pool.query(
                `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
                VALUES ($1, 0, 0, 0, 0)
                RETURNING *`,
                [userId]
            );

            return res.json({
                wallet: newWallet.rows[0],
                message: 'Wallet creado exitosamente'
            });
        }

        res.json({
            wallet: result.rows[0]
        });

    } catch (error) {
        devLogger.error('[WALLET] Error al obtener saldo:', error.message);
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

        devLogger.log(`[WALLET] Obteniendo historial para usuario ${userId}`);

        let query = `
            SELECT
                id,
                user_id,
                transaction_type,
                amount,
                balance_after,
                description,
                metadata,
                created_at
            FROM wallet_history
            WHERE user_id = $1
        `;
        const params = [userId];

        // Filtro opcional por tipo
        if (type && ['earn', 'spend', 'purchase'].includes(type)) {
            query += ` AND transaction_type = $${params.length + 1}`;
            params.push(type);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total de transacciones
        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM wallet_history WHERE user_id = $1`,
            [userId]
        );

        res.json({
            transactions: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        devLogger.error('[WALLET] Error al obtener historial:', error.message);
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

        devLogger.log(`[WALLET] Usuario ${userId} ganando ${amount} IACoins: ${description}`);

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
        devLogger.error('[WALLET] Error al ganar IACoins:', error.message);
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

        devLogger.log(`[WALLET] Usuario ${userId} gastando ${amount} IACoins: ${description}`);

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
        devLogger.error('[WALLET] Error al gastar IACoins:', error.message);
        res.status(500).json({
            error: 'Error al procesar el gasto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINT 5: POST /api/wallet/purchase
// Comprar IACoins con dinero real (Stripe/MercadoPago)
// ============================================
router.post('/purchase', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { package_id, payment_method, payment_reference } = req.body;

        // Validaciones
        if (!package_id) {
            return res.status(400).json({
                error: 'El package_id es requerido'
            });
        }

        if (!payment_method) {
            return res.status(400).json({
                error: 'El método de pago es requerido'
            });
        }

        devLogger.log(`[WALLET] Usuario ${userId} comprando paquete ${package_id} con ${payment_method}`);

        // Configuración de paquetes (debería venir de BD o config)
        const PACKAGES = {
            'starter': { iacoins: 100, bonus_percentage: 0, price_usd: 4.99 },
            'basic': { iacoins: 250, bonus_percentage: 10, price_usd: 9.99 },
            'popular': { iacoins: 500, bonus_percentage: 20, price_usd: 19.99 },
            'premium': { iacoins: 1200, bonus_percentage: 30, price_usd: 39.99 },
            'ultimate': { iacoins: 3000, bonus_percentage: 50, price_usd: 89.99 }
        };

        const pkg = PACKAGES[package_id];
        if (!pkg) {
            return res.status(400).json({
                error: 'Paquete no válido'
            });
        }

        const totalCoins = Math.floor(pkg.iacoins * (1 + pkg.bonus_percentage / 100));

        // TODO: Integrar con pasarela de pago real (Stripe/MercadoPago)
        // Por ahora simulamos una compra exitosa

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
            // Crear wallet si no existe
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
                    payment_method,
                    payment_reference,
                    base_coins: pkg.iacoins,
                    bonus_percentage: pkg.bonus_percentage,
                    price_usd: pkg.price_usd
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
        devLogger.error('[WALLET] Error al comprar IACoins:', error.message);
        res.status(500).json({
            error: 'Error al procesar la compra',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

module.exports = router;

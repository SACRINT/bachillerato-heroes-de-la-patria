/**
 * 💳 STRIPE PAYMENTS SERVICE - TypeScript
 * Servicio de integración con Stripe para compra de IACoins
 * FASE 5.2 - Monetización
 * Creado: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface IACoinsPackage {
    id: string;
    name: string;
    description: string;
    price_mxn: number;
    iacoins_base: number;
    bonus_percentage: number;
    total_iacoins: number;
    icon: string;
    is_active: boolean;
    is_featured: boolean;
}

export interface CheckoutSession {
    sessionId: string;
    sessionUrl: string;
    packageId: string;
    amount: number;
    iacoins: number;
}

export interface PaymentIntent {
    id: number;
    user_id: number;
    stripe_session_id: string;
    package_id: string;
    amount_mxn: number;
    iacoins_amount: number;
    status: string;
    created_at: Date;
}

// =====================================================
// STRIPE PAYMENTS SERVICE
// =====================================================

class StripePaymentsService {
    private stripe: any;
    private isConfigured: boolean = false;

    constructor() {
        // Inicializar Stripe si la API key está configurada
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey && stripeKey.startsWith('sk_')) {
            try {
                this.stripe = require('stripe')(stripeKey);
                this.isConfigured = true;
                console.log('[STRIPE] ✅ Stripe inicializado correctamente');
            } catch (error: any) {
                console.error('[STRIPE] ❌ Error inicializando Stripe:', error.message);
            }
        } else {
            console.log('[STRIPE] ⚠️ STRIPE_SECRET_KEY no configurada - modo simulación');
        }
    }

    /**
     * Obtener paquetes de IACoins disponibles
     */
    async getAvailablePackages(): Promise<IACoinsPackage[]> {
        const result = await pool.query(`
            SELECT id, name, description, price_mxn, iacoins_base, bonus_percentage, 
                   icon, is_active, is_featured,
                   calculate_total_iacoins(iacoins_base, bonus_percentage) as total_iacoins
            FROM iacoins_packages
            WHERE is_active = true
            ORDER BY sort_order
        `);
        return result.rows;
    }

    /**
     * Obtener un paquete por ID
     */
    async getPackageById(packageId: string): Promise<IACoinsPackage | null> {
        const result = await pool.query(`
            SELECT id, name, description, price_mxn, iacoins_base, bonus_percentage,
                   icon, is_active, is_featured,
                   calculate_total_iacoins(iacoins_base, bonus_percentage) as total_iacoins
            FROM iacoins_packages
            WHERE id = $1 AND is_active = true
        `, [packageId]);
        return result.rows[0] || null;
    }

    /**
     * Crear sesión de checkout de Stripe
     */
    async createCheckoutSession(
        userId: number,
        packageId: string,
        successUrl: string,
        cancelUrl: string
    ): Promise<CheckoutSession> {
        // Obtener paquete
        const pkg = await this.getPackageById(packageId);
        if (!pkg) {
            throw new Error('Paquete no encontrado');
        }

        const totalIacoins = pkg.iacoins_base + Math.floor(pkg.iacoins_base * pkg.bonus_percentage / 100);

        // Si Stripe no está configurado, simular checkout
        if (!this.isConfigured) {
            const mockSessionId = `cs_test_mock_${Date.now()}_${userId}`;

            // Registrar intento de pago en BD
            await this.createPaymentIntent(userId, mockSessionId, pkg, totalIacoins);

            return {
                sessionId: mockSessionId,
                sessionUrl: `${successUrl}?session_id=${mockSessionId}&mock=true`,
                packageId: pkg.id,
                amount: pkg.price_mxn,
                iacoins: totalIacoins
            };
        }

        // Crear sesión real de Stripe
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: `${pkg.name} - ${totalIacoins} IACoins`,
                        description: pkg.description,
                        images: [] // Agregar logo si está disponible
                    },
                    unit_amount: Math.round(pkg.price_mxn * 100) // Stripe usa centavos
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
                user_id: userId.toString(),
                package_id: pkg.id,
                iacoins_amount: totalIacoins.toString()
            }
        });

        // Registrar intento de pago en BD
        await this.createPaymentIntent(userId, session.id, pkg, totalIacoins);

        return {
            sessionId: session.id,
            sessionUrl: session.url,
            packageId: pkg.id,
            amount: pkg.price_mxn,
            iacoins: totalIacoins
        };
    }

    /**
     * Registrar intento de pago en BD
     */
    private async createPaymentIntent(
        userId: number,
        sessionId: string,
        pkg: IACoinsPackage,
        totalIacoins: number
    ): Promise<void> {
        await pool.query(`
            INSERT INTO payment_intents 
            (user_id, stripe_session_id, package_id, amount_mxn, iacoins_amount, bonus_iacoins, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        `, [
            userId,
            sessionId,
            pkg.id,
            pkg.price_mxn,
            totalIacoins,
            Math.floor(pkg.iacoins_base * pkg.bonus_percentage / 100)
        ]);
    }

    /**
     * Procesar pago completado (webhook o verificación)
     */
    async processCompletedPayment(sessionId: string): Promise<{ success: boolean; iacoins: number }> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Obtener payment intent
            const intentResult = await client.query(
                'SELECT * FROM payment_intents WHERE stripe_session_id = $1 FOR UPDATE',
                [sessionId]
            );

            if (intentResult.rows.length === 0) {
                throw new Error('Payment intent no encontrado');
            }

            const intent = intentResult.rows[0];

            // Verificar que no esté ya procesado
            if (intent.status === 'completed') {
                await client.query('ROLLBACK');
                return { success: true, iacoins: intent.iacoins_amount };
            }

            // Actualizar status del payment intent
            await client.query(
                `UPDATE payment_intents SET status = 'completed', completed_at = NOW() WHERE id = $1`,
                [intent.id]
            );

            // Acreditar IACoins al wallet del usuario
            const walletResult = await client.query(
                `UPDATE wallet 
                 SET balance = balance + $1, total_purchased = total_purchased + $1, updated_at = NOW()
                 WHERE user_id = $2
                 RETURNING balance`,
                [intent.iacoins_amount, intent.user_id]
            );

            let newBalance: number;

            if (walletResult.rows.length === 0) {
                // Crear wallet si no existe
                const createResult = await client.query(
                    `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
                     VALUES ($1, $2, 0, 0, $2)
                     RETURNING balance`,
                    [intent.user_id, intent.iacoins_amount]
                );
                newBalance = createResult.rows[0].balance;
            } else {
                newBalance = walletResult.rows[0].balance;
            }

            // Registrar en historial
            await client.query(
                `INSERT INTO wallet_history 
                 (user_id, transaction_type, amount, balance_after, description, metadata)
                 VALUES ($1, 'purchase', $2, $3, $4, $5)`,
                [
                    intent.user_id,
                    intent.iacoins_amount,
                    newBalance,
                    `Compra de ${intent.iacoins_amount} IACoins (${intent.package_id})`,
                    JSON.stringify({
                        stripe_session_id: sessionId,
                        package_id: intent.package_id,
                        amount_mxn: intent.amount_mxn
                    })
                ]
            );

            await client.query('COMMIT');

            console.log(`[STRIPE] ✅ Pago completado: ${intent.iacoins_amount} IACoins acreditados a usuario ${intent.user_id}`);

            return { success: true, iacoins: intent.iacoins_amount };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Verificar sesión de Stripe
     */
    async verifySession(sessionId: string): Promise<PaymentIntent | null> {
        const result = await pool.query(
            'SELECT * FROM payment_intents WHERE stripe_session_id = $1',
            [sessionId]
        );
        return result.rows[0] || null;
    }

    /**
     * Manejar webhook de Stripe
     */
    async handleWebhook(event: any): Promise<void> {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log(`[STRIPE] Webhook: checkout.session.completed - ${session.id}`);
                await this.processCompletedPayment(session.id);
                break;

            case 'payment_intent.succeeded':
                console.log(`[STRIPE] Webhook: payment_intent.succeeded`);
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                console.log(`[STRIPE] Webhook: payment_intent.payment_failed`);
                // Marcar como fallido en BD
                await pool.query(
                    `UPDATE payment_intents SET status = 'failed', error_message = $1 
                     WHERE stripe_payment_intent = $2`,
                    [failedIntent.last_payment_error?.message || 'Payment failed', failedIntent.id]
                );
                break;

            default:
                console.log(`[STRIPE] Webhook no manejado: ${event.type}`);
        }
    }

    /**
     * Obtener historial de compras de un usuario
     */
    async getUserPurchaseHistory(userId: number, limit: number = 20): Promise<PaymentIntent[]> {
        const result = await pool.query(
            `SELECT * FROM payment_intents 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    /**
     * Verificar si Stripe está configurado
     */
    isStripeConfigured(): boolean {
        return this.isConfigured;
    }
}

// =====================================================
// EXPORTS
// =====================================================

const stripePaymentsService = new StripePaymentsService();

export default stripePaymentsService;
export { StripePaymentsService };

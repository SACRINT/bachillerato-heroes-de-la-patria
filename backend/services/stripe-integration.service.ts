/**
 * Stripe Integration Service
 * Servicio completo de integración con Stripe para pagos escolares
 */

import { executeQuery } from '../config/database';

// Mock de Stripe - En producción usar: import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export interface StripeConfig {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    currency: string;
}

export interface CheckoutSession {
    type: 'inscripcion' | 'colegiatura' | 'servicio' | 'ia_coins';
    amount: number;
    description: string;
    metadata: {
        user_id?: number;
        student_id?: number;
        service_id?: number;
        [key: string]: any;
    };
    success_url: string;
    cancel_url: string;
}

class StripeIntegrationService {

    private config: StripeConfig;

    constructor() {
        this.config = {
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock',
            secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock',
            currency: 'MXN'
        };
    }

    /**
     * Crear sesión de Checkout
     */
    async createCheckoutSession(data: CheckoutSession): Promise<any> {
        try {
            // TODO: Usar Stripe real
            // const session = await stripe.checkout.sessions.create({
            //     payment_method_types: ['card', 'oxxo'],
            //     line_items: [{
            //         price_data: {
            //             currency: this.config.currency.toLowerCase(),
            //             product_data: {
            //                 name: data.description,
            //             },
            //             unit_amount: data.amount * 100, // Centavos
            //         },
            //         quantity: 1,
            //     }],
            //     mode: 'payment',
            //     success_url: data.success_url,
            //     cancel_url: data.cancel_url,
            //     metadata: data.metadata,
            //     expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos
            // });

            // Mock response
            const mockSession = {
                id: `cs_test_${Date.now()}`,
                url: `https://checkout.stripe.com/pay/cs_test_${Date.now()}`,
                amount_total: data.amount * 100,
                currency: this.config.currency.toLowerCase(),
                payment_status: 'unpaid',
                metadata: data.metadata
            };

            // Registrar en BD
            await this.recordTransaction({
                tipo: data.type,
                monto: data.amount,
                stripe_session_id: mockSession.id,
                status: 'pendiente',
                metadata: data.metadata
            });

            return mockSession;

        } catch (error) {
            console.error('Error creando checkout session:', error);
            throw error;
        }
    }

    /**
     * Crear Payment Intent para pago directo
     */
    async createPaymentIntent(amount: number, metadata: any): Promise<any> {
        try {
            // TODO: Usar Stripe real
            // const paymentIntent = await stripe.paymentIntents.create({
            //     amount: amount * 100,
            //     currency: this.config.currency.toLowerCase(),
            //     payment_method_types: ['card'],
            //     metadata
            // });

            const mockIntent = {
                id: `pi_mock_${Date.now()}`,
                client_secret: `pi_mock_${Date.now()}_secret`,
                amount: amount * 100,
                currency: this.config.currency.toLowerCase(),
                status: 'requires_payment_method'
            };

            return mockIntent;

        } catch (error) {
            console.error('Error creando payment intent:', error);
            throw error;
        }
    }

    /**
     * Crear pago OXXO
     */
    async createOxxoPayment(amount: number, metadata: any, customerEmail: string): Promise<any> {
        try {
            // TODO: Usar Stripe real
            // const paymentIntent = await stripe.paymentIntents.create({
            //     amount: amount * 100,
            //     currency: this.config.currency.toLowerCase(),
            //     payment_method_types: ['oxxo'],
            //     metadata,
            //     receipt_email: customerEmail
            // });

            const mockOxxo = {
                id: `pi_oxxo_${Date.now()}`,
                amount: amount * 100,
                currency: this.config.currency.toLowerCase(),
                status: 'requires_action',
                next_action: {
                    type: 'oxxo_display_details',
                    oxxo_display_details: {
                        number: `${Date.now()}`.slice(-10),
                        expires_after: 259200, // 3 días
                        hosted_voucher_url: `https://mock-stripe.com/voucher/${Date.now()}`
                    }
                },
                metadata
            };

            // Registrar transacción
            await this.recordTransaction({
                tipo: metadata.tipo || 'servicio',
                monto: amount,
                stripe_payment_intent_id: mockOxxo.id,
                oxxo_referencia: mockOxxo.next_action.oxxo_display_details.number,
                status: 'pendiente',
                fecha_expiracion: new Date(Date.now() + 259200000), // 3 días
                metadata
            });

            return mockOxxo;

        } catch (error) {
            console.error('Error creando pago OXXO:', error);
            throw error;
        }
    }

    /**
     * Confirmar pago (webhook handler)
     */
    async handleWebhook(signature: string, payload: any): Promise<any> {
        try {
            // TODO: Verificar firma del webhook
            // const event = stripe.webhooks.constructEvent(
            //     payload,
            //     signature,
            //     this.config.webhookSecret
            // );

            const event = payload; // Mock

            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object);
                    break;

                case 'payment_intent.succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;

                case 'charge.refunded':
                    await this.handleRefund(event.data.object);
                    break;
            }

            return { received: true };

        } catch (error) {
            console.error('Error procesando webhook:', error);
            throw error;
        }
    }

    /**
     * Manejar checkout completado
     */
    private async handleCheckoutCompleted(session: any): Promise<void> {
        const metadata = session.metadata;

        await executeQuery(`
            UPDATE transacciones_financieras
            SET 
                status = 'completado',
                fecha_pago = CURRENT_TIMESTAMP,
                stripe_charge_id = $2
            WHERE stripe_session_id = $1
        `, [session.id, session.payment_intent]);

        // Actualizar según tipo de pago
        switch (metadata.tipo) {
            case 'inscripcion':
                await this.processInscripcionPayment(metadata);
                break;
            case 'colegiatura':
                await this.processColegiaturaPayment(metadata);
                break;
            case 'servicio':
                await this.processServicioPayment(metadata);
                break;
            case 'ia_coins':
                await this.processIACoinsPayment(metadata);
                break;
        }

        // Generar recibo
        await this.generateReceipt(session.id);
    }

    /**
     * Manejar pago exitoso
     */
    private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
        await executeQuery(`
            UPDATE transacciones_financieras
            SET 
                status = 'completado',
                fecha_pago = CURRENT_TIMESTAMP
            WHERE stripe_payment_intent_id = $1
        `, [paymentIntent.id]);

        // Generar recibo
        await this.generateReceipt(paymentIntent.id);
    }

    /**
     * Manejar pago fallido
     */
    private async handlePaymentFailed(paymentIntent: any): Promise<void> {
        await executeQuery(`
            UPDATE transacciones_financieras
            SET 
                status = 'fallido',
                motivo_fallo = $2
            WHERE stripe_payment_intent_id = $1
        `, [paymentIntent.id, paymentIntent.last_payment_error?.message || 'Pago rechazado']);
    }

    /**
     * Manejar reembolso
     */
    private async handleRefund(charge: any): Promise<void> {
        await executeQuery(`
            UPDATE transacciones_financieras
            SET 
                status = 'reembolsado',
                fecha_reembolso = CURRENT_TIMESTAMP
            WHERE stripe_charge_id = $1
        `, [charge.id]);
    }

    /**
     * Procesar pago de inscripción
     */
    private async processInscripcionPayment(metadata: any): Promise<void> {
        const EnrollmentService = require('./enrollment.service').default;
        await EnrollmentService.registerPayment(metadata.solicitud_id, {
            monto: metadata.amount,
            referencia: metadata.payment_intent,
            metodo: 'stripe'
        });
    }

    /**
     * Procesar pago de colegiatura
     */
    private async processColegiaturaPayment(metadata: any): Promise<void> {
        await executeQuery(`
            UPDATE colegiaturas
            SET 
                status = 'pagado',
                fecha_pago = CURRENT_TIMESTAMP,
                metodo_pago = 'stripe'
            WHERE id = $1
        `, [metadata.colegiatura_id]);
    }

    /**
     * Procesar pago de servicio
     */
    private async processServicioPayment(metadata: any): Promise<void> {
        await executeQuery(`
            INSERT INTO pagos_servicios (
                estudiante_id, servicio_id, monto, 
                metodo_pago, status, fecha_pago
            ) VALUES ($1, $2, $3, 'stripe', 'completado', CURRENT_TIMESTAMP)
        `, [metadata.student_id, metadata.service_id, metadata.amount]);
    }

    /**
     * Procesar compra de IA Coins
     */
    private async processIACoinsPayment(metadata: any): Promise<void> {
        const coins = Math.floor(metadata.amount / 10); // 1 MXN = 0.1 coins

        await executeQuery(`
            UPDATE usuarios
            SET ia_coins = ia_coins + $1
            WHERE id = $2
        `, [coins, metadata.user_id]);

        // Registrar transacción de coins
        await executeQuery(`
            INSERT INTO ia_coins_transactions (
                user_id, tipo, cantidad, monto_mxn, descripcion
            ) VALUES ($1, 'compra', $2, $3, 'Compra con Stripe')
        `, [metadata.user_id, coins, metadata.amount]);
    }

    /**
     * Generar recibo automático
     */
    private async generateReceipt(transactionId: string): Promise<void> {
        const transaction = await executeQuery(`
            SELECT * FROM transacciones_financieras
            WHERE stripe_session_id = $1 OR stripe_payment_intent_id = $1
            LIMIT 1
        `, [transactionId]) as any[];

        if (!transaction || transaction.length === 0) return;

        const receiptUrl = `/recibos/${transaction[0].id}_recibo.pdf`;

        await executeQuery(`
            UPDATE transacciones_financieras
            SET recibo_url = $1, recibo_generado = true
            WHERE id = $2
        `, [receiptUrl, transaction[0].id]);

        // Enviar recibo por email
        await this.sendReceiptEmail(transaction[0]);
    }

    /**
     * Enviar recibo por email
     */
    private async sendReceiptEmail(transaction: any): Promise<void> {
        // TODO: Integrar con EmailService real
        console.log(`Enviando recibo de transacción ${transaction.id} a email`);
    }

    /**
     * Registrar transacción en BD
     */
    private async recordTransaction(data: any): Promise<any> {
        const result = await executeQuery(`
            INSERT INTO transacciones_financieras (
                tipo, monto, moneda, stripe_session_id, stripe_payment_intent_id,
                oxxo_referencia, fecha_expiracion, status, metadata, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            data.tipo,
            data.monto,
            this.config.currency,
            data.stripe_session_id || null,
            data.stripe_payment_intent_id || null,
            data.oxxo_referencia || null,
            data.fecha_expiracion || null,
            data.status || 'pendiente',
            JSON.stringify(data.metadata || {})
        ]) as any[];

        return result[0];
    }

    /**
     * Crear reembolso
     */
    async createRefund(chargeId: string, amount?: number, reason?: string): Promise<any> {
        try {
            // TODO: Usar Stripe real
            // const refund = await stripe.refunds.create({
            //     charge: chargeId,
            //     amount: amount ? amount * 100 : undefined,
            //     reason: reason as any
            // });

            const mockRefund = {
                id: `re_mock_${Date.now()}`,
                charge: chargeId,
                amount: amount ? amount * 100 : 0,
                status: 'succeeded'
            };

            return mockRefund;

        } catch (error) {
            console.error('Error creando reembolso:', error);
            throw error;
        }
    }

    /**
     * Obtener configuración pública (para frontend)
     */
    getPublicConfig(): { publishableKey: string; currency: string } {
        return {
            publishableKey: this.config.publishableKey,
            currency: this.config.currency
        };
    }

    /**
     * Obtener balance de cuenta
     */
    async getBalance(): Promise<any> {
        try {
            // TODO: Usar Stripe real
            // const balance = await stripe.balance.retrieve();

            const mockBalance = {
                available: [{ amount: 0, currency: this.config.currency.toLowerCase() }],
                pending: [{ amount: 0, currency: this.config.currency.toLowerCase() }]
            };

            return mockBalance;

        } catch (error) {
            console.error('Error obteniendo balance:', error);
            throw error;
        }
    }
}

export default new StripeIntegrationService();

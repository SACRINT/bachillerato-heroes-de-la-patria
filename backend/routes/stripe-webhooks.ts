/**
 * 💳 STRIPE WEBHOOKS ROUTES - TypeScript
 * Endpoints para recibir eventos de Stripe
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import devLogger from '../utils/devLogger';

const router = express.Router();

let stripePaymentsService: any;
try {
    // @ts-ignore
    stripePaymentsService = require('../services/stripePaymentsService.bridge');
} catch (error) {
    console.log('[STRIPE-WEBHOOKS] Servicio en modo simulado');
    stripePaymentsService = null;
}

// =====================================================
// HANDLERS
// =====================================================

async function handleCheckoutCompleted(session: any) {
    devLogger.info(`[STRIPE-WEBHOOK] Checkout completado: ${session.id}`);

    try {
        if (stripePaymentsService) {
            const result = await stripePaymentsService.processCompletedPayment(session.id);
            devLogger.info(`[STRIPE-WEBHOOK] IACoins acreditados: ${result.iacoins}`);
        } else {
            devLogger.warn('[STRIPE-WEBHOOK] Servicio no disponible, pago pendiente de procesamiento manual');
        }
    } catch (error) {
        devLogger.error('[STRIPE-WEBHOOK] Error procesando checkout:', error);
    }
}

async function handlePaymentSucceeded(paymentIntent: any) {
    devLogger.info(`[STRIPE-WEBHOOK] Pago exitoso: ${paymentIntent.id}`);
}

async function handlePaymentFailed(paymentIntent: any) {
    devLogger.warn(`[STRIPE-WEBHOOK] Pago fallido: ${paymentIntent.id}`);

    try {
        if (stripePaymentsService) {
            await stripePaymentsService.handleWebhook({
                type: 'payment_intent.payment_failed',
                data: { object: paymentIntent }
            });
        }
    } catch (error) {
        devLogger.error('[STRIPE-WEBHOOK] Error manejando pago fallido:', error);
    }
}

async function handleChargeRefunded(charge: any) {
    devLogger.warn(`[STRIPE-WEBHOOK] Reembolso: ${charge.id}`);
}

// =====================================================
// ROUTES
// =====================================================

/**
 * POST /api/stripe-webhooks
 * Recibe eventos de Stripe
 * NOTA: Usa express.raw para validar la firma
 */
router.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    devLogger.info('[STRIPE-WEBHOOK] Evento recibido');

    try {
        let event: any;

        if (webhookSecret && sig && stripePaymentsService?.stripe) {
            try {
                event = stripePaymentsService.stripe.webhooks.constructEvent(
                    req.body,
                    sig,
                    webhookSecret
                );
            } catch (err: any) {
                devLogger.error('[STRIPE-WEBHOOK] Error verificando firma:', err.message);
                res.status(400).send(`Webhook Error: ${err.message}`);
                return;
            }
        } else {
            event = typeof req.body === 'string'
                ? JSON.parse(req.body)
                : req.body;

            devLogger.warn('[STRIPE-WEBHOOK] ⚠️ Webhook sin verificación de firma (desarrollo)');
        }

        devLogger.info(`[STRIPE-WEBHOOK] Tipo: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            case 'charge.refunded':
                await handleChargeRefunded(event.data.object);
                break;
            default:
                devLogger.info(`[STRIPE-WEBHOOK] Evento no manejado: ${event.type}`);
        }

        res.json({ received: true });

    } catch (error) {
        devLogger.error('[STRIPE-WEBHOOK] Error procesando webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * GET /api/stripe-webhooks/verify/:sessionId
 */
router.get('/verify/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;

        if (!stripePaymentsService) {
            if (sessionId.includes('mock')) {
                res.json({
                    success: true,
                    status: 'completed',
                    message: 'Pago simulado completado'
                });
                return;
            }
            res.status(503).json({ error: 'Servicio no disponible' });
            return;
        }

        const intent = await stripePaymentsService.verifySession(sessionId);

        if (!intent) {
            res.status(404).json({ error: 'Sesión no encontrada' });
            return;
        }

        res.json({
            success: intent.status === 'completed',
            status: intent.status,
            iacoins: intent.iacoins_amount,
            package_id: intent.package_id
        });

    } catch (error) {
        devLogger.error('[STRIPE] Error verificando sesión:', error);
        res.status(500).json({ error: 'Error verificando pago' });
    }
});

/**
 * POST /api/stripe-webhooks/process-mock/:sessionId
 */
router.post('/process-mock/:sessionId', async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ error: 'No disponible en producción' });
        return;
    }

    try {
        const { sessionId } = req.params;

        if (!sessionId.includes('mock')) {
            res.status(400).json({ error: 'Solo para sesiones mock' });
            return;
        }

        if (stripePaymentsService) {
            const result = await stripePaymentsService.processCompletedPayment(sessionId);
            res.json({
                success: true,
                message: 'Pago mock procesado',
                iacoins: result.iacoins
            });
        } else {
            res.status(503).json({ error: 'Servicio no disponible' });
        }

    } catch (error: any) {
        devLogger.error('[STRIPE] Error procesando mock:', error);
        res.status(500).json({ error: error.message });
    }
});

// @ts-ignore
export = router;

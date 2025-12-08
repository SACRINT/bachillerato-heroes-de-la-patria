/**
 * 💳 STRIPE WEBHOOKS ROUTES
 * Endpoints para recibir eventos de Stripe
 * FASE 5.2 - Monetización IACoins
 * Creado: 07 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Importar servicio de Stripe (cuando esté compilado)
let stripePaymentsService;
try {
    stripePaymentsService = require('../services/stripePaymentsService.bridge');
} catch (error) {
    console.log('[STRIPE-WEBHOOKS] Servicio en modo simulado');
    stripePaymentsService = null;
}

const devLogger = require('../utils/devLogger');

// =====================================================
// MIDDLEWARE ESPECIAL PARA WEBHOOKS
// =====================================================

/**
 * IMPORTANTE: Este router necesita raw body para verificar la firma de Stripe
 * Se debe montar ANTES del middleware express.json() en server.js
 * O usar express.raw() específicamente para esta ruta
 */

// =====================================================
// WEBHOOK ENDPOINT
// =====================================================

/**
 * POST /api/stripe-webhooks
 * Recibe eventos de Stripe (checkout completed, payment failed, etc.)
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    devLogger.info('[STRIPE-WEBHOOK] Evento recibido');

    try {
        let event;

        // Si tenemos webhook secret, verificar firma
        if (webhookSecret && sig && stripePaymentsService?.stripe) {
            try {
                event = stripePaymentsService.stripe.webhooks.constructEvent(
                    req.body,
                    sig,
                    webhookSecret
                );
            } catch (err) {
                devLogger.error('[STRIPE-WEBHOOK] Error verificando firma:', err.message);
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
        } else {
            // Modo desarrollo/simulado - parsear JSON directamente
            event = typeof req.body === 'string'
                ? JSON.parse(req.body)
                : req.body;

            devLogger.warn('[STRIPE-WEBHOOK] ⚠️ Webhook sin verificación de firma (desarrollo)');
        }

        devLogger.info(`[STRIPE-WEBHOOK] Tipo: ${event.type}`);

        // Procesar evento según tipo
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

// =====================================================
// HANDLERS DE EVENTOS
// =====================================================

/**
 * Manejar checkout completado
 */
async function handleCheckoutCompleted(session) {
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
        // No lanzar error para que Stripe no reintente
    }
}

/**
 * Manejar pago exitoso
 */
async function handlePaymentSucceeded(paymentIntent) {
    devLogger.info(`[STRIPE-WEBHOOK] Pago exitoso: ${paymentIntent.id}`);
    // La mayoría de la lógica se maneja en checkout.session.completed
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(paymentIntent) {
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

/**
 * Manejar reembolso
 */
async function handleChargeRefunded(charge) {
    devLogger.warn(`[STRIPE-WEBHOOK] Reembolso: ${charge.id}`);
    // TODO: Implementar lógica de reembolso (restar IACoins)
}

// =====================================================
// ENDPOINT DE VERIFICACIÓN DE PAGO (Para frontend)
// =====================================================

/**
 * GET /api/stripe-webhooks/verify/:sessionId
 * Verificar estado de un pago
 */
router.get('/verify/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!stripePaymentsService) {
            // Modo simulado
            if (sessionId.includes('mock')) {
                return res.json({
                    success: true,
                    status: 'completed',
                    message: 'Pago simulado completado'
                });
            }
            return res.status(503).json({ error: 'Servicio no disponible' });
        }

        const intent = await stripePaymentsService.verifySession(sessionId);

        if (!intent) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
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
 * Procesar pago mock manualmente (solo desarrollo)
 */
router.post('/process-mock/:sessionId', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'No disponible en producción' });
    }

    try {
        const { sessionId } = req.params;

        if (!sessionId.includes('mock')) {
            return res.status(400).json({ error: 'Solo para sesiones mock' });
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

    } catch (error) {
        devLogger.error('[STRIPE] Error procesando mock:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

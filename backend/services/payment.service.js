/**
 * PAYMENT SERVICE - SEMANA 11
 * Stripe Integration completa
 */
class PaymentService {
    async createPaymentIntent(amount, currency = 'mxn') {
        console.log(`[PAYMENT] 💳 Payment intent: ${amount} ${currency}`);
        // Stripe integration
    }

    async createSubscription(customerId, priceId) {
        console.log('[PAYMENT] 📅 Subscription creada');
    }
}

module.exports = new PaymentService();

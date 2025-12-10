declare const _exports: PaymentService;
export = _exports;
/**
 * PAYMENT SERVICE - SEMANA 11
 * Stripe Integration completa
 */
declare class PaymentService {
    createPaymentIntent(amount: any, currency?: string): Promise<void>;
    createSubscription(customerId: any, priceId: any): Promise<void>;
}
//# sourceMappingURL=payment.service.d.ts.map
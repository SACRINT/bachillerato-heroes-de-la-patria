/**
 * 💳 STRIPE PAYMENTS SERVICE - TypeScript
 * Servicio de integración con Stripe para compra de IACoins
 * FASE 5.2 - Monetización
 * Creado: 07 Diciembre 2025
 */
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
declare class StripePaymentsService {
    private stripe;
    private isConfigured;
    constructor();
    /**
     * Obtener paquetes de IACoins disponibles
     */
    getAvailablePackages(): Promise<IACoinsPackage[]>;
    /**
     * Obtener un paquete por ID
     */
    getPackageById(packageId: string): Promise<IACoinsPackage | null>;
    /**
     * Crear sesión de checkout de Stripe
     */
    createCheckoutSession(userId: number, packageId: string, successUrl: string, cancelUrl: string): Promise<CheckoutSession>;
    /**
     * Registrar intento de pago en BD
     */
    private createPaymentIntent;
    /**
     * Procesar pago completado (webhook o verificación)
     */
    processCompletedPayment(sessionId: string): Promise<{
        success: boolean;
        iacoins: number;
    }>;
    /**
     * Verificar sesión de Stripe
     */
    verifySession(sessionId: string): Promise<PaymentIntent | null>;
    /**
     * Manejar webhook de Stripe
     */
    handleWebhook(event: any): Promise<void>;
    /**
     * Obtener historial de compras de un usuario
     */
    getUserPurchaseHistory(userId: number, limit?: number): Promise<PaymentIntent[]>;
    /**
     * Verificar si Stripe está configurado
     */
    isStripeConfigured(): boolean;
}
declare const stripePaymentsService: StripePaymentsService;
export default stripePaymentsService;
export { StripePaymentsService };
//# sourceMappingURL=stripe-payments.service.d.ts.map
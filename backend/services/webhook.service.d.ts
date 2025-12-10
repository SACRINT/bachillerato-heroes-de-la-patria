/**
 * 🔗 WEBHOOK SERVICE - TypeScript Version
 * Sistema de webhooks salientes
 * Refactorizado: 07 Diciembre 2025
 */
export interface WebhookRecord {
    id: number;
    url: string;
    events: string[];
    secret: string;
    active: boolean;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export interface WebhookOptions {
    metadata?: Record<string, any>;
}
export interface DeliveryResult {
    webhookId: number;
    success: boolean;
    status?: number;
    error?: string;
    attempt: number;
}
export interface TriggerResult {
    event: string;
    deliveries: number;
    results: DeliveryResult[];
}
declare class WebhookService {
    events: string[];
    private maxRetries;
    constructor();
    register(url: string, events: string[], options?: WebhookOptions): Promise<{
        success: boolean;
        webhook: WebhookRecord;
    }>;
    trigger(event: string, payload: Record<string, any>): Promise<TriggerResult>;
    deliver(webhook: WebhookRecord, event: string, payload: Record<string, any>, attempt?: number): Promise<DeliveryResult>;
    sign(payload: Record<string, any>, secret: string): string;
    list(): Promise<{
        success: boolean;
        webhooks: WebhookRecord[];
    }>;
    delete(id: number): Promise<{
        success: boolean;
    }>;
    toggle(id: number, active: boolean): Promise<{
        success: boolean;
    }>;
    getAvailableEvents(): string[];
}
declare const webhookService: WebhookService;
export { WebhookService };
export default webhookService;
//# sourceMappingURL=webhook.service.d.ts.map
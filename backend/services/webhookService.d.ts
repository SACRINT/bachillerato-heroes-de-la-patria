declare const _exports: WebhookService;
export = _exports;
declare class WebhookService {
    events: string[];
    maxRetries: number;
    register(url: any, events: any, options?: {}): Promise<{
        success: boolean;
        webhook: any;
    }>;
    trigger(event: any, payload: any): Promise<{
        event: any;
        deliveries: number;
        results: any[];
    }>;
    deliver(webhook: any, event: any, payload: any, attempt?: number): any;
    sign(payload: any, secret: any): string;
    list(): Promise<{
        success: boolean;
        webhooks: any;
    }>;
    delete(id: any): Promise<{
        success: boolean;
    }>;
    toggle(id: any, active: any): Promise<{
        success: boolean;
    }>;
    getAvailableEvents(): string[];
}
//# sourceMappingURL=webhookService.d.ts.map
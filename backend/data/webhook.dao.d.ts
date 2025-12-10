/**
 * 🔗 WEBHOOK DAO - TypeScript
 * Data Access Object para webhooks
 * ✅ FASE 3 DAL - Extendido con métodos tenant-aware
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface Webhook {
    id: number;
    url: string;
    events: string[];
    secret: string;
    active?: boolean;
    status?: string;
    metadata?: any;
    description?: string;
    secret_preview?: string;
    tenant_id?: number;
    created_at: Date;
    updated_at?: Date;
}
export interface WebhookDelivery {
    id: number;
    webhook_id: number;
    event_type: string;
    event?: string;
    payload?: any;
    success?: boolean;
    status?: string;
    status_code?: number;
    response_code?: number;
    error?: string;
    response_body?: string;
    retry_count?: number;
    delivered_at?: Date;
    created_at: Date;
}
export interface WebhookUpdates {
    url?: string;
    events?: string[];
    description?: string;
    status?: string;
}
declare class WebhookDAO {
    static register(url: string, events: string[], secret: string, metadata: any): Promise<Webhook>;
    static findByEvent(event: string): Promise<Webhook[]>;
    static logDelivery(webhookId: number, event: string, success: boolean, statusCode: number, error: string): Promise<void>;
    static list(): Promise<Webhook[]>;
    static delete(id: number): Promise<void>;
    static toggle(id: number, active: boolean): Promise<void>;
    /**
     * Listar webhooks por tenant
     */
    static listByTenant(tenantId: number): Promise<Webhook[]>;
    /**
     * Crear webhook con tenant
     */
    static createForTenant(tenantId: number, url: string, events: string[], description: string, secret: string, secretPreview: string): Promise<Webhook>;
    /**
     * Obtener webhook por ID y tenant
     */
    static getByIdAndTenant(id: number, tenantId: number): Promise<Webhook | null>;
    /**
     * Eliminar webhook por ID y tenant
     */
    static deleteByIdAndTenant(id: number, tenantId: number): Promise<{
        id: number;
    } | null>;
    /**
     * Verificar que webhook pertenece a tenant
     */
    static belongsToTenant(id: number, tenantId: number): Promise<boolean>;
    /**
     * Obtener deliveries de un webhook
     */
    static getDeliveries(webhookId: number, limit?: number, offset?: number): Promise<WebhookDelivery[]>;
    /**
     * Obtener webhook con secret (para envío)
     */
    static getWithSecret(id: number, tenantId: number): Promise<Webhook | null>;
    /**
     * Guardar log de delivery con payload completo
     */
    static logDeliveryFull(webhookId: number, eventType: string, payload: any, status: string, responseCode: number, responseBody: string | null, retryCount: number): Promise<void>;
    /**
     * Guardar log de error de delivery
     */
    static logDeliveryError(webhookId: number, eventType: string, payload: any, errorMessage: string, retryCount: number): Promise<void>;
    /**
     * Obtener webhooks activos para un evento y tenant
     */
    static getActiveForEvent(tenantId: number, eventType: string): Promise<Webhook[]>;
    /**
     * Actualizar webhook (dinámico)
     */
    static updateByIdAndTenant(id: number, tenantId: number, updates: WebhookUpdates): Promise<Webhook | null>;
}
export default WebhookDAO;
//# sourceMappingURL=webhook.dao.d.ts.map
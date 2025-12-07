/**
 * 🔗 WEBHOOK SERVICE - TypeScript Version
 * Sistema de webhooks salientes
 * Refactorizado: 07 Diciembre 2025
 */

import crypto from 'crypto';
const WebhookDAO = require('../data/webhook.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// WEBHOOK SERVICE CLASS
// ============================================

class WebhookService {
    public events: string[];
    private maxRetries: number;

    constructor() {
        this.events = [
            'student.created',
            'student.updated',
            'student.deleted',
            'grade.created',
            'grade.updated',
            'notification.sent',
            'user.login',
            'user.logout'
        ];
        this.maxRetries = 3;
    }

    async register(url: string, events: string[], options: WebhookOptions = {}): Promise<{ success: boolean; webhook: WebhookRecord }> {
        const secret = crypto.randomBytes(32).toString('hex');
        const webhook = await WebhookDAO.register(url, events, secret, options.metadata || {});
        return { success: true, webhook };
    }

    async trigger(event: string, payload: Record<string, any>): Promise<TriggerResult> {
        const webhooks = await WebhookDAO.findByEvent(event);
        const deliveries: DeliveryResult[] = [];

        for (const webhook of webhooks) {
            deliveries.push(await this.deliver(webhook, event, payload));
        }

        return { event, deliveries: deliveries.length, results: deliveries };
    }

    async deliver(webhook: WebhookRecord, event: string, payload: Record<string, any>, attempt: number = 1): Promise<DeliveryResult> {
        const signature = this.sign(payload, webhook.secret);
        const body = JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            payload
        });

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': event
                },
                body
            });

            const success = response.ok;
            await WebhookDAO.logDelivery(webhook.id, event, success, response.status, null);

            if (!success && attempt < this.maxRetries) {
                await new Promise(r => setTimeout(r, attempt * 1000));
                return this.deliver(webhook, event, payload, attempt + 1);
            }

            return { webhookId: webhook.id, success, status: response.status, attempt };

        } catch (error: any) {
            devLogger.error(`[Webhook] Error entregando a ${webhook.url}:`, error.message);
            await WebhookDAO.logDelivery(webhook.id, event, false, 0, error.message);

            if (attempt < this.maxRetries) {
                await new Promise(r => setTimeout(r, attempt * 1000));
                return this.deliver(webhook, event, payload, attempt + 1);
            }

            return { webhookId: webhook.id, success: false, error: error.message, attempt };
        }
    }

    sign(payload: Record<string, any>, secret: string): string {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return hmac.digest('hex');
    }

    async list(): Promise<{ success: boolean; webhooks: WebhookRecord[] }> {
        return { success: true, webhooks: await WebhookDAO.list() };
    }

    async delete(id: number): Promise<{ success: boolean }> {
        await WebhookDAO.delete(id);
        return { success: true };
    }

    async toggle(id: number, active: boolean): Promise<{ success: boolean }> {
        await WebhookDAO.toggle(id, active);
        return { success: true };
    }

    getAvailableEvents(): string[] {
        return this.events;
    }
}

// ============================================
// EXPORTS
// ============================================

const webhookService = new WebhookService();

export { WebhookService };
export default webhookService;

module.exports = webhookService;
module.exports.WebhookService = WebhookService;

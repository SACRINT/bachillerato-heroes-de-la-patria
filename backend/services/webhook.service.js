"use strict";
/**
 * 🔗 WEBHOOK SERVICE - TypeScript Version
 * Sistema de webhooks salientes
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const WebhookDAO = require('../data/webhook.dao.js');
const devLogger = require('../utils/devLogger.js');
// ============================================
// WEBHOOK SERVICE CLASS
// ============================================
class WebhookService {
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
    async register(url, events, options = {}) {
        const secret = crypto_1.default.randomBytes(32).toString('hex');
        const webhook = await WebhookDAO.register(url, events, secret, options.metadata || {});
        return { success: true, webhook };
    }
    async trigger(event, payload) {
        const webhooks = await WebhookDAO.findByEvent(event);
        const deliveries = [];
        for (const webhook of webhooks) {
            deliveries.push(await this.deliver(webhook, event, payload));
        }
        return { event, deliveries: deliveries.length, results: deliveries };
    }
    async deliver(webhook, event, payload, attempt = 1) {
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
        }
        catch (error) {
            devLogger.error(`[Webhook] Error entregando a ${webhook.url}:`, error.message);
            await WebhookDAO.logDelivery(webhook.id, event, false, 0, error.message);
            if (attempt < this.maxRetries) {
                await new Promise(r => setTimeout(r, attempt * 1000));
                return this.deliver(webhook, event, payload, attempt + 1);
            }
            return { webhookId: webhook.id, success: false, error: error.message, attempt };
        }
    }
    sign(payload, secret) {
        const hmac = crypto_1.default.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return hmac.digest('hex');
    }
    async list() {
        return { success: true, webhooks: await WebhookDAO.list() };
    }
    async delete(id) {
        await WebhookDAO.delete(id);
        return { success: true };
    }
    async toggle(id, active) {
        await WebhookDAO.toggle(id, active);
        return { success: true };
    }
    getAvailableEvents() {
        return this.events;
    }
}
exports.WebhookService = WebhookService;
// ============================================
// EXPORTS
// ============================================
const webhookService = new WebhookService();
exports.default = webhookService;
module.exports = webhookService;
module.exports.WebhookService = WebhookService;
//# sourceMappingURL=webhook.service.js.map
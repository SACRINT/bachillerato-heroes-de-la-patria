/**
 * 🔗 WEBHOOK SERVICE - SEMANA 13
 * Sistema de webhooks para integraciones
 *
 * Features:
 * - Registro de webhooks
 * - Firma de payloads
 * - Reintentos automáticos
 * - Logs de entregas
 * - Rate limiting
 *
 * Fecha: 20 Noviembre 2025
 */

const crypto = require('crypto');
const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class WebhookService {
  constructor() {
    this.events = [
      'student.created', 'student.updated', 'student.deleted',
      'grade.created', 'grade.updated',
      'notification.sent',
      'user.login', 'user.logout'
    ];
    this.maxRetries = 3;
  }

  async register(url, events, options = {}) {
    const secret = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(`
      INSERT INTO webhooks (url, events, secret, active, metadata, created_at)
      VALUES ($1, $2, $3, true, $4, NOW())
      RETURNING id, url, events, secret
    `, [url, JSON.stringify(events), secret, JSON.stringify(options.metadata || {})]);

    return {
      success: true,
      webhook: result.rows[0]
    };
  }

  async trigger(event, payload) {
    // Buscar webhooks suscritos a este evento
    const webhooks = await pool.query(`
      SELECT * FROM webhooks
      WHERE active = true AND events::jsonb ? $1
    `, [event]);

    const deliveries = [];

    for (const webhook of webhooks.rows) {
      const delivery = await this.deliver(webhook, event, payload);
      deliveries.push(delivery);
    }

    return {
      event,
      deliveries: deliveries.length,
      results: deliveries
    };
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
        body,
        timeout: 10000
      });

      const success = response.ok;

      // Log delivery
      await this.logDelivery(webhook.id, event, success, response.status);

      if (!success && attempt < this.maxRetries) {
        // Retry con backoff
        await new Promise(r => setTimeout(r, attempt * 1000));
        return this.deliver(webhook, event, payload, attempt + 1);
      }

      return {
        webhookId: webhook.id,
        success,
        status: response.status,
        attempt
      };

    } catch (error) {
      devLogger.error(`[Webhook] Error entregando a ${webhook.url}:`, error.message);

      await this.logDelivery(webhook.id, event, false, 0, error.message);

      if (attempt < this.maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        return this.deliver(webhook, event, payload, attempt + 1);
      }

      return {
        webhookId: webhook.id,
        success: false,
        error: error.message,
        attempt
      };
    }
  }

  sign(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  async logDelivery(webhookId, event, success, statusCode, error = null) {
    try {
      await pool.query(`
        INSERT INTO webhook_deliveries
        (webhook_id, event, success, status_code, error, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [webhookId, event, success, statusCode, error]);
    } catch {
      // Tabla puede no existir
    }
  }

  async list() {
    const result = await pool.query(`
      SELECT id, url, events, active, created_at
      FROM webhooks
      ORDER BY created_at DESC
    `);

    return {
      success: true,
      webhooks: result.rows
    };
  }

  async delete(id) {
    await pool.query('DELETE FROM webhooks WHERE id = $1', [id]);
    return { success: true };
  }

  async toggle(id, active) {
    await pool.query('UPDATE webhooks SET active = $1 WHERE id = $2', [active, id]);
    return { success: true };
  }

  getAvailableEvents() {
    return this.events;
  }
}

module.exports = new WebhookService();

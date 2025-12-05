/**
 * 🔗 WEBHOOK DAO
 * Data Access Object para webhooks
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class WebhookDAO {

    static async register(url, events, secret, metadata) {
        const result = await pool.query('INSERT INTO webhooks (url, events, secret, active, metadata, created_at) VALUES ($1, $2, $3, true, $4, NOW()) RETURNING id, url, events, secret', [url, JSON.stringify(events), secret, JSON.stringify(metadata)]);
        return result.rows[0];
    }

    static async findByEvent(event) {
        const result = await pool.query('SELECT * FROM webhooks WHERE active = true AND events::jsonb ? $1', [event]);
        return result.rows;
    }

    static async logDelivery(webhookId, event, success, statusCode, error) {
        try { await pool.query('INSERT INTO webhook_deliveries (webhook_id, event, success, status_code, error, created_at) VALUES ($1, $2, $3, $4, $5, NOW())', [webhookId, event, success, statusCode, error]); } catch { }
    }

    static async list() {
        const result = await pool.query('SELECT id, url, events, active, created_at FROM webhooks ORDER BY created_at DESC');
        return result.rows;
    }

    static async delete(id) { await pool.query('DELETE FROM webhooks WHERE id = $1', [id]); }
    static async toggle(id, active) { await pool.query('UPDATE webhooks SET active = $1 WHERE id = $2', [active, id]); }
}

module.exports = WebhookDAO;

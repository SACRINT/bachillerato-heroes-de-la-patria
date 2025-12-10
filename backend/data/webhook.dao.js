"use strict";
/**
 * 🔗 WEBHOOK DAO - TypeScript
 * Data Access Object para webhooks
 * ✅ FASE 3 DAL - Extendido con métodos tenant-aware
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// WEBHOOK DAO CLASS
// =====================================================
class WebhookDAO {
    // =========================================================================
    // MÉTODOS ORIGINALES (sin tenant)
    // =========================================================================
    static async register(url, events, secret, metadata) {
        const result = await database_1.pool.query('INSERT INTO webhooks (url, events, secret, active, metadata, created_at) VALUES ($1, $2, $3, true, $4, NOW()) RETURNING id, url, events, secret', [url, JSON.stringify(events), secret, JSON.stringify(metadata)]);
        return result.rows[0];
    }
    static async findByEvent(event) {
        const result = await database_1.pool.query('SELECT * FROM webhooks WHERE active = true AND events::jsonb ? $1', [event]);
        return result.rows;
    }
    static async logDelivery(webhookId, event, success, statusCode, error) {
        try {
            await database_1.pool.query('INSERT INTO webhook_deliveries (webhook_id, event, success, status_code, error, created_at) VALUES ($1, $2, $3, $4, $5, NOW())', [webhookId, event, success, statusCode, error]);
        }
        catch { }
    }
    static async list() {
        const result = await database_1.pool.query('SELECT id, url, events, active, created_at FROM webhooks ORDER BY created_at DESC');
        return result.rows;
    }
    static async delete(id) {
        await database_1.pool.query('DELETE FROM webhooks WHERE id = $1', [id]);
    }
    static async toggle(id, active) {
        await database_1.pool.query('UPDATE webhooks SET active = $1 WHERE id = $2', [active, id]);
    }
    // =========================================================================
    // MÉTODOS TENANT-AWARE (nuevos)
    // =========================================================================
    /**
     * Listar webhooks por tenant
     */
    static async listByTenant(tenantId) {
        const result = await database_1.pool.query(`SELECT id, url, events, status, secret_preview, created_at, updated_at
             FROM webhooks
             WHERE tenant_id = $1
             ORDER BY created_at DESC`, [tenantId]);
        return result.rows;
    }
    /**
     * Crear webhook con tenant
     */
    static async createForTenant(tenantId, url, events, description, secret, secretPreview) {
        const result = await database_1.pool.query(`INSERT INTO webhooks (tenant_id, url, events, description, secret, secret_preview, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'active')
             RETURNING id, url, events, description, secret_preview, status, created_at`, [tenantId, url, JSON.stringify(events), description, secret, secretPreview]);
        return result.rows[0];
    }
    /**
     * Obtener webhook por ID y tenant
     */
    static async getByIdAndTenant(id, tenantId) {
        const result = await database_1.pool.query(`SELECT id, url, events, description, status, secret_preview, created_at, updated_at
             FROM webhooks
             WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
        return result.rows[0] || null;
    }
    /**
     * Eliminar webhook por ID y tenant
     */
    static async deleteByIdAndTenant(id, tenantId) {
        const result = await database_1.pool.query(`DELETE FROM webhooks
             WHERE id = $1 AND tenant_id = $2
             RETURNING id`, [id, tenantId]);
        return result.rows[0] || null;
    }
    /**
     * Verificar que webhook pertenece a tenant
     */
    static async belongsToTenant(id, tenantId) {
        const result = await database_1.pool.query(`SELECT id FROM webhooks WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
        return result.rows.length > 0;
    }
    /**
     * Obtener deliveries de un webhook
     */
    static async getDeliveries(webhookId, limit = 50, offset = 0) {
        const result = await database_1.pool.query(`SELECT id, event_type, status, response_code, response_body,
                    retry_count, delivered_at, created_at
             FROM webhook_deliveries
             WHERE webhook_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`, [webhookId, limit, offset]);
        return result.rows;
    }
    /**
     * Obtener webhook con secret (para envío)
     */
    static async getWithSecret(id, tenantId) {
        const result = await database_1.pool.query(`SELECT id, url, secret, status FROM webhooks
             WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
        return result.rows[0] || null;
    }
    /**
     * Guardar log de delivery con payload completo
     */
    static async logDeliveryFull(webhookId, eventType, payload, status, responseCode, responseBody, retryCount) {
        await database_1.pool.query(`INSERT INTO webhook_deliveries
             (webhook_id, event_type, payload, status, response_code, response_body, retry_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            webhookId,
            eventType,
            JSON.stringify(payload),
            status,
            responseCode,
            responseBody ? responseBody.substring(0, 1000) : null,
            retryCount
        ]);
    }
    /**
     * Guardar log de error de delivery
     */
    static async logDeliveryError(webhookId, eventType, payload, errorMessage, retryCount) {
        await database_1.pool.query(`INSERT INTO webhook_deliveries
             (webhook_id, event_type, payload, status, response_body, retry_count)
             VALUES ($1, $2, $3, 'error', $4, $5)`, [
            webhookId,
            eventType,
            JSON.stringify(payload),
            errorMessage,
            retryCount
        ]);
    }
    /**
     * Obtener webhooks activos para un evento y tenant
     */
    static async getActiveForEvent(tenantId, eventType) {
        const result = await database_1.pool.query(`SELECT id, url, secret, events
             FROM webhooks
             WHERE tenant_id = $1
               AND status = 'active'
               AND events @> $2::jsonb`, [tenantId, JSON.stringify([eventType])]);
        return result.rows;
    }
    /**
     * Actualizar webhook (dinámico)
     */
    static async updateByIdAndTenant(id, tenantId, updates) {
        const setClauses = [];
        const values = [];
        let paramCounter = 1;
        if (updates.url !== undefined) {
            setClauses.push(`url = $${paramCounter++}`);
            values.push(updates.url);
        }
        if (updates.events !== undefined) {
            setClauses.push(`events = $${paramCounter++}`);
            values.push(JSON.stringify(updates.events));
        }
        if (updates.description !== undefined) {
            setClauses.push(`description = $${paramCounter++}`);
            values.push(updates.description);
        }
        if (updates.status !== undefined) {
            setClauses.push(`status = $${paramCounter++}`);
            values.push(updates.status);
        }
        if (setClauses.length === 0) {
            return null;
        }
        setClauses.push(`updated_at = NOW()`);
        values.push(id, tenantId);
        const result = await database_1.pool.query(`UPDATE webhooks
             SET ${setClauses.join(', ')}
             WHERE id = $${paramCounter++} AND tenant_id = $${paramCounter++}
             RETURNING id, url, events, description, status, updated_at`, values);
        return result.rows[0] || null;
    }
}
exports.default = WebhookDAO;
module.exports = WebhookDAO;
//# sourceMappingURL=webhook.dao.js.map
"use strict";
/**
 * 📅 DAO: Gestión de Línea del Tiempo (tenant_timeline)
 */
const debugLog = require('../utils/debug-logger.js');

class TenantTimelineDAO {
    constructor(pool) { this.pool = pool; }

    async getByTenant(tenantId) {
        const result = await this.pool.query(
            'SELECT * FROM tenant_timeline WHERE tenant_id = $1 AND is_active = true ORDER BY sort_order, year',
            [tenantId]
        );
        return result.rows;
    }

    async getById(id, tenantId) {
        const result = await this.pool.query('SELECT * FROM tenant_timeline WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return result.rows[0] || null;
    }

    async create(data, tenantId) {
        const { year, title, description, image_url, event_type, sort_order } = data;
        const result = await this.pool.query(
            `INSERT INTO tenant_timeline (tenant_id, year, title, description, image_url, event_type, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [tenantId, year, title, description || null, image_url || null, event_type || 'hitos', sort_order || 0]
        );
        return result.rows[0];
    }

    async update(id, data, tenantId) {
        const { year, title, description, image_url, event_type, sort_order, is_active } = data;
        const result = await this.pool.query(
            `UPDATE tenant_timeline SET year = COALESCE($1, year), title = COALESCE($2, title),
             description = COALESCE($3, description), image_url = COALESCE($4, image_url),
             event_type = COALESCE($5, event_type), sort_order = COALESCE($6, sort_order),
             is_active = COALESCE($7, is_active), updated_at = NOW()
             WHERE id = $8 AND tenant_id = $9 RETURNING *`,
            [year, title, description, image_url, event_type, sort_order, is_active, id, tenantId]
        );
        return result.rows[0] || null;
    }

    async delete(id, tenantId) {
        await this.pool.query('DELETE FROM tenant_timeline WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return true;
    }

    async getStats(tenantId) {
        const result = await this.pool.query(
            'SELECT COUNT(*) as total FROM tenant_timeline WHERE tenant_id = $1', [tenantId]
        );
        return { total: parseInt(result.rows[0].total) || 0 };
    }
}

module.exports = TenantTimelineDAO;

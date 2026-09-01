"use strict";
/**
 * 🏫 DAO: Gestión de Instalaciones (tenant_installations)
 */
class TenantInstallationsDAO {
    constructor(pool) { this.pool = pool; }

    async getByTenant(tenantId) {
        const result = await this.pool.query(
            'SELECT * FROM tenant_installations WHERE tenant_id = $1 AND is_active = true ORDER BY sort_order, name',
            [tenantId]
        );
        return result.rows;
    }

    async getById(id, tenantId) {
        const result = await this.pool.query('SELECT * FROM tenant_installations WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return result.rows[0] || null;
    }

    async create(data, tenantId) {
        const { name, description, image_url, capacity, features, sort_order } = data;
        const result = await this.pool.query(
            `INSERT INTO tenant_installations (tenant_id, name, description, image_url, capacity, features, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [tenantId, name, description || null, image_url || null, capacity || null, features || null, sort_order || 0]
        );
        return result.rows[0];
    }

    async update(id, data, tenantId) {
        const { name, description, image_url, capacity, features, sort_order, is_active } = data;
        const result = await this.pool.query(
            `UPDATE tenant_installations SET name = COALESCE($1, name), description = COALESCE($2, description),
             image_url = COALESCE($3, image_url), capacity = COALESCE($4, capacity),
             features = COALESCE($5, features), sort_order = COALESCE($6, sort_order),
             is_active = COALESCE($7, is_active), updated_at = NOW()
             WHERE id = $8 AND tenant_id = $9 RETURNING *`,
            [name, description, image_url, capacity, features, sort_order, is_active, id, tenantId]
        );
        return result.rows[0] || null;
    }

    async delete(id, tenantId) {
        await this.pool.query('DELETE FROM tenant_installations WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return true;
    }

    async getStats(tenantId) {
        const result = await this.pool.query('SELECT COUNT(*) as total FROM tenant_installations WHERE tenant_id = $1', [tenantId]);
        return { total: parseInt(result.rows[0].total) || 0 };
    }
}

module.exports = TenantInstallationsDAO;

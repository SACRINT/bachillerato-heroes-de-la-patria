"use strict";
/**
 * 🎬 DAO: Gestión de Imágenes del Hero (tenant_hero_images)
 */
class TenantHeroImagesDAO {
    constructor(pool) { this.pool = pool; }

    async getByTenant(tenantId) {
        const result = await this.pool.query(
            'SELECT * FROM tenant_hero_images WHERE tenant_id = $1 AND is_active = true ORDER BY sort_order',
            [tenantId]
        );
        return result.rows;
    }

    async getById(id, tenantId) {
        const result = await this.pool.query('SELECT * FROM tenant_hero_images WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return result.rows[0] || null;
    }

    async create(data, tenantId) {
        const { image_url, title, subtitle, link_url, sort_order } = data;
        const result = await this.pool.query(
            `INSERT INTO tenant_hero_images (tenant_id, image_url, title, subtitle, link_url, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [tenantId, image_url, title || null, subtitle || null, link_url || null, sort_order || 0]
        );
        return result.rows[0];
    }

    async update(id, data, tenantId) {
        const { image_url, title, subtitle, link_url, sort_order, is_active } = data;
        const result = await this.pool.query(
            `UPDATE tenant_hero_images SET image_url = COALESCE($1, image_url), title = COALESCE($2, title),
             subtitle = COALESCE($3, subtitle), link_url = COALESCE($4, link_url),
             sort_order = COALESCE($5, sort_order), is_active = COALESCE($6, is_active),
             updated_at = NOW()
             WHERE id = $7 AND tenant_id = $8 RETURNING *`,
            [image_url, title, subtitle, link_url, sort_order, is_active, id, tenantId]
        );
        return result.rows[0] || null;
    }

    async delete(id, tenantId) {
        await this.pool.query('DELETE FROM tenant_hero_images WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return true;
    }

    async getStats(tenantId) {
        const result = await this.pool.query('SELECT COUNT(*) as total FROM tenant_hero_images WHERE tenant_id = $1', [tenantId]);
        return { total: parseInt(result.rows[0].total) || 0 };
    }
}

module.exports = TenantHeroImagesDAO;

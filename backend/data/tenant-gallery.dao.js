"use strict";
/**
 * 🖼️ DAO: Gestión de Galería de Imágenes (tenant_gallery)
 */
const debugLog = require('../utils/debug-logger.js');

class TenantGalleryDAO {
    constructor(pool) { this.pool = pool; }

    async getByTenant(tenantId, category = null) {
        let query = 'SELECT * FROM tenant_gallery WHERE tenant_id = $1 AND is_active = true';
        const params = [tenantId];
        if (category) { query += ' AND category = $2'; params.push(category); }
        query += ' ORDER BY sort_order, created_at DESC';
        const result = await this.pool.query(query, params);
        return result.rows;
    }

    async getById(id, tenantId) {
        const result = await this.pool.query('SELECT * FROM tenant_gallery WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return result.rows[0] || null;
    }

    async create(data, tenantId) {
        const { title, description, image_url, thumbnail_url, category, album, sort_order } = data;
        const result = await this.pool.query(
            `INSERT INTO tenant_gallery (tenant_id, title, description, image_url, thumbnail_url, category, album, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [tenantId, title || null, description || null, image_url, thumbnail_url || null, category || null, album || null, sort_order || 0]
        );
        return result.rows[0];
    }

    async update(id, data, tenantId) {
        const { title, description, image_url, thumbnail_url, category, album, sort_order, is_active } = data;
        const result = await this.pool.query(
            `UPDATE tenant_gallery SET title = COALESCE($1, title), description = COALESCE($2, description),
             image_url = COALESCE($3, image_url), thumbnail_url = COALESCE($4, thumbnail_url),
             category = COALESCE($5, category), album = COALESCE($6, album),
             sort_order = COALESCE($7, sort_order), is_active = COALESCE($8, is_active),
             updated_at = NOW()
             WHERE id = $9 AND tenant_id = $10 RETURNING *`,
            [title, description, image_url, thumbnail_url, category, album, sort_order, is_active, id, tenantId]
        );
        return result.rows[0] || null;
    }

    async delete(id, tenantId) {
        await this.pool.query('DELETE FROM tenant_gallery WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return true;
    }

    async getCategories(tenantId) {
        const result = await this.pool.query(
            'SELECT DISTINCT category, COUNT(*) as count FROM tenant_gallery WHERE tenant_id = $1 AND is_active = true AND category IS NOT NULL GROUP BY category ORDER BY category',
            [tenantId]
        );
        return result.rows;
    }

    async getStats(tenantId) {
        const result = await this.pool.query(
            'SELECT COUNT(*) as total, COUNT(DISTINCT category) as categorias FROM tenant_gallery WHERE tenant_id = $1', [tenantId]
        );
        return result.rows[0];
    }
}

module.exports = TenantGalleryDAO;

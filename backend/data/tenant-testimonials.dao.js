"use strict";
/**
 * 💬 DAO: Gestión de Testimonios (tenant_testimonials)
 */
const debugLog = require('../utils/debug-logger.js');

class TenantTestimonialsDAO {
    constructor(pool) { this.pool = pool; }

    async getByTenant(tenantId, featuredOnly = false) {
        let query = 'SELECT * FROM tenant_testimonials WHERE tenant_id = $1 AND is_active = true';
        if (featuredOnly) query += ' AND is_featured = true';
        query += ' ORDER BY rating DESC, created_at DESC';
        const result = await this.pool.query(query, [tenantId]);
        return result.rows;
    }

    async getById(id, tenantId) {
        const result = await this.pool.query('SELECT * FROM tenant_testimonials WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return result.rows[0] || null;
    }

    async create(data, tenantId) {
        const { person_name, graduation_year, occupation, testimonial, photo_url, rating, is_featured } = data;
        const result = await this.pool.query(
            `INSERT INTO tenant_testimonials (tenant_id, person_name, graduation_year, occupation, testimonial, photo_url, rating, is_featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [tenantId, person_name, graduation_year || null, occupation || null, testimonial, photo_url || null, rating || 5, is_featured || false]
        );
        return result.rows[0];
    }

    async update(id, data, tenantId) {
        const { person_name, graduation_year, occupation, testimonial, photo_url, rating, is_featured, is_active } = data;
        const result = await this.pool.query(
            `UPDATE tenant_testimonials SET person_name = COALESCE($1, person_name),
             graduation_year = COALESCE($2, graduation_year), occupation = COALESCE($3, occupation),
             testimonial = COALESCE($4, testimonial), photo_url = COALESCE($5, photo_url),
             rating = COALESCE($6, rating), is_featured = COALESCE($7, is_featured),
             is_active = COALESCE($8, is_active), updated_at = NOW()
             WHERE id = $9 AND tenant_id = $10 RETURNING *`,
            [person_name, graduation_year, occupation, testimonial, photo_url, rating, is_featured, is_active, id, tenantId]
        );
        return result.rows[0] || null;
    }

    async delete(id, tenantId) {
        await this.pool.query('DELETE FROM tenant_testimonials WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        return true;
    }

    async getStats(tenantId) {
        const result = await this.pool.query(
            'SELECT COUNT(*) as total, ROUND(AVG(rating),1) as promedio_rating FROM tenant_testimonials WHERE tenant_id = $1', [tenantId]
        );
        return result.rows[0];
    }
}

module.exports = TenantTestimonialsDAO;

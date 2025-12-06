/**
 * 🏢 TENANT DAO
 * Data Access Object para gestión de tenants
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class TenantDAO {

    static async getById(tenantId) {
        const result = await pool.query('SELECT id, nombre, subdomain, dominio, status, config_json, created_at, updated_at FROM tenants WHERE id = $1 OR subdomain = $1 LIMIT 1', [tenantId]);
        return result.rows[0];
    }

    static async updateConfig(tenantId, configJson) {
        const result = await pool.query('UPDATE tenants SET config_json = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR subdomain = $2 RETURNING *', [JSON.stringify(configJson), tenantId]);
        return result.rows[0];
    }

    static async checkExists(id, subdomain) {
        const result = await pool.query('SELECT id FROM tenants WHERE id = $1 OR subdomain = $2', [id, subdomain]);
        return result.rows.length > 0;
    }

    static async create(id, nombre, subdomain, dominio, status, configJson) {
        const result = await pool.query('INSERT INTO tenants (id, nombre, subdomain, dominio, status, config_json) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [id, nombre, subdomain, dominio, status, JSON.stringify(configJson)]);
        return result.rows[0];
    }

    static async list(status, limit, offset) {
        let query = 'SELECT * FROM tenants'; const params = [];
        if (status) { query += ' WHERE status = $1'; params.push(status); }
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`; params.push(limit, offset);
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async updateStatus(tenantId, newStatus) {
        const result = await pool.query('UPDATE tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR subdomain = $2 RETURNING *', [newStatus, tenantId]);
        return result.rows[0];
    }

    static async getStats(tenantId) {
        const [students, users, news] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM estudiantes WHERE tenant_id = $1', [tenantId]),
            pool.query('SELECT COUNT(*) FROM usuarios WHERE tenant_id = $1', [tenantId]),
            pool.query('SELECT COUNT(*) FROM noticias WHERE tenant_id = $1', [tenantId])
        ]);
        return { students: parseInt(students.rows[0].count), users: parseInt(users.rows[0].count), news: parseInt(news.rows[0].count) };
    }
}

module.exports = TenantDAO;

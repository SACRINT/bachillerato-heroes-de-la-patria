"use strict";
/**
 * 👥 DAO: Gestión de Personal del Plantel (tenant_staff)
 * CRUD completo para que el director gestione el equipo del plantel.
 */
const debugLog = require('../utils/debug-logger.js');

class TenantStaffDAO {
    constructor(pool) {
        this.pool = pool;
    }

    async getByTenant(tenantId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM tenant_staff WHERE tenant_id = $1 AND is_active = true ORDER BY sort_order, full_name',
                [tenantId]
            );
            return result.rows;
        } catch (error) {
            debugLog.error('STAFF-DAO', 'Error obteniendo personal', error);
            throw error;
        }
    }

    async getById(id, tenantId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM tenant_staff WHERE id = $1 AND tenant_id = $2',
                [id, tenantId]
            );
            return result.rows[0] || null;
        } catch (error) {
            debugLog.error('STAFF-DAO', 'Error obteniendo miembro por ID', error);
            throw error;
        }
    }

    async create(data, tenantId) {
        try {
            const { full_name, position, department, photo_url, email, phone, bio, sort_order } = data;
            const result = await this.pool.query(
                `INSERT INTO tenant_staff (tenant_id, full_name, position, department, photo_url, email, phone, bio, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [tenantId, full_name, position || null, department || null, photo_url || null, email || null, phone || null, bio || null, sort_order || 0]
            );
            return result.rows[0];
        } catch (error) {
            debugLog.error('STAFF-DAO', 'Error creando miembro del personal', error);
            throw error;
        }
    }

    async update(id, data, tenantId) {
        try {
            const { full_name, position, department, photo_url, email, phone, bio, sort_order, is_active } = data;
            const result = await this.pool.query(
                `UPDATE tenant_staff SET full_name = COALESCE($1, full_name), position = COALESCE($2, position),
                 department = COALESCE($3, department), photo_url = COALESCE($4, photo_url),
                 email = COALESCE($5, email), phone = COALESCE($6, phone), bio = COALESCE($7, bio),
                 sort_order = COALESCE($8, sort_order), is_active = COALESCE($9, is_active),
                 updated_at = NOW()
                 WHERE id = $10 AND tenant_id = $11 RETURNING *`,
                [full_name, position, department, photo_url, email, phone, bio, sort_order, is_active, id, tenantId]
            );
            return result.rows[0] || null;
        } catch (error) {
            debugLog.error('STAFF-DAO', 'Error actualizando miembro del personal', error);
            throw error;
        }
    }

    async delete(id, tenantId) {
        try {
            await this.pool.query(
                'DELETE FROM tenant_staff WHERE id = $1 AND tenant_id = $2',
                [id, tenantId]
            );
            return true;
        } catch (error) {
            debugLog.error('STAFF-DAO', 'Error eliminando miembro del personal', error);
            throw error;
        }
    }

    async getStats(tenantId) {
        try {
            const result = await this.pool.query(
                'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as activos FROM tenant_staff WHERE tenant_id = $1',
                [tenantId]
            );
            return result.rows[0];
        } catch (error) {
            return { total: 0, activos: 0 };
        }
    }
}

module.exports = TenantStaffDAO;

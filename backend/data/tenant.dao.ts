/**
 * 🏢 TENANT DAO - TypeScript
 * Data Access Object para gestión de tenants
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface TenantRow {
    id: string;
    nombre: string;
    subdomain: string;
    dominio?: string;
    status: 'active' | 'inactive' | 'pending';
    config_json: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export interface TenantStats {
    students: number;
    users: number;
    news: number;
}

// =====================================================
// TENANT DAO CLASS
// =====================================================

class TenantDAO {

    static async getById(tenantId: string): Promise<TenantRow | undefined> {
        const result = await pool.query(
            'SELECT id, nombre, subdomain, dominio, status, config_json, created_at, updated_at FROM tenants WHERE id = $1 OR subdomain = $1 LIMIT 1',
            [tenantId]
        );
        return result.rows[0];
    }

    static async updateConfig(tenantId: string, configJson: Record<string, any>): Promise<TenantRow | undefined> {
        const result = await pool.query(
            'UPDATE tenants SET config_json = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR subdomain = $2 RETURNING *',
            [JSON.stringify(configJson), tenantId]
        );
        return result.rows[0];
    }

    static async checkExists(id: string, subdomain: string): Promise<boolean> {
        const result = await pool.query(
            'SELECT id FROM tenants WHERE id = $1 OR subdomain = $2',
            [id, subdomain]
        );
        return result.rows.length > 0;
    }

    static async create(
        id: string,
        nombre: string,
        subdomain: string,
        dominio: string | null,
        status: string,
        configJson: Record<string, any>
    ): Promise<TenantRow> {
        const result = await pool.query(
            'INSERT INTO tenants (id, nombre, subdomain, dominio, status, config_json) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, nombre, subdomain, dominio, status, JSON.stringify(configJson)]
        );
        return result.rows[0];
    }

    static async list(status: string | null, limit: number, offset: number): Promise<TenantRow[]> {
        let query = 'SELECT * FROM tenants';
        const params: (string | number)[] = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async updateStatus(tenantId: string, newStatus: string): Promise<TenantRow | undefined> {
        const result = await pool.query(
            'UPDATE tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR subdomain = $2 RETURNING *',
            [newStatus, tenantId]
        );
        return result.rows[0];
    }

    static async getStats(tenantId: string): Promise<TenantStats> {
        const [students, users, news] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM estudiantes WHERE tenant_id = $1', [tenantId]),
            pool.query('SELECT COUNT(*) FROM usuarios WHERE tenant_id = $1', [tenantId]),
            pool.query('SELECT COUNT(*) FROM noticias WHERE tenant_id = $1', [tenantId])
        ]);

        return {
            students: parseInt(students.rows[0].count),
            users: parseInt(users.rows[0].count),
            news: parseInt(news.rows[0].count)
        };
    }
}

export default TenantDAO;
module.exports = TenantDAO;

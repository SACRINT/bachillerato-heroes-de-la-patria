"use strict";
/**
 * 🏗️ TENANT ONBOARDING DAO - TypeScript
 * Data Access Object para onboarding de tenants
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// TENANT ONBOARDING DAO CLASS
// =====================================================
class TenantOnboardingDAO {
    static async checkSubdomainExists(subdomain) {
        const result = await database_1.pool.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
        return result.rows.length > 0;
    }
    static async checkDomainExists(domain) {
        const result = await database_1.pool.query('SELECT id FROM tenants WHERE domain = $1', [domain]);
        return result.rows.length > 0;
    }
    static async checkEmailExists(email) {
        const result = await database_1.pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        return result.rows.length > 0;
    }
    static async createTenantWithAdmin(client, tenantData, adminData, seedData) {
        const { tenantId, name, subdomain, domain, plan, config } = tenantData;
        const { userId, uuid, email, passwordHash, username, nombre, apellidoPaterno, apellidoMaterno } = adminData;
        // Crear tenant
        const tenantResult = await client.query(`INSERT INTO tenants (id, name, subdomain, domain, plan, status, config_json, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`, [tenantId, name, subdomain, domain, plan, 'active', JSON.stringify(config)]);
        // Crear admin
        const adminResult = await client.query(`INSERT INTO usuarios (id, uuid, email, password_hash, username, role, status, nombre, apellido_paterno, apellido_materno, tenant_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id, uuid, email, username, role, nombre, tenant_id`, [userId, uuid, email, passwordHash, username, 'admin', 'activo', nombre, apellidoPaterno, apellidoMaterno, tenantId]);
        // Seed data si está habilitado
        if (seedData) {
            await client.query(`INSERT INTO categorias (nombre, descripcion, tenant_id, created_at) VALUES ('Avisos Importantes', 'Comunicados oficiales', $1, NOW()), ('Eventos', 'Eventos académicos y culturales', $1, NOW()), ('Noticias Académicas', 'Logros y actualizaciones académicas', $1, NOW()), ('Deportes', 'Actividades deportivas', $1, NOW()), ('Cultura', 'Eventos culturales y artísticos', $1, NOW()) ON CONFLICT DO NOTHING`, [tenantId]);
        }
        return { tenant: tenantResult.rows[0], admin: adminResult.rows[0] };
    }
    static async updateStatus(tenantId, status) {
        const result = await database_1.pool.query('UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, tenantId]);
        return result.rows[0];
    }
    static async updateConfig(tenantId, newConfig) {
        const result = await database_1.pool.query('UPDATE tenants SET config_json = config_json || $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *', [JSON.stringify(newConfig), tenantId]);
        return result.rows[0];
    }
    static getConnection() { return database_1.pool.connect(); }
}
exports.default = TenantOnboardingDAO;
module.exports = TenantOnboardingDAO;
//# sourceMappingURL=tenant-onboarding.dao.js.map
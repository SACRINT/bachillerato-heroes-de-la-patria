/**
 * 🏗️ TENANT ONBOARDING SERVICE - v2.0.0
 * Refactorizado: 04 Diciembre 2025
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const TenantOnboardingDAO = require('../data/tenant-onboarding.dao.js');
const logger = require('../utils/winston-logger.js');
const emailService = require('./emailService.js');

class TenantOnboardingService {
  async createTenant(data) {
    const { name, subdomain, domain, plan = 'starter', config = {}, adminEmail, adminPassword, adminName, seedData = true, sendWelcomeEmail = true } = data;
    const client = await TenantOnboardingDAO.getConnection();
    try {
      await client.query('BEGIN');
      if (await TenantOnboardingDAO.checkSubdomainExists(subdomain)) throw new Error(`El subdomain "${subdomain}" ya está en uso`);
      if (domain && await TenantOnboardingDAO.checkDomainExists(domain)) throw new Error(`El domain "${domain}" ya está en uso`);
      if (await TenantOnboardingDAO.checkEmailExists(adminEmail)) throw new Error(`El email "${adminEmail}" ya está registrado`);

      const tenantId = crypto.randomUUID();
      const defaultConfig = { school_name: name, school_short_name: subdomain.toUpperCase(), school_type: 'Bachillerato General por Competencias', primary_color: '#1e40af', secondary_color: '#dc2626', logo_url: null, features: { notifications: true, calendar: true, messaging: true, reports: true }, ...config };
      const [nombre, apellidoPaterno, apellidoMaterno] = this.parseFullName(adminName);

      const { tenant, admin } = await TenantOnboardingDAO.createTenantWithAdmin(client, { tenantId, name, subdomain, domain: domain || `${subdomain}.bge.edu.mx`, plan, config: defaultConfig }, { userId: crypto.randomUUID(), uuid: crypto.randomUUID(), email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 10), username: adminEmail.split('@')[0], nombre, apellidoPaterno, apellidoMaterno }, seedData);

      await client.query('COMMIT');
      logger.info('[TENANT-ONBOARDING] Onboarding completado', { tenantId, name, adminEmail });
      if (sendWelcomeEmail) { try { await this.sendWelcomeEmail(admin, tenant); } catch (e) { logger.error('[TENANT-ONBOARDING] Error email:', { error: e.message }); } }
      return { tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain, domain: tenant.domain, plan: tenant.plan, config: tenant.config_json }, admin: { id: admin.id, email: admin.email, role: admin.role } };
    } catch (error) { await client.query('ROLLBACK'); logger.error('[TENANT-ONBOARDING] Error', { error: error.message }); throw error; }
    finally { client.release(); }
  }

  parseFullName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return [parts[0], '', ''];
    if (parts.length === 2) return [parts[0], parts[1], ''];
    return [parts[0], parts[1], parts.slice(2).join(' ')];
  }

  async sendWelcomeEmail(admin, tenant) {
    const loginUrl = `https://${tenant.subdomain}.bge.edu.mx/login`;
    await emailService.sendEmail({ to: admin.email, subject: `Bienvenido a ${tenant.name} - BGE Platform`, html: `<h1>¡Bienvenido a ${tenant.name}!</h1><p>Hola ${admin.nombre},</p><p>Tu cuenta de administrador ha sido creada.</p><h3>Acceso:</h3><ul><li><strong>Email:</strong> ${admin.email}</li><li><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li></ul>` });
    logger.info('[TENANT-ONBOARDING] Email enviado', { tenantId: tenant.id, adminEmail: admin.email });
  }

  async deactivateTenant(tenantId) { const result = await TenantOnboardingDAO.updateStatus(tenantId, 'inactive'); if (!result) throw new Error('Tenant no encontrado'); logger.info('[TENANT-ONBOARDING] Desactivado', { tenantId }); return result; }
  async reactivateTenant(tenantId) { const result = await TenantOnboardingDAO.updateStatus(tenantId, 'active'); if (!result) throw new Error('Tenant no encontrado'); logger.info('[TENANT-ONBOARDING] Reactivado', { tenantId }); return result; }
  async updateTenantConfig(tenantId, newConfig) { const result = await TenantOnboardingDAO.updateConfig(tenantId, newConfig); if (!result) throw new Error('Tenant no encontrado'); logger.info('[TENANT-ONBOARDING] Config actualizada', { tenantId, newConfig }); return result; }
}

module.exports = new TenantOnboardingService();

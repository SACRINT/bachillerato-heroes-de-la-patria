/**
 * 🏗️ TENANT ONBOARDING SERVICE
 * Automatiza la creación de nuevos tenants con configuración completa
 * Semana 13 - Multi-Tenancy Enterprise
 */

const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const logger = require('../utils/winston-logger');
const emailService = require('./emailService');

class TenantOnboardingService {
  /**
   * Crear un nuevo tenant completo con:
   * - Registro en tabla tenants
   * - Usuario administrador
   * - Configuración inicial
   * - Datos de ejemplo (opcional)
   * - Email de bienvenida
   *
   * @param {object} data - Datos del nuevo tenant
   * @returns {object} - Tenant y admin creados
   */
  async createTenant(data) {
    const {
      // Datos del tenant
      name,
      subdomain,
      domain,
      plan = 'starter',
      config = {},

      // Datos del admin
      adminEmail,
      adminPassword,
      adminName,

      // Opciones
      seedData = true,
      sendWelcomeEmail = true,
    } = data;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // =========================================================================
      // 1. VALIDACIONES PREVIAS
      // =========================================================================

      // Verificar subdomain único
      const existingSubdomain = await client.query(
        'SELECT id FROM tenants WHERE subdomain = $1',
        [subdomain]
      );
      if (existingSubdomain.rows.length > 0) {
        throw new Error(`El subdomain "${subdomain}" ya está en uso`);
      }

      // Verificar domain único (si se proporciona)
      if (domain) {
        const existingDomain = await client.query(
          'SELECT id FROM tenants WHERE domain = $1',
          [domain]
        );
        if (existingDomain.rows.length > 0) {
          throw new Error(`El domain "${domain}" ya está en uso`);
        }
      }

      // Verificar email único
      const existingEmail = await client.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [adminEmail]
      );
      if (existingEmail.rows.length > 0) {
        throw new Error(`El email "${adminEmail}" ya está registrado`);
      }

      // =========================================================================
      // 2. CREAR TENANT
      // =========================================================================

      const tenantId = crypto.randomUUID();

      const defaultConfig = {
        school_name: name,
        school_short_name: subdomain.toUpperCase(),
        school_type: 'Bachillerato General por Competencias',
        primary_color: '#1e40af',
        secondary_color: '#dc2626',
        logo_url: null,
        features: {
          notifications: true,
          calendar: true,
          messaging: true,
          reports: true,
        },
        ...config,
      };

      const tenantResult = await client.query(
        `INSERT INTO tenants (
          id, name, subdomain, domain, plan, status, config_json, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [
          tenantId,
          name,
          subdomain,
          domain || `${subdomain}.bge.edu.mx`,
          plan,
          'active',
          JSON.stringify(defaultConfig),
        ]
      );

      const tenant = tenantResult.rows[0];

      logger.info('[TENANT-ONBOARDING] Tenant creado exitosamente', {
        tenantId,
        name,
        subdomain,
      });

      // =========================================================================
      // 3. CREAR USUARIO ADMINISTRADOR
      // =========================================================================

      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const userId = crypto.randomUUID();

      const adminResult = await client.query(
        `INSERT INTO usuarios (
          id, uuid, email, password_hash, username, role, status,
          nombre, apellido_paterno, apellido_materno, tenant_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING id, uuid, email, username, role, nombre, tenant_id`,
        [
          userId,
          crypto.randomUUID(),
          adminEmail,
          passwordHash,
          adminEmail.split('@')[0],
          'admin',
          'activo',
          ...this.parseFullName(adminName),
          tenantId,
        ]
      );

      const admin = adminResult.rows[0];

      logger.info('[TENANT-ONBOARDING] Admin creado exitosamente', {
        tenantId,
        adminId: admin.id,
        adminEmail,
      });

      // =========================================================================
      // 4. CONFIGURAR DATOS INICIALES (SEED DATA)
      // =========================================================================

      if (seedData) {
        await this.seedTenantData(client, tenantId);
        logger.info('[TENANT-ONBOARDING] Datos iniciales configurados', {
          tenantId,
        });
      }

      // =========================================================================
      // 5. COMMIT TRANSACTION
      // =========================================================================

      await client.query('COMMIT');

      logger.info('[TENANT-ONBOARDING] Onboarding completado exitosamente', {
        tenantId,
        name,
        adminEmail,
      });

      // =========================================================================
      // 6. ENVIAR EMAIL DE BIENVENIDA (DESPUÉS DEL COMMIT)
      // =========================================================================

      if (sendWelcomeEmail) {
        try {
          await this.sendWelcomeEmail(admin, tenant);
        } catch (emailError) {
          logger.error(
            '[TENANT-ONBOARDING] Error al enviar email de bienvenida',
            {
              tenantId,
              error: emailError.message,
            }
          );
          // No fallar el onboarding si falla el email
        }
      }

      // =========================================================================
      // 7. RETORNAR RESULTADO
      // =========================================================================

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          domain: tenant.domain,
          plan: tenant.plan,
          config: tenant.config_json,
        },
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[TENANT-ONBOARDING] Error en onboarding', {
        error: error.message,
        stack: error.stack,
        data,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Crear datos iniciales para un nuevo tenant
   * - Categorías de noticias
   * - Roles de usuario
   * - Configuraciones predeterminadas
   */
  async seedTenantData(client, tenantId) {
    // Crear categorías de noticias
    await client.query(
      `INSERT INTO categorias (nombre, descripcion, tenant_id, created_at)
       VALUES
         ('Avisos Importantes', 'Comunicados oficiales', $1, NOW()),
         ('Eventos', 'Eventos académicos y culturales', $1, NOW()),
         ('Noticias Académicas', 'Logros y actualizaciones académicas', $1, NOW()),
         ('Deportes', 'Actividades deportivas', $1, NOW()),
         ('Cultura', 'Eventos culturales y artísticos', $1, NOW())
       ON CONFLICT DO NOTHING`,
      [tenantId]
    );

    logger.debug('[TENANT-ONBOARDING] Categorías creadas', { tenantId });
  }

  /**
   * Parsear nombre completo en nombre, apellido paterno y materno
   * Ejemplo: "Juan Pérez López" → ["Juan", "Pérez", "López"]
   */
  parseFullName(fullName) {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return [parts[0], '', ''];
    } else if (parts.length === 2) {
      return [parts[0], parts[1], ''];
    } else {
      return [parts[0], parts[1], parts.slice(2).join(' ')];
    }
  }

  /**
   * Enviar email de bienvenida al admin del nuevo tenant
   */
  async sendWelcomeEmail(admin, tenant) {
    const loginUrl = `https://${tenant.subdomain}.bge.edu.mx/login`;

    const emailContent = `
      <h1>¡Bienvenido a ${tenant.name}!</h1>

      <p>Hola ${admin.nombre},</p>

      <p>Tu cuenta de administrador ha sido creada exitosamente en la plataforma BGE.</p>

      <h3>Información de acceso:</h3>
      <ul>
        <li><strong>Email:</strong> ${admin.email}</li>
        <li><strong>URL de acceso:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
        <li><strong>Plan:</strong> ${tenant.plan}</li>
      </ul>

      <h3>Próximos pasos:</h3>
      <ol>
        <li>Inicia sesión con tu email y contraseña</li>
        <li>Configura tu perfil y los colores de tu institución</li>
        <li>Invita a docentes y estudiantes</li>
        <li>Explora las funcionalidades del sistema</li>
      </ol>

      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

      <p>Saludos,<br>El equipo de BGE</p>
    `;

    await emailService.sendEmail({
      to: admin.email,
      subject: `Bienvenido a ${tenant.name} - BGE Platform`,
      html: emailContent,
    });

    logger.info('[TENANT-ONBOARDING] Email de bienvenida enviado', {
      tenantId: tenant.id,
      adminEmail: admin.email,
    });
  }

  /**
   * Desactivar un tenant (soft delete)
   */
  async deactivateTenant(tenantId) {
    const result = await pool.query(
      'UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['inactive', tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error('Tenant no encontrado');
    }

    logger.info('[TENANT-ONBOARDING] Tenant desactivado', { tenantId });

    return result.rows[0];
  }

  /**
   * Reactivar un tenant
   */
  async reactivateTenant(tenantId) {
    const result = await pool.query(
      'UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['active', tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error('Tenant no encontrado');
    }

    logger.info('[TENANT-ONBOARDING] Tenant reactivado', { tenantId });

    return result.rows[0];
  }

  /**
   * Actualizar configuración de un tenant
   */
  async updateTenantConfig(tenantId, newConfig) {
    const result = await pool.query(
      'UPDATE tenants SET config_json = config_json || $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(newConfig), tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error('Tenant no encontrado');
    }

    logger.info('[TENANT-ONBOARDING] Configuración actualizada', {
      tenantId,
      newConfig,
    });

    return result.rows[0];
  }
}

module.exports = new TenantOnboardingService();

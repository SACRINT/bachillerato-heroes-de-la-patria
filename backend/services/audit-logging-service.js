/**
 * 📝 AUDIT LOGGING SERVICE
 * Registra todas las operaciones críticas para cumplimiento y seguridad
 * Semana 13 - Multi-Tenancy Enterprise
 */

const pool = require('../config/database.js');
const logger = require('../utils/winston-logger.js');
const emailService = require('./emailService.js');

/**
 * Categorías de eventos auditables
 */
const AuditEventTypes = {
  // Autenticación
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_LOGIN_FAILED: 'user.login.failed',
  PASSWORD_CHANGED: 'user.password.changed',
  PASSWORD_RESET: 'user.password.reset',

  // Usuarios
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ROLE_CHANGED: 'user.role.changed',

  // Tenant Management
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  TENANT_DEACTIVATED: 'tenant.deactivated',
  TENANT_REACTIVATED: 'tenant.reactivated',
  TENANT_CONFIG_CHANGED: 'tenant.config.changed',

  // Datos Académicos
  STUDENT_CREATED: 'student.created',
  STUDENT_UPDATED: 'student.updated',
  STUDENT_DELETED: 'student.deleted',
  GRADE_CREATED: 'grade.created',
  GRADE_UPDATED: 'grade.updated',
  GRADE_DELETED: 'grade.deleted',

  // Datos Sensibles
  DATA_EXPORTED: 'data.exported',
  DATA_IMPORTED: 'data.imported',
  GDPR_REQUEST: 'gdpr.request',

  // Seguridad
  PERMISSION_CHANGED: 'security.permission.changed',
  ACCESS_DENIED: 'security.access.denied',
  SUSPICIOUS_ACTIVITY: 'security.suspicious',
};

/**
 * Niveles de severidad
 */
const AuditSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

class AuditLoggingService {
  /**
   * Registrar un evento de auditoría
   *
   * @param {object} options - Opciones del log
   * @returns {object} - Log creado
   */
  async log(options) {
    const {
      event_type,
      user_id = null,
      tenant_id = null,
      target_type = null,
      target_id = null,
      changes = {},
      metadata = {},
      ip_address = null,
      user_agent = null,
      severity = AuditSeverity.LOW,
      success = true,
    } = options;

    try {
      // Validar tipo de evento
      if (!Object.values(AuditEventTypes).includes(event_type)) {
        logger.warn('[AUDIT-LOG] Tipo de evento no reconocido', { event_type });
      }

      // Insertar en tabla audit_logs
      const result = await pool.query(
        `INSERT INTO audit_logs (
          event_type, user_id, tenant_id, target_type, target_id,
          changes, metadata, ip_address, user_agent,
          severity, success, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *`,
        [
          event_type,
          user_id,
          tenant_id,
          target_type,
          target_id,
          JSON.stringify(changes),
          JSON.stringify(metadata),
          ip_address,
          user_agent,
          severity,
          success,
        ]
      );

      const auditLog = result.rows[0];

      // Log también a winston para ELK
      logger.info('[AUDIT-LOG] Evento registrado', {
        id: auditLog.id,
        event_type,
        user_id,
        tenant_id,
        severity,
        success,
      });

      // Si es crítico, log adicional
      if (severity === AuditSeverity.CRITICAL) {
        logger.warn('[AUDIT-LOG] EVENTO CRÍTICO', {
          id: auditLog.id,
          event_type,
          user_id,
          tenant_id,
          metadata,
        });
      }

      return auditLog;
    } catch (error) {
      logger.error('[AUDIT-LOG] Error al registrar evento', {
        error: error.message,
        stack: error.stack,
        options,
      });
      throw error;
    }
  }

  /**
   * Log de inicio de sesión exitoso
   */
  async logLogin(user, req) {
    return await this.log({
      event_type: AuditEventTypes.USER_LOGIN,
      user_id: user.id,
      tenant_id: user.tenant_id,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: {
        email: user.email,
        role: user.role,
      },
      severity: AuditSeverity.LOW,
      success: true,
    });
  }

  /**
   * Log de inicio de sesión fallido
   */
  async logLoginFailed(email, req, reason = 'Invalid credentials') {
    return await this.log({
      event_type: AuditEventTypes.USER_LOGIN_FAILED,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: {
        email,
        reason,
      },
      severity: AuditSeverity.MEDIUM,
      success: false,
    });
  }

  /**
   * Log de creación de usuario
   */
  async logUserCreated(newUser, createdBy, tenantId) {
    return await this.log({
      event_type: AuditEventTypes.USER_CREATED,
      user_id: createdBy,
      tenant_id: tenantId,
      target_type: 'user',
      target_id: newUser.id,
      changes: {
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
      severity: AuditSeverity.LOW,
      success: true,
    });
  }

  /**
   * Log de actualización de usuario
   */
  async logUserUpdated(userId, oldData, newData, updatedBy, tenantId) {
    const changes = this.getDiff(oldData, newData);

    return await this.log({
      event_type: AuditEventTypes.USER_UPDATED,
      user_id: updatedBy,
      tenant_id: tenantId,
      target_type: 'user',
      target_id: userId,
      changes,
      severity: AuditSeverity.LOW,
      success: true,
    });
  }

  /**
   * Log de eliminación de usuario
   */
  async logUserDeleted(deletedUser, deletedBy, tenantId) {
    return await this.log({
      event_type: AuditEventTypes.USER_DELETED,
      user_id: deletedBy,
      tenant_id: tenantId,
      target_type: 'user',
      target_id: deletedUser.id,
      changes: {
        email: deletedUser.email,
        role: deletedUser.role,
      },
      severity: AuditSeverity.MEDIUM,
      success: true,
    });
  }

  /**
   * Log de cambio de rol y enviar alerta si es crítico.
   */
  async logRoleChanged(userId, oldRole, newRole, changedBy, tenantId) {
    const log = await this.log({
      event_type: AuditEventTypes.USER_ROLE_CHANGED,
      user_id: changedBy,
      tenant_id: tenantId,
      target_type: 'user',
      target_id: userId,
      changes: {
        old_role: oldRole,
        new_role: newRole,
      },
      severity: AuditSeverity.HIGH,
      success: true,
    });

    // Si el nuevo rol es 'admin', enviar alerta de seguridad
    if (newRole === 'admin') {
      try {
        devLogger.warn(`[AUDIT-LOG] ALERTA: Usuario ${userId} fue promovido a admin por usuario ${changedBy}. Enviando email.`);
        
        // Obtener detalles del admin y del usuario para el email
        const adminUserResult = await pool.query('SELECT id, email, nombre FROM usuarios WHERE id = $1', [changedBy]);
        const targetUserResult = await pool.query('SELECT id, email, nombre FROM usuarios WHERE id = $1', [userId]);

        if (adminUserResult.rows.length > 0 && targetUserResult.rows.length > 0) {
          const adminEmail = process.env.ADMIN_EMAIL;
          if (!adminEmail) {
            devLogger.error('[AUDIT-LOG] La variable de entorno ADMIN_EMAIL no está configurada. No se puede enviar la alerta de seguridad.');
            return log;
          }

          await emailService.sendEmail({
            to: adminEmail,
            subject: '🚨 Alerta de Seguridad: Cambio de Rol a Administrador',
            template: 'security-alert-role-change',
            data: {
              timestamp: new Date(),
              adminUser: adminUserResult.rows[0],
              targetUser: targetUserResult.rows[0],
              oldRole,
              newRole,
              ipAddress: 'No disponible en este log', // Se puede mejorar pasando el objeto `req`
              currentYear: new Date().getFullYear()
            }
          });
          devLogger.log(`[AUDIT-LOG] Email de alerta de seguridad enviado a ${adminEmail}.`);
        }
      } catch (emailError) {
        devLogger.error(`[AUDIT-LOG] Falló el envío del email de alerta de seguridad: ${emailError.message}`);
      }
    }

    return log;
  }

  /**
   * Log de creación de tenant
   */
  async logTenantCreated(tenant, createdBy) {
    return await this.log({
      event_type: AuditEventTypes.TENANT_CREATED,
      user_id: createdBy,
      tenant_id: tenant.id,
      target_type: 'tenant',
      target_id: tenant.id,
      changes: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
      },
      severity: AuditSeverity.HIGH,
      success: true,
    });
  }

  /**
   * Log de acceso denegado (403 Forbidden)
   */
  async logAccessDenied(user, resource, req) {
    return await this.log({
      event_type: AuditEventTypes.ACCESS_DENIED,
      user_id: user?.id || null,
      tenant_id: user?.tenant_id || null,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: {
        resource,
        path: req.path,
        method: req.method,
      },
      severity: AuditSeverity.MEDIUM,
      success: false,
    });
  }

  /**
   * Log de exportación de datos (GDPR)
   */
  async logDataExported(userId, dataType, tenantId, req) {
    return await this.log({
      event_type: AuditEventTypes.DATA_EXPORTED,
      user_id: userId,
      tenant_id: tenantId,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: {
        data_type: dataType,
      },
      severity: AuditSeverity.HIGH,
      success: true,
    });
  }

  /**
   * Consultar logs de auditoría
   */
  async queryLogs(filters = {}) {
    const {
      tenant_id = null,
      user_id = null,
      event_type = null,
      severity = null,
      start_date = null,
      end_date = null,
      limit = 100,
      offset = 0,
    } = filters;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (tenant_id) {
      query += ` AND tenant_id = $${paramIndex}`;
      params.push(tenant_id);
      paramIndex++;
    }

    if (user_id) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (event_type) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(event_type);
      paramIndex++;
    }

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return result.rows;
  }

  /**
   * Obtener diferencias entre dos objetos (para cambios)
   */
  getDiff(oldData, newData) {
    const changes = {};

    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    }

    return changes;
  }
}

module.exports = new AuditLoggingService();
module.exports.AuditEventTypes = AuditEventTypes;
module.exports.AuditSeverity = AuditSeverity;

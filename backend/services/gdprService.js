/**
 * 🛡️ GDPR COMPLIANCE SERVICE - SEMANA 20
 * Cumplimiento de protección de datos
 *
 * Features:
 * - Consent management
 * - Data export (portability)
 * - Right to be forgotten
 * - Data retention
 * - Audit trail
 *
 * Fecha: 20 Noviembre 2025
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class GDPRService {
  constructor() {
    this.consentTypes = [
      'essential',      // Necesarias para funcionamiento
      'marketing',      // Comunicaciones marketing
      'analytics',      // Analíticas
      'third_party'     // Terceros
    ];
  }

  async recordConsent(userId, consents) {
    const result = await pool.query(`
      INSERT INTO gdpr_consents (user_id, consents, ip_address, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `, [userId, JSON.stringify(consents), consents.ip_address]);

    devLogger.log(`[GDPR] Consentimiento registrado para usuario ${userId}`);

    return {
      success: true,
      consentId: result.rows[0].id
    };
  }

  async getConsent(userId) {
    const result = await pool.query(`
      SELECT consents, created_at
      FROM gdpr_consents
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    return {
      success: true,
      consent: result.rows[0] || null
    };
  }

  async exportUserData(userId) {
    devLogger.log(`[GDPR] Exportando datos del usuario ${userId}`);

    const data = {};

    // Datos del usuario
    const user = await pool.query(`
      SELECT id, email, nombre, apellido_paterno, apellido_materno, role, created_at
      FROM usuarios
      WHERE id = $1
    `, [userId]);

    if (user.rows.length) {
      data.usuario = user.rows[0];
    }

    // Estudiante (si aplica)
    const student = await pool.query(`
      SELECT * FROM estudiantes WHERE id = $1
    `, [userId]);

    if (student.rows.length) {
      data.estudiante = student.rows[0];

      // Calificaciones
      const grades = await pool.query(`
        SELECT * FROM calificaciones WHERE estudiante_id = $1
      `, [userId]);
      data.calificaciones = grades.rows;

      // Asistencias
      const attendance = await pool.query(`
        SELECT * FROM asistencias WHERE estudiante_id = $1
      `, [userId]);
      data.asistencias = attendance.rows;
    }

    // Notificaciones
    const notifications = await pool.query(`
      SELECT * FROM notificaciones WHERE user_id = $1
    `, [userId]);
    data.notificaciones = notifications.rows;

    // Actividad (audit logs)
    const activity = await pool.query(`
      SELECT action, entity, created_at
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `, [userId]);
    data.actividad = activity.rows;

    return {
      success: true,
      data,
      exportedAt: new Date().toISOString(),
      format: 'JSON'
    };
  }

  async deleteUserData(userId, options = {}) {
    const { keepAuditLogs = true } = options;

    devLogger.log(`[GDPR] Eliminando datos del usuario ${userId}`);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Eliminar calificaciones
      await client.query('DELETE FROM calificaciones WHERE estudiante_id = $1', [userId]);

      // Eliminar asistencias
      await client.query('DELETE FROM asistencias WHERE estudiante_id = $1', [userId]);

      // Eliminar notificaciones
      await client.query('DELETE FROM notificaciones WHERE user_id = $1', [userId]);

      // Eliminar consentimientos
      await client.query('DELETE FROM gdpr_consents WHERE user_id = $1', [userId]);

      // Eliminar datos de estudiante
      await client.query('DELETE FROM estudiantes WHERE id = $1', [userId]);

      // Anonimizar usuario (mantener registro pero sin datos personales)
      await client.query(`
        UPDATE usuarios
        SET email = 'deleted_' || id || '@deleted.local',
            nombre = 'Usuario',
            apellido_paterno = 'Eliminado',
            apellido_materno = '',
            password_hash = 'DELETED',
            status = 'deleted'
        WHERE id = $1
      `, [userId]);

      // Audit logs (opcional)
      if (!keepAuditLogs) {
        await client.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
      }

      await client.query('COMMIT');

      // Registrar solicitud GDPR
      await this.logRequest(userId, 'delete', 'completed');

      return {
        success: true,
        message: 'Datos eliminados exitosamente',
        deletedAt: new Date().toISOString()
      };

    } catch (error) {
      await client.query('ROLLBACK');
      devLogger.error('[GDPR] Error eliminando datos:', error.message);
      throw error;

    } finally {
      client.release();
    }
  }

  async logRequest(userId, type, status, details = null) {
    try {
      await pool.query(`
        INSERT INTO gdpr_requests (user_id, request_type, status, details, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [userId, type, status, details]);
    } catch {
      // Tabla puede no existir
    }
  }

  async getRequests(options = {}) {
    const { userId, status, page = 1, limit = 50 } = options;

    let query = `
      SELECT * FROM gdpr_requests
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (userId) {
      query += ` AND user_id = $${paramCount++}`;
      params.push(userId);
    }

    if (status) {
      query += ` AND status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, (page - 1) * limit);

    try {
      const result = await pool.query(query, params);
      return {
        success: true,
        requests: result.rows
      };
    } catch {
      return { success: true, requests: [] };
    }
  }

  async applyRetentionPolicy(daysToKeep = 365) {
    devLogger.log(`[GDPR] Aplicando política de retención (${daysToKeep} días)`);

    let deleted = 0;

    // Eliminar audit logs antiguos
    const result = await pool.query(`
      DELETE FROM audit_logs
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `);
    deleted += result.rowCount;

    // Eliminar notificaciones antiguas leídas
    const notifResult = await pool.query(`
      DELETE FROM notificaciones
      WHERE leida = true AND created_at < NOW() - INTERVAL '90 days'
    `);
    deleted += notifResult.rowCount;

    return {
      success: true,
      deleted,
      appliedAt: new Date().toISOString()
    };
  }
}

module.exports = new GDPRService();

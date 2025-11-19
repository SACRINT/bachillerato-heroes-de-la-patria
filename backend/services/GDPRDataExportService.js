/**
 * 🔒 GDPR DATA EXPORT SERVICE - v1.0.0
 * Servicio de exportación de datos para cumplimiento GDPR/FERPA
 *
 * v5.1.0 Features
 * Fecha: 19 Noviembre 2025
 *
 * Derechos del titular:
 * - Derecho de acceso (Art. 15)
 * - Derecho de portabilidad (Art. 20)
 * - Derecho de rectificación (Art. 16)
 * - Derecho de supresión (Art. 17)
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

/**
 * Clase de error personalizada
 */
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

// Tipos de solicitud GDPR
const REQUEST_TYPES = {
  ACCESS: 'access',           // Derecho de acceso
  PORTABILITY: 'portability', // Derecho de portabilidad
  RECTIFICATION: 'rectification', // Derecho de rectificación
  ERASURE: 'erasure',         // Derecho de supresión
  RESTRICTION: 'restriction'   // Derecho de limitación
};

// Estado de solicitudes
const REQUEST_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// Tablas con datos personales
const PERSONAL_DATA_TABLES = {
  usuarios: {
    columns: ['email', 'username', 'nombre', 'apellido_paterno', 'apellido_materno', 'telefono', 'direccion'],
    identifier: 'id'
  },
  estudiantes: {
    columns: ['matricula', 'nombre', 'apellido_paterno', 'apellido_materno', 'email', 'telefono', 'direccion', 'fecha_nacimiento', 'curp'],
    identifier: 'id'
  },
  padres: {
    columns: ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'telefono', 'direccion'],
    identifier: 'id'
  },
  docentes: {
    columns: ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'telefono', 'especialidad'],
    identifier: 'id'
  },
  calificaciones: {
    columns: ['calificacion', 'observaciones'],
    identifier: 'estudiante_id',
    isRelated: true
  },
  asistencia: {
    columns: ['fecha', 'status', 'justificacion'],
    identifier: 'estudiante_id',
    isRelated: true
  },
  citas: {
    columns: ['motivo', 'fecha_solicitada', 'hora_solicitada', 'notas'],
    identifier: 'usuario_id',
    isRelated: true
  },
  notificaciones: {
    columns: ['titulo', 'mensaje', 'tipo'],
    identifier: 'usuario_id',
    isRelated: true
  }
};

class GDPRDataExportService {
  constructor() {
    this.exportDir = process.env.GDPR_EXPORT_DIR || path.join(__dirname, '..', '..', 'exports', 'gdpr');
  }

  /**
   * Inicializar servicio
   */
  async initialize() {
    await fs.mkdir(this.exportDir, { recursive: true });
    devLogger.log('[GDPR] Servicio inicializado');
  }

  /**
   * Crear solicitud de datos (Subject Access Request - SAR)
   * @param {Object} options - Opciones de la solicitud
   * @returns {Promise<Object>} Solicitud creada
   */
  async createRequest(options) {
    const {
      userId,
      type,
      reason = null,
      requestedBy = null
    } = options;

    if (!REQUEST_TYPES[type.toUpperCase()]) {
      throw new ServiceError(`Tipo de solicitud inválido: ${type}`, 400);
    }

    const requestId = this._generateRequestId();

    const query = `
      INSERT INTO gdpr_requests (
        id, user_id, type, status, reason, requested_by, created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days')
      RETURNING *
    `;

    const result = await pool.query(query, [
      requestId,
      userId,
      type,
      REQUEST_STATUS.PENDING,
      reason,
      requestedBy
    ]);

    devLogger.log(`[GDPR] Solicitud creada: ${requestId} tipo: ${type}`);

    return result.rows[0];
  }

  /**
   * Procesar solicitud de acceso a datos
   * @param {string} requestId - ID de la solicitud
   * @returns {Promise<Object>} Datos del usuario
   */
  async processAccessRequest(requestId) {
    const request = await this._getRequest(requestId);

    if (request.status !== REQUEST_STATUS.PENDING) {
      throw new ServiceError(`Solicitud no está pendiente: ${request.status}`, 400);
    }

    await this._updateRequestStatus(requestId, REQUEST_STATUS.PROCESSING);

    try {
      const userId = request.user_id;
      const userData = await this._collectUserData(userId);

      // Crear archivo de exportación
      const exportPath = await this._createExportFile(requestId, userData);

      await this._updateRequestStatus(requestId, REQUEST_STATUS.COMPLETED, {
        exportPath,
        completedAt: new Date().toISOString()
      });

      return {
        requestId,
        status: REQUEST_STATUS.COMPLETED,
        exportPath,
        dataCategories: Object.keys(userData),
        totalRecords: this._countRecords(userData)
      };
    } catch (error) {
      await this._updateRequestStatus(requestId, REQUEST_STATUS.REJECTED, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Procesar solicitud de portabilidad
   * @param {string} requestId - ID de la solicitud
   * @param {string} format - Formato de exportación (json, csv)
   * @returns {Promise<Object>} Archivo de datos portátiles
   */
  async processPortabilityRequest(requestId, format = 'json') {
    const request = await this._getRequest(requestId);
    await this._updateRequestStatus(requestId, REQUEST_STATUS.PROCESSING);

    try {
      const userId = request.user_id;
      const userData = await this._collectUserData(userId);

      // Crear archivo en formato solicitado
      let exportPath;
      if (format === 'json') {
        exportPath = await this._createJSONExport(requestId, userData);
      } else if (format === 'csv') {
        exportPath = await this._createCSVExport(requestId, userData);
      }

      // Crear ZIP con todos los archivos
      const zipPath = await this._createZipArchive(requestId, exportPath);

      await this._updateRequestStatus(requestId, REQUEST_STATUS.COMPLETED, {
        exportPath: zipPath,
        format
      });

      return {
        requestId,
        status: REQUEST_STATUS.COMPLETED,
        downloadPath: zipPath,
        format,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
      };
    } catch (error) {
      await this._updateRequestStatus(requestId, REQUEST_STATUS.REJECTED);
      throw error;
    }
  }

  /**
   * Procesar solicitud de supresión (derecho al olvido)
   * @param {string} requestId - ID de la solicitud
   * @returns {Promise<Object>} Resultado de la supresión
   */
  async processErasureRequest(requestId) {
    const request = await this._getRequest(requestId);
    await this._updateRequestStatus(requestId, REQUEST_STATUS.PROCESSING);

    try {
      const userId = request.user_id;
      const erasureResult = {
        tablesProcessed: [],
        recordsDeleted: 0,
        recordsAnonymized: 0
      };

      // Verificar si hay razones legales para retener datos
      const retentionCheck = await this._checkRetentionRequirements(userId);
      if (retentionCheck.mustRetain) {
        throw new ServiceError(
          `No se puede eliminar: ${retentionCheck.reason}. Datos retenidos hasta: ${retentionCheck.retainUntil}`,
          400
        );
      }

      // Eliminar o anonimizar datos
      for (const [tableName, config] of Object.entries(PERSONAL_DATA_TABLES)) {
        const result = await this._eraseFromTable(tableName, config, userId);
        erasureResult.tablesProcessed.push(tableName);
        erasureResult.recordsDeleted += result.deleted;
        erasureResult.recordsAnonymized += result.anonymized;
      }

      await this._updateRequestStatus(requestId, REQUEST_STATUS.COMPLETED, {
        erasureResult
      });

      devLogger.log(`[GDPR] Supresión completada para usuario ${userId}:`, erasureResult);

      return {
        requestId,
        status: REQUEST_STATUS.COMPLETED,
        ...erasureResult
      };
    } catch (error) {
      await this._updateRequestStatus(requestId, REQUEST_STATUS.REJECTED, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtener estado de solicitud
   * @param {string} requestId - ID de la solicitud
   */
  async getRequestStatus(requestId) {
    const request = await this._getRequest(requestId);

    return {
      id: request.id,
      type: request.type,
      status: request.status,
      createdAt: request.created_at,
      expiresAt: request.expires_at,
      completedAt: request.completed_at
    };
  }

  /**
   * Listar solicitudes de un usuario
   * @param {number} userId - ID del usuario
   */
  async listUserRequests(userId) {
    const query = `
      SELECT * FROM gdpr_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Descargar archivo de exportación
   * @param {string} requestId - ID de la solicitud
   */
  async downloadExport(requestId) {
    const request = await this._getRequest(requestId);

    if (request.status !== REQUEST_STATUS.COMPLETED) {
      throw new ServiceError('La solicitud no está completada', 400);
    }

    const exportPath = request.export_path;
    if (!exportPath) {
      throw new ServiceError('No hay archivo de exportación disponible', 404);
    }

    // Verificar que no haya expirado
    if (new Date() > new Date(request.expires_at)) {
      throw new ServiceError('La exportación ha expirado', 410);
    }

    return {
      path: exportPath,
      filename: path.basename(exportPath)
    };
  }

  /**
   * Generar reporte de consentimientos
   * @param {number} tenantId - ID del tenant
   */
  async generateConsentReport(tenantId = null) {
    let query = `
      SELECT
        u.id,
        u.email,
        c.type as consent_type,
        c.given_at,
        c.revoked_at,
        c.ip_address
      FROM usuarios u
      LEFT JOIN user_consents c ON u.id = c.user_id
    `;

    const params = [];
    if (tenantId) {
      query += ' WHERE u.tenant_id = $1';
      params.push(tenantId);
    }

    query += ' ORDER BY c.given_at DESC';

    const result = await pool.query(query, params);

    return {
      generatedAt: new Date().toISOString(),
      totalUsers: new Set(result.rows.map(r => r.id)).size,
      consents: result.rows
    };
  }

  /**
   * Registrar consentimiento
   * @param {Object} options - Opciones del consentimiento
   */
  async recordConsent(options) {
    const {
      userId,
      type,
      given = true,
      ipAddress = null
    } = options;

    const query = given
      ? `
        INSERT INTO user_consents (user_id, type, given_at, ip_address)
        VALUES ($1, $2, NOW(), $3)
        ON CONFLICT (user_id, type) DO UPDATE SET given_at = NOW(), revoked_at = NULL, ip_address = $3
        RETURNING *
      `
      : `
        UPDATE user_consents
        SET revoked_at = NOW()
        WHERE user_id = $1 AND type = $2
        RETURNING *
      `;

    const result = await pool.query(query, [userId, type, ipAddress]);

    devLogger.log(`[GDPR] Consentimiento ${given ? 'otorgado' : 'revocado'}: usuario ${userId}, tipo ${type}`);

    return result.rows[0];
  }

  // ==================== MÉTODOS PRIVADOS ====================

  _generateRequestId() {
    return `gdpr_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  async _getRequest(requestId) {
    const query = 'SELECT * FROM gdpr_requests WHERE id = $1';
    const result = await pool.query(query, [requestId]);

    if (result.rows.length === 0) {
      throw new ServiceError('Solicitud no encontrada', 404);
    }

    return result.rows[0];
  }

  async _updateRequestStatus(requestId, status, metadata = {}) {
    const query = `
      UPDATE gdpr_requests
      SET status = $2, metadata = metadata || $3, updated_at = NOW()
      ${status === REQUEST_STATUS.COMPLETED ? ', completed_at = NOW()' : ''}
      WHERE id = $1
    `;

    await pool.query(query, [requestId, status, JSON.stringify(metadata)]);
  }

  async _collectUserData(userId) {
    const userData = {};

    // Datos del usuario principal
    const userQuery = 'SELECT * FROM usuarios WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    if (userResult.rows.length > 0) {
      userData.usuario = this._sanitizeRecord(userResult.rows[0]);
    }

    // Buscar datos relacionados
    for (const [tableName, config] of Object.entries(PERSONAL_DATA_TABLES)) {
      if (tableName === 'usuarios') continue;

      const identifier = config.identifier;
      const targetId = config.isRelated ? userId : userId;

      const query = `SELECT * FROM ${tableName} WHERE ${identifier} = $1`;
      const result = await pool.query(query, [targetId]);

      if (result.rows.length > 0) {
        userData[tableName] = result.rows.map(r => this._sanitizeRecord(r));
      }
    }

    return userData;
  }

  _sanitizeRecord(record) {
    const sanitized = { ...record };

    // Remover campos técnicos internos
    delete sanitized.password_hash;
    delete sanitized.refresh_token;
    delete sanitized.reset_token;

    return sanitized;
  }

  async _createExportFile(requestId, userData) {
    const filename = `${requestId}_data.json`;
    const filepath = path.join(this.exportDir, filename);

    const exportData = {
      exportId: requestId,
      exportedAt: new Date().toISOString(),
      dataController: 'BGE - Bachillerato General Estatal',
      purpose: 'Subject Access Request (GDPR Art. 15)',
      data: userData
    };

    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
    return filepath;
  }

  async _createJSONExport(requestId, userData) {
    const filename = `${requestId}_portable.json`;
    const filepath = path.join(this.exportDir, filename);

    await fs.writeFile(filepath, JSON.stringify(userData, null, 2));
    return filepath;
  }

  async _createCSVExport(requestId, userData) {
    const files = [];

    for (const [category, data] of Object.entries(userData)) {
      if (!Array.isArray(data)) continue;
      if (data.length === 0) continue;

      const filename = `${requestId}_${category}.csv`;
      const filepath = path.join(this.exportDir, filename);

      const headers = Object.keys(data[0]);
      const rows = [headers.join(',')];

      for (const record of data) {
        const values = headers.map(h => {
          const val = record[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val;
        });
        rows.push(values.join(','));
      }

      await fs.writeFile(filepath, rows.join('\n'));
      files.push(filepath);
    }

    return files;
  }

  async _createZipArchive(requestId, files) {
    const zipFilename = `${requestId}_export.zip`;
    const zipPath = path.join(this.exportDir, zipFilename);

    // Crear archivo ZIP
    const output = require('fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(zipPath));
      archive.on('error', reject);

      archive.pipe(output);

      if (Array.isArray(files)) {
        files.forEach(file => {
          archive.file(file, { name: path.basename(file) });
        });
      } else {
        archive.file(files, { name: path.basename(files) });
      }

      archive.finalize();
    });
  }

  async _checkRetentionRequirements(userId) {
    // Verificar si hay requerimientos legales de retención
    // Por ejemplo: registros académicos deben retenerse X años

    const query = `
      SELECT * FROM estudiantes WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length > 0) {
      const student = result.rows[0];

      // Los registros académicos deben retenerse 5 años después de egreso
      if (student.status === 'activo') {
        return {
          mustRetain: true,
          reason: 'Estudiante activo - registros académicos requeridos',
          retainUntil: null
        };
      }

      if (student.status === 'egresado') {
        const graduationDate = new Date(student.fecha_egreso || student.updated_at);
        const retainUntil = new Date(graduationDate);
        retainUntil.setFullYear(retainUntil.getFullYear() + 5);

        if (new Date() < retainUntil) {
          return {
            mustRetain: true,
            reason: 'Período de retención legal (5 años post-egreso)',
            retainUntil: retainUntil.toISOString()
          };
        }
      }
    }

    return { mustRetain: false };
  }

  async _eraseFromTable(tableName, config, userId) {
    const identifier = config.identifier;
    const targetId = config.isRelated ? userId : userId;

    // Algunas tablas se anonimizan en lugar de eliminarse
    const anonymizeTables = ['calificaciones', 'asistencia'];

    if (anonymizeTables.includes(tableName)) {
      // Anonimizar: reemplazar datos personales con valores genéricos
      const updateQuery = `
        UPDATE ${tableName}
        SET ${config.columns.filter(c => c !== identifier).map(c => `${c} = '[ELIMINADO]'`).join(', ')}
        WHERE ${identifier} = $1
        RETURNING id
      `;

      const result = await pool.query(updateQuery, [targetId]);
      return { deleted: 0, anonymized: result.rows.length };
    } else {
      // Eliminar completamente
      const deleteQuery = `
        DELETE FROM ${tableName}
        WHERE ${identifier} = $1
        RETURNING id
      `;

      const result = await pool.query(deleteQuery, [targetId]);
      return { deleted: result.rows.length, anonymized: 0 };
    }
  }

  _countRecords(userData) {
    let count = 0;
    for (const value of Object.values(userData)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (typeof value === 'object') {
        count += 1;
      }
    }
    return count;
  }
}

module.exports = new GDPRDataExportService();
module.exports.ServiceError = ServiceError;
module.exports.REQUEST_TYPES = REQUEST_TYPES;
module.exports.REQUEST_STATUS = REQUEST_STATUS;

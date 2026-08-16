/**
 * 🔒 GDPR DATA EXPORT SERVICE - v2.0.0
 * Servicio de exportación de datos para cumplimiento GDPR/FERPA
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar GDPRDataExportDAO
 * - Sin SQL directo en el servicio
 */

const GDPRDataExportDAO = require('../data/gdpr-data-export.dao.js');
const devLogger = require('../utils/devLogger.js');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

class ServiceError extends Error {
  constructor(message, statusCode = 500) { super(message); this.name = 'ServiceError'; this.statusCode = statusCode; }
}

const REQUEST_TYPES = { ACCESS: 'access', PORTABILITY: 'portability', RECTIFICATION: 'rectification', ERASURE: 'erasure', RESTRICTION: 'restriction' };
const REQUEST_STATUS = { PENDING: 'pending', PROCESSING: 'processing', COMPLETED: 'completed', REJECTED: 'rejected', EXPIRED: 'expired' };

const PERSONAL_DATA_TABLES = {
  usuarios: { columns: ['email', 'username', 'nombre', 'apellido_paterno', 'apellido_materno', 'telefono', 'direccion'], identifier: 'id' },
  estudiantes: { columns: ['matricula', 'nombre', 'apellido_paterno', 'apellido_materno', 'email', 'telefono', 'direccion', 'fecha_nacimiento', 'curp'], identifier: 'id' },
  padres: { columns: ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'telefono', 'direccion'], identifier: 'id' },
  docentes: { columns: ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'telefono', 'especialidad'], identifier: 'id' },
  calificaciones: { columns: ['calificacion', 'observaciones'], identifier: 'estudiante_id', isRelated: true },
  asistencia: { columns: ['fecha', 'status', 'justificacion'], identifier: 'estudiante_id', isRelated: true },
  citas: { columns: ['motivo', 'fecha_solicitada', 'hora_solicitada', 'notas'], identifier: 'usuario_id', isRelated: true },
  notificaciones: { columns: ['titulo', 'mensaje', 'tipo'], identifier: 'usuario_id', isRelated: true }
};

class GDPRDataExportService {
  constructor() { this.exportDir = process.env.GDPR_EXPORT_DIR || path.join(__dirname, '..', '..', 'exports', 'gdpr'); }

  async initialize() { await fs.mkdir(this.exportDir, { recursive: true }); devLogger.log('[GDPR] Servicio inicializado'); }

  async createRequest(options) {
    const { userId, type, reason = null, requestedBy = null } = options;
    if (!REQUEST_TYPES[type.toUpperCase()]) throw new ServiceError(`Tipo de solicitud inválido: ${type}`, 400);
    const requestId = this._generateRequestId();
    const result = await GDPRDataExportDAO.createRequest(requestId, userId, type, REQUEST_STATUS.PENDING, reason, requestedBy);
    devLogger.log(`[GDPR] Solicitud creada: ${requestId} tipo: ${type}`);
    return result;
  }

  async processAccessRequest(requestId) {
    const request = await this._getRequest(requestId);
    if (request.status !== REQUEST_STATUS.PENDING) throw new ServiceError(`Solicitud no está pendiente: ${request.status}`, 400);
    await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.PROCESSING);
    try {
      const userData = await this._collectUserData(request.user_id);
      const exportPath = await this._createExportFile(requestId, userData);
      await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.COMPLETED, { exportPath, completedAt: new Date().toISOString() }, true);
      return { requestId, status: REQUEST_STATUS.COMPLETED, exportPath, dataCategories: Object.keys(userData), totalRecords: this._countRecords(userData) };
    } catch (error) {
      await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.REJECTED, { error: error.message });
      throw error;
    }
  }

  async processPortabilityRequest(requestId, format = 'json') {
    const request = await this._getRequest(requestId);
    await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.PROCESSING);
    try {
      const userData = await this._collectUserData(request.user_id);
      let exportPath = format === 'json' ? await this._createJSONExport(requestId, userData) : await this._createCSVExport(requestId, userData);
      const zipPath = await this._createZipArchive(requestId, exportPath);
      await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.COMPLETED, { exportPath: zipPath, format }, true);
      return { requestId, status: REQUEST_STATUS.COMPLETED, downloadPath: zipPath, format, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
    } catch (error) { await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.REJECTED); throw error; }
  }

  async processErasureRequest(requestId) {
    const request = await this._getRequest(requestId);
    await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.PROCESSING);
    try {
      const userId = request.user_id;
      const erasureResult = { tablesProcessed: [], recordsDeleted: 0, recordsAnonymized: 0 };
      const retentionCheck = await this._checkRetentionRequirements(userId);
      if (retentionCheck.mustRetain) throw new ServiceError(`No se puede eliminar: ${retentionCheck.reason}`, 400);
      const anonymizeTables = ['calificaciones', 'asistencia'];
      for (const [tableName, config] of Object.entries(PERSONAL_DATA_TABLES)) {
        const targetId = config.isRelated ? userId : userId;
        if (anonymizeTables.includes(tableName)) {
          erasureResult.recordsAnonymized += await GDPRDataExportDAO.anonymizeTable(tableName, config.columns, config.identifier, targetId);
        } else {
          erasureResult.recordsDeleted += await GDPRDataExportDAO.deleteFromTable(tableName, config.identifier, targetId);
        }
        erasureResult.tablesProcessed.push(tableName);
      }
      await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.COMPLETED, { erasureResult }, true);
      devLogger.log(`[GDPR] Supresión completada para usuario ${userId}:`, erasureResult);
      return { requestId, status: REQUEST_STATUS.COMPLETED, ...erasureResult };
    } catch (error) { await GDPRDataExportDAO.updateRequestStatus(requestId, REQUEST_STATUS.REJECTED, { error: error.message }); throw error; }
  }

  async getRequestStatus(requestId) {
    const r = await this._getRequest(requestId);
    return { id: r.id, type: r.type, status: r.status, createdAt: r.created_at, expiresAt: r.expires_at, completedAt: r.completed_at };
  }

  async listUserRequests(userId) { return GDPRDataExportDAO.listUserRequests(userId); }

  async downloadExport(requestId) {
    const request = await this._getRequest(requestId);
    if (request.status !== REQUEST_STATUS.COMPLETED) throw new ServiceError('La solicitud no está completada', 400);
    if (!request.export_path) throw new ServiceError('No hay archivo de exportación disponible', 404);
    if (new Date() > new Date(request.expires_at)) throw new ServiceError('La exportación ha expirado', 410);
    return { path: request.export_path, filename: path.basename(request.export_path) };
  }

  async generateConsentReport(tenantId = null) {
    const rows = await GDPRDataExportDAO.getConsentReport(tenantId);
    return { generatedAt: new Date().toISOString(), totalUsers: new Set(rows.map(r => r.id)).size, consents: rows };
  }

  async recordConsent(options) {
    const { userId, type, given = true, ipAddress = null } = options;
    const result = given ? await GDPRDataExportDAO.giveConsent(userId, type, ipAddress) : await GDPRDataExportDAO.revokeConsent(userId, type);
    devLogger.log(`[GDPR] Consentimiento ${given ? 'otorgado' : 'revocado'}: usuario ${userId}, tipo ${type}`);
    return result;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  _generateRequestId() { return `gdpr_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`; }

  async _getRequest(requestId) {
    const result = await GDPRDataExportDAO.getRequest(requestId);
    if (!result) throw new ServiceError('Solicitud no encontrada', 404);
    return result;
  }

  async _collectUserData(userId) {
    const userData = {};
    const user = await GDPRDataExportDAO.getUserData(userId);
    if (user) userData.usuario = this._sanitizeRecord(user);
    for (const [tableName, config] of Object.entries(PERSONAL_DATA_TABLES)) {
      if (tableName === 'usuarios') continue;
      const rows = await GDPRDataExportDAO.getTableData(tableName, config.identifier, userId);
      if (rows.length > 0) userData[tableName] = rows.map(r => this._sanitizeRecord(r));
    }
    return userData;
  }

  _sanitizeRecord(record) { const s = { ...record }; delete s.password_hash; delete s.refresh_token; delete s.reset_token; return s; }

  async _createExportFile(requestId, userData) {
    const filepath = path.join(this.exportDir, `${requestId}_data.json`);
    await fs.writeFile(filepath, JSON.stringify({ exportId: requestId, exportedAt: new Date().toISOString(), dataController: 'BGE', purpose: 'Subject Access Request (GDPR Art. 15)', data: userData }, null, 2));
    return filepath;
  }

  async _createJSONExport(requestId, userData) { const p = path.join(this.exportDir, `${requestId}_portable.json`); await fs.writeFile(p, JSON.stringify(userData, null, 2)); return p; }

  async _createCSVExport(requestId, userData) {
    const files = [];
    for (const [category, data] of Object.entries(userData)) {
      if (!Array.isArray(data) || data.length === 0) continue;
      const filepath = path.join(this.exportDir, `${requestId}_${category}.csv`);
      const headers = Object.keys(data[0]); const rows = [headers.join(',')];
      for (const r of data) { rows.push(headers.map(h => { const v = r[h]; if (v === null || v === undefined) return ''; if (typeof v === 'string' && v.includes(',')) return `"${v}"`; return v; }).join(',')); }
      await fs.writeFile(filepath, rows.join('\n')); files.push(filepath);
    }
    return files;
  }

  async _createZipArchive(requestId, files) {
    const zipPath = path.join(this.exportDir, `${requestId}_export.zip`);
    const output = require('fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(zipPath)); archive.on('error', reject); archive.pipe(output);
      (Array.isArray(files) ? files : [files]).forEach(f => archive.file(f, { name: path.basename(f) }));
      archive.finalize();
    });
  }

  async _checkRetentionRequirements(userId) {
    const student = await GDPRDataExportDAO.getStudentData(userId);
    if (student) {
      if (student.status === 'activo') return { mustRetain: true, reason: 'Estudiante activo - registros académicos requeridos', retainUntil: null };
      if (student.status === 'egresado') {
        const retainUntil = new Date(student.fecha_egreso || student.updated_at); retainUntil.setFullYear(retainUntil.getFullYear() + 5);
        if (new Date() < retainUntil) return { mustRetain: true, reason: 'Período de retención legal (5 años post-egreso)', retainUntil: retainUntil.toISOString() };
      }
    }
    return { mustRetain: false };
  }

  _countRecords(userData) { let c = 0; for (const v of Object.values(userData)) { c += Array.isArray(v) ? v.length : (typeof v === 'object' ? 1 : 0); } return c; }
}

module.exports = new GDPRDataExportService();
module.exports.ServiceError = ServiceError;
module.exports.REQUEST_TYPES = REQUEST_TYPES;
module.exports.REQUEST_STATUS = REQUEST_STATUS;

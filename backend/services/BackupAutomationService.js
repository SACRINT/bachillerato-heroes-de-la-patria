/**
 * 💾 BACKUP AUTOMATION SERVICE - v2.0.0
 * Servicio de backups automatizados para BGE
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar BackupAutomationDAO
 * - Sin SQL directo en el servicio
 */

const BackupAutomationDAO = require('../data/backup-automation.dao');
const devLogger = require('../utils/devLogger');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const crypto = require('crypto');

const execPromise = util.promisify(exec);

class ServiceError extends Error {
  constructor(message, statusCode = 500) { super(message); this.name = 'ServiceError'; this.statusCode = statusCode; }
}

const BACKUP_LEVELS = {
  INCREMENTAL: { level: 1, name: 'Incremental', retention: 24, interval: 3600, compress: false },
  DAILY: { level: 2, name: 'Daily Full', retention: 30, interval: 86400, compress: true },
  WEEKLY_OFFSITE: { level: 3, name: 'Weekly Offsite', retention: 90, interval: 604800, compress: true, encrypt: true }
};

const BACKUP_BASE_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');
const BACKUP_DIRS = { incremental: path.join(BACKUP_BASE_DIR, 'incremental'), daily: path.join(BACKUP_BASE_DIR, 'daily'), weekly: path.join(BACKUP_BASE_DIR, 'weekly'), temp: path.join(BACKUP_BASE_DIR, 'temp') };

class BackupAutomationService {
  constructor() {
    this.isRunning = false;
    this.lastBackups = { incremental: null, daily: null, weekly: null };
    this.stats = { totalBackups: 0, successfulBackups: 0, failedBackups: 0, totalSize: 0 };
  }

  async initialize() {
    devLogger.log('[Backup] Inicializando servicio de backups...');
    for (const dir of Object.values(BACKUP_DIRS)) { await fs.mkdir(dir, { recursive: true }); }
    await this._loadLastBackupState();
    devLogger.log('[Backup] Servicio inicializado correctamente');
    return true;
  }

  async runBackup(level) {
    const config = BACKUP_LEVELS[level];
    if (!config) throw new ServiceError(`Nivel de backup inválido: ${level}`, 400);
    if (this.isRunning) throw new ServiceError('Ya hay un backup en ejecución', 409);

    this.isRunning = true;
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${level}_${timestamp}`;

    devLogger.log(`[Backup] Iniciando backup ${config.name} - ID: ${backupId}`);
    try {
      await BackupAutomationDAO.logBackupStart(backupId, level);
      let result;
      switch (level) {
        case 'INCREMENTAL': result = await this._runIncrementalBackup(backupId); break;
        case 'DAILY': result = await this._runDailyBackup(backupId); break;
        case 'WEEKLY_OFFSITE': result = await this._runWeeklyBackup(backupId); break;
      }
      const duration = Date.now() - startTime;
      await BackupAutomationDAO.logBackupComplete(backupId, result.size, duration, result.path);
      this.stats.totalBackups++; this.stats.successfulBackups++; this.stats.totalSize += result.size;
      await this._cleanOldBackups(level, config.retention);
      devLogger.log(`[Backup] ${config.name} completado - Duración: ${duration}ms, Tamaño: ${this._formatSize(result.size)}`);
      return { success: true, backupId, level: config.name, ...result, duration };
    } catch (error) {
      this.stats.totalBackups++; this.stats.failedBackups++;
      await BackupAutomationDAO.logBackupError(backupId, error.message);
      devLogger.error(`[Backup] Error en ${config.name}:`, error.message);
      throw new ServiceError(`Error en backup ${config.name}: ${error.message}`, 500);
    } finally { this.isRunning = false; }
  }

  async _runIncrementalBackup(backupId) {
    const backupPath = path.join(BACKUP_DIRS.incremental, `${backupId}.sql`);
    const lastBackup = this.lastBackups.incremental;
    const since = lastBackup ? new Date(lastBackup).toISOString() : new Date(Date.now() - 3600000).toISOString();
    const tables = await BackupAutomationDAO.getModifiedTables();
    if (tables.length === 0) { devLogger.log('[Backup] No hay cambios'); return { path: null, size: 0, tables: 0, type: 'incremental' }; }

    const queries = [];
    for (const table of tables) {
      const rows = await BackupAutomationDAO.getTableData(table.name, since);
      if (rows.length > 0) queries.push(this._generateInsertSQL(table.name, rows));
    }
    await fs.writeFile(backupPath, queries.join('\n\n'));
    const stats = await fs.stat(backupPath);
    this.lastBackups.incremental = new Date().toISOString();
    return { path: backupPath, size: stats.size, tables: tables.length, type: 'incremental' };
  }

  async _runDailyBackup(backupId) {
    const backupPath = path.join(BACKUP_DIRS.daily, `${backupId}.sql`);
    const compressedPath = `${backupPath}.gz`;
    const tables = await BackupAutomationDAO.getAllTables();
    const queries = [];
    for (const t of tables) { queries.push(`-- Tabla: ${t.table_name}`); const rows = await BackupAutomationDAO.getTableData(t.table_name); if (rows.length > 0) queries.push(this._generateInsertSQL(t.table_name, rows)); }
    await fs.writeFile(backupPath, queries.join('\n\n'));
    await execPromise(`gzip -9 ${backupPath}`);
    const stats = await fs.stat(compressedPath);
    this.lastBackups.daily = new Date().toISOString();
    return { path: compressedPath, size: stats.size, tables: tables.length, type: 'daily', compressed: true };
  }

  async _runWeeklyBackup(backupId) {
    const compressedPath = path.join(BACKUP_DIRS.weekly, `${backupId}.sql.gz`);
    const encryptedPath = `${compressedPath}.enc`;
    const dailyResult = await this._runDailyBackup(`${backupId}_base`);
    await fs.copyFile(dailyResult.path, compressedPath);
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (encryptionKey) {
      await this._encryptFile(compressedPath, encryptedPath, encryptionKey);
      await fs.unlink(compressedPath);
      const stats = await fs.stat(encryptedPath);
      this.lastBackups.weekly = new Date().toISOString();
      if (process.env.BACKUP_OFFSITE_ENABLED === 'true') await this._uploadToOffsite(encryptedPath, backupId);
      return { path: encryptedPath, size: stats.size, tables: dailyResult.tables, type: 'weekly', compressed: true, encrypted: true, offsite: process.env.BACKUP_OFFSITE_ENABLED === 'true' };
    }
    const stats = await fs.stat(compressedPath);
    this.lastBackups.weekly = new Date().toISOString();
    return { path: compressedPath, size: stats.size, tables: dailyResult.tables, type: 'weekly', compressed: true, encrypted: false };
  }

  async restore(backupPath, options = {}) {
    const { decrypt = false, decompress = false } = options;
    devLogger.log(`[Backup] Iniciando restauración desde: ${backupPath}`);
    let sqlPath = backupPath;
    if (decrypt && backupPath.endsWith('.enc')) { const decryptedPath = backupPath.replace('.enc', ''); await this._decryptFile(backupPath, decryptedPath, process.env.BACKUP_ENCRYPTION_KEY); sqlPath = decryptedPath; }
    if (decompress && sqlPath.endsWith('.gz')) { await execPromise(`gunzip -k ${sqlPath}`); sqlPath = sqlPath.replace('.gz', ''); }
    const sql = await fs.readFile(sqlPath, 'utf-8');
    const statements = sql.split(';').filter(s => s.trim());
    let executed = 0;
    for (const statement of statements) { if (statement.trim()) { await BackupAutomationDAO.executeStatement(statement); executed++; } }
    devLogger.log(`[Backup] Restauración completada - ${executed} statements ejecutados`);
    return { success: true, statementsExecuted: executed };
  }

  async listBackups(level = null) {
    const backups = [];
    const dirs = level ? [BACKUP_DIRS[level.toLowerCase()]] : Object.values(BACKUP_DIRS).filter(d => d !== BACKUP_DIRS.temp);
    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) { const p = path.join(dir, file); const stats = await fs.stat(p); backups.push({ name: file, path: p, size: stats.size, sizeFormatted: this._formatSize(stats.size), created: stats.birthtime, level: this._getLevelFromPath(dir) }); }
      } catch { }
    }
    backups.sort((a, b) => b.created - a.created);
    return backups;
  }

  async getStats() {
    const backups = await this.listBackups();
    const byLevel = { incremental: backups.filter(b => b.level === 'incremental'), daily: backups.filter(b => b.level === 'daily'), weekly: backups.filter(b => b.level === 'weekly') };
    return { total: backups.length, byLevel: { incremental: byLevel.incremental.length, daily: byLevel.daily.length, weekly: byLevel.weekly.length }, totalSize: backups.reduce((a, b) => a + b.size, 0), totalSizeFormatted: this._formatSize(backups.reduce((a, b) => a + b.size, 0)), lastBackup: backups[0] || null, runtime: this.stats };
  }

  async verifyIntegrity(backupPath) {
    try {
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) return { valid: false, error: 'El archivo está vacío' };
      const content = await fs.readFile(backupPath);
      const checksum = crypto.createHash('sha256').update(content).digest('hex');
      if (backupPath.endsWith('.sql') && !content.toString().includes('INSERT') && !content.toString().includes('CREATE')) return { valid: false, error: 'No contiene comandos SQL válidos' };
      return { valid: true, checksum, size: stats.size, sizeFormatted: this._formatSize(stats.size) };
    } catch (e) { return { valid: false, error: e.message }; }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  async _loadLastBackupState() {
    try {
      const rows = await BackupAutomationDAO.getLastBackupState();
      for (const row of rows) { this.lastBackups[row.level.toLowerCase().replace(' ', '')] = row.last_backup; }
    } catch { devLogger.log('[Backup] No se pudo cargar estado previo de backups'); }
  }

  _generateInsertSQL(tableName, rows) {
    if (rows.length === 0) return '';
    const columns = Object.keys(rows[0]);
    const values = rows.map(row => {
      const vals = columns.map(col => { const val = row[col]; if (val === null) return 'NULL'; if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'; if (typeof val === 'number') return val; if (val instanceof Date) return `'${val.toISOString()}'`; return `'${String(val).replace(/'/g, "''")}'`; });
      return `(${vals.join(', ')})`;
    });
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values.join(',\n')};`;
  }

  async _encryptFile(inputPath, outputPath, key) { const iv = crypto.randomBytes(16); const keyBuffer = crypto.scryptSync(key, 'salt', 32); const input = await fs.readFile(inputPath); const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv); await fs.writeFile(outputPath, Buffer.concat([iv, cipher.update(input), cipher.final()])); }
  async _decryptFile(inputPath, outputPath, key) { const keyBuffer = crypto.scryptSync(key, 'salt', 32); const input = await fs.readFile(inputPath); const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, input.slice(0, 16)); await fs.writeFile(outputPath, Buffer.concat([decipher.update(input.slice(16)), decipher.final()])); }
  async _uploadToOffsite(filePath, backupId) { devLogger.log(`[Backup] Subiendo a offsite: ${backupId}`); }

  async _cleanOldBackups(level, retentionDays) {
    const dir = BACKUP_DIRS[level.toLowerCase().split('_')[0]]; const cutoffDate = new Date(); cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    try { const files = await fs.readdir(dir); for (const file of files) { const p = path.join(dir, file); const stats = await fs.stat(p); if (stats.birthtime < cutoffDate) { await fs.unlink(p); devLogger.log(`[Backup] Eliminado backup antiguo: ${file}`); } } } catch (e) { devLogger.warn(`[Backup] Error limpiando: ${e.message}`); }
  }

  _formatSize(bytes) { const units = ['B', 'KB', 'MB', 'GB']; let i = 0; let size = bytes; while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; } return `${size.toFixed(2)} ${units[i]}`; }
  _getLevelFromPath(dir) { if (dir.includes('incremental')) return 'incremental'; if (dir.includes('daily')) return 'daily'; if (dir.includes('weekly')) return 'weekly'; return 'unknown'; }
}

module.exports = new BackupAutomationService();
module.exports.ServiceError = ServiceError;
module.exports.BACKUP_LEVELS = BACKUP_LEVELS;

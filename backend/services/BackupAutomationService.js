/**
 * 💾 BACKUP AUTOMATION SERVICE - v1.0.0
 * Servicio de backups automatizados para BGE
 *
 * v5.0.0 Features
 * Fecha: 19 Noviembre 2025
 *
 * 3 Niveles de Backup:
 * - Nivel 1: Backups incrementales cada hora
 * - Nivel 2: Backups completos diarios
 * - Nivel 3: Backups offsite semanales (disaster recovery)
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const crypto = require('crypto');

const execPromise = util.promisify(exec);

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

// Configuración de niveles
const BACKUP_LEVELS = {
  INCREMENTAL: {
    level: 1,
    name: 'Incremental',
    retention: 24,        // Horas
    interval: 60 * 60,    // 1 hora en segundos
    compress: false
  },
  DAILY: {
    level: 2,
    name: 'Daily Full',
    retention: 30,        // Días
    interval: 24 * 60 * 60, // 1 día en segundos
    compress: true
  },
  WEEKLY_OFFSITE: {
    level: 3,
    name: 'Weekly Offsite',
    retention: 90,        // Días
    interval: 7 * 24 * 60 * 60, // 1 semana en segundos
    compress: true,
    encrypt: true
  }
};

// Directorios
const BACKUP_BASE_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');
const BACKUP_DIRS = {
  incremental: path.join(BACKUP_BASE_DIR, 'incremental'),
  daily: path.join(BACKUP_BASE_DIR, 'daily'),
  weekly: path.join(BACKUP_BASE_DIR, 'weekly'),
  temp: path.join(BACKUP_BASE_DIR, 'temp')
};

class BackupAutomationService {
  constructor() {
    this.isRunning = false;
    this.lastBackups = {
      incremental: null,
      daily: null,
      weekly: null
    };
    this.stats = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      totalSize: 0
    };
  }

  /**
   * Inicializar servicio de backups
   */
  async initialize() {
    devLogger.log('[Backup] Inicializando servicio de backups...');

    try {
      // Crear directorios si no existen
      for (const dir of Object.values(BACKUP_DIRS)) {
        await fs.mkdir(dir, { recursive: true });
      }

      // Cargar último estado de backups
      await this._loadLastBackupState();

      devLogger.log('[Backup] Servicio inicializado correctamente');
      return true;
    } catch (error) {
      devLogger.error('[Backup] Error al inicializar:', error.message);
      throw new ServiceError('Error al inicializar servicio de backups', 500);
    }
  }

  /**
   * Ejecutar backup según nivel
   * @param {string} level - Nivel de backup (INCREMENTAL, DAILY, WEEKLY_OFFSITE)
   * @returns {Promise<Object>} Resultado del backup
   */
  async runBackup(level) {
    const config = BACKUP_LEVELS[level];
    if (!config) {
      throw new ServiceError(`Nivel de backup inválido: ${level}`, 400);
    }

    if (this.isRunning) {
      throw new ServiceError('Ya hay un backup en ejecución', 409);
    }

    this.isRunning = true;
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${level}_${timestamp}`;

    devLogger.log(`[Backup] Iniciando backup ${config.name} - ID: ${backupId}`);

    try {
      // Registrar inicio
      await this._logBackupStart(backupId, level);

      let result;
      switch (level) {
        case 'INCREMENTAL':
          result = await this._runIncrementalBackup(backupId);
          break;
        case 'DAILY':
          result = await this._runDailyBackup(backupId);
          break;
        case 'WEEKLY_OFFSITE':
          result = await this._runWeeklyBackup(backupId);
          break;
      }

      // Registrar éxito
      const duration = Date.now() - startTime;
      await this._logBackupComplete(backupId, result, duration);

      // Actualizar estadísticas
      this.stats.totalBackups++;
      this.stats.successfulBackups++;
      this.stats.totalSize += result.size;

      // Limpiar backups antiguos
      await this._cleanOldBackups(level, config.retention);

      devLogger.log(`[Backup] ${config.name} completado - Duración: ${duration}ms, Tamaño: ${this._formatSize(result.size)}`);

      return {
        success: true,
        backupId,
        level: config.name,
        ...result,
        duration
      };
    } catch (error) {
      this.stats.totalBackups++;
      this.stats.failedBackups++;

      await this._logBackupError(backupId, error.message);
      devLogger.error(`[Backup] Error en ${config.name}:`, error.message);

      throw new ServiceError(`Error en backup ${config.name}: ${error.message}`, 500);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Backup incremental (Nivel 1)
   * Solo cambios desde el último backup
   */
  async _runIncrementalBackup(backupId) {
    const backupPath = path.join(BACKUP_DIRS.incremental, `${backupId}.sql`);

    // Obtener timestamp del último backup
    const lastBackup = this.lastBackups.incremental;
    const since = lastBackup
      ? new Date(lastBackup).toISOString()
      : new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Última hora

    // Exportar solo tablas con cambios recientes
    const tables = await this._getModifiedTables(since);

    if (tables.length === 0) {
      devLogger.log('[Backup] No hay cambios desde el último backup incremental');
      return {
        path: null,
        size: 0,
        tables: 0,
        type: 'incremental'
      };
    }

    // Exportar datos modificados
    const queries = [];
    for (const table of tables) {
      const query = `
        SELECT * FROM ${table.name}
        WHERE updated_at > '${since}' OR created_at > '${since}'
      `;
      const result = await pool.query(query);

      if (result.rows.length > 0) {
        queries.push(this._generateInsertSQL(table.name, result.rows));
      }
    }

    // Escribir archivo
    const content = queries.join('\n\n');
    await fs.writeFile(backupPath, content);

    const stats = await fs.stat(backupPath);
    this.lastBackups.incremental = new Date().toISOString();

    return {
      path: backupPath,
      size: stats.size,
      tables: tables.length,
      type: 'incremental'
    };
  }

  /**
   * Backup completo diario (Nivel 2)
   * Todas las tablas, comprimido
   */
  async _runDailyBackup(backupId) {
    const backupPath = path.join(BACKUP_DIRS.daily, `${backupId}.sql`);
    const compressedPath = `${backupPath}.gz`;

    // Obtener todas las tablas
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = await pool.query(tablesQuery);

    // Exportar cada tabla
    const queries = [];
    for (const table of tables.rows) {
      const tableName = table.table_name;

      // Schema de la tabla
      queries.push(`-- Tabla: ${tableName}`);

      // Datos
      const result = await pool.query(`SELECT * FROM ${tableName}`);
      if (result.rows.length > 0) {
        queries.push(this._generateInsertSQL(tableName, result.rows));
      }
    }

    // Escribir y comprimir
    const content = queries.join('\n\n');
    await fs.writeFile(backupPath, content);

    // Comprimir con gzip
    await execPromise(`gzip -9 ${backupPath}`);

    const stats = await fs.stat(compressedPath);
    this.lastBackups.daily = new Date().toISOString();

    return {
      path: compressedPath,
      size: stats.size,
      tables: tables.rows.length,
      type: 'daily',
      compressed: true
    };
  }

  /**
   * Backup offsite semanal (Nivel 3)
   * Completo, comprimido y encriptado para disaster recovery
   */
  async _runWeeklyBackup(backupId) {
    const backupPath = path.join(BACKUP_DIRS.weekly, `${backupId}.sql`);
    const compressedPath = `${backupPath}.gz`;
    const encryptedPath = `${compressedPath}.enc`;

    // Ejecutar backup diario primero
    const dailyResult = await this._runDailyBackup(`${backupId}_base`);

    // Copiar a directorio weekly
    const sourceFile = dailyResult.path;
    await fs.copyFile(sourceFile, compressedPath);

    // Encriptar si hay clave configurada
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (encryptionKey) {
      await this._encryptFile(compressedPath, encryptedPath, encryptionKey);
      await fs.unlink(compressedPath); // Eliminar versión sin encriptar

      const stats = await fs.stat(encryptedPath);
      this.lastBackups.weekly = new Date().toISOString();

      // Enviar a almacenamiento offsite (S3, GCS, etc)
      if (process.env.BACKUP_OFFSITE_ENABLED === 'true') {
        await this._uploadToOffsite(encryptedPath, backupId);
      }

      return {
        path: encryptedPath,
        size: stats.size,
        tables: dailyResult.tables,
        type: 'weekly',
        compressed: true,
        encrypted: true,
        offsite: process.env.BACKUP_OFFSITE_ENABLED === 'true'
      };
    } else {
      const stats = await fs.stat(compressedPath);
      this.lastBackups.weekly = new Date().toISOString();

      return {
        path: compressedPath,
        size: stats.size,
        tables: dailyResult.tables,
        type: 'weekly',
        compressed: true,
        encrypted: false
      };
    }
  }

  /**
   * Restaurar backup
   * @param {string} backupPath - Ruta al archivo de backup
   * @param {Object} options - Opciones de restauración
   */
  async restore(backupPath, options = {}) {
    const { decrypt = false, decompress = false } = options;

    devLogger.log(`[Backup] Iniciando restauración desde: ${backupPath}`);

    try {
      let sqlPath = backupPath;

      // Desencriptar si es necesario
      if (decrypt && backupPath.endsWith('.enc')) {
        const decryptedPath = backupPath.replace('.enc', '');
        const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
        await this._decryptFile(backupPath, decryptedPath, encryptionKey);
        sqlPath = decryptedPath;
      }

      // Descomprimir si es necesario
      if (decompress && sqlPath.endsWith('.gz')) {
        await execPromise(`gunzip -k ${sqlPath}`);
        sqlPath = sqlPath.replace('.gz', '');
      }

      // Leer y ejecutar SQL
      const sql = await fs.readFile(sqlPath, 'utf-8');
      const statements = sql.split(';').filter(s => s.trim());

      let executed = 0;
      for (const statement of statements) {
        if (statement.trim()) {
          await pool.query(statement);
          executed++;
        }
      }

      devLogger.log(`[Backup] Restauración completada - ${executed} statements ejecutados`);

      return {
        success: true,
        statementsExecuted: executed
      };
    } catch (error) {
      devLogger.error('[Backup] Error en restauración:', error.message);
      throw new ServiceError(`Error al restaurar backup: ${error.message}`, 500);
    }
  }

  /**
   * Obtener lista de backups disponibles
   * @param {string} level - Nivel de backup (opcional)
   */
  async listBackups(level = null) {
    const backups = [];

    const dirs = level
      ? [BACKUP_DIRS[level.toLowerCase()]]
      : Object.values(BACKUP_DIRS).filter(d => d !== BACKUP_DIRS.temp);

    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);

          backups.push({
            name: file,
            path: filePath,
            size: stats.size,
            sizeFormatted: this._formatSize(stats.size),
            created: stats.birthtime,
            level: this._getLevelFromPath(dir)
          });
        }
      } catch (error) {
        // Directorio no existe, ignorar
      }
    }

    // Ordenar por fecha descendente
    backups.sort((a, b) => b.created - a.created);

    return backups;
  }

  /**
   * Obtener estadísticas de backups
   */
  async getStats() {
    const backups = await this.listBackups();

    const byLevel = {
      incremental: backups.filter(b => b.level === 'incremental'),
      daily: backups.filter(b => b.level === 'daily'),
      weekly: backups.filter(b => b.level === 'weekly')
    };

    return {
      total: backups.length,
      byLevel: {
        incremental: byLevel.incremental.length,
        daily: byLevel.daily.length,
        weekly: byLevel.weekly.length
      },
      totalSize: backups.reduce((acc, b) => acc + b.size, 0),
      totalSizeFormatted: this._formatSize(backups.reduce((acc, b) => acc + b.size, 0)),
      lastBackup: backups[0] || null,
      runtime: this.stats
    };
  }

  /**
   * Verificar integridad de un backup
   * @param {string} backupPath - Ruta al backup
   */
  async verifyIntegrity(backupPath) {
    try {
      const stats = await fs.stat(backupPath);

      if (stats.size === 0) {
        return { valid: false, error: 'El archivo está vacío' };
      }

      // Calcular checksum
      const content = await fs.readFile(backupPath);
      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      // Para archivos SQL, verificar sintaxis básica
      if (backupPath.endsWith('.sql')) {
        const sql = content.toString();
        if (!sql.includes('INSERT') && !sql.includes('CREATE')) {
          return { valid: false, error: 'No contiene comandos SQL válidos' };
        }
      }

      return {
        valid: true,
        checksum,
        size: stats.size,
        sizeFormatted: this._formatSize(stats.size)
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  async _loadLastBackupState() {
    try {
      const query = `
        SELECT level, MAX(created_at) as last_backup
        FROM backup_log
        WHERE status = 'completed'
        GROUP BY level
      `;
      const result = await pool.query(query);

      for (const row of result.rows) {
        const levelKey = row.level.toLowerCase().replace(' ', '');
        this.lastBackups[levelKey] = row.last_backup;
      }
    } catch {
      // Tabla puede no existir aún
      devLogger.log('[Backup] No se pudo cargar estado previo de backups');
    }
  }

  async _getModifiedTables(since) {
    // Obtener tablas con columnas de timestamp
    const query = `
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (column_name = 'updated_at' OR column_name = 'created_at')
    `;
    const result = await pool.query(query);
    return result.rows.map(r => ({ name: r.table_name }));
  }

  _generateInsertSQL(tableName, rows) {
    if (rows.length === 0) return '';

    const columns = Object.keys(rows[0]);
    const values = rows.map(row => {
      const vals = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return val;
        if (val instanceof Date) return `'${val.toISOString()}'`;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return `(${vals.join(', ')})`;
    });

    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values.join(',\n')};`;
  }

  async _encryptFile(inputPath, outputPath, key) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);

    const input = await fs.readFile(inputPath);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

    const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);
    await fs.writeFile(outputPath, encrypted);
  }

  async _decryptFile(inputPath, outputPath, key) {
    const algorithm = 'aes-256-cbc';
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);

    const input = await fs.readFile(inputPath);
    const iv = input.slice(0, 16);
    const encrypted = input.slice(16);

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    await fs.writeFile(outputPath, decrypted);
  }

  async _uploadToOffsite(filePath, backupId) {
    // Implementar según proveedor (S3, GCS, Azure Blob, etc)
    devLogger.log(`[Backup] Subiendo a offsite: ${backupId}`);
    // TODO: Implementar con AWS SDK, Google Cloud SDK, etc.
  }

  async _cleanOldBackups(level, retentionDays) {
    const dir = BACKUP_DIRS[level.toLowerCase().split('_')[0]];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.birthtime < cutoffDate) {
          await fs.unlink(filePath);
          devLogger.log(`[Backup] Eliminado backup antiguo: ${file}`);
        }
      }
    } catch (error) {
      devLogger.warn(`[Backup] Error limpiando backups antiguos: ${error.message}`);
    }
  }

  async _logBackupStart(backupId, level) {
    try {
      await pool.query(`
        INSERT INTO backup_log (backup_id, level, status, started_at)
        VALUES ($1, $2, 'running', NOW())
      `, [backupId, level]);
    } catch {
      // Tabla puede no existir
    }
  }

  async _logBackupComplete(backupId, result, duration) {
    try {
      await pool.query(`
        UPDATE backup_log
        SET status = 'completed', completed_at = NOW(), size_bytes = $2, duration_ms = $3, path = $4
        WHERE backup_id = $1
      `, [backupId, result.size, duration, result.path]);
    } catch {
      // Ignorar
    }
  }

  async _logBackupError(backupId, errorMessage) {
    try {
      await pool.query(`
        UPDATE backup_log
        SET status = 'failed', error_message = $2, completed_at = NOW()
        WHERE backup_id = $1
      `, [backupId, errorMessage]);
    } catch {
      // Ignorar
    }
  }

  _formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  _getLevelFromPath(dir) {
    if (dir.includes('incremental')) return 'incremental';
    if (dir.includes('daily')) return 'daily';
    if (dir.includes('weekly')) return 'weekly';
    return 'unknown';
  }
}

module.exports = new BackupAutomationService();
module.exports.ServiceError = ServiceError;
module.exports.BACKUP_LEVELS = BACKUP_LEVELS;

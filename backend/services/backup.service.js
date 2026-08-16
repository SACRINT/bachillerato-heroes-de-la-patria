"use strict";
/**
 * 💾 BACKUP SERVICE - TypeScript
 * Servicio para respaldo automático de datos críticos del sistema
 *
 * Features:
 * - Backup completo y parcial (solo datos)
 * - Programación automática con cron
 * - Limpieza de backups antiguos
 * - Health checks
 * - Estadísticas
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
exports.getBackupService = getBackupService;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
// Dynamic imports for optional dependencies
let archiver;
let cron;
try {
    archiver = require('archiver');
    cron = require('node-cron');
}
catch (e) {
    devLogger_1.default.warn('[BackupService] archiver o node-cron no disponible');
}
// =====================================================
// BACKUP SERVICE CLASS
// =====================================================
class BackupService {
    constructor() {
        this.backupDir = path_1.default.join(__dirname, '../backups');
        this.maxBackups = 30;
        this.isRunning = false;
        devLogger_1.default.log('[BackupService] 💾 Servicio de backup inicializado');
        this.init();
    }
    /**
     * Inicializar servicio de backup
     */
    async init() {
        try {
            await this.ensureBackupDirectory();
            this.scheduleBackups();
            await this.cleanOldBackups();
            devLogger_1.default.log('[BackupService] ✅ Servicio configurado correctamente');
        }
        catch (error) {
            devLogger_1.default.error(`[BackupService] ❌ Error inicializando: ${error.message}`);
        }
    }
    /**
     * Asegurar que existe el directorio de backups
     */
    async ensureBackupDirectory() {
        try {
            await promises_1.default.access(this.backupDir);
        }
        catch (error) {
            await promises_1.default.mkdir(this.backupDir, { recursive: true });
            devLogger_1.default.log(`[BackupService] 📁 Directorio creado: ${this.backupDir}`);
        }
    }
    /**
     * Programar backups automáticos
     */
    scheduleBackups() {
        if (!cron) {
            devLogger_1.default.warn('[BackupService] node-cron no disponible, backups manuales solamente');
            return;
        }
        // Backup diario a las 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            devLogger_1.default.log('[BackupService] 🕐 Iniciando backup automático diario');
            await this.createFullBackup('daily');
        });
        // Backup semanal los domingos a las 3:00 AM
        cron.schedule('0 3 * * 0', async () => {
            devLogger_1.default.log('[BackupService] 📅 Iniciando backup automático semanal');
            await this.createFullBackup('weekly');
        });
        // Backup de datos cada 6 horas
        cron.schedule('0 */6 * * *', async () => {
            devLogger_1.default.log('[BackupService] 🔄 Iniciando backup de datos cada 6 horas');
            await this.createDataBackup();
        });
        devLogger_1.default.log('[BackupService] ⏰ Programación automática configurada');
    }
    /**
     * Crear backup completo del sistema
     */
    async createFullBackup(type = 'manual') {
        if (this.isRunning) {
            devLogger_1.default.log('[BackupService] ⚠️ Backup ya en ejecución');
            return { success: false, error: 'Backup ya en ejecución' };
        }
        if (!archiver) {
            return { success: false, error: 'archiver no disponible' };
        }
        this.isRunning = true;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `bge_full_backup_${type}_${timestamp}.zip`;
        const backupPath = path_1.default.join(this.backupDir, backupName);
        try {
            devLogger_1.default.log(`[BackupService] 🚀 Iniciando backup completo: ${backupName}`);
            const output = (0, fs_1.createWriteStream)(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                    devLogger_1.default.log(`[BackupService] ✅ Backup completo: ${sizeInMB} MB`);
                    this.isRunning = false;
                    setTimeout(() => this.cleanOldBackups(), 5000);
                    resolve({
                        success: true,
                        filename: backupName,
                        path: backupPath,
                        size: archive.pointer(),
                        timestamp: new Date().toISOString()
                    });
                });
                archive.on('error', (err) => {
                    devLogger_1.default.error(`[BackupService] ❌ Error creando archivo: ${err.message}`);
                    this.isRunning = false;
                    reject({ success: false, error: err.message });
                });
                archive.pipe(output);
                // Agregar archivos
                this.addSystemFilesToBackup(archive);
                this.addDataFilesToBackup(archive);
                this.addConfigFilesToBackup(archive);
                archive.finalize();
            });
        }
        catch (error) {
            devLogger_1.default.error(`[BackupService] ❌ Error en backup: ${error.message}`);
            this.isRunning = false;
            return { success: false, error: error.message };
        }
    }
    /**
     * Crear backup solo de datos
     */
    async createDataBackup() {
        if (!archiver) {
            return { success: false, error: 'archiver no disponible' };
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `bge_data_backup_${timestamp}.zip`;
        const backupPath = path_1.default.join(this.backupDir, backupName);
        try {
            devLogger_1.default.log(`[BackupService] 📊 Iniciando backup de datos: ${backupName}`);
            const output = (0, fs_1.createWriteStream)(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                    devLogger_1.default.log(`[BackupService] ✅ Backup de datos: ${sizeInMB} MB`);
                    resolve({
                        success: true,
                        filename: backupName,
                        path: backupPath,
                        type: 'data-only'
                    });
                });
                archive.on('error', (err) => {
                    reject({ success: false, error: err.message });
                });
                archive.pipe(output);
                this.addDataFilesToBackup(archive);
                archive.finalize();
            });
        }
        catch (error) {
            devLogger_1.default.error(`[BackupService] ❌ Error en backup datos: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * Agregar archivos del sistema al backup
     */
    async addSystemFilesToBackup(archive) {
        const systemPaths = [
            '../package.json',
            '../server.js',
            '../routes',
            '../middleware',
            '../config',
            '../services'
        ];
        for (const systemPath of systemPaths) {
            const fullPath = path_1.default.join(__dirname, systemPath);
            try {
                const stats = await promises_1.default.stat(fullPath);
                if (stats.isDirectory()) {
                    archive.directory(fullPath, path_1.default.basename(fullPath));
                }
                else {
                    archive.file(fullPath, { name: path_1.default.basename(fullPath) });
                }
                devLogger_1.default.log(`[BackupService] 📁 Agregado: ${path_1.default.basename(fullPath)}`);
            }
            catch (error) {
                // Ignorar archivos no encontrados
            }
        }
    }
    /**
     * Agregar archivos de datos al backup
     */
    async addDataFilesToBackup(archive) {
        const dataPaths = ['../data', '../../data'];
        for (const dataPath of dataPaths) {
            const fullPath = path_1.default.join(__dirname, dataPath);
            try {
                const stats = await promises_1.default.stat(fullPath);
                if (stats.isDirectory()) {
                    archive.directory(fullPath, `data_${path_1.default.basename(fullPath)}`);
                    devLogger_1.default.log(`[BackupService] 📊 Datos agregados: ${path_1.default.basename(fullPath)}`);
                }
            }
            catch (error) {
                // Ignorar directorios no encontrados
            }
        }
    }
    /**
     * Agregar archivos de configuración al backup
     */
    async addConfigFilesToBackup(archive) {
        const configFiles = ['../.env', '../.env.example'];
        for (const configFile of configFiles) {
            const fullPath = path_1.default.join(__dirname, configFile);
            try {
                await promises_1.default.access(fullPath);
                archive.file(fullPath, { name: path_1.default.basename(configFile) });
                devLogger_1.default.log(`[BackupService] ⚙️ Config agregado: ${path_1.default.basename(configFile)}`);
            }
            catch (error) {
                // Ignorar archivos no encontrados
            }
        }
    }
    /**
     * Limpiar backups antiguos
     */
    async cleanOldBackups() {
        try {
            const files = await promises_1.default.readdir(this.backupDir);
            const backupFiles = [];
            for (const file of files) {
                if (file.includes('backup') && file.endsWith('.zip')) {
                    const filePath = path_1.default.join(this.backupDir, file);
                    const stats = await promises_1.default.stat(filePath);
                    backupFiles.push({
                        name: file,
                        path: filePath,
                        time: stats.mtime
                    });
                }
            }
            backupFiles.sort((a, b) => b.time.getTime() - a.time.getTime());
            if (backupFiles.length > this.maxBackups) {
                const toDelete = backupFiles.slice(this.maxBackups);
                for (const backup of toDelete) {
                    await promises_1.default.unlink(backup.path);
                    devLogger_1.default.log(`[BackupService] 🗑️ Backup antiguo eliminado: ${backup.name}`);
                }
            }
            devLogger_1.default.log(`[BackupService] 🧹 Limpieza completada. Backups: ${Math.min(backupFiles.length, this.maxBackups)}`);
        }
        catch (error) {
            devLogger_1.default.error(`[BackupService] ❌ Error limpiando backups: ${error.message}`);
        }
    }
    /**
     * Restaurar desde backup
     */
    async restoreFromBackup(backupFilename) {
        const backupPath = path_1.default.join(this.backupDir, backupFilename);
        try {
            await promises_1.default.access(backupPath);
            devLogger_1.default.log(`[BackupService] 🔄 Restauración desde: ${backupFilename}`);
            devLogger_1.default.log('[BackupService] ⚠️ Restauración manual requerida por seguridad');
            return {
                success: true,
                message: 'Backup disponible para restauración manual',
                path: backupPath
            };
        }
        catch (error) {
            devLogger_1.default.error('[BackupService] ❌ Error accediendo al backup');
            return { success: false, error: 'Backup no encontrado' };
        }
    }
    /**
     * Listar backups disponibles
     */
    async listBackups() {
        try {
            const files = await promises_1.default.readdir(this.backupDir);
            const backupFiles = [];
            for (const file of files) {
                if (file.includes('backup') && file.endsWith('.zip')) {
                    const filePath = path_1.default.join(this.backupDir, file);
                    const stats = await promises_1.default.stat(filePath);
                    backupFiles.push({
                        filename: file,
                        size: stats.size,
                        sizeFormatted: this.formatBytes(stats.size),
                        created: stats.mtime,
                        type: file.includes('full') ? 'complete' : 'data-only'
                    });
                }
            }
            backupFiles.sort((a, b) => b.created.getTime() - a.created.getTime());
            return {
                success: true,
                backups: backupFiles,
                count: backupFiles.length
            };
        }
        catch (error) {
            devLogger_1.default.error(`[BackupService] ❌ Error listando backups: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * Obtener estadísticas de backups
     */
    async getBackupStats() {
        try {
            const backupList = await this.listBackups();
            if (!backupList.success || !backupList.backups) {
                return backupList;
            }
            const stats = {
                totalBackups: backupList.count || 0,
                totalSize: 0,
                oldestBackup: null,
                newestBackup: null,
                fullBackups: 0,
                dataBackups: 0
            };
            backupList.backups.forEach(backup => {
                stats.totalSize += backup.size;
                if (backup.type === 'complete') {
                    stats.fullBackups++;
                }
                else {
                    stats.dataBackups++;
                }
                if (!stats.oldestBackup || backup.created < stats.oldestBackup) {
                    stats.oldestBackup = backup.created;
                }
                if (!stats.newestBackup || backup.created > stats.newestBackup) {
                    stats.newestBackup = backup.created;
                }
            });
            stats.totalSizeFormatted = this.formatBytes(stats.totalSize);
            return { success: true, stats };
        }
        catch (error) {
            devLogger_1.default.error(`[BackupService] ❌ Error obteniendo stats: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * Crear backup manual inmediato
     */
    async createManualBackup() {
        devLogger_1.default.log('[BackupService] 👤 Backup manual solicitado');
        return await this.createFullBackup('manual');
    }
    /**
     * Formatear bytes a tamaño legible
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    /**
     * Verificar salud del sistema de backup
     */
    async checkBackupHealth() {
        const health = {
            status: 'healthy',
            issues: [],
            lastBackup: null,
            diskSpace: null,
            scheduledJobs: 'active'
        };
        try {
            const backupList = await this.listBackups();
            if (backupList.success && backupList.backups && backupList.backups.length > 0) {
                health.lastBackup = backupList.backups[0].created;
                const hoursSinceLastBackup = (Date.now() - health.lastBackup.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastBackup > 25) {
                    health.issues.push('Último backup hace más de 25 horas');
                    health.status = 'warning';
                }
            }
            else {
                health.issues.push('No se encontraron backups');
                health.status = 'warning';
            }
            if (health.issues.length === 0) {
                health.status = 'healthy';
            }
        }
        catch (error) {
            health.status = 'error';
            health.issues.push(`Error verificando salud: ${error.message}`);
        }
        return health;
    }
    /**
     * Parar el servicio de backup
     */
    stop() {
        this.isRunning = false;
        devLogger_1.default.log('[BackupService] 🛑 Servicio de backup detenido');
    }
}
exports.BackupService = BackupService;
// Singleton instance
let backupServiceInstance = null;
function getBackupService() {
    if (!backupServiceInstance) {
        backupServiceInstance = new BackupService();
    }
    return backupServiceInstance;
}
exports.default = getBackupService();
module.exports = { BackupService, getBackupService };
//# sourceMappingURL=backup.service.js.map
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

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import devLogger from '../utils/devLogger';

// Dynamic imports for optional dependencies
let archiver: any;
let cron: any;

try {
    archiver = require('archiver');
    cron = require('node-cron');
} catch (e) {
    devLogger.warn('[BackupService] archiver o node-cron no disponible');
}

// =====================================================
// INTERFACES
// =====================================================

export interface BackupResult {
    success: boolean;
    filename?: string;
    path?: string;
    size?: number;
    timestamp?: string;
    type?: string;
    message?: string;
    error?: string;
}

export interface BackupFileInfo {
    filename: string;
    size: number;
    sizeFormatted: string;
    created: Date;
    type: 'complete' | 'data-only';
}

export interface BackupListResult {
    success: boolean;
    backups?: BackupFileInfo[];
    count?: number;
    error?: string;
}

export interface BackupStats {
    totalBackups: number;
    totalSize: number;
    totalSizeFormatted?: string;
    oldestBackup: Date | null;
    newestBackup: Date | null;
    fullBackups: number;
    dataBackups: number;
}

export interface BackupStatsResult {
    success: boolean;
    stats?: BackupStats;
    error?: string;
}

export interface BackupHealth {
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    lastBackup: Date | null;
    diskSpace: any;
    scheduledJobs: string;
}

// =====================================================
// BACKUP SERVICE CLASS
// =====================================================

class BackupService {
    private backupDir: string;
    private maxBackups: number;
    private isRunning: boolean;

    constructor() {
        this.backupDir = path.join(__dirname, '../backups');
        this.maxBackups = 30;
        this.isRunning = false;

        devLogger.log('[BackupService] 💾 Servicio de backup inicializado');
        this.init();
    }

    /**
     * Inicializar servicio de backup
     */
    private async init(): Promise<void> {
        try {
            await this.ensureBackupDirectory();
            this.scheduleBackups();
            await this.cleanOldBackups();
            devLogger.log('[BackupService] ✅ Servicio configurado correctamente');
        } catch (error: any) {
            devLogger.error(`[BackupService] ❌ Error inicializando: ${error.message}`);
        }
    }

    /**
     * Asegurar que existe el directorio de backups
     */
    private async ensureBackupDirectory(): Promise<void> {
        try {
            await fs.access(this.backupDir);
        } catch (error) {
            await fs.mkdir(this.backupDir, { recursive: true });
            devLogger.log(`[BackupService] 📁 Directorio creado: ${this.backupDir}`);
        }
    }

    /**
     * Programar backups automáticos
     */
    private scheduleBackups(): void {
        if (!cron) {
            devLogger.warn('[BackupService] node-cron no disponible, backups manuales solamente');
            return;
        }

        // Backup diario a las 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            devLogger.log('[BackupService] 🕐 Iniciando backup automático diario');
            await this.createFullBackup('daily');
        });

        // Backup semanal los domingos a las 3:00 AM
        cron.schedule('0 3 * * 0', async () => {
            devLogger.log('[BackupService] 📅 Iniciando backup automático semanal');
            await this.createFullBackup('weekly');
        });

        // Backup de datos cada 6 horas
        cron.schedule('0 */6 * * *', async () => {
            devLogger.log('[BackupService] 🔄 Iniciando backup de datos cada 6 horas');
            await this.createDataBackup();
        });

        devLogger.log('[BackupService] ⏰ Programación automática configurada');
    }

    /**
     * Crear backup completo del sistema
     */
    async createFullBackup(type: string = 'manual'): Promise<BackupResult> {
        if (this.isRunning) {
            devLogger.log('[BackupService] ⚠️ Backup ya en ejecución');
            return { success: false, error: 'Backup ya en ejecución' };
        }

        if (!archiver) {
            return { success: false, error: 'archiver no disponible' };
        }

        this.isRunning = true;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `bge_full_backup_${type}_${timestamp}.zip`;
        const backupPath = path.join(this.backupDir, backupName);

        try {
            devLogger.log(`[BackupService] 🚀 Iniciando backup completo: ${backupName}`);

            const output = createWriteStream(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                    devLogger.log(`[BackupService] ✅ Backup completo: ${sizeInMB} MB`);
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

                archive.on('error', (err: Error) => {
                    devLogger.error(`[BackupService] ❌ Error creando archivo: ${err.message}`);
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

        } catch (error: any) {
            devLogger.error(`[BackupService] ❌ Error en backup: ${error.message}`);
            this.isRunning = false;
            return { success: false, error: error.message };
        }
    }

    /**
     * Crear backup solo de datos
     */
    async createDataBackup(): Promise<BackupResult> {
        if (!archiver) {
            return { success: false, error: 'archiver no disponible' };
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `bge_data_backup_${timestamp}.zip`;
        const backupPath = path.join(this.backupDir, backupName);

        try {
            devLogger.log(`[BackupService] 📊 Iniciando backup de datos: ${backupName}`);

            const output = createWriteStream(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                    devLogger.log(`[BackupService] ✅ Backup de datos: ${sizeInMB} MB`);
                    resolve({
                        success: true,
                        filename: backupName,
                        path: backupPath,
                        type: 'data-only'
                    });
                });

                archive.on('error', (err: Error) => {
                    reject({ success: false, error: err.message });
                });

                archive.pipe(output);
                this.addDataFilesToBackup(archive);
                archive.finalize();
            });

        } catch (error: any) {
            devLogger.error(`[BackupService] ❌ Error en backup datos: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Agregar archivos del sistema al backup
     */
    private async addSystemFilesToBackup(archive: any): Promise<void> {
        const systemPaths = [
            '../package.json',
            '../server.js',
            '../routes',
            '../middleware',
            '../config',
            '../services'
        ];

        for (const systemPath of systemPaths) {
            const fullPath = path.join(__dirname, systemPath);
            try {
                const stats = await fs.stat(fullPath);
                if (stats.isDirectory()) {
                    archive.directory(fullPath, path.basename(fullPath));
                } else {
                    archive.file(fullPath, { name: path.basename(fullPath) });
                }
                devLogger.log(`[BackupService] 📁 Agregado: ${path.basename(fullPath)}`);
            } catch (error) {
                // Ignorar archivos no encontrados
            }
        }
    }

    /**
     * Agregar archivos de datos al backup
     */
    private async addDataFilesToBackup(archive: any): Promise<void> {
        const dataPaths = ['../data', '../../data'];

        for (const dataPath of dataPaths) {
            const fullPath = path.join(__dirname, dataPath);
            try {
                const stats = await fs.stat(fullPath);
                if (stats.isDirectory()) {
                    archive.directory(fullPath, `data_${path.basename(fullPath)}`);
                    devLogger.log(`[BackupService] 📊 Datos agregados: ${path.basename(fullPath)}`);
                }
            } catch (error) {
                // Ignorar directorios no encontrados
            }
        }
    }

    /**
     * Agregar archivos de configuración al backup
     */
    private async addConfigFilesToBackup(archive: any): Promise<void> {
        const configFiles = ['../.env', '../.env.example'];

        for (const configFile of configFiles) {
            const fullPath = path.join(__dirname, configFile);
            try {
                await fs.access(fullPath);
                archive.file(fullPath, { name: path.basename(configFile) });
                devLogger.log(`[BackupService] ⚙️ Config agregado: ${path.basename(configFile)}`);
            } catch (error) {
                // Ignorar archivos no encontrados
            }
        }
    }

    /**
     * Limpiar backups antiguos
     */
    async cleanOldBackups(): Promise<void> {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles: Array<{ name: string; path: string; time: Date }> = [];

            for (const file of files) {
                if (file.includes('backup') && file.endsWith('.zip')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
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
                    await fs.unlink(backup.path);
                    devLogger.log(`[BackupService] 🗑️ Backup antiguo eliminado: ${backup.name}`);
                }
            }

            devLogger.log(`[BackupService] 🧹 Limpieza completada. Backups: ${Math.min(backupFiles.length, this.maxBackups)}`);
        } catch (error: any) {
            devLogger.error(`[BackupService] ❌ Error limpiando backups: ${error.message}`);
        }
    }

    /**
     * Restaurar desde backup
     */
    async restoreFromBackup(backupFilename: string): Promise<BackupResult> {
        const backupPath = path.join(this.backupDir, backupFilename);

        try {
            await fs.access(backupPath);
            devLogger.log(`[BackupService] 🔄 Restauración desde: ${backupFilename}`);
            devLogger.log('[BackupService] ⚠️ Restauración manual requerida por seguridad');

            return {
                success: true,
                message: 'Backup disponible para restauración manual',
                path: backupPath
            };
        } catch (error) {
            devLogger.error('[BackupService] ❌ Error accediendo al backup');
            return { success: false, error: 'Backup no encontrado' };
        }
    }

    /**
     * Listar backups disponibles
     */
    async listBackups(): Promise<BackupListResult> {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles: BackupFileInfo[] = [];

            for (const file of files) {
                if (file.includes('backup') && file.endsWith('.zip')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);

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
        } catch (error: any) {
            devLogger.error(`[BackupService] ❌ Error listando backups: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener estadísticas de backups
     */
    async getBackupStats(): Promise<BackupStatsResult> {
        try {
            const backupList = await this.listBackups();
            if (!backupList.success || !backupList.backups) {
                return backupList as BackupStatsResult;
            }

            const stats: BackupStats = {
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
                } else {
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
        } catch (error: any) {
            devLogger.error(`[BackupService] ❌ Error obteniendo stats: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Crear backup manual inmediato
     */
    async createManualBackup(): Promise<BackupResult> {
        devLogger.log('[BackupService] 👤 Backup manual solicitado');
        return await this.createFullBackup('manual');
    }

    /**
     * Formatear bytes a tamaño legible
     */
    formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Verificar salud del sistema de backup
     */
    async checkBackupHealth(): Promise<BackupHealth> {
        const health: BackupHealth = {
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
            } else {
                health.issues.push('No se encontraron backups');
                health.status = 'warning';
            }

            if (health.issues.length === 0) {
                health.status = 'healthy';
            }

        } catch (error: any) {
            health.status = 'error';
            health.issues.push(`Error verificando salud: ${error.message}`);
        }

        return health;
    }

    /**
     * Parar el servicio de backup
     */
    stop(): void {
        this.isRunning = false;
        devLogger.log('[BackupService] 🛑 Servicio de backup detenido');
    }
}

// Singleton instance
let backupServiceInstance: BackupService | null = null;

export function getBackupService(): BackupService {
    if (!backupServiceInstance) {
        backupServiceInstance = new BackupService();
    }
    return backupServiceInstance;
}

export { BackupService };
export default getBackupService();
module.exports = { BackupService, getBackupService };

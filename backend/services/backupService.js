/**
 * 💾 SISTEMA DE BACKUP AUTOMÁTICO - BGE HÉROES DE LA PATRIA
 * Servicio para respaldo automático de datos críticos del sistema
 */

const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const archiver = require('archiver');
const cron = require('node-cron');

class BackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../backups');
        this.maxBackups = 30; // Mantener últimos 30 backups
        this.isRunning = false;

        console.log('💾 [BACKUP] Servicio de backup inicializado');
        this.init();
    }

    /**
     * Inicializar servicio de backup
     */
    async init() {
        try {
            // Crear directorio de backups si no existe
            await this.ensureBackupDirectory();

            // Programar backups automáticos
            this.scheduleBackups();

            // Limpiar backups antiguos al iniciar
            await this.cleanOldBackups();

            console.log('✅ [BACKUP] Servicio configurado correctamente');
        } catch (error) {
            console.error('❌ [BACKUP] Error inicializando servicio:', error);
        }
    }

    /**
     * Asegurar que existe el directorio de backups
     */
    async ensureBackupDirectory() {
        try {
            await fs.access(this.backupDir);
        } catch (error) {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log(`📁 [BACKUP] Directorio creado: ${this.backupDir}`);
        }
    }

    /**
     * Programar backups automáticos
     */
    scheduleBackups() {
        // Backup diario a las 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('🕐 [BACKUP] Iniciando backup automático diario');
            await this.createFullBackup('daily');
        });

        // Backup semanal los domingos a las 3:00 AM
        cron.schedule('0 3 * * 0', async () => {
            console.log('📅 [BACKUP] Iniciando backup automático semanal');
            await this.createFullBackup('weekly');
        });

        // Backup de datos cada 6 horas
        cron.schedule('0 */6 * * *', async () => {
            console.log('🔄 [BACKUP] Iniciando backup de datos cada 6 horas');
            await this.createDataBackup();
        });

        console.log('⏰ [BACKUP] Programación automática configurada');
    }

    /**
     * Crear backup completo del sistema
     */
    async createFullBackup(type = 'manual') {
        if (this.isRunning) {
            console.log('⚠️ [BACKUP] Backup ya en ejecución, saltando...');
            return false;
        }

        this.isRunning = true;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `bge_full_backup_${type}_${timestamp}.zip`;
        const backupPath = path.join(this.backupDir, backupName);

        try {
            console.log(`🚀 [BACKUP] Iniciando backup completo: ${backupName}`);

            const output = createWriteStream(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            // Configurar eventos del archiver
            output.on('close', () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`✅ [BACKUP] Backup completo creado: ${sizeInMB} MB`);
                this.isRunning = false;
            });

            archive.on('error', (err) => {
                console.error('❌ [BACKUP] Error creando archivo:', err);
                this.isRunning = false;
                throw err;
            });

            archive.pipe(output);

            // Incluir archivos críticos del sistema
            await this.addSystemFilesToBackup(archive);
            await this.addDataFilesToBackup(archive);
            await this.addConfigFilesToBackup(archive);

            // Finalizar archivo
            await archive.finalize();

            // Limpiar backups antiguos después de crear uno nuevo
            setTimeout(() => this.cleanOldBackups(), 5000);

            return {
                success: true,
                filename: backupName,
                path: backupPath,
                size: archive.pointer(),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ [BACKUP] Error creando backup completo:', error);
            this.isRunning = false;
            return { success: false, error: error.message };
        }
    }

    /**
     * Crear backup solo de datos
     */
    async createDataBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `bge_data_backup_${timestamp}.zip`;
        const backupPath = path.join(this.backupDir, backupName);

        try {
            console.log(`📊 [BACKUP] Iniciando backup de datos: ${backupName}`);

            const output = createWriteStream(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`✅ [BACKUP] Backup de datos creado: ${sizeInMB} MB`);
            });

            archive.pipe(output);

            // Solo incluir archivos de datos
            await this.addDataFilesToBackup(archive);

            await archive.finalize();

            return {
                success: true,
                filename: backupName,
                path: backupPath,
                type: 'data-only'
            };

        } catch (error) {
            console.error('❌ [BACKUP] Error creando backup de datos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Agregar archivos del sistema al backup
     */
    async addSystemFilesToBackup(archive) {
        const systemPaths = [
            '../package.json',
            '../package-lock.json',
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
                console.log(`📁 [BACKUP] Agregado: ${path.basename(fullPath)}`);
            } catch (error) {
                console.log(`⚠️ [BACKUP] No se pudo agregar: ${systemPath}`);
            }
        }
    }

    /**
     * Agregar archivos de datos al backup
     */
    async addDataFilesToBackup(archive) {
        const dataPaths = [
            '../data',
            '../../data',
            '../../public/data'
        ];

        for (const dataPath of dataPaths) {
            const fullPath = path.join(__dirname, dataPath);
            try {
                const stats = await fs.stat(fullPath);
                if (stats.isDirectory()) {
                    archive.directory(fullPath, `data_${path.basename(fullPath)}`);
                    console.log(`📊 [BACKUP] Datos agregados: ${path.basename(fullPath)}`);
                }
            } catch (error) {
                console.log(`⚠️ [BACKUP] Directorio de datos no encontrado: ${dataPath}`);
            }
        }

        // Backup de archivos de usuarios
        const usersFile = path.join(__dirname, '../data/usuarios.json');
        try {
            await fs.access(usersFile);
            archive.file(usersFile, { name: 'usuarios_backup.json' });
            console.log('👥 [BACKUP] Usuarios agregados al backup');
        } catch (error) {
            console.log('⚠️ [BACKUP] Archivo de usuarios no encontrado');
        }
    }

    /**
     * Agregar archivos de configuración al backup
     */
    async addConfigFilesToBackup(archive) {
        const configFiles = [
            '../.env',
            '../.env.example',
            '../../.env.database'
        ];

        for (const configFile of configFiles) {
            const fullPath = path.join(__dirname, configFile);
            try {
                await fs.access(fullPath);
                archive.file(fullPath, { name: path.basename(configFile) });
                console.log(`⚙️ [BACKUP] Config agregado: ${path.basename(configFile)}`);
            } catch (error) {
                console.log(`⚠️ [BACKUP] Config no encontrado: ${configFile}`);
            }
        }
    }

    /**
     * Limpiar backups antiguos
     */
    async cleanOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.includes('backup') && file.endsWith('.zip'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    time: fs.stat(path.join(this.backupDir, file)).then(stats => stats.mtime)
                }));

            // Esperar a obtener todos los tiempos de modificación
            for (let backup of backupFiles) {
                backup.time = await backup.time;
            }

            // Ordenar por fecha (más recientes primero)
            backupFiles.sort((a, b) => b.time - a.time);

            // Eliminar backups excedentes
            if (backupFiles.length > this.maxBackups) {
                const toDelete = backupFiles.slice(this.maxBackups);
                for (const backup of toDelete) {
                    await fs.unlink(backup.path);
                    console.log(`🗑️ [BACKUP] Backup antiguo eliminado: ${backup.name}`);
                }
            }

            console.log(`🧹 [BACKUP] Limpieza completada. Backups actuales: ${Math.min(backupFiles.length, this.maxBackups)}`);
        } catch (error) {
            console.error('❌ [BACKUP] Error limpiando backups antiguos:', error);
        }
    }

    /**
     * Restaurar desde backup
     */
    async restoreFromBackup(backupFilename) {
        const backupPath = path.join(this.backupDir, backupFilename);

        try {
            await fs.access(backupPath);
            console.log(`🔄 [BACKUP] Iniciando restauración desde: ${backupFilename}`);

            // Aquí implementarías la lógica de restauración
            // Por seguridad, solo registramos la acción
            console.log('⚠️ [BACKUP] Restauración manual requerida por seguridad');

            return {
                success: true,
                message: 'Backup disponible para restauración manual',
                backupPath: backupPath
            };
        } catch (error) {
            console.error('❌ [BACKUP] Error accediendo al backup:', error);
            return { success: false, error: 'Backup no encontrado' };
        }
    }

    /**
     * Listar backups disponibles
     */
    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = [];

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

            // Ordenar por fecha de creación (más recientes primero)
            backupFiles.sort((a, b) => b.created - a.created);

            return {
                success: true,
                backups: backupFiles,
                count: backupFiles.length
            };
        } catch (error) {
            console.error('❌ [BACKUP] Error listando backups:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener estadísticas de backups
     */
    async getBackupStats() {
        try {
            const backupList = await this.listBackups();
            if (!backupList.success) {
                return backupList;
            }

            const stats = {
                totalBackups: backupList.count,
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

            return {
                success: true,
                stats: stats
            };
        } catch (error) {
            console.error('❌ [BACKUP] Error obteniendo estadísticas:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Crear backup manual inmediato
     */
    async createManualBackup() {
        console.log('👤 [BACKUP] Backup manual solicitado');
        return await this.createFullBackup('manual');
    }

    /**
     * Formatear bytes a tamaño legible
     */
    formatBytes(bytes, decimals = 2) {
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
    async checkBackupHealth() {
        const health = {
            status: 'healthy',
            issues: [],
            lastBackup: null,
            diskSpace: null,
            scheduledJobs: 'active'
        };

        try {
            // Verificar último backup
            const backupList = await this.listBackups();
            if (backupList.success && backupList.backups.length > 0) {
                health.lastBackup = backupList.backups[0].created;

                // Verificar si el último backup es muy antiguo (más de 25 horas)
                const hoursSinceLastBackup = (Date.now() - health.lastBackup) / (1000 * 60 * 60);
                if (hoursSinceLastBackup > 25) {
                    health.issues.push('Último backup hace más de 25 horas');
                    health.status = 'warning';
                }
            } else {
                health.issues.push('No se encontraron backups');
                health.status = 'warning';
            }

            // Verificar espacio en disco
            const stats = await fs.stat(this.backupDir);
            // Nota: En producción usarías statvfs o similar para espacio real en disco

            if (health.issues.length === 0) {
                health.status = 'healthy';
            }

        } catch (error) {
            health.status = 'error';
            health.issues.push(`Error verificando salud: ${error.message}`);
        }

        return health;
    }

    /**
     * Parar el servicio de backup
     */
    stop() {
        // Detener tareas programadas (cron jobs se detienen automáticamente)
        this.isRunning = false;
        console.log('🛑 [BACKUP] Servicio de backup detenido');
    }
}

// Instancia singleton del servicio
let backupServiceInstance = null;

/**
 * Obtener instancia del servicio de backup
 */
function getBackupService() {
    if (!backupServiceInstance) {
        backupServiceInstance = new BackupService();
    }
    return backupServiceInstance;
}

module.exports = {
    BackupService,
    getBackupService
};
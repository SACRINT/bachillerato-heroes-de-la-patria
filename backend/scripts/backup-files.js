/**
 * 📁 BACKUP AUTOMÁTICO DE ARCHIVOS SUBIDOS
 * Sistema de respaldo de uploads y archivos críticos
 * Fecha: 18 de Octubre, 2025
 */

const fs = require('fs').promises;
const devLogger = require('../utils/devLogger');
const path = require('path');
const archiver = require('archiver');
const { createWriteStream, createReadStream } = require('fs');

class FilesBackup {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups/files');
        this.sourceDirs = [
            path.join(__dirname, '../../public/uploads'),
            path.join(__dirname, '../../uploads'),
            path.join(__dirname, '../../.env'), // Backup de configuración
        ];
        this.retentionDays = 30; // Mantener backups de archivos por 30 días
    }

    /**
     * Ejecutar backup de archivos
     */
    async runBackup() {
        devLogger.log('📁 Iniciando backup de archivos...\n');

        try {
            // Crear directorio de backups
            await this.ensureBackupDirectory();

            // Crear backup comprimido
            const backupFile = await this.createBackupArchive();

            // Aplicar retención
            await this.applyRetentionPolicy();

            // Generar reporte
            await this.generateReport(backupFile);

            return {
                success: true,
                backupFile,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            devLogger.error('❌ Error en backup de archivos:', error);
            throw error;
        }
    }

    /**
     * Crear directorio de backups
     */
    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            devLogger.log(`✅ Directorio de backups: ${this.backupDir}`);
        } catch (error) {
            throw new Error(`Error al crear directorio: ${error.message}`);
        }
    }

    /**
     * Crear archivo ZIP con todos los archivos
     */
    async createBackupArchive() {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupDir, `files-backup-${timestamp}.zip`);

            const output = createWriteStream(backupFile);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Máxima compresión
            });

            output.on('close', () => {
                const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                devLogger.log(`✅ Backup creado: ${path.basename(backupFile)} (${sizeMB} MB)`);
                resolve(backupFile);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Agregar cada directorio al archivo
            let filesAdded = 0;

            (async () => {
                for (const sourceDir of this.sourceDirs) {
                    try {
                        const stats = await fs.stat(sourceDir);

                        if (stats.isDirectory()) {
                            devLogger.log(`📂 Agregando directorio: ${path.basename(sourceDir)}`);
                            archive.directory(sourceDir, path.basename(sourceDir));
                            filesAdded++;
                        } else if (stats.isFile()) {
                            devLogger.log(`📄 Agregando archivo: ${path.basename(sourceDir)}`);
                            archive.file(sourceDir, { name: path.basename(sourceDir) });
                            filesAdded++;
                        }
                    } catch (error) {
                        devLogger.warn(`⚠️ No se pudo agregar: ${sourceDir} (${error.message})`);
                    }
                }

                if (filesAdded === 0) {
                    devLogger.warn('⚠️ Advertencia: No se agregó ningún archivo al backup');
                }

                await archive.finalize();
            })();
        });
    }

    /**
     * Aplicar política de retención
     */
    async applyRetentionPolicy() {
        devLogger.log('\n🗑️ Aplicando política de retención...');

        try {
            const files = await fs.readdir(this.backupDir);
            const now = Date.now();

            let deleted = 0;

            for (const file of files) {
                if (!file.endsWith('.zip')) continue;

                const filePath = path.join(this.backupDir, file);
                const stats = await fs.stat(filePath);
                const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                if (ageInDays > this.retentionDays) {
                    await fs.unlink(filePath);
                    deleted++;
                    devLogger.log(`  🗑️ Eliminado: ${file} (${Math.floor(ageInDays)} días)`);
                }
            }

            devLogger.log(`✅ ${deleted} backup(s) antiguos eliminados\n`);

        } catch (error) {
            devLogger.error('❌ Error al aplicar retención:', error);
        }
    }

    /**
     * Generar reporte
     */
    async generateReport(backupFile) {
        try {
            const stats = await fs.stat(backupFile);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

            const report = {
                timestamp: new Date().toISOString(),
                backupFile: path.basename(backupFile),
                sizeMB: sizeMB,
                sourceDirs: this.sourceDirs.map(dir => path.basename(dir)),
                retentionDays: this.retentionDays
            };

            devLogger.log('\n' + '='.repeat(60));
            devLogger.log('📊 REPORTE DE BACKUP DE ARCHIVOS');
            devLogger.log('='.repeat(60));
            devLogger.log(`Archivo: ${report.backupFile}`);
            devLogger.log(`Tamaño: ${report.sizeMB} MB`);
            devLogger.log(`Timestamp: ${report.timestamp}`);
            devLogger.log('='.repeat(60) + '\n');

            // Guardar reporte
            const reportPath = path.join(this.backupDir, 'last-backup-report.json');
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        } catch (error) {
            devLogger.error('Error al generar reporte:', error);
        }
    }

    /**
     * Listar backups disponibles
     */
    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = [];

            for (const file of files) {
                if (file.endsWith('.zip')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);

                    backups.push({
                        file,
                        size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
                        created: stats.mtime.toISOString()
                    });
                }
            }

            return backups.sort((a, b) => new Date(b.created) - new Date(a.created));

        } catch (error) {
            devLogger.error('Error al listar backups:', error);
            return [];
        }
    }
}

// Ejecutar backup si se llama directamente
if (require.main === module) {
    (async () => {
        try {
            const backup = new FilesBackup();
            await backup.runBackup();

            devLogger.log('✅ Backup de archivos completado exitosamente\n');
            process.exit(0);

        } catch (error) {
            devLogger.error('❌ Error fatal en backup:', error);
            process.exit(1);
        }
    })();
}

module.exports = FilesBackup;

/**
 * 💾 BACKUP AUTOMÁTICO DE POSTGRESQL
 * Sistema de respaldo automático de base de datos
 * Fecha: 18 de Octubre, 2025
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class DatabaseBackup {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups/database');
        this.retentionDays = {
            daily: 7,      // Mantener backups diarios por 7 días
            weekly: 30,    // Mantener backups semanales por 30 días
            monthly: 90    // Mantener backups mensuales por 90 días
        };
    }

    /**
     * Ejecutar backup completo
     */
    async runBackup() {
        console.log('💾 Iniciando backup de base de datos PostgreSQL...\n');

        try {
            // Verificar variables de entorno
            this.validateEnvironment();

            // Crear directorio de backups
            await this.ensureBackupDirectory();

            // Generar backup
            const backupFile = await this.createBackup();

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
            console.error('❌ Error en backup de base de datos:', error);
            throw error;
        }
    }

    /**
     * Validar variables de entorno
     */
    validateEnvironment() {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL no está configurada en .env');
        }

        console.log('✅ Variables de entorno validadas');
    }

    /**
     * Crear directorio de backups
     */
    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log(`✅ Directorio de backups: ${this.backupDir}`);
        } catch (error) {
            throw new Error(`Error al crear directorio de backups: ${error.message}`);
        }
    }

    /**
     * Crear backup de PostgreSQL
     */
    async createBackup() {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);

            // Parsear DATABASE_URL
            const dbUrl = new URL(process.env.DATABASE_URL);
            const host = dbUrl.hostname;
            const port = dbUrl.port || 5432;
            const database = dbUrl.pathname.slice(1); // Remove leading slash
            const username = dbUrl.username;
            const password = dbUrl.password;

            // Comando pg_dump
            const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${backupFile}"`;

            // Ejecutar pg_dump
            console.log(`📥 Ejecutando backup de: ${database}@${host}...`);

            const env = {
                ...process.env,
                PGPASSWORD: password
            };

            exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Error al ejecutar pg_dump:', stderr);
                    reject(new Error(`pg_dump falló: ${error.message}`));
                    return;
                }

                console.log(`✅ Backup creado: ${path.basename(backupFile)}`);

                // Comprimir backup
                this.compressBackup(backupFile)
                    .then(compressedFile => resolve(compressedFile))
                    .catch(compressError => {
                        console.warn('⚠️ Advertencia: No se pudo comprimir el backup');
                        resolve(backupFile);
                    });
            });
        });
    }

    /**
     * Comprimir backup con gzip
     */
    async compressBackup(backupFile) {
        return new Promise((resolve, reject) => {
            const compressedFile = `${backupFile}.gz`;

            exec(`gzip "${backupFile}"`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                console.log(`🗜️ Backup comprimido: ${path.basename(compressedFile)}`);
                resolve(compressedFile);
            });
        });
    }

    /**
     * Aplicar política de retención
     */
    async applyRetentionPolicy() {
        console.log('\n🗑️ Aplicando política de retención...');

        try {
            const files = await fs.readdir(this.backupDir);
            const now = Date.now();

            let deleted = 0;

            for (const file of files) {
                const filePath = path.join(this.backupDir, file);
                const stats = await fs.stat(filePath);
                const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                // Determinar si el backup debe conservarse
                const shouldDelete = this.shouldDeleteBackup(file, ageInDays);

                if (shouldDelete) {
                    await fs.unlink(filePath);
                    deleted++;
                    console.log(`  🗑️ Eliminado: ${file} (${Math.floor(ageInDays)} días)`);
                }
            }

            console.log(`✅ ${deleted} backup(s) antiguos eliminados\n`);

        } catch (error) {
            console.error('❌ Error al aplicar retención:', error);
        }
    }

    /**
     * Determinar si un backup debe eliminarse
     */
    shouldDeleteBackup(filename, ageInDays) {
        const isDaily = true; // Todos los backups son diarios inicialmente
        const isWeekly = filename.includes('weekly') || ageInDays % 7 < 1;
        const isMonthly = filename.includes('monthly') || ageInDays % 30 < 1;

        if (isMonthly && ageInDays <= this.retentionDays.monthly) {
            return false; // Conservar backups mensuales hasta 90 días
        }

        if (isWeekly && ageInDays <= this.retentionDays.weekly) {
            return false; // Conservar backups semanales hasta 30 días
        }

        if (isDaily && ageInDays <= this.retentionDays.daily) {
            return false; // Conservar backups diarios hasta 7 días
        }

        return true; // Eliminar si no cumple ninguna condición
    }

    /**
     * Generar reporte de backup
     */
    async generateReport(backupFile) {
        try {
            const stats = await fs.stat(backupFile);
            const size = (stats.size / 1024 / 1024).toFixed(2); // MB

            const report = {
                timestamp: new Date().toISOString(),
                backupFile: path.basename(backupFile),
                sizeMB: size,
                retentionPolicy: this.retentionDays
            };

            console.log('\n' + '='.repeat(60));
            console.log('📊 REPORTE DE BACKUP');
            console.log('='.repeat(60));
            console.log(`Archivo: ${report.backupFile}`);
            console.log(`Tamaño: ${report.sizeMB} MB`);
            console.log(`Timestamp: ${report.timestamp}`);
            console.log('='.repeat(60) + '\n');

            // Guardar reporte JSON
            const reportPath = path.join(this.backupDir, 'last-backup-report.json');
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        } catch (error) {
            console.error('Error al generar reporte:', error);
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
                if (file.endsWith('.sql') || file.endsWith('.gz')) {
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
            console.error('Error al listar backups:', error);
            return [];
        }
    }
}

// Ejecutar backup si se llama directamente
if (require.main === module) {
    (async () => {
        try {
            const backup = new DatabaseBackup();
            await backup.runBackup();

            console.log('✅ Backup de base de datos completado exitosamente\n');
            process.exit(0);

        } catch (error) {
            console.error('❌ Error fatal en backup:', error);
            process.exit(1);
        }
    })();
}

module.exports = DatabaseBackup;

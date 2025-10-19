/**
 * 🔄 BACKUP MAESTRO - Ejecuta todos los backups
 * Sistema completo de respaldo automático
 * Fecha: 18 de Octubre, 2025
 */

const DatabaseBackup = require('./backup-database');
const FilesBackup = require('./backup-files');
const path = require('path');
const fs = require('fs').promises;

class MasterBackup {
    constructor() {
        this.databaseBackup = new DatabaseBackup();
        this.filesBackup = new FilesBackup();
        this.logFile = path.join(__dirname, '../../backups/backup-log.txt');
    }

    /**
     * Ejecutar todos los backups
     */
    async runAllBackups() {
        console.log('🔄 INICIANDO BACKUP MAESTRO');
        console.log('='.repeat(70) + '\n');

        const startTime = Date.now();
        const results = {
            timestamp: new Date().toISOString(),
            database: null,
            files: null,
            totalTime: 0,
            success: false
        };

        try {
            // Backup de base de datos
            console.log('1️⃣ BACKUP DE BASE DE DATOS\n');
            results.database = await this.databaseBackup.runBackup();

            console.log('\n' + '-'.repeat(70) + '\n');

            // Backup de archivos
            console.log('2️⃣ BACKUP DE ARCHIVOS\n');
            results.files = await this.filesBackup.runBackup();

            // Calcular tiempo total
            results.totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
            results.success = true;

            // Generar resumen
            await this.generateSummary(results);

            // Log del backup
            await this.logBackup(results);

            console.log('\n' + '='.repeat(70));
            console.log('✅ BACKUP MAESTRO COMPLETADO EXITOSAMENTE');
            console.log(`⏱️ Tiempo total: ${results.totalTime}s`);
            console.log('='.repeat(70) + '\n');

            return results;

        } catch (error) {
            console.error('\n❌ ERROR EN BACKUP MAESTRO:', error);

            results.success = false;
            results.error = error.message;
            results.totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

            await this.logBackup(results);

            throw error;
        }
    }

    /**
     * Generar resumen de backups
     */
    async generateSummary(results) {
        const summary = {
            timestamp: results.timestamp,
            success: results.success,
            totalTime: `${results.totalTime}s`,
            database: {
                file: results.database?.backupFile ? path.basename(results.database.backupFile) : 'N/A',
                status: results.database?.success ? 'SUCCESS' : 'FAILED'
            },
            files: {
                file: results.files?.backupFile ? path.basename(results.files.backupFile) : 'N/A',
                status: results.files?.success ? 'SUCCESS' : 'FAILED'
            }
        };

        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMEN DE BACKUPS');
        console.log('='.repeat(70));
        console.log(`Timestamp: ${summary.timestamp}`);
        console.log(`Estado General: ${summary.success ? '✅ EXITOSO' : '❌ FALLIDO'}`);
        console.log(`Tiempo Total: ${summary.totalTime}`);
        console.log('\nBase de Datos:');
        console.log(`  Estado: ${summary.database.status}`);
        console.log(`  Archivo: ${summary.database.file}`);
        console.log('\nArchivos:');
        console.log(`  Estado: ${summary.files.status}`);
        console.log(`  Archivo: ${summary.files.file}`);
        console.log('='.repeat(70));

        // Guardar resumen JSON
        const summaryPath = path.join(__dirname, '../../backups/last-backup-summary.json');
        await fs.mkdir(path.dirname(summaryPath), { recursive: true });
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    }

    /**
     * Registrar backup en log
     */
    async logBackup(results) {
        try {
            const logEntry = `\n[${results.timestamp}] Backup ${results.success ? 'EXITOSO' : 'FALLIDO'} - Tiempo: ${results.totalTime}s\n`;

            await fs.appendFile(this.logFile, logEntry);

        } catch (error) {
            console.error('Error al escribir log:', error);
        }
    }

    /**
     * Listar todos los backups
     */
    async listAllBackups() {
        console.log('📋 BACKUPS DISPONIBLES\n');

        console.log('Base de Datos:');
        const dbBackups = await this.databaseBackup.listBackups();
        dbBackups.forEach((backup, i) => {
            console.log(`  ${i + 1}. ${backup.file} (${backup.size}) - ${backup.created}`);
        });

        console.log('\nArchivos:');
        const fileBackups = await this.filesBackup.listBackups();
        fileBackups.forEach((backup, i) => {
            console.log(`  ${i + 1}. ${backup.file} (${backup.size}) - ${backup.created}`);
        });

        return { database: dbBackups, files: fileBackups };
    }

    /**
     * Verificar espacio en disco
     */
    async checkDiskSpace() {
        // Esta función podría implementarse para verificar espacio disponible
        console.log('⚠️ Verificación de espacio en disco no implementada (requiere módulo adicional)');
    }
}

// Ejecutar backup si se llama directamente
if (require.main === module) {
    (async () => {
        try {
            const masterBackup = new MasterBackup();

            // Verificar si se pide listar backups
            if (process.argv.includes('--list')) {
                await masterBackup.listAllBackups();
                process.exit(0);
            }

            // Ejecutar backups
            await masterBackup.runAllBackups();

            process.exit(0);

        } catch (error) {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        }
    })();
}

module.exports = MasterBackup;

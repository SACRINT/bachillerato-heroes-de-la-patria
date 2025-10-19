/**
 * 🔄 RESTAURACIÓN DE BACKUPS
 * Sistema de restauración de base de datos y archivos
 * Fecha: 18 de Octubre, 2025
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const extract = require('extract-zip');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class BackupRestore {
    constructor() {
        this.backupBaseDir = path.join(__dirname, '../../backups');
        this.databaseBackupDir = path.join(this.backupBaseDir, 'database');
        this.filesBackupDir = path.join(this.backupBaseDir, 'files');
    }

    /**
     * Restaurar base de datos desde backup
     */
    async restoreDatabase(backupFile) {
        console.log('🔄 Iniciando restauración de base de datos...\n');

        return new Promise((resolve, reject) => {
            // Verificar que el archivo existe
            const backupPath = backupFile.startsWith('/') || backupFile.includes(':')
                ? backupFile
                : path.join(this.databaseBackupDir, backupFile);

            // Parsear DATABASE_URL
            const dbUrl = new URL(process.env.DATABASE_URL);
            const host = dbUrl.hostname;
            const port = dbUrl.port || 5432;
            const database = dbUrl.pathname.slice(1);
            const username = dbUrl.username;
            const password = dbUrl.password;

            // Verificar si el archivo está comprimido
            let sqlFile = backupPath;
            let needsDecompression = false;

            if (backupPath.endsWith('.gz')) {
                needsDecompression = true;
                sqlFile = backupPath.replace('.gz', '');
            }

            // Descomprimir si es necesario
            const executeRestore = () => {
                const psqlCommand = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${sqlFile}"`;

                console.log(`📥 Restaurando backup de: ${database}@${host}...`);

                const env = {
                    ...process.env,
                    PGPASSWORD: password
                };

                exec(psqlCommand, { env }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('❌ Error al restaurar:', stderr);
                        reject(new Error(`psql falló: ${error.message}`));
                        return;
                    }

                    console.log('✅ Base de datos restaurada exitosamente\n');
                    console.log(stdout);

                    resolve({ success: true, database });
                });
            };

            // Si necesita descompresión
            if (needsDecompression) {
                console.log('📦 Descomprimiendo backup...');

                exec(`gunzip -c "${backupPath}" > "${sqlFile}"`, (error) => {
                    if (error) {
                        console.error('❌ Error al descomprimir:', error);
                        reject(error);
                        return;
                    }

                    console.log('✅ Backup descomprimido\n');
                    executeRestore();
                });
            } else {
                executeRestore();
            }
        });
    }

    /**
     * Restaurar archivos desde backup
     */
    async restoreFiles(backupFile) {
        console.log('📁 Iniciando restauración de archivos...\n');

        try {
            const backupPath = backupFile.startsWith('/') || backupFile.includes(':')
                ? backupFile
                : path.join(this.filesBackupDir, backupFile);

            const restoreDir = path.join(__dirname, '../../restored-files');

            // Crear directorio de restauración
            await fs.mkdir(restoreDir, { recursive: true });

            // Extraer archivo ZIP
            console.log('📦 Extrayendo archivos...');
            await extract(backupPath, { dir: path.resolve(restoreDir) });

            console.log(`✅ Archivos restaurados en: ${restoreDir}\n`);

            return {
                success: true,
                restoreDir
            };

        } catch (error) {
            console.error('❌ Error al restaurar archivos:', error);
            throw error;
        }
    }

    /**
     * Listar backups disponibles para restauración
     */
    async listAvailableBackups() {
        console.log('📋 BACKUPS DISPONIBLES PARA RESTAURACIÓN\n');

        console.log('='.repeat(70));
        console.log('BASE DE DATOS:');
        console.log('='.repeat(70));

        try {
            const dbFiles = await fs.readdir(this.databaseBackupDir);
            const dbBackups = dbFiles.filter(f => f.endsWith('.sql') || f.endsWith('.gz'));

            dbBackups.forEach((file, i) => {
                console.log(`  [${i + 1}] ${file}`);
            });

            if (dbBackups.length === 0) {
                console.log('  (No hay backups disponibles)');
            }

        } catch (error) {
            console.log('  (Error al leer backups de base de datos)');
        }

        console.log('\n' + '='.repeat(70));
        console.log('ARCHIVOS:');
        console.log('='.repeat(70));

        try {
            const fileFiles = await fs.readdir(this.filesBackupDir);
            const fileBackups = fileFiles.filter(f => f.endsWith('.zip'));

            fileBackups.forEach((file, i) => {
                console.log(`  [${i + 1}] ${file}`);
            });

            if (fileBackups.length === 0) {
                console.log('  (No hay backups disponibles)');
            }

        } catch (error) {
            console.log('  (Error al leer backups de archivos)');
        }

        console.log('='.repeat(70) + '\n');
    }

    /**
     * Obtener el backup más reciente
     */
    async getLatestBackup(type = 'database') {
        try {
            const dir = type === 'database' ? this.databaseBackupDir : this.filesBackupDir;
            const extension = type === 'database' ? ['.sql', '.gz'] : ['.zip'];

            const files = await fs.readdir(dir);
            const backups = files.filter(f => extension.some(ext => f.endsWith(ext)));

            if (backups.length === 0) {
                return null;
            }

            // Ordenar por fecha de modificación (más reciente primero)
            const backupsWithStats = await Promise.all(
                backups.map(async (file) => {
                    const filePath = path.join(dir, file);
                    const stats = await fs.stat(filePath);
                    return { file, mtime: stats.mtime };
                })
            );

            backupsWithStats.sort((a, b) => b.mtime - a.mtime);

            return backupsWithStats[0].file;

        } catch (error) {
            console.error('Error al obtener backup más reciente:', error);
            return null;
        }
    }
}

// CLI para ejecutar restauraciones
if (require.main === module) {
    (async () => {
        const restore = new BackupRestore();
        const args = process.argv.slice(2);

        try {
            // Listar backups
            if (args.includes('--list')) {
                await restore.listAvailableBackups();
                process.exit(0);
            }

            // Restaurar base de datos
            if (args.includes('--database')) {
                const backupFile = args[args.indexOf('--database') + 1];

                if (!backupFile || backupFile.startsWith('--')) {
                    console.error('❌ Especifica el archivo de backup: --database <archivo>');
                    process.exit(1);
                }

                await restore.restoreDatabase(backupFile);
                process.exit(0);
            }

            // Restaurar archivos
            if (args.includes('--files')) {
                const backupFile = args[args.indexOf('--files') + 1];

                if (!backupFile || backupFile.startsWith('--')) {
                    console.error('❌ Especifica el archivo de backup: --files <archivo>');
                    process.exit(1);
                }

                await restore.restoreFiles(backupFile);
                process.exit(0);
            }

            // Restaurar el backup más reciente
            if (args.includes('--latest')) {
                console.log('🔄 Restaurando backups más recientes...\n');

                const dbBackup = await restore.getLatestBackup('database');
                if (dbBackup) {
                    console.log(`📊 Base de datos: ${dbBackup}`);
                    await restore.restoreDatabase(dbBackup);
                } else {
                    console.log('⚠️ No se encontró backup de base de datos');
                }

                const filesBackup = await restore.getLatestBackup('files');
                if (filesBackup) {
                    console.log(`📁 Archivos: ${filesBackup}`);
                    await restore.restoreFiles(filesBackup);
                } else {
                    console.log('⚠️ No se encontró backup de archivos');
                }

                process.exit(0);
            }

            // Mostrar ayuda
            console.log('🔄 SISTEMA DE RESTAURACIÓN DE BACKUPS\n');
            console.log('Uso:');
            console.log('  node restore-backup.js --list                 # Listar backups disponibles');
            console.log('  node restore-backup.js --database <archivo>   # Restaurar base de datos');
            console.log('  node restore-backup.js --files <archivo>      # Restaurar archivos');
            console.log('  node restore-backup.js --latest               # Restaurar backups más recientes\n');

        } catch (error) {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        }
    })();
}

module.exports = BackupRestore;

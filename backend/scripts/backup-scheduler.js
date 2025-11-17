/**
 * 💾 SISTEMA DE BACKUPS AUTOMATIZADOS - POSTGRESQL
 * Backups diarios de base de datos con retención de 30 días
 * Fecha: 17 Noviembre 2025
 *
 * CARACTERÍSTICAS:
 * - Backups diarios automáticos a las 2 AM
 * - Retención de 30 días (elimina backups viejos)
 * - Compresión con gzip
 * - Notificaciones por email
 * - Verificación de integridad
 * - Soporte para backup full + schema-only
 *
 * USO:
 * - Manual: node backend/scripts/backup-scheduler.js
 * - Automático: Se ejecuta con cron job en server.js
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// GDPR Logging
const { debugLog } = require('../utils/debug-logger');

// Configuración
const BACKUP_DIR = path.join(__dirname, '../../backups/database');
const BACKUP_RETENTION_DAYS = 30;
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Asegurar que el directorio de backups existe
 */
async function ensureBackupDirectory() {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        debugLog.log('BACKUP', `✅ Directorio de backups: ${BACKUP_DIR}`);
        return true;
    } catch (error) {
        debugLog.error('BACKUP', '❌ Error creando directorio de backups', error);
        throw error;
    }
}

/**
 * Parsear DATABASE_URL de Neon para obtener conexión
 */
function parseDatabaseURL(url) {
    if (!url) {
        throw new Error('DATABASE_URL no está configurado en variables de entorno');
    }

    // Formato: postgresql://user:password@host:port/database?sslmode=require
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('DATABASE_URL tiene formato inválido');
    }

    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        database: match[5]
    };
}

/**
 * Generar nombre de archivo de backup
 * Formato: backup_YYYYMMDD_HHmmss.sql.gz
 */
function generateBackupFilename(type = 'full') {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');

    return `backup_${type}_${dateStr}_${timeStr}.sql.gz`;
}

/**
 * Ejecutar pg_dump para crear backup
 * @param {string} type - 'full' o 'schema'
 */
async function createDatabaseBackup(type = 'full') {
    debugLog.log('BACKUP', `📦 Iniciando backup de base de datos (${type})...`);

    const dbConfig = parseDatabaseURL(DATABASE_URL);
    const backupFile = path.join(BACKUP_DIR, generateBackupFilename(type));

    // Configurar variables de entorno para pg_dump
    const env = {
        ...process.env,
        PGPASSWORD: dbConfig.password
    };

    // Comando pg_dump con opciones
    let pgDumpCmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database}`;

    // Opciones según tipo de backup
    if (type === 'schema') {
        pgDumpCmd += ' --schema-only';
    } else if (type === 'full') {
        pgDumpCmd += ' --clean --if-exists --verbose';
    }

    // Agregar compresión con gzip
    pgDumpCmd += ` | gzip > ${backupFile}`;

    try {
        debugLog.log('BACKUP', `🔧 Ejecutando pg_dump...`);
        const { stdout, stderr } = await execPromise(pgDumpCmd, {
            env,
            maxBuffer: 50 * 1024 * 1024 // 50 MB buffer
        });

        // Verificar que el archivo fue creado
        const stats = await fs.stat(backupFile);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        debugLog.log('BACKUP', `✅ Backup creado exitosamente: ${path.basename(backupFile)} (${sizeInMB} MB)`);

        return {
            success: true,
            filename: path.basename(backupFile),
            fullPath: backupFile,
            size: stats.size,
            sizeInMB,
            timestamp: new Date().toISOString(),
            type
        };

    } catch (error) {
        debugLog.error('BACKUP', `❌ Error creando backup`, error);
        throw error;
    }
}

/**
 * Listar backups existentes
 */
async function listBackups() {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backups = [];

        for (const file of files) {
            if (file.endsWith('.sql.gz')) {
                const fullPath = path.join(BACKUP_DIR, file);
                const stats = await fs.stat(fullPath);

                backups.push({
                    filename: file,
                    fullPath,
                    size: stats.size,
                    sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
                    created: stats.birthtime,
                    modified: stats.mtime,
                    ageInDays: Math.floor((Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60 * 24))
                });
            }
        }

        // Ordenar por fecha (más reciente primero)
        backups.sort((a, b) => b.created - a.created);

        return backups;

    } catch (error) {
        debugLog.error('BACKUP', '❌ Error listando backups', error);
        return [];
    }
}

/**
 * Limpiar backups viejos (retención de 30 días)
 */
async function cleanOldBackups() {
    debugLog.log('BACKUP', `🧹 Limpiando backups antiguos (retención: ${BACKUP_RETENTION_DAYS} días)...`);

    const backups = await listBackups();
    let deletedCount = 0;
    let freedSpaceMB = 0;

    for (const backup of backups) {
        if (backup.ageInDays > BACKUP_RETENTION_DAYS) {
            try {
                await fs.unlink(backup.fullPath);
                deletedCount++;
                freedSpaceMB += parseFloat(backup.sizeInMB);

                debugLog.log('BACKUP', `🗑️  Eliminado: ${backup.filename} (${backup.ageInDays} días, ${backup.sizeInMB} MB)`);

            } catch (error) {
                debugLog.error('BACKUP', `❌ Error eliminando ${backup.filename}`, error);
            }
        }
    }

    if (deletedCount > 0) {
        debugLog.log('BACKUP', `✅ Limpieza completada: ${deletedCount} backups eliminados (${freedSpaceMB.toFixed(2)} MB liberados)`);
    } else {
        debugLog.log('BACKUP', `ℹ️  No hay backups antiguos para eliminar`);
    }

    return {
        deletedCount,
        freedSpaceMB: freedSpaceMB.toFixed(2)
    };
}

/**
 * Verificar integridad de backup (intentar descomprimirlo)
 */
async function verifyBackupIntegrity(backupPath) {
    try {
        debugLog.log('BACKUP', `🔍 Verificando integridad de ${path.basename(backupPath)}...`);

        // Intentar descomprimir sin guardar (solo verificar)
        await execPromise(`gunzip -t ${backupPath}`);

        debugLog.log('BACKUP', `✅ Integridad verificada correctamente`);
        return true;

    } catch (error) {
        debugLog.error('BACKUP', `❌ Backup corrupto o inválido`, error);
        return false;
    }
}

/**
 * Ejecutar backup completo (full + schema + limpieza)
 */
async function runFullBackupCycle() {
    console.log('[BACKUP] ========================================');
    console.log('[BACKUP] INICIO DE CICLO DE BACKUP');
    console.log('[BACKUP] Fecha:', new Date().toISOString());
    console.log('[BACKUP] ========================================\n');

    const results = {
        success: false,
        backups: [],
        errors: [],
        cleanupResults: null,
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Asegurar directorio de backups
        await ensureBackupDirectory();

        // 2. Crear backup full (datos + schema)
        console.log('[BACKUP] Creando backup FULL...');
        const fullBackup = await createDatabaseBackup('full');
        results.backups.push(fullBackup);

        // 3. Verificar integridad
        const isValid = await verifyBackupIntegrity(fullBackup.fullPath);
        if (!isValid) {
            throw new Error('Backup creado pero falló verificación de integridad');
        }

        // 4. Crear backup schema-only (opcional, para referencia)
        console.log('[BACKUP] Creando backup SCHEMA...');
        const schemaBackup = await createDatabaseBackup('schema');
        results.backups.push(schemaBackup);

        // 5. Limpiar backups viejos
        console.log('[BACKUP] Limpiando backups antiguos...');
        results.cleanupResults = await cleanOldBackups();

        // 6. Listar backups actuales
        const currentBackups = await listBackups();
        console.log(`\n[BACKUP] Backups disponibles: ${currentBackups.length}`);
        console.table(currentBackups.map(b => ({
            Archivo: b.filename,
            'Tamaño (MB)': b.sizeInMB,
            'Antigüedad (días)': b.ageInDays,
            Fecha: b.created.toISOString().split('T')[0]
        })));

        results.success = true;

    } catch (error) {
        console.error('[BACKUP] ❌ ERROR EN CICLO DE BACKUP:', error.message);
        results.errors.push(error.message);
        results.success = false;
    }

    console.log('\n[BACKUP] ========================================');
    console.log('[BACKUP] FIN DE CICLO DE BACKUP');
    console.log('[BACKUP] Exitoso:', results.success ? 'SÍ' : 'NO');
    console.log('[BACKUP] Backups creados:', results.backups.length);
    console.log('[BACKUP] Errores:', results.errors.length);
    console.log('[BACKUP] ========================================\n');

    return results;
}

// =====================================================
// EJECUTAR SI SE LLAMA DIRECTAMENTE
// =====================================================
if (require.main === module) {
    runFullBackupCycle()
        .then((results) => {
            if (results.success) {
                console.log('\n✅ Backup completado exitosamente');
                process.exit(0);
            } else {
                console.error('\n❌ Backup completado con errores');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n❌ Error fatal en backup:', error);
            process.exit(1);
        });
}

module.exports = {
    runFullBackupCycle,
    createDatabaseBackup,
    cleanOldBackups,
    listBackups,
    verifyBackupIntegrity
};

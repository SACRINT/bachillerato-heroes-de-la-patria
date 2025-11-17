/**
 * 🧹 SCRIPT DE LIMPIEZA AUTOMÁTICA DE REGISTROS ELIMINADOS
 * Elimina permanentemente registros con deleted_at > 30 días
 * Fecha: 17 Noviembre 2025
 *
 * USO:
 * - Manual: node backend/scripts/cleanup-old-deleted-records.js
 * - Cron: Se ejecuta automáticamente cada domingo a las 2 AM
 */

const { purgeOldDeleted } = require('../data/soft-delete-helpers');

// Lista de tablas con soft deletes
const TABLES_WITH_SOFT_DELETES = [
    'usuarios',
    'estudiantes',
    'docentes',
    'calificaciones',
    'noticias',
    'eventos',
    'avisos',
    'citas',
    'solicitudes_documentos',
    'contactos'
];

/**
 * Ejecutar limpieza de registros viejos en todas las tablas
 * @param {number} daysOld - Días de antigüedad para eliminar (default: 30)
 */
async function cleanupOldDeleted(daysOld = 30) {
    console.log('[CLEANUP] ========================================');
    console.log(`[CLEANUP] Iniciando limpieza de registros eliminados hace más de ${daysOld} días...`);
    console.log('[CLEANUP] Fecha:', new Date().toISOString());
    console.log('[CLEANUP] ========================================\n');

    let totalDeleted = 0;
    const results = [];

    for (const table of TABLES_WITH_SOFT_DELETES) {
        try {
            console.log(`[CLEANUP] Procesando tabla: ${table}...`);
            const count = await purgeOldDeleted(table, daysOld);

            results.push({
                table,
                deleted: count,
                status: 'success'
            });

            totalDeleted += count;

            if (count > 0) {
                console.log(`[CLEANUP] ✅ ${table}: ${count} registros eliminados permanentemente`);
            } else {
                console.log(`[CLEANUP] ℹ️  ${table}: No hay registros para eliminar`);
            }

        } catch (error) {
            console.error(`[CLEANUP] ❌ Error en tabla ${table}:`, error.message);
            results.push({
                table,
                deleted: 0,
                status: 'error',
                error: error.message
            });
        }
    }

    console.log('\n[CLEANUP] ========================================');
    console.log('[CLEANUP] Limpieza completada');
    console.log(`[CLEANUP] Total registros eliminados: ${totalDeleted}`);
    console.log('[CLEANUP] ========================================\n');

    // Resumen por tabla
    console.log('[CLEANUP] Resumen por tabla:');
    console.table(results);

    return {
        success: true,
        totalDeleted,
        tables: results,
        timestamp: new Date().toISOString()
    };
}

// =====================================================
// EJECUTAR SI SE LLAMA DIRECTAMENTE (no como módulo)
// =====================================================
if (require.main === module) {
    // Obtener días desde argumentos de línea de comandos
    const daysArg = process.argv[2];
    const days = daysArg ? parseInt(daysArg) : 30;

    if (isNaN(days) || days < 1) {
        console.error('[CLEANUP] ❌ Error: Días debe ser un número positivo');
        console.error('[CLEANUP] Uso: node cleanup-old-deleted-records.js [días]');
        console.error('[CLEANUP] Ejemplo: node cleanup-old-deleted-records.js 30');
        process.exit(1);
    }

    console.log(`[CLEANUP] Ejecutando limpieza con ${days} días de antigüedad...\n`);

    cleanupOldDeleted(days)
        .then((result) => {
            console.log('\n[CLEANUP] ✅ Script finalizado exitosamente');
            process.exit(0);
        })
        .catch((err) => {
            console.error('\n[CLEANUP] ❌ Error fatal:', err);
            console.error(err.stack);
            process.exit(1);
        });
}

module.exports = { cleanupOldDeleted };

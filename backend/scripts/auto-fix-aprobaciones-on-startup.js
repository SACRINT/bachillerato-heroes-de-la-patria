/**
 * 🚀 AUTO-FIX APROBACIONES - EJECUTA AUTOMÁTICAMENTE AL INICIAR SERVIDOR
 * Propósito: Sincronizar BD sin intervención manual
 * Fecha: 3 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');
const { pool } = require('../config/database');

/**
 * Función que ejecuta el fix automáticamente
 */
async function autoFixAprobaciones() {
    try {
        devLogger.log('\n🔧 [AUTO-FIX] Iniciando sincronización automática de aprobaciones...\n');

        // Paso 1: Ver estado actual
        const estadoActual = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as confirmados,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as no_confirmados
            FROM pendientes_aprobacion
        `);

        const antes = estadoActual.rows[0];
        devLogger.log('📊 [AUTO-FIX] Estado ACTUAL de la BD:');
        devLogger.log(`   - Total registros: ${antes.total}`);
        devLogger.log(`   - Pendientes: ${antes.pendientes}`);
        devLogger.log(`   - Pendientes confirmados: ${antes.confirmados}`);
        devLogger.log(`   - Pendientes NO confirmados: ${antes.no_confirmados}`);

        // Paso 2: Si hay registros sin confirmar, actualizar
        if (antes.no_confirmados > 0) {
            devLogger.log(`\n🔄 [AUTO-FIX] Actualizando ${antes.no_confirmados} registros sin confirmar...`);

            const updateResult = await pool.query(`
                UPDATE pendientes_aprobacion
                SET email_confirmado = true, updated_at = NOW()
                WHERE estado = 'pendiente' AND email_confirmado = false
                RETURNING id, tipo_solicitud, email_usuario
            `);

            devLogger.log(`✅ [AUTO-FIX] ${updateResult.rows.length} registros actualizados:`);
            updateResult.rows.forEach(row => {
                devLogger.log(`   - ID ${row.id}: ${row.tipo_solicitud} (${row.email_usuario})`);
            });

            // Paso 3: Verificar estado después
            const estadoFinal = await pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as confirmados,
                    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as no_confirmados
                FROM pendientes_aprobacion
            `);

            const despues = estadoFinal.rows[0];
            devLogger.log(`\n📊 [AUTO-FIX] Estado FINAL de la BD:`);
            devLogger.log(`   - Total registros: ${despues.total}`);
            devLogger.log(`   - Pendientes: ${despues.pendientes}`);
            devLogger.log(`   - Pendientes confirmados: ${despues.confirmados}`);
            devLogger.log(`   - Pendientes NO confirmados: ${despues.no_confirmados}`);

            devLogger.log(`\n✅ [AUTO-FIX] Sincronización completada exitosamente!\n`);

        } else {
            devLogger.log(`\n✅ [AUTO-FIX] BD ya está sincronizada. No hay cambios necesarios.\n`);
        }

    } catch (error) {
        devLogger.error('\n❌ [AUTO-FIX] Error durante sincronización:', error.message);
        devLogger.error(error);
    }
}

// Exportar función para ser llamada desde el servidor principal
module.exports = { autoFixAprobaciones };

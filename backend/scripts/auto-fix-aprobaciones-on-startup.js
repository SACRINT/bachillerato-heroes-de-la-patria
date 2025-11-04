/**
 * 🚀 AUTO-FIX APROBACIONES - EJECUTA AUTOMÁTICAMENTE AL INICIAR SERVIDOR
 * Propósito: Sincronizar BD sin intervención manual
 * Fecha: 3 Noviembre 2025
 */

const { pool } = require('../config/database');

/**
 * Función que ejecuta el fix automáticamente
 */
async function autoFixAprobaciones() {
    try {
        console.log('\n🔧 [AUTO-FIX] Iniciando sincronización automática de aprobaciones...\n');

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
        console.log('📊 [AUTO-FIX] Estado ACTUAL de la BD:');
        console.log(`   - Total registros: ${antes.total}`);
        console.log(`   - Pendientes: ${antes.pendientes}`);
        console.log(`   - Pendientes confirmados: ${antes.confirmados}`);
        console.log(`   - Pendientes NO confirmados: ${antes.no_confirmados}`);

        // Paso 2: Si hay registros sin confirmar, actualizar
        if (antes.no_confirmados > 0) {
            console.log(`\n🔄 [AUTO-FIX] Actualizando ${antes.no_confirmados} registros sin confirmar...`);

            const updateResult = await pool.query(`
                UPDATE pendientes_aprobacion
                SET email_confirmado = true, updated_at = NOW()
                WHERE estado = 'pendiente' AND email_confirmado = false
                RETURNING id, tipo_solicitud, email_usuario
            `);

            console.log(`✅ [AUTO-FIX] ${updateResult.rows.length} registros actualizados:`);
            updateResult.rows.forEach(row => {
                console.log(`   - ID ${row.id}: ${row.tipo_solicitud} (${row.email_usuario})`);
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
            console.log(`\n📊 [AUTO-FIX] Estado FINAL de la BD:`);
            console.log(`   - Total registros: ${despues.total}`);
            console.log(`   - Pendientes: ${despues.pendientes}`);
            console.log(`   - Pendientes confirmados: ${despues.confirmados}`);
            console.log(`   - Pendientes NO confirmados: ${despues.no_confirmados}`);

            console.log(`\n✅ [AUTO-FIX] Sincronización completada exitosamente!\n`);

        } else {
            console.log(`\n✅ [AUTO-FIX] BD ya está sincronizada. No hay cambios necesarios.\n`);
        }

    } catch (error) {
        console.error('\n❌ [AUTO-FIX] Error durante sincronización:', error.message);
        console.error(error);
    }
}

// Exportar función para ser llamada desde el servidor principal
module.exports = { autoFixAprobaciones };

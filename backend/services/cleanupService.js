const { pool } = require('../config/database');

/**
 * Limpiar tokens expirados de egresados
 * Ejecuta: DELETE FROM egresados_pending_confirmation WHERE token_expires_at < NOW()
 */
const cleanupExpiredEgresadosConfirmations = async () => {
    const client = await pool.connect();
    try {
        console.log('🧹 [Cleanup Service] Ejecutando limpieza de tokens de egresados expirados...');

        const query = `
            DELETE FROM egresados_pending_confirmation
            WHERE token_expires_at < NOW();
        `;

        const result = await client.query(query);

        if (result.rowCount > 0) {
            console.log(`✅ [Cleanup Service] Se eliminaron ${result.rowCount} registros de egresados expirados.`);
        } else {
            console.log('ℹ️ [Cleanup Service] No se encontraron registros de egresados para limpiar.');
        }

    } catch (error) {
        console.error('❌ [Cleanup Service] Error al limpiar tokens de egresados:', error);
    } finally {
        client.release();
    }
};

/**
 * Limpiar tokens expirados de bolsa de trabajo (CV)
 * Ejecuta: DELETE FROM bolsa_trabajo_pending_confirmation WHERE token_expires_at < NOW()
 * Agregado: 6 Noviembre 2025 - Mismo patrón que egresados
 */
const cleanupExpiredBolsaTrabajoConfirmations = async () => {
    const client = await pool.connect();
    try {
        console.log('🧹 [Cleanup Service] Ejecutando limpieza de tokens de bolsa de trabajo expirados...');

        const query = `
            DELETE FROM bolsa_trabajo_pending_confirmation
            WHERE token_expires_at < NOW();
        `;

        const result = await client.query(query);

        if (result.rowCount > 0) {
            console.log(`✅ [Cleanup Service] Se eliminaron ${result.rowCount} registros de bolsa de trabajo expirados.`);
        } else {
            console.log('ℹ️ [Cleanup Service] No se encontraron registros de bolsa de trabajo para limpiar.');
        }

    } catch (error) {
        console.error('❌ [Cleanup Service] Error al limpiar tokens de bolsa de trabajo:', error);
    } finally {
        client.release();
    }
};

/**
 * Ejecutar ambas limpiezas en paralelo
 */
const cleanupAllExpiredConfirmations = async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔄 [Cleanup Service] Iniciando ciclo de limpieza...');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // Ejecutar ambas limpiezas en paralelo
        await Promise.all([
            cleanupExpiredEgresadosConfirmations(),
            cleanupExpiredBolsaTrabajoConfirmations()
        ]);

        console.log('\n✅ [Cleanup Service] Ciclo de limpieza completado exitosamente.');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ [Cleanup Service] Error durante el ciclo de limpieza:', error);
    }
};

const startCleanupService = (intervalInHours = 12) => {
    const intervalInMs = intervalInHours * 60 * 60 * 1000;

    console.log(`🚀 [Cleanup Service] El servicio de limpieza se ejecutará cada ${intervalInHours} horas.`);
    console.log(`📊 [Cleanup Service] Se limpiarán:
       1. Tokens de egresados expirados (egresados_pending_confirmation)
       2. Tokens de bolsa de trabajo expirados (bolsa_trabajo_pending_confirmation)\n`);

    // Ejecutar una vez al iniciar
    cleanupAllExpiredConfirmations();

    // Establecer el intervalo para ejecuciones futuras
    setInterval(cleanupAllExpiredConfirmations, intervalInMs);
};

module.exports = { startCleanupService };

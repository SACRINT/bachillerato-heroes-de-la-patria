const { pool } = require('../config/database');

const cleanupTable = async (tableName) => {
    const client = await pool.connect();
    try {
        console.log(`🧹 [Cleanup Service] Ejecutando limpieza para la tabla: ${tableName}...`);
        const query = `DELETE FROM ${tableName} WHERE token_expires_at < NOW();`;
        const result = await client.query(query);

        if (result.rowCount > 0) {
            console.log(`✅ [Cleanup Service] Se eliminaron ${result.rowCount} registros expirados de ${tableName}.`);
        } else {
            console.log(`ℹ️ [Cleanup Service] No se encontraron registros para limpiar en ${tableName}.`);
        }
    } catch (error) {
        // Ignorar error si la tabla no existe, ya que puede no estar en uso en todos los despliegues
        if (error.code === '42P01') { // 42P01: undefined_table
            console.warn(`⚠️ [Cleanup Service] La tabla ${tableName} no fue encontrada, omitiendo limpieza.`);
        } else {
            console.error(`❌ [Cleanup Service] Error al limpiar la tabla ${tableName}:`, error);
        }
    } finally {
        client.release();
    }
};

const runCleanupCycle = async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔄 [Cleanup Service] Iniciando ciclo de limpieza...');
    console.log('═══════════════════════════════════════════════════════');
    
    await cleanupTable('egresados_pending_confirmation');
    await cleanupTable('bolsa_trabajo_pending_confirmation');

    console.log('\n✅ [Cleanup Service] Ciclo de limpieza completado exitosamente.');
    console.log('═══════════════════════════════════════════════════════\n');
};

const startCleanupService = (intervalInHours = 12) => {
    const intervalInMs = intervalInHours * 60 * 60 * 1000;
    
    console.log(`🚀 [Cleanup Service] El servicio de limpieza se ejecutará cada ${intervalInHours} horas.`);
    console.log(`📊 [Cleanup Service] Se limpiarán:
       1. Tokens de egresados expirados (egresados_pending_confirmation)
       2. Tokens de bolsa de trabajo expirados (bolsa_trabajo_pending_confirmation)
`);

    // Ejecutar una vez al iniciar, después de un breve retraso para no colisionar con el arranque del servidor
    setTimeout(runCleanupCycle, 10000); // 10 segundos de retraso

    // Establecer el intervalo para ejecuciones futuras
    setInterval(runCleanupCycle, intervalInMs);
};

module.exports = { startCleanupService };
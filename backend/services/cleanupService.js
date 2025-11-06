const { pool } = require('../config/database');

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
            console.log(`✅ [Cleanup Service] Se eliminaron ${result.rowCount} registros de confirmación de egresados expirados.`);
        } else {
            console.log('ℹ️ [Cleanup Service] No se encontraron registros de egresados para limpiar.');
        }

    } catch (error) {
        console.error('❌ [Cleanup Service] Error al limpiar tokens de egresados:', error);
    } finally {
        client.release();
    }
};

const startCleanupService = (intervalInHours = 12) => {
    const intervalInMs = intervalInHours * 60 * 60 * 1000;

    console.log(`🚀 [Cleanup Service] El servicio de limpieza se ejecutará cada ${intervalInHours} horas.`);

    // Ejecutar una vez al iniciar
    cleanupExpiredEgresadosConfirmations();

    // Establecer el intervalo para ejecuciones futuras
    setInterval(cleanupExpiredEgresadosConfirmations, intervalInMs);
};

module.exports = { startCleanupService };

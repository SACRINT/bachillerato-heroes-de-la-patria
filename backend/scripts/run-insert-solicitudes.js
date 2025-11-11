/**
 * 📋 Script para insertar datos de prueba en la tabla solicitudes_documentos
 * Uso: node backend/scripts/run-insert-solicitudes.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');

async function insertTestSolicitudes() {
    let client;
    try {
        devLogger.log('🔄 [SOLICITUDES TEST] Conectando a la base de datos...');
        client = await pool.connect();

        // Leer el script SQL
        const sqlFilePath = path.join(__dirname, 'insert-test-solicitudes.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

        // Ejecutar el script completo
        devLogger.log('📄 [SOLICITUDES TEST] Ejecutando script SQL...');
        await client.query(sqlContent);

        devLogger.log('✅ [SOLICITUDES TEST] ¡Datos de prueba insertados exitosamente!');
        devLogger.log('');
        devLogger.log('📊 RESUMEN:');
        devLogger.log('   - 4 solicitudes PENDIENTES (mostrarán botones de Aceptar/Rechazar)');
        devLogger.log('   - 2 solicitudes PROCESADAS (aprobadas/rechazadas)');
        devLogger.log('   - Total: 6 solicitudes');
        devLogger.log('');
        devLogger.log('🎯 PRÓXIMO PASO: Reinicia el servidor Node.js');
        devLogger.log('   Comando: node backend/server.js');
        devLogger.log('');

        // Obtener estadísticas finales
        const result = await client.query('SELECT estado, COUNT(*) as cantidad FROM solicitudes_documentos GROUP BY estado');
        devLogger.log('📈 ESTADO DE SOLICITUDES:');
        result.rows.forEach(row => {
            devLogger.log(`   - ${row.estado}: ${row.cantidad}`);
        });

    } catch (error) {
        devLogger.error('❌ [SOLICITUDES TEST] Error al insertar datos:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            client.release();
            pool.end();
            devLogger.log('\n🔌 Conexión cerrada');
        }
    }
}

insertTestSolicitudes();

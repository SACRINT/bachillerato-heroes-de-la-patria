/**
 * 📋 Script para insertar datos de prueba en la tabla solicitudes_documentos
 * Uso: node backend/scripts/run-insert-solicitudes.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function insertTestSolicitudes() {
    let client;
    try {
        console.log('🔄 [SOLICITUDES TEST] Conectando a la base de datos...');
        client = await pool.connect();

        // Leer el script SQL
        const sqlFilePath = path.join(__dirname, 'insert-test-solicitudes.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

        // Ejecutar el script completo
        console.log('📄 [SOLICITUDES TEST] Ejecutando script SQL...');
        await client.query(sqlContent);

        console.log('✅ [SOLICITUDES TEST] ¡Datos de prueba insertados exitosamente!');
        console.log('');
        console.log('📊 RESUMEN:');
        console.log('   - 4 solicitudes PENDIENTES (mostrarán botones de Aceptar/Rechazar)');
        console.log('   - 2 solicitudes PROCESADAS (aprobadas/rechazadas)');
        console.log('   - Total: 6 solicitudes');
        console.log('');
        console.log('🎯 PRÓXIMO PASO: Reinicia el servidor Node.js');
        console.log('   Comando: node backend/server.js');
        console.log('');

        // Obtener estadísticas finales
        const result = await client.query('SELECT estado, COUNT(*) as cantidad FROM solicitudes_documentos GROUP BY estado');
        console.log('📈 ESTADO DE SOLICITUDES:');
        result.rows.forEach(row => {
            console.log(`   - ${row.estado}: ${row.cantidad}`);
        });

    } catch (error) {
        console.error('❌ [SOLICITUDES TEST] Error al insertar datos:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            client.release();
            pool.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

insertTestSolicitudes();

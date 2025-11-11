/**
 * 🗑️ Script para eliminar registro incorrecto de pendientes_aprobacion
 * El email samuelci6377@gmail.com se guardó como 'bolsa_trabajo' en lugar de 'egresados'
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    devLogger.log('🔍 Buscando registro incorrecto...');

    const result = await pool.query(
      `SELECT id, tipo_solicitud, email_usuario, estado FROM pendientes_aprobacion
       WHERE email_usuario = $1`,
      ['samuelci6377@gmail.com']
    );

    if (result.rows.length === 0) {
      devLogger.log('✅ No hay registros con ese email');
    } else {
      devLogger.log('📋 Registros encontrados:');
      result.rows.forEach(row => {
        devLogger.log(`  ID: ${row.id}, Tipo: ${row.tipo_solicitud}, Email: ${row.email_usuario}, Estado: ${row.estado}`);
      });

      // Eliminar solo los registros que tienen tipo_solicitud = 'bolsa_trabajo'
      const deleteResult = await pool.query(
        `DELETE FROM pendientes_aprobacion
         WHERE email_usuario = $1 AND tipo_solicitud = $2`,
        ['samuelci6377@gmail.com', 'bolsa_trabajo']
      );

      devLogger.log(`\n✅ ${deleteResult.rowCount} registro(s) eliminado(s)`);
    }

  } catch (err) {
    devLogger.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
})();

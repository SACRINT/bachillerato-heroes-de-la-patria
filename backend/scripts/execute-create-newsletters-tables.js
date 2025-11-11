/**
 * 📧 SCRIPT PARA CREAR TABLAS DE NEWSLETTERS EN POSTGRESQL
 * Ejecuta el script SQL create-newsletters-tables.sql
 */

const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function createNewslettersTables() {
    devLogger.log('🚀 Iniciando creación de tablas de newsletters...\n');

    try {
        // 1. Test de conexión
        devLogger.log('1️⃣ Verificando conexión a PostgreSQL...');
        await testConnection();
        devLogger.log('✅ Conexión verificada\n');

        // 2. Leer script SQL
        devLogger.log('2️⃣ Leyendo script SQL...');
        const sqlFilePath = path.join(__dirname, 'create-newsletters-tables.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
        devLogger.log(`✅ Script cargado: ${sqlFilePath}\n`);

        // 3. Ejecutar script SQL
        devLogger.log('3️⃣ Ejecutando script SQL...');
        devLogger.log('   (Esto puede tomar unos segundos)\n');

        // PostgreSQL permite ejecutar múltiples statements en una sola query
        await pool.query(sqlScript);

        devLogger.log('✅ Script ejecutado exitosamente\n');

        // 4. Verificar tablas creadas
        devLogger.log('4️⃣ Verificando tablas creadas...');
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('suscriptores', 'newsletters', 'newsletter_envios')
            ORDER BY table_name
        `);

        devLogger.log(`✅ ${result.rows.length} tablas encontradas:`);
        result.rows.forEach(row => {
            devLogger.log(`   • ${row.table_name}`);
        });

        // 5. Verificar datos de prueba
        devLogger.log('\n5️⃣ Verificando datos de prueba...');
        const statsResult = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM suscriptores) AS suscriptores,
                (SELECT COUNT(*) FROM newsletters) AS newsletters,
                (SELECT COUNT(*) FROM newsletter_envios) AS envios
        `);

        const stats = statsResult.rows[0];
        devLogger.log('✅ Datos de prueba insertados:');
        devLogger.log(`   • Suscriptores: ${stats.suscriptores}`);
        devLogger.log(`   • Newsletters: ${stats.newsletters}`);
        devLogger.log(`   • Envíos: ${stats.envios}`);

        devLogger.log('\n🎉 ¡Tablas de newsletters creadas exitosamente!');
        devLogger.log('🔧 Ahora puedes usar el sistema de newsletters con PostgreSQL');

        process.exit(0);

    } catch (error) {
        devLogger.error('\n❌ Error creando tablas:', error.message);
        devLogger.error('\n🔍 Detalles del error:');
        devLogger.error(error);

        if (error.code === 'ECONNREFUSED') {
            devLogger.error('\n💡 Sugerencias:');
            devLogger.error('   • Verifica que PostgreSQL esté corriendo');
            devLogger.error('   • Verifica DATABASE_URL en .env o variables de entorno');
            devLogger.error('   • Si usas Neon/Vercel, verifica las credenciales');
        }

        process.exit(1);
    }
}

// Ejecutar
createNewslettersTables();

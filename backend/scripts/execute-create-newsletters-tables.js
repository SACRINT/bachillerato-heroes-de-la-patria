/**
 * 📧 SCRIPT PARA CREAR TABLAS DE NEWSLETTERS EN POSTGRESQL
 * Ejecuta el script SQL create-newsletters-tables.sql
 */

const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function createNewslettersTables() {
    console.log('🚀 Iniciando creación de tablas de newsletters...\n');

    try {
        // 1. Test de conexión
        console.log('1️⃣ Verificando conexión a PostgreSQL...');
        await testConnection();
        console.log('✅ Conexión verificada\n');

        // 2. Leer script SQL
        console.log('2️⃣ Leyendo script SQL...');
        const sqlFilePath = path.join(__dirname, 'create-newsletters-tables.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
        console.log(`✅ Script cargado: ${sqlFilePath}\n`);

        // 3. Ejecutar script SQL
        console.log('3️⃣ Ejecutando script SQL...');
        console.log('   (Esto puede tomar unos segundos)\n');

        // PostgreSQL permite ejecutar múltiples statements en una sola query
        await pool.query(sqlScript);

        console.log('✅ Script ejecutado exitosamente\n');

        // 4. Verificar tablas creadas
        console.log('4️⃣ Verificando tablas creadas...');
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('suscriptores', 'newsletters', 'newsletter_envios')
            ORDER BY table_name
        `);

        console.log(`✅ ${result.rows.length} tablas encontradas:`);
        result.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });

        // 5. Verificar datos de prueba
        console.log('\n5️⃣ Verificando datos de prueba...');
        const statsResult = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM suscriptores) AS suscriptores,
                (SELECT COUNT(*) FROM newsletters) AS newsletters,
                (SELECT COUNT(*) FROM newsletter_envios) AS envios
        `);

        const stats = statsResult.rows[0];
        console.log('✅ Datos de prueba insertados:');
        console.log(`   • Suscriptores: ${stats.suscriptores}`);
        console.log(`   • Newsletters: ${stats.newsletters}`);
        console.log(`   • Envíos: ${stats.envios}`);

        console.log('\n🎉 ¡Tablas de newsletters creadas exitosamente!');
        console.log('🔧 Ahora puedes usar el sistema de newsletters con PostgreSQL');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error creando tablas:', error.message);
        console.error('\n🔍 Detalles del error:');
        console.error(error);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Sugerencias:');
            console.error('   • Verifica que PostgreSQL esté corriendo');
            console.error('   • Verifica DATABASE_URL en .env o variables de entorno');
            console.error('   • Si usas Neon/Vercel, verifica las credenciales');
        }

        process.exit(1);
    }
}

// Ejecutar
createNewslettersTables();

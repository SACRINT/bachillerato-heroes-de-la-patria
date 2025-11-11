/**
 * 📅 SCRIPT PARA CREAR TABLA DE CITAS EN POSTGRESQL
 * Ejecuta el script SQL create-citas-tables.sql
 */

const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function createCitasTables() {
    devLogger.log('🚀 Iniciando creación de tabla de citas...\n');

    try {
        // 1. Test de conexión
        devLogger.log('1️⃣ Verificando conexión a PostgreSQL...');
        await testConnection();
        devLogger.log('✅ Conexión verificada\n');

        // 2. Leer script SQL
        devLogger.log('2️⃣ Leyendo script SQL...');
        const sqlFilePath = path.join(__dirname, 'create-citas-tables.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
        devLogger.log(`✅ Script cargado: ${sqlFilePath}\n`);

        // 3. Ejecutar script SQL
        devLogger.log('3️⃣ Ejecutando script SQL...');
        devLogger.log('   (Esto puede tomar unos segundos)\n');

        await pool.query(sqlScript);

        devLogger.log('✅ Script ejecutado exitosamente\n');

        // 4. Verificar tabla creada
        devLogger.log('4️⃣ Verificando tabla creada...');
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'citas'
        `);

        if (result.rows.length > 0) {
            devLogger.log('✅ Tabla encontrada: citas');
        }

        // 5. Verificar datos de prueba
        devLogger.log('\n5️⃣ Verificando datos de prueba...');
        const statsResult = await pool.query(`
            SELECT COUNT(*) AS total FROM citas
        `);

        devLogger.log(`✅ Citas de prueba insertadas: ${statsResult.rows[0].total}`);

        devLogger.log('\n🎉 ¡Tabla de citas creada exitosamente!');
        devLogger.log('🔧 Ahora puedes usar el sistema de citas con PostgreSQL');

        process.exit(0);

    } catch (error) {
        devLogger.error('\n❌ Error creando tabla:', error.message);
        devLogger.error('\n🔍 Detalles del error:');
        devLogger.error(error);

        process.exit(1);
    }
}

// Ejecutar
createCitasTables();

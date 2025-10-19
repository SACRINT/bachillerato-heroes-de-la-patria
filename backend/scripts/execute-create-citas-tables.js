/**
 * 📅 SCRIPT PARA CREAR TABLA DE CITAS EN POSTGRESQL
 * Ejecuta el script SQL create-citas-tables.sql
 */

const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function createCitasTables() {
    console.log('🚀 Iniciando creación de tabla de citas...\n');

    try {
        // 1. Test de conexión
        console.log('1️⃣ Verificando conexión a PostgreSQL...');
        await testConnection();
        console.log('✅ Conexión verificada\n');

        // 2. Leer script SQL
        console.log('2️⃣ Leyendo script SQL...');
        const sqlFilePath = path.join(__dirname, 'create-citas-tables.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
        console.log(`✅ Script cargado: ${sqlFilePath}\n`);

        // 3. Ejecutar script SQL
        console.log('3️⃣ Ejecutando script SQL...');
        console.log('   (Esto puede tomar unos segundos)\n');

        await pool.query(sqlScript);

        console.log('✅ Script ejecutado exitosamente\n');

        // 4. Verificar tabla creada
        console.log('4️⃣ Verificando tabla creada...');
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'citas'
        `);

        if (result.rows.length > 0) {
            console.log('✅ Tabla encontrada: citas');
        }

        // 5. Verificar datos de prueba
        console.log('\n5️⃣ Verificando datos de prueba...');
        const statsResult = await pool.query(`
            SELECT COUNT(*) AS total FROM citas
        `);

        console.log(`✅ Citas de prueba insertadas: ${statsResult.rows[0].total}`);

        console.log('\n🎉 ¡Tabla de citas creada exitosamente!');
        console.log('🔧 Ahora puedes usar el sistema de citas con PostgreSQL');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error creando tabla:', error.message);
        console.error('\n🔍 Detalles del error:');
        console.error(error);

        process.exit(1);
    }
}

// Ejecutar
createCitasTables();

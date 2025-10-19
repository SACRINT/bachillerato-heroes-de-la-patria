/**
 * 🎓 SCRIPT PARA CREAR TABLA DE EGRESADOS EN POSTGRESQL
 * Ejecuta el script SQL create-egresados-table.sql
 */

const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function createEgresadosTable() {
    console.log('🚀 Iniciando creación de tabla de egresados...\n');

    try {
        // 1. Test de conexión
        console.log('1️⃣ Verificando conexión a PostgreSQL...');
        await testConnection();
        console.log('✅ Conexión verificada\n');

        // 2. Leer script SQL
        console.log('2️⃣ Leyendo script SQL...');
        const sqlFilePath = path.join(__dirname, 'create-egresados-table.sql');
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
            AND table_name = 'egresados'
        `);

        if (result.rows.length > 0) {
            console.log('✅ Tabla encontrada: egresados');
        }

        // 5. Verificar datos de prueba
        console.log('\n5️⃣ Verificando datos de prueba...');
        const statsResult = await pool.query(`
            SELECT COUNT(*) AS total FROM egresados
        `);

        console.log(`✅ Perfiles de prueba insertados: ${statsResult.rows[0].total}`);

        // 6. Mostrar perfiles insertados
        console.log('\n6️⃣ Perfiles de prueba:');
        const profilesResult = await pool.query(`
            SELECT egresado_id, nombre_completo, carrera_tecnica, estado_perfil
            FROM egresados
            ORDER BY created_at
        `);

        profilesResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.egresado_id} - ${row.nombre_completo}`);
            console.log(`      Carrera: ${row.carrera_tecnica}`);
            console.log(`      Estado: ${row.estado_perfil}\n`);
        });

        console.log('🎉 ¡Tabla de egresados creada exitosamente!');
        console.log('🔧 Ahora puedes usar el sistema de perfiles profesionales');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error creando tabla:', error.message);
        console.error('\n🔍 Detalles del error:');
        console.error(error);

        process.exit(1);
    }
}

// Ejecutar
createEgresadosTable();

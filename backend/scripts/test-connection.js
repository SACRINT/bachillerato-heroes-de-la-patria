/**
 * 🔧 SCRIPT DE PRUEBA DE CONEXIÓN MYSQL
 * ====================================
 * Verifica la conexión a MySQL y el estado de la base de datos BGE
 * Proyecto: Bachillerato General Estatal "Héroes de la Patria"
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.database') });

// Configuración de conexión
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'bge_user',
    password: process.env.DB_PASSWORD || 'HeroesPatria2025DB!',
    database: process.env.DB_NAME || 'heroes_patria_db',
    charset: 'utf8mb4'
};

/**
 * Probar conexión básica a MySQL
 */
async function testBasicConnection() {
    console.log('🔍 Probando conexión básica a MySQL...');
    console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 Usuario: ${dbConfig.user}`);
    console.log(`🗄️ Base de datos: ${dbConfig.database}`);
    console.log('=====================================');

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa a MySQL');

        // Verificar versión
        const [versionRows] = await connection.execute('SELECT VERSION() as version');
        console.log(`📊 MySQL Version: ${versionRows[0].version}`);

        // Verificar configuración
        const [charsetRows] = await connection.execute('SELECT @@character_set_database as charset, @@collation_database as collation');
        console.log(`🔤 Charset: ${charsetRows[0].charset}`);
        console.log(`🔤 Collation: ${charsetRows[0].collation}`);

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error de conexión básica:', error.message);

        // Diagnósticos específicos
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 DIAGNÓSTICO:');
            console.log('   - El servidor MySQL no está ejecutándose');
            console.log('   - Comandos para iniciar: net start MySQL80');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔧 DIAGNÓSTICO:');
            console.log('   - Usuario o contraseña incorrectos');
            console.log('   - Verificar credenciales en .env.database');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n🔧 DIAGNÓSTICO:');
            console.log('   - La base de datos no existe');
            console.log('   - Ejecutar: mysql -u root -p < backend/scripts/create-database.sql');
        }

        return false;
    }
}

/**
 * Verificar estructura de la base de datos
 */
async function checkDatabaseStructure() {
    console.log('\n🏗️ Verificando estructura de la base de datos...');
    console.log('==============================================');

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Obtener lista de tablas
        const [tables] = await connection.execute(`
            SELECT table_name, table_rows, data_length, index_length
            FROM information_schema.tables
            WHERE table_schema = ?
            ORDER BY table_name
        `, [dbConfig.database]);

        if (tables.length === 0) {
            console.log('❌ No se encontraron tablas en la base de datos');
            console.log('💡 Ejecutar: mysql -u bge_user -p heroes_patria_db < backend/scripts/create-database.sql');
            return false;
        }

        console.log(`📋 Total de tablas encontradas: ${tables.length}`);
        console.log('\n📊 ESTRUCTURA DE TABLAS:');

        tables.forEach(table => {
            const sizeKB = Math.round((parseInt(table.data_length) + parseInt(table.index_length)) / 1024);
            console.log(`   📄 ${table.table_name.padEnd(25)} | Filas: ${String(table.table_rows).padStart(6)} | Tamaño: ${sizeKB} KB`);
        });

        // Verificar tablas críticas
        const criticalTables = ['usuarios', 'estudiantes', 'docentes', 'materias', 'calificaciones', 'avisos'];
        const existingTables = tables.map(t => t.table_name);
        const missingTables = criticalTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            console.log(`\n⚠️ Tablas críticas faltantes: ${missingTables.join(', ')}`);
        } else {
            console.log('\n✅ Todas las tablas críticas están presentes');
        }

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error verificando estructura:', error.message);
        return false;
    }
}

/**
 * Verificar datos iniciales
 */
async function checkInitialData() {
    console.log('\n📊 Verificando datos iniciales...');
    console.log('================================');

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Estadísticas generales
        const queries = [
            { name: 'Usuarios', query: 'SELECT COUNT(*) as count FROM usuarios' },
            { name: 'Administradores', query: 'SELECT COUNT(*) as count FROM usuarios WHERE role = "admin"' },
            { name: 'Docentes', query: 'SELECT COUNT(*) as count FROM docentes' },
            { name: 'Estudiantes', query: 'SELECT COUNT(*) as count FROM estudiantes' },
            { name: 'Materias', query: 'SELECT COUNT(*) as count FROM materias' },
            { name: 'Achievements', query: 'SELECT COUNT(*) as count FROM achievements' },
            { name: 'Avisos', query: 'SELECT COUNT(*) as count FROM avisos' }
        ];

        for (const { name, query } of queries) {
            try {
                const [result] = await connection.execute(query);
                const count = result[0].count;
                const status = count > 0 ? '✅' : '⚠️';
                console.log(`   ${status} ${name.padEnd(15)}: ${count}`);
            } catch (error) {
                console.log(`   ❌ ${name.padEnd(15)}: Error - ${error.message}`);
            }
        }

        // Verificar usuario administrador
        const [adminUsers] = await connection.execute('SELECT username, email FROM usuarios WHERE role = "admin"');
        if (adminUsers.length > 0) {
            console.log('\n👨‍💼 USUARIOS ADMINISTRADORES:');
            adminUsers.forEach(admin => {
                console.log(`   🔑 ${admin.username} (${admin.email})`);
            });
        }

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error verificando datos iniciales:', error.message);
        return false;
    }
}

/**
 * Probar operaciones CRUD básicas
 */
async function testCRUDOperations() {
    console.log('\n🧪 Probando operaciones CRUD básicas...');
    console.log('======================================');

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Test CREATE
        console.log('   🔧 Probando INSERT...');
        const testId = `test_${Date.now()}`;
        await connection.execute(`
            INSERT INTO system_metrics (metric_name, metric_value, metric_type)
            VALUES (?, 1.0, 'counter')
        `, [testId]);
        console.log('   ✅ INSERT exitoso');

        // Test READ
        console.log('   🔍 Probando SELECT...');
        const [selectResult] = await connection.execute(
            'SELECT * FROM system_metrics WHERE metric_name = ?',
            [testId]
        );
        if (selectResult.length > 0) {
            console.log('   ✅ SELECT exitoso');
        } else {
            console.log('   ❌ SELECT falló');
        }

        // Test UPDATE
        console.log('   ✏️ Probando UPDATE...');
        await connection.execute(
            'UPDATE system_metrics SET metric_value = 2.0 WHERE metric_name = ?',
            [testId]
        );
        console.log('   ✅ UPDATE exitoso');

        // Test DELETE
        console.log('   🗑️ Probando DELETE...');
        await connection.execute(
            'DELETE FROM system_metrics WHERE metric_name = ?',
            [testId]
        );
        console.log('   ✅ DELETE exitoso');

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error en operaciones CRUD:', error.message);
        return false;
    }
}

/**
 * Función principal de pruebas
 */
async function runConnectionTest() {
    console.log('🚀 BGE DATABASE CONNECTION TEST');
    console.log('===============================');
    console.log(`⏰ Fecha: ${new Date().toLocaleString()}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);

    let allTestsPassed = true;

    // Ejecutar todas las pruebas
    const tests = [
        { name: 'Conexión Básica', fn: testBasicConnection },
        { name: 'Estructura de BD', fn: checkDatabaseStructure },
        { name: 'Datos Iniciales', fn: checkInitialData },
        { name: 'Operaciones CRUD', fn: testCRUDOperations }
    ];

    for (const { name, fn } of tests) {
        console.log(`\n🔍 Ejecutando prueba: ${name}`);
        const result = await fn();
        if (!result) {
            allTestsPassed = false;
        }
    }

    // Resultado final
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
        console.log('🎉 TODAS LAS PRUEBAS EXITOSAS');
        console.log('✅ La base de datos MySQL está completamente configurada');
        console.log('🚀 El sistema está listo para producción');
    } else {
        console.log('⚠️ ALGUNAS PRUEBAS FALLARON');
        console.log('🔧 Revisar los mensajes de error arriba');
        console.log('📖 Consultar: docs/SETUP_MYSQL_INSTALLATION.md');
    }
    console.log('='.repeat(50));
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
    runConnectionTest().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = {
    runConnectionTest,
    testBasicConnection,
    checkDatabaseStructure,
    checkInitialData,
    testCRUDOperations
};
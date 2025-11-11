/**
 * 🔧 SCRIPT DE PRUEBA DE CONEXIÓN MYSQL
 * ====================================
 * Verifica la conexión a MySQL y el estado de la base de datos BGE
 * Proyecto: Bachillerato General Estatal "Héroes de la Patria"
 */

const mysql = require('mysql2/promise');
const devLogger = require('../utils/devLogger');
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
    devLogger.log('🔍 Probando conexión básica a MySQL...');
    devLogger.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
    devLogger.log(`👤 Usuario: ${dbConfig.user}`);
    devLogger.log(`🗄️ Base de datos: ${dbConfig.database}`);
    devLogger.log('=====================================');

    try {
        const connection = await mysql.createConnection(dbConfig);
        devLogger.log('✅ Conexión exitosa a MySQL');

        // Verificar versión
        const [versionRows] = await connection.execute('SELECT VERSION() as version');
        devLogger.log(`📊 MySQL Version: ${versionRows[0].version}`);

        // Verificar configuración
        const [charsetRows] = await connection.execute('SELECT @@character_set_database as charset, @@collation_database as collation');
        devLogger.log(`🔤 Charset: ${charsetRows[0].charset}`);
        devLogger.log(`🔤 Collation: ${charsetRows[0].collation}`);

        await connection.end();
        return true;

    } catch (error) {
        devLogger.error('❌ Error de conexión básica:', error.message);

        // Diagnósticos específicos
        if (error.code === 'ECONNREFUSED') {
            devLogger.log('\n🔧 DIAGNÓSTICO:');
            devLogger.log('   - El servidor MySQL no está ejecutándose');
            devLogger.log('   - Comandos para iniciar: net start MySQL80');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            devLogger.log('\n🔧 DIAGNÓSTICO:');
            devLogger.log('   - Usuario o contraseña incorrectos');
            devLogger.log('   - Verificar credenciales en .env.database');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            devLogger.log('\n🔧 DIAGNÓSTICO:');
            devLogger.log('   - La base de datos no existe');
            devLogger.log('   - Ejecutar: mysql -u root -p < backend/scripts/create-database.sql');
        }

        return false;
    }
}

/**
 * Verificar estructura de la base de datos
 */
async function checkDatabaseStructure() {
    devLogger.log('\n🏗️ Verificando estructura de la base de datos...');
    devLogger.log('==============================================');

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
            devLogger.log('❌ No se encontraron tablas en la base de datos');
            devLogger.log('💡 Ejecutar: mysql -u bge_user -p heroes_patria_db < backend/scripts/create-database.sql');
            return false;
        }

        devLogger.log(`📋 Total de tablas encontradas: ${tables.length}`);
        devLogger.log('\n📊 ESTRUCTURA DE TABLAS:');

        tables.forEach(table => {
            const sizeKB = Math.round((parseInt(table.data_length) + parseInt(table.index_length)) / 1024);
            devLogger.log(`   📄 ${table.table_name.padEnd(25)} | Filas: ${String(table.table_rows).padStart(6)} | Tamaño: ${sizeKB} KB`);
        });

        // Verificar tablas críticas
        const criticalTables = ['usuarios', 'estudiantes', 'docentes', 'materias', 'calificaciones', 'avisos'];
        const existingTables = tables.map(t => t.table_name);
        const missingTables = criticalTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            devLogger.log(`\n⚠️ Tablas críticas faltantes: ${missingTables.join(', ')}`);
        } else {
            devLogger.log('\n✅ Todas las tablas críticas están presentes');
        }

        await connection.end();
        return true;

    } catch (error) {
        devLogger.error('❌ Error verificando estructura:', error.message);
        return false;
    }
}

/**
 * Verificar datos iniciales
 */
async function checkInitialData() {
    devLogger.log('\n📊 Verificando datos iniciales...');
    devLogger.log('================================');

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
                devLogger.log(`   ${status} ${name.padEnd(15)}: ${count}`);
            } catch (error) {
                devLogger.log(`   ❌ ${name.padEnd(15)}: Error - ${error.message}`);
            }
        }

        // Verificar usuario administrador
        const [adminUsers] = await connection.execute('SELECT username, email FROM usuarios WHERE role = "admin"');
        if (adminUsers.length > 0) {
            devLogger.log('\n👨‍💼 USUARIOS ADMINISTRADORES:');
            adminUsers.forEach(admin => {
                devLogger.log(`   🔑 ${admin.username} (${admin.email})`);
            });
        }

        await connection.end();
        return true;

    } catch (error) {
        devLogger.error('❌ Error verificando datos iniciales:', error.message);
        return false;
    }
}

/**
 * Probar operaciones CRUD básicas
 */
async function testCRUDOperations() {
    devLogger.log('\n🧪 Probando operaciones CRUD básicas...');
    devLogger.log('======================================');

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Test CREATE
        devLogger.log('   🔧 Probando INSERT...');
        const testId = `test_${Date.now()}`;
        await connection.execute(`
            INSERT INTO system_metrics (metric_name, metric_value, metric_type)
            VALUES (?, 1.0, 'counter')
        `, [testId]);
        devLogger.log('   ✅ INSERT exitoso');

        // Test READ
        devLogger.log('   🔍 Probando SELECT...');
        const [selectResult] = await connection.execute(
            'SELECT * FROM system_metrics WHERE metric_name = ?',
            [testId]
        );
        if (selectResult.length > 0) {
            devLogger.log('   ✅ SELECT exitoso');
        } else {
            devLogger.log('   ❌ SELECT falló');
        }

        // Test UPDATE
        devLogger.log('   ✏️ Probando UPDATE...');
        await connection.execute(
            'UPDATE system_metrics SET metric_value = 2.0 WHERE metric_name = ?',
            [testId]
        );
        devLogger.log('   ✅ UPDATE exitoso');

        // Test DELETE
        devLogger.log('   🗑️ Probando DELETE...');
        await connection.execute(
            'DELETE FROM system_metrics WHERE metric_name = ?',
            [testId]
        );
        devLogger.log('   ✅ DELETE exitoso');

        await connection.end();
        return true;

    } catch (error) {
        devLogger.error('❌ Error en operaciones CRUD:', error.message);
        return false;
    }
}

/**
 * Función principal de pruebas
 */
async function runConnectionTest() {
    devLogger.log('🚀 BGE DATABASE CONNECTION TEST');
    devLogger.log('===============================');
    devLogger.log(`⏰ Fecha: ${new Date().toLocaleString()}`);
    devLogger.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);

    let allTestsPassed = true;

    // Ejecutar todas las pruebas
    const tests = [
        { name: 'Conexión Básica', fn: testBasicConnection },
        { name: 'Estructura de BD', fn: checkDatabaseStructure },
        { name: 'Datos Iniciales', fn: checkInitialData },
        { name: 'Operaciones CRUD', fn: testCRUDOperations }
    ];

    for (const { name, fn } of tests) {
        devLogger.log(`\n🔍 Ejecutando prueba: ${name}`);
        const result = await fn();
        if (!result) {
            allTestsPassed = false;
        }
    }

    // Resultado final
    devLogger.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
        devLogger.log('🎉 TODAS LAS PRUEBAS EXITOSAS');
        devLogger.log('✅ La base de datos MySQL está completamente configurada');
        devLogger.log('🚀 El sistema está listo para producción');
    } else {
        devLogger.log('⚠️ ALGUNAS PRUEBAS FALLARON');
        devLogger.log('🔧 Revisar los mensajes de error arriba');
        devLogger.log('📖 Consultar: docs/SETUP_MYSQL_INSTALLATION.md');
    }
    devLogger.log('='.repeat(50));
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
    runConnectionTest().then(() => {
        process.exit(0);
    }).catch(error => {
        devLogger.error('💥 Error fatal:', error);
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
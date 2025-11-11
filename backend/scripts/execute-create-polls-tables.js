/**
 * EJECUTAR CREACIÓN DE TABLAS DEL SISTEMA DE ENCUESTAS
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

const fs = require('fs').promises;
const devLogger = require('../utils/devLogger');
const path = require('path');
const { pool } = require('../config/database');

/**
 * Ejecuta el script SQL para crear las tablas
 */
async function createPollsTables() {
    const client = await pool.connect();

    try {
        devLogger.log('🚀 Iniciando creación de tablas del Sistema de Encuestas...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-polls-tables.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        devLogger.log('📄 Archivo SQL cargado:', sqlPath);
        devLogger.log('📏 Tamaño:', sql.length, 'caracteres\n');

        // Ejecutar el script
        devLogger.log('⚙️ Ejecutando script SQL...\n');
        await client.query(sql);

        devLogger.log('\n✅ Tablas creadas exitosamente!\n');

        // Verificar tablas creadas
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'poll%'
            ORDER BY table_name;
        `;

        const result = await client.query(tablesQuery);

        devLogger.log('📊 Tablas del sistema de encuestas:');
        devLogger.log('═════════════════════════════════════\n');
        result.rows.forEach((row, index) => {
            devLogger.log(`  ${index + 1}. ${row.table_name}`);
        });
        devLogger.log();

        // Verificar categorías insertadas
        const categoriesQuery = 'SELECT COUNT(*) as count FROM poll_categories';
        const categoriesResult = await client.query(categoriesQuery);
        const categoriesCount = categoriesResult.rows[0].count;

        devLogger.log(`📁 Categorías iniciales insertadas: ${categoriesCount}`);

        // Mostrar las categorías
        const categoriesListQuery = `
            SELECT name, slug, icon, color
            FROM poll_categories
            ORDER BY display_order
        `;
        const categoriesList = await client.query(categoriesListQuery);

        devLogger.log('\n📋 Categorías disponibles:');
        devLogger.log('═════════════════════════════════════\n');
        categoriesList.rows.forEach((cat, index) => {
            devLogger.log(`  ${index + 1}. ${cat.icon} ${cat.name} (${cat.slug}) - ${cat.color}`);
        });
        devLogger.log();

        // Verificar funciones y triggers
        const functionsQuery = `
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_type = 'FUNCTION'
            AND routine_schema = 'public'
            AND routine_name LIKE '%poll%'
            ORDER BY routine_name;
        `;
        const functionsResult = await client.query(functionsQuery);

        devLogger.log(`🔧 Funciones creadas: ${functionsResult.rows.length}`);
        functionsResult.rows.forEach((func, index) => {
            devLogger.log(`  ${index + 1}. ${func.routine_name}()`);
        });
        devLogger.log();

        // Verificar vistas
        const viewsQuery = `
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE '%poll%'
            ORDER BY table_name;
        `;
        const viewsResult = await client.query(viewsQuery);

        devLogger.log(`📈 Vistas creadas: ${viewsResult.rows.length}`);
        viewsResult.rows.forEach((view, index) => {
            devLogger.log(`  ${index + 1}. ${view.table_name}`);
        });
        devLogger.log();

        // Resumen final
        devLogger.log('═════════════════════════════════════');
        devLogger.log('✅ SISTEMA DE ENCUESTAS INSTALADO');
        devLogger.log('═════════════════════════════════════');
        devLogger.log(`📊 Tablas: ${result.rows.length}`);
        devLogger.log(`🔧 Funciones: ${functionsResult.rows.length}`);
        devLogger.log(`📈 Vistas: ${viewsResult.rows.length}`);
        devLogger.log(`📁 Categorías: ${categoriesCount}`);
        devLogger.log('═════════════════════════════════════\n');

        devLogger.log('🎯 Próximos pasos:');
        devLogger.log('  1. Crear API REST en /api/polls');
        devLogger.log('  2. Desarrollar interfaz de gestión');
        devLogger.log('  3. Implementar sistema de votación');
        devLogger.log('  4. Integrar visualización de resultados\n');

    } catch (error) {
        devLogger.error('\n❌ Error al crear las tablas:', error.message);
        devLogger.error('\n📋 Detalles del error:');
        devLogger.error(error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Función principal
 */
async function main() {
    try {
        await createPollsTables();
        devLogger.log('🎉 Proceso completado exitosamente!\n');
        process.exit(0);
    } catch (error) {
        devLogger.error('\n💥 Error fatal:', error.message);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}

module.exports = { createPollsTables };

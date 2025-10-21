/**
 * EJECUTAR CREACIÓN DE TABLAS DEL SISTEMA DE ENCUESTAS
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

/**
 * Ejecuta el script SQL para crear las tablas
 */
async function createPollsTables() {
    const client = await pool.connect();

    try {
        console.log('🚀 Iniciando creación de tablas del Sistema de Encuestas...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-polls-tables.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        console.log('📄 Archivo SQL cargado:', sqlPath);
        console.log('📏 Tamaño:', sql.length, 'caracteres\n');

        // Ejecutar el script
        console.log('⚙️ Ejecutando script SQL...\n');
        await client.query(sql);

        console.log('\n✅ Tablas creadas exitosamente!\n');

        // Verificar tablas creadas
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'poll%'
            ORDER BY table_name;
        `;

        const result = await client.query(tablesQuery);

        console.log('📊 Tablas del sistema de encuestas:');
        console.log('═════════════════════════════════════\n');
        result.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.table_name}`);
        });
        console.log();

        // Verificar categorías insertadas
        const categoriesQuery = 'SELECT COUNT(*) as count FROM poll_categories';
        const categoriesResult = await client.query(categoriesQuery);
        const categoriesCount = categoriesResult.rows[0].count;

        console.log(`📁 Categorías iniciales insertadas: ${categoriesCount}`);

        // Mostrar las categorías
        const categoriesListQuery = `
            SELECT name, slug, icon, color
            FROM poll_categories
            ORDER BY display_order
        `;
        const categoriesList = await client.query(categoriesListQuery);

        console.log('\n📋 Categorías disponibles:');
        console.log('═════════════════════════════════════\n');
        categoriesList.rows.forEach((cat, index) => {
            console.log(`  ${index + 1}. ${cat.icon} ${cat.name} (${cat.slug}) - ${cat.color}`);
        });
        console.log();

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

        console.log(`🔧 Funciones creadas: ${functionsResult.rows.length}`);
        functionsResult.rows.forEach((func, index) => {
            console.log(`  ${index + 1}. ${func.routine_name}()`);
        });
        console.log();

        // Verificar vistas
        const viewsQuery = `
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE '%poll%'
            ORDER BY table_name;
        `;
        const viewsResult = await client.query(viewsQuery);

        console.log(`📈 Vistas creadas: ${viewsResult.rows.length}`);
        viewsResult.rows.forEach((view, index) => {
            console.log(`  ${index + 1}. ${view.table_name}`);
        });
        console.log();

        // Resumen final
        console.log('═════════════════════════════════════');
        console.log('✅ SISTEMA DE ENCUESTAS INSTALADO');
        console.log('═════════════════════════════════════');
        console.log(`📊 Tablas: ${result.rows.length}`);
        console.log(`🔧 Funciones: ${functionsResult.rows.length}`);
        console.log(`📈 Vistas: ${viewsResult.rows.length}`);
        console.log(`📁 Categorías: ${categoriesCount}`);
        console.log('═════════════════════════════════════\n');

        console.log('🎯 Próximos pasos:');
        console.log('  1. Crear API REST en /api/polls');
        console.log('  2. Desarrollar interfaz de gestión');
        console.log('  3. Implementar sistema de votación');
        console.log('  4. Integrar visualización de resultados\n');

    } catch (error) {
        console.error('\n❌ Error al crear las tablas:', error.message);
        console.error('\n📋 Detalles del error:');
        console.error(error);
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
        console.log('🎉 Proceso completado exitosamente!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Error fatal:', error.message);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}

module.exports = { createPollsTables };

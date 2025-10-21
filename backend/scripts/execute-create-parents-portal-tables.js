/**
 * EJECUTAR CREACIÓN DE TABLAS DEL PORTAL DE PADRES
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

/**
 * Ejecuta el script SQL para crear las tablas del portal de padres
 */
async function createParentsPortalTables() {
    const client = await pool.connect();

    try {
        console.log('🚀 Iniciando creación de tablas del Portal de Padres...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-parents-portal-tables.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        console.log('📄 Archivo SQL cargado:', sqlPath);
        console.log('📏 Tamaño:', sql.length, 'caracteres\n');

        // Ejecutar el script
        console.log('⚙️  Ejecutando script SQL...\n');
        await client.query(sql);

        console.log('\n✅ Tablas creadas exitosamente!\n');

        // Verificar tablas creadas
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND (
                table_name LIKE 'parent%'
                OR table_name = 'students'
                OR table_name = 'grades'
                OR table_name = 'attendance'
                OR table_name = 'payments'
            )
            ORDER BY table_name;
        `;

        const result = await client.query(tablesQuery);

        console.log('📊 Tablas del Portal de Padres:');
        console.log('═════════════════════════════════════\n');
        result.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.table_name}`);
        });
        console.log();

        // Verificar vistas creadas
        const viewsQuery = `
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE 'v_%'
            ORDER BY table_name;
        `;
        const viewsResult = await client.query(viewsQuery);

        console.log('📈 Vistas creadas:');
        console.log('═════════════════════════════════════\n');
        viewsResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.table_name}`);
        });
        console.log();

        // Verificar datos de ejemplo
        const parentsCountQuery = 'SELECT COUNT(*) as count FROM parents';
        const studentsCountQuery = 'SELECT COUNT(*) as count FROM students';
        const relationsCountQuery = 'SELECT COUNT(*) as count FROM parents_students';

        const parentsCount = await client.query(parentsCountQuery);
        const studentsCount = await client.query(studentsCountQuery);
        const relationsCount = await client.query(relationsCountQuery);

        console.log('📁 Datos de ejemplo insertados:');
        console.log('═════════════════════════════════════\n');
        console.log(`  Padres: ${parentsCount.rows[0].count}`);
        console.log(`  Estudiantes: ${studentsCount.rows[0].count}`);
        console.log(`  Relaciones: ${relationsCount.rows[0].count}`);
        console.log();

        // Resumen final
        console.log('═════════════════════════════════════');
        console.log('✅ PORTAL DE PADRES INSTALADO');
        console.log('═════════════════════════════════════');
        console.log(`📊 Tablas: ${result.rows.length}`);
        console.log(`📈 Vistas: ${viewsResult.rows.length}`);
        console.log(`📁 Registros de ejemplo: ${parseInt(parentsCount.rows[0].count) + parseInt(studentsCount.rows[0].count)}`);
        console.log('═════════════════════════════════════\n');

        console.log('🎯 Próximos pasos:');
        console.log('  1. Crear API REST en /api/parents');
        console.log('  2. Desarrollar interfaz de portal (padres.html)');
        console.log('  3. Implementar sistema de autenticación');
        console.log('  4. Integrar con sistema escolar existente\n');

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
        await createParentsPortalTables();
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

module.exports = { createParentsPortalTables };

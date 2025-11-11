/**
 * EJECUTAR CREACIÓN DE TABLAS DEL PORTAL DE PADRES
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

const fs = require('fs').promises;
const devLogger = require('../utils/devLogger');
const path = require('path');
const { pool } = require('../config/database');

/**
 * Ejecuta el script SQL para crear las tablas del portal de padres
 */
async function createParentsPortalTables() {
    const client = await pool.connect();

    try {
        devLogger.log('🚀 Iniciando creación de tablas del Portal de Padres...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-parents-portal-tables.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        devLogger.log('📄 Archivo SQL cargado:', sqlPath);
        devLogger.log('📏 Tamaño:', sql.length, 'caracteres\n');

        // Ejecutar el script
        devLogger.log('⚙️  Ejecutando script SQL...\n');
        await client.query(sql);

        devLogger.log('\n✅ Tablas creadas exitosamente!\n');

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

        devLogger.log('📊 Tablas del Portal de Padres:');
        devLogger.log('═════════════════════════════════════\n');
        result.rows.forEach((row, index) => {
            devLogger.log(`  ${index + 1}. ${row.table_name}`);
        });
        devLogger.log();

        // Verificar vistas creadas
        const viewsQuery = `
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE 'v_%'
            ORDER BY table_name;
        `;
        const viewsResult = await client.query(viewsQuery);

        devLogger.log('📈 Vistas creadas:');
        devLogger.log('═════════════════════════════════════\n');
        viewsResult.rows.forEach((row, index) => {
            devLogger.log(`  ${index + 1}. ${row.table_name}`);
        });
        devLogger.log();

        // Verificar datos de ejemplo
        const parentsCountQuery = 'SELECT COUNT(*) as count FROM parents';
        const studentsCountQuery = 'SELECT COUNT(*) as count FROM students';
        const relationsCountQuery = 'SELECT COUNT(*) as count FROM parents_students';

        const parentsCount = await client.query(parentsCountQuery);
        const studentsCount = await client.query(studentsCountQuery);
        const relationsCount = await client.query(relationsCountQuery);

        devLogger.log('📁 Datos de ejemplo insertados:');
        devLogger.log('═════════════════════════════════════\n');
        devLogger.log(`  Padres: ${parentsCount.rows[0].count}`);
        devLogger.log(`  Estudiantes: ${studentsCount.rows[0].count}`);
        devLogger.log(`  Relaciones: ${relationsCount.rows[0].count}`);
        devLogger.log();

        // Resumen final
        devLogger.log('═════════════════════════════════════');
        devLogger.log('✅ PORTAL DE PADRES INSTALADO');
        devLogger.log('═════════════════════════════════════');
        devLogger.log(`📊 Tablas: ${result.rows.length}`);
        devLogger.log(`📈 Vistas: ${viewsResult.rows.length}`);
        devLogger.log(`📁 Registros de ejemplo: ${parseInt(parentsCount.rows[0].count) + parseInt(studentsCount.rows[0].count)}`);
        devLogger.log('═════════════════════════════════════\n');

        devLogger.log('🎯 Próximos pasos:');
        devLogger.log('  1. Crear API REST en /api/parents');
        devLogger.log('  2. Desarrollar interfaz de portal (padres.html)');
        devLogger.log('  3. Implementar sistema de autenticación');
        devLogger.log('  4. Integrar con sistema escolar existente\n');

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
        await createParentsPortalTables();
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

module.exports = { createParentsPortalTables };

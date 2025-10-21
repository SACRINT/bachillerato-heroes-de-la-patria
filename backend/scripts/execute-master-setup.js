/**
 * EJECUTAR SCRIPT MAESTRO DE INSTALACIÓN DE BASE DE DATOS (PostgreSQL)
 * BGE Héroes de la Patria
 * Fecha: 20 de Octubre, 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

async function runMasterSetup() {
    const client = await pool.connect();
    try {
        console.log('>>> INICIANDO SCRIPT MAESTRO DE CONFIGURACION DE BASE DE DATOS...\n');

        const sqlPath = path.join(__dirname, 'master-database-setup.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        console.log('--- Archivo SQL Maestro cargado:', sqlPath);
        console.log('--- Tamanio:', sql.length, 'caracteres\n');

        console.log('--- Ejecutando script SQL unificado...');
        await client.query(sql);
        console.log('--- Script SQL unificado ejecutado con exito.\n');

        const tablesQuery = `
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('usuarios', 'estudiantes', 'docentes', 'polls', 'teacher_classes', 'conversations', 'library_documents');
        `;
        const result = await client.query(tablesQuery);

        console.log('--- Verificacion de Tablas Clave Creadas:');
        result.rows.forEach((row, index) => {
            console.log(`    ${index + 1}. ${row.table_name} [OK]`);
        });
        console.log('\n----------------------------------------');
        console.log('>>> CONFIGURACION DE BASE DE DATOS COMPLETADA');
        console.log('----------------------------------------');

    } catch (error) {
        console.error('\nXXX Error al ejecutar el script maestro:', error.message);
        console.error('\nXXX Detalles del error:');
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await runMasterSetup();
        console.log('\n*** Proceso de configuracion de base de datos finalizado exitosamente! ***\n');
        process.exit(0);
    } catch (error) {
        console.error('\n### Error fatal en el proceso de configuracion. ###');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

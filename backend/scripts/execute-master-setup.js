/**
 * EJECUTAR SCRIPT MAESTRO DE INSTALACIÓN DE BASE DE DATOS (PostgreSQL)
 * BGE Héroes de la Patria
 * Fecha: 20 de Octubre, 2025
 */

const fs = require('fs').promises;
const devLogger = require('../utils/devLogger');
const path = require('path');
const { pool } = require('../config/database');

async function runMasterSetup() {
    const client = await pool.connect();
    try {
        devLogger.log('>>> INICIANDO SCRIPT MAESTRO DE CONFIGURACION DE BASE DE DATOS...\n');

        const sqlPath = path.join(__dirname, 'master-database-setup.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        devLogger.log('--- Archivo SQL Maestro cargado:', sqlPath);
        devLogger.log('--- Tamanio:', sql.length, 'caracteres\n');

        devLogger.log('--- Ejecutando script SQL unificado...');
        await client.query(sql);
        devLogger.log('--- Script SQL unificado ejecutado con exito.\n');

        const tablesQuery = `
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('usuarios', 'estudiantes', 'docentes', 'polls', 'teacher_classes', 'conversations', 'library_documents', 'pending_submissions', 'quejas', 'suscriptores_notificaciones', 'noticias', 'eventos', 'comunicados');
        `;
        const result = await client.query(tablesQuery);

        devLogger.log('--- Verificacion de Tablas Clave Creadas:');
        result.rows.forEach((row, index) => {
            devLogger.log(`    ${index + 1}. ${row.table_name} [OK]`);
        });
        devLogger.log('\n----------------------------------------');
        devLogger.log('>>> CONFIGURACION DE BASE DE DATOS COMPLETADA');
        devLogger.log('----------------------------------------');

    } catch (error) {
        devLogger.error('\nXXX Error al ejecutar el script maestro:', error.message);
        devLogger.error('\nXXX Detalles del error:');
        devLogger.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await runMasterSetup();
        devLogger.log('\n*** Proceso de configuracion de base de datos finalizado exitosamente! ***\n');
        process.exit(0);
    } catch (error) {
        devLogger.error('\n### Error fatal en el proceso de configuracion. ###');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

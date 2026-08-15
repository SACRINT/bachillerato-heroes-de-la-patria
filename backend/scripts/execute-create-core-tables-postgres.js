/**
 * EJECUTAR CREACIÓN DE TABLAS PRINCIPALES (POSTGRESQL)
 * BGE Héroes de la Patria
 * Fecha: 20 de Octubre, 2025
 */

const fs = require('fs').promises;
const devLogger = require('../utils/devLogger');
const path = require('path');
const { pool } = require('../config/database');

async function createCoreTables() {
    const client = await pool.connect();
    try {
        devLogger.log('Iniciando creacion de tablas principales del sistema (PostgreSQL)...\\n');

        const sqlPath = path.join(__dirname, 'create-core-tables-postgres.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        devLogger.log('Archivo SQL cargado:', sqlPath);
        devLogger.log('Tamanio:', sql.length, 'caracteres\n');

        devLogger.log('Ejecutando script SQL...\n');
        await client.query(sql);

        devLogger.log('\nTablas principales creadas exitosamente!\n');

        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('usuarios', 'estudiantes', 'docentes', 'materias', 'calificaciones', 'avisos');
        `;
        const result = await client.query(tablesQuery);

        devLogger.log('Tablas principales verificadas:');
        devLogger.log('----------------------------------------\n');
        result.rows.forEach((row, index) => {
            devLogger.log(`  ${index + 1}. ${row.table_name}`);
        });
        devLogger.log();

        devLogger.log('----------------------------------------');
        devLogger.log('TABLAS PRINCIPALES INSTALADAS');
        devLogger.log('----------------------------------------');

    } catch (error) {
        devLogger.error('\nError al crear las tablas principales:', error.message);
        devLogger.error('\nDetalles del error:');
        devLogger.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await createCoreTables();
        devLogger.log('\nProceso completado exitosamente!\n');
        process.exit(0);
    } catch (error) {
        devLogger.error('\nError fatal:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createCoreTables };
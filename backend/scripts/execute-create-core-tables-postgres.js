/**
 * EJECUTAR CREACIÓN DE TABLAS PRINCIPALES (POSTGRESQL)
 * BGE Héroes de la Patria
 * Fecha: 20 de Octubre, 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

async function createCoreTables() {
    const client = await pool.connect();
    try {
        console.log('Iniciando creacion de tablas principales del sistema (PostgreSQL)...
');

        const sqlPath = path.join(__dirname, 'create-core-tables-postgres.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        console.log('Archivo SQL cargado:', sqlPath);
        console.log('Tamanio:', sql.length, 'caracteres\n');

        console.log('Ejecutando script SQL...\n');
        await client.query(sql);

        console.log('\nTablas principales creadas exitosamente!\n');

        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('usuarios', 'estudiantes', 'docentes', 'materias', 'calificaciones', 'avisos');
        `;
        const result = await client.query(tablesQuery);

        console.log('Tablas principales verificadas:');
        console.log('----------------------------------------\n');
        result.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.table_name}`);
        });
        console.log();

        console.log('----------------------------------------');
        console.log('TABLAS PRINCIPALES INSTALADAS');
        console.log('----------------------------------------');

    } catch (error) {
        console.error('\nError al crear las tablas principales:', error.message);
        console.error('\nDetalles del error:');
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await createCoreTables();
        console.log('\nProceso completado exitosamente!\n');
        process.exit(0);
    } catch (error) {
        console.error('\nError fatal:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createCoreTables };
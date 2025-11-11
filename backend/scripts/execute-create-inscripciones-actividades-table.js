/**
 * 📝 Script para crear la tabla inscripciones_actividades en PostgreSQL
 * Ejecuta: node backend/scripts/execute-create-inscripciones-actividades-table.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');

async function createInscripcionesActividadesTable() {
    try {
        devLogger.log('📝 Creando tabla inscripciones_actividades...');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-inscripciones-actividades-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Ejecutar el SQL
        await pool.query(sql);

        devLogger.log('✅ Tabla inscripciones_actividades creada exitosamente');

        // Verificar que la tabla existe
        const checkQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'inscripciones_actividades'
        `;

        const result = await pool.query(checkQuery);

        if (result.rows.length > 0) {
            devLogger.log('✅ Verificación: La tabla existe en la base de datos');

            // Mostrar estructura de la tabla
            const structureQuery = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'inscripciones_actividades'
                ORDER BY ordinal_position
            `;

            const structure = await pool.query(structureQuery);
            devLogger.log('\n📊 Estructura de la tabla:');
            console.table(structure.rows);
        } else {
            devLogger.error('❌ Error: La tabla no fue creada correctamente');
        }

        process.exit(0);

    } catch (error) {
        devLogger.error('❌ Error al crear la tabla:', error.message);
        devLogger.error(error);
        process.exit(1);
    }
}

// Ejecutar
createInscripcionesActividadesTable();

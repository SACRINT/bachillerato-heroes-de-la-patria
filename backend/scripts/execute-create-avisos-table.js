/**
 * 📝 Script para crear la tabla avisos en PostgreSQL
 * Ejecuta: node backend/scripts/execute-create-avisos-table.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function createAvisosTable() {
    try {
        console.log('📝 Creando tabla avisos...');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-avisos-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Ejecutar el SQL
        await pool.query(sql);

        console.log('✅ Tabla avisos creada exitosamente');

        // Verificar que la tabla existe
        const checkQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'avisos'
        `;

        const result = await pool.query(checkQuery);

        if (result.rows.length > 0) {
            console.log('✅ Verificación: La tabla existe en la base de datos');

            // Mostrar estructura de la tabla
            const structureQuery = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'avisos'
                ORDER BY ordinal_position
            `;

            const structure = await pool.query(structureQuery);
            console.log('\n📊 Estructura de la tabla:');
            console.table(structure.rows);
        } else {
            console.error('❌ Error: La tabla no fue creada correctamente');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error al crear la tabla:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar
createAvisosTable();

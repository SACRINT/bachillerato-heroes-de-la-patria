/**
 * 📝 Script para crear la tabla pending_submissions en PostgreSQL
 * Ejecuta: node backend/scripts/execute-create-pending-submissions-table.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function createPendingSubmissionsTable() {
    try {
        console.log('📝 Creando tabla pending_submissions...');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-pending-submissions-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Ejecutar el SQL
        await pool.query(sql);

        console.log('✅ Tabla pending_submissions creada exitosamente');

        // Verificar que la tabla existe
        const checkQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'pending_submissions'
        `;

        const result = await pool.query(checkQuery);

        if (result.rows.length > 0) {
            console.log('✅ Verificación: La tabla existe en la base de datos');

            // Mostrar estructura de la tabla
            const structureQuery = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'pending_submissions'
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
createPendingSubmissionsTable();

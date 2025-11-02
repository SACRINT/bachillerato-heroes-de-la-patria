/**
 * 🔍 VERIFICADOR DE ESTRUCTURA DE TABLAS
 * Muestra las columnas de las tablas críticas
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function checkStructure() {
    try {
        const client = await pool.connect();

        console.log('📋 ESTRUCTURA DE TABLA ESTUDIANTES:');
        console.log('='.repeat(60));

        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'estudiantes'
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);

        result.rows.forEach(col => {
            console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        client.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkStructure();

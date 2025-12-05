/**
 * Script para ejecutar migraciones de Calendar
 * Crea las tablas necesarias para el sistema de calendario
 */

const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📅 Ejecutando migration de Calendar...');

        const sqlPath = path.join(__dirname, 'create_calendar_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Ejecutar las queries
        await executeQuery(sql);

        console.log('✅ Tablas de calendario creadas exitosamente');
        console.log('   - calendar_events');
        console.log('   - event_attendees');
        console.log('   - event_reminders');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();

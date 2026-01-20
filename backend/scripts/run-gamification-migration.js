require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('✅ Conectado a la base de datos.');
        console.log('📋 Ejecutando migración: Sistema de Gamificación Avanzada...');

        const sqlFilePath = path.join(__dirname, '../migrations/012_gamification_system.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf-8');

        await client.query(sql);

        console.log('✅ Migración completada exitosamente!');
        console.log('📊 Tablas creadas:');
        console.log('   - challenges (retos dinámicos)');
        console.log('   - user_challenge_progress');
        console.log('   - user_streaks (rachas)');
        console.log('   - achievements (8 logros precargados)');
        console.log('   - user_achievements');
        console.log('   - group_competitions');
        console.log('   - competition_participants');
        console.log('   - badges (4 insignias precargadas)');
        console.log('   - user_badges');
        console.log('   - notifications');
        console.log('🔧 Vistas, triggers y funciones creadas.');
        console.log('🎮 Sistema de gamificación completo.');

    } catch (err) {
        console.error('❌ Error ejecutando migración:', err.message);
        console.error(err);
        throw err;
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();

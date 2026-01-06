const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runSeed() {
    try {
        console.log('🌱 Ejecutando Seed SQL de Adaptive Content..');
        const sqlPath = path.join(__dirname, '066-seed-data.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        await executeQuery(sql);
        console.log('✅ Seed completado exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en Seed:', error);
        process.exit(1);
    }
}

runSeed();

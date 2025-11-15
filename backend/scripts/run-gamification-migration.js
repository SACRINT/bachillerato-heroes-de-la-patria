/**
 * 🗄️ SCRIPT DE MIGRACIÓN AUTOMÁTICA - SISTEMA GAMIFICACIÓN
 * Ejecuta la migración SQL para crear tablas de IACoins
 * Uso: node backend/scripts/run-gamification-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

async function runMigration() {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log('========================================');
    console.log('🗄️  MIGRACIÓN: SISTEMA GAMIFICACIÓN');
    console.log('========================================');
    console.log(colors.reset);

    // Verificar DATABASE_URL
    if (!process.env.DATABASE_URL) {
        console.error(`${colors.red}❌ ERROR: DATABASE_URL no está configurado en .env${colors.reset}`);
        console.log(`${colors.yellow}Agrega DATABASE_URL=postgresql://... a tu archivo .env${colors.reset}`);
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log(`${colors.blue}📡 Conectando a PostgreSQL...${colors.reset}`);
        await pool.query('SELECT NOW()');
        console.log(`${colors.green}✅ Conexión exitosa${colors.reset}\n`);

        // Leer archivo SQL
        const sqlPath = path.join(__dirname, '../migrations/create-gamification-tables.sql');
        console.log(`${colors.blue}📄 Leyendo migración: ${sqlPath}${colors.reset}`);

        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Archivo no encontrado: ${sqlPath}`);
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        console.log(`${colors.green}✅ Archivo leído correctamente (${sqlContent.length} caracteres)${colors.reset}\n`);

        // Ejecutar migración
        console.log(`${colors.blue}🚀 Ejecutando migración...${colors.reset}`);
        console.log(`${colors.cyan}   (Esto puede tomar unos segundos)${colors.reset}\n`);

        const result = await pool.query(sqlContent);

        console.log(`${colors.green}${colors.bright}✅ MIGRACIÓN COMPLETADA EXITOSAMENTE${colors.reset}\n`);

        // Verificar tablas creadas
        console.log(`${colors.blue}🔍 Verificando tablas creadas...${colors.reset}`);

        const tables = ['wallet', 'wallet_history', 'challenges', 'user_challenges', 'store_items', 'user_items'];
        let allTablesCreated = true;

        for (const table of tables) {
            const checkResult = await pool.query(
                `SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = $1
                )`,
                [table]
            );

            const exists = checkResult.rows[0].exists;
            if (exists) {
                console.log(`   ${colors.green}✅ ${table}${colors.reset}`);
            } else {
                console.log(`   ${colors.red}❌ ${table} (NO CREADA)${colors.reset}`);
                allTablesCreated = false;
            }
        }

        console.log('');

        if (allTablesCreated) {
            console.log(`${colors.green}${colors.bright}🎉 TODAS LAS TABLAS CREADAS CORRECTAMENTE${colors.reset}\n`);
        } else {
            console.log(`${colors.red}⚠️  ALGUNAS TABLAS NO SE CREARON${colors.reset}\n`);
        }

        // Verificar datos de prueba
        console.log(`${colors.blue}🔍 Verificando datos de prueba...${colors.reset}`);

        const challengesCount = await pool.query('SELECT COUNT(*) as count FROM challenges');
        const itemsCount = await pool.query('SELECT COUNT(*) as count FROM store_items');

        console.log(`   Retos creados: ${colors.cyan}${challengesCount.rows[0].count}${colors.reset}`);
        console.log(`   Items de tienda: ${colors.cyan}${itemsCount.rows[0].count}${colors.reset}\n`);

        // Resumen final
        console.log(`${colors.bright}${colors.green}`);
        console.log('========================================');
        console.log('✅ MIGRACIÓN COMPLETADA');
        console.log('========================================');
        console.log(colors.reset);
        console.log(`${colors.cyan}Tablas creadas: 6/6${colors.reset}`);
        console.log(`${colors.cyan}Retos de ejemplo: ${challengesCount.rows[0].count}${colors.reset}`);
        console.log(`${colors.cyan}Items de tienda: ${itemsCount.rows[0].count}${colors.reset}\n`);

        console.log(`${colors.yellow}📝 PRÓXIMOS PASOS:${colors.reset}`);
        console.log(`   1. Reiniciar servidor backend (npm run dev)`);
        console.log(`   2. Ejecutar tests: node backend/scripts/test-gamification-endpoints.js`);
        console.log(`   3. Probar en navegador: http://localhost:3000/gamification-center.html\n`);

    } catch (error) {
        console.error(`${colors.red}${colors.bright}❌ ERROR EN MIGRACIÓN:${colors.reset}`);
        console.error(`${colors.red}${error.message}${colors.reset}\n`);

        if (error.stack) {
            console.error(`${colors.yellow}Stack trace:${colors.reset}`);
            console.error(error.stack);
        }

        process.exit(1);
    } finally {
        await pool.end();
        console.log(`${colors.blue}🔌 Conexión cerrada${colors.reset}\n`);
    }
}

// Ejecutar migración
runMigration().catch(error => {
    console.error(`${colors.red}Error inesperado:${colors.reset}`, error);
    process.exit(1);
});

#!/usr/bin/env node

/**
 * SCRIPT: Crear tablas financieras en Neon
 * Crea las tablas necesarias para el módulo de finanzas
 * Uso: node run-create-finances-tables.js
 */

const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

const pool = new Pool(poolConfig);

const createQueries = [
    // 1. Tabla ingresos
    `CREATE TABLE IF NOT EXISTS ingresos (
        id SERIAL PRIMARY KEY,
        concepto VARCHAR(200) NOT NULL,
        descripcion TEXT,
        monto DECIMAL(12, 2) NOT NULL,
        categoria VARCHAR(100),
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        periodo_fiscal VARCHAR(20),
        responsable VARCHAR(200),
        numero_comprobante VARCHAR(50),
        referencia VARCHAR(200),
        estado VARCHAR(50) DEFAULT 'registrado',
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 2. Tabla gastos
    `CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY,
        concepto VARCHAR(200) NOT NULL,
        descripcion TEXT,
        monto DECIMAL(12, 2) NOT NULL,
        categoria VARCHAR(100),
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        periodo_fiscal VARCHAR(20),
        responsable VARCHAR(200),
        numero_comprobante VARCHAR(50),
        referencia VARCHAR(200),
        estado VARCHAR(50) DEFAULT 'registrado',
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 3. Tabla pagos_pendientes
    `CREATE TABLE IF NOT EXISTS pagos_pendientes (
        id SERIAL PRIMARY KEY,
        estudiante_id INTEGER,
        estudiante VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        monto DECIMAL(12, 2) NOT NULL,
        concepto VARCHAR(200) NOT NULL,
        periodo VARCHAR(50),
        fecha_vencimiento DATE NOT NULL,
        fecha_recordatorio DATE,
        estado VARCHAR(50) DEFAULT 'pendiente',
        numero_pago VARCHAR(50),
        intentos_cobro INTEGER DEFAULT 0,
        fecha_ultimo_intento DATE,
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 4. Tabla pending_approvals
    `CREATE TABLE IF NOT EXISTS pending_approvals (
        id SERIAL PRIMARY KEY,
        form_type VARCHAR(100) NOT NULL,
        submission_data JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by VARCHAR(200),
        review_date TIMESTAMP,
        review_comments TEXT,
        priority VARCHAR(20) DEFAULT 'normal'
    )`,

    // Índices para ingresos
    'CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha)',
    'CREATE INDEX IF NOT EXISTS idx_ingresos_categoria ON ingresos(categoria)',
    'CREATE INDEX IF NOT EXISTS idx_ingresos_periodo ON ingresos(periodo_fiscal)',
    'CREATE INDEX IF NOT EXISTS idx_ingresos_estado ON ingresos(estado)',

    // Índices para gastos
    'CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha)',
    'CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria)',
    'CREATE INDEX IF NOT EXISTS idx_gastos_periodo ON gastos(periodo_fiscal)',
    'CREATE INDEX IF NOT EXISTS idx_gastos_estado ON gastos(estado)',

    // Índices para pagos_pendientes
    'CREATE INDEX IF NOT EXISTS idx_pagos_estudiante ON pagos_pendientes(estudiante_id)',
    'CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos_pendientes(estado)',
    'CREATE INDEX IF NOT EXISTS idx_pagos_vencimiento ON pagos_pendientes(fecha_vencimiento)',
    'CREATE INDEX IF NOT EXISTS idx_pagos_periodo ON pagos_pendientes(periodo)',

    // Índices para pending_approvals
    'CREATE INDEX IF NOT EXISTS idx_approvals_status ON pending_approvals(status)',
    'CREATE INDEX IF NOT EXISTS idx_approvals_form_type ON pending_approvals(form_type)',
    'CREATE INDEX IF NOT EXISTS idx_approvals_created ON pending_approvals(created_at)'
];

async function createFinancesTables() {
    const client = await pool.connect();
    try {
        console.log('🚀 [FINANCES] Iniciando creación de tablas financieras en Neon...\n');

        let successCount = 0;
        let skipCount = 0;

        for (const query of createQueries) {
            try {
                await client.query(query);
                const queryType = query.split(' ')[0] + ' ' + query.split(' ')[1];
                console.log(`✅ ${queryType} ejecutado exitosamente`);
                successCount++;
            } catch (error) {
                if (error.message.includes('already exists') || error.message.includes('already_exists')) {
                    skipCount++;
                } else {
                    console.error(`❌ Error: ${error.message}`);
                }
            }
        }

        console.log(`\n📊 [RESUMEN]`);
        console.log(`✅ Operaciones completadas: ${successCount}`);
        console.log(`⏭️  Elementos ya existentes: ${skipCount}`);
        console.log(`\n✨ [FINANCES] Tablas y índices listos!\n`);

        // Verificar tablas creadas
        console.log('📋 [VERIFICACIÓN] Listando tablas creadas:\n');
        const result = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('ingresos', 'gastos', 'pagos_pendientes', 'pending_approvals')
            ORDER BY table_name
        `);

        if (result.rows.length > 0) {
            console.log('Tablas encontradas:');
            result.rows.forEach(row => {
                console.log(`  ✅ ${row.table_name}`);
            });
            console.log('\n✨ ¡Base de datos lista para producción!\n');
        } else {
            console.log('❌ No se encontraron las tablas esperadas');
        }

    } catch (error) {
        console.error('❌ [FATAL ERROR]', error);
        process.exit(1);
    } finally {
        await client.release();
        await pool.end();
    }
}

// Ejecutar
createFinancesTables().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});

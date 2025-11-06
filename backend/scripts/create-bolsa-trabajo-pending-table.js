/**
 * 📋 SCRIPT: Crear tabla bolsa_trabajo_pending_confirmation en Neon
 * Propósito: Almacenar temporalmente datos de CV pendientes de confirmación de email
 * Fecha: 6 Noviembre 2025
 * Corre con: node backend/scripts/create-bolsa-trabajo-pending-table.js
 */

const { pool } = require('../config/database');

const createBolsaTrabajoPendingTable = async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Iniciando creación de tabla bolsa_trabajo_pending_confirmation...\n');

        // 1. Crear tabla temporal para CVs pendientes de confirmación
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS bolsa_trabajo_pending_confirmation (
                id BIGSERIAL PRIMARY KEY,
                email_usuario VARCHAR(255) UNIQUE NOT NULL,
                datos_json JSONB NOT NULL,
                confirmation_token VARCHAR(255) UNIQUE NOT NULL,
                token_expires_at TIMESTAMP DEFAULT (NOW() + '24 hours'::interval),
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                fecha_actualizacion TIMESTAMP DEFAULT NOW()
            );
        `;

        await client.query(createTableQuery);
        console.log('✅ Tabla bolsa_trabajo_pending_confirmation creada exitosamente!');

        // 2. Crear índices para optimización
        console.log('\n📊 Creando índices de optimización...');

        const indexQueries = [
            {
                name: 'idx_bolsa_trabajo_pending_token',
                query: `CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_token
                        ON bolsa_trabajo_pending_confirmation(confirmation_token) WHERE confirmation_token IS NOT NULL;`
            },
            {
                name: 'idx_bolsa_trabajo_pending_email',
                query: `CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_email
                        ON bolsa_trabajo_pending_confirmation(email_usuario) WHERE email_usuario IS NOT NULL;`
            },
            {
                name: 'idx_bolsa_trabajo_pending_expires',
                query: `CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_expires
                        ON bolsa_trabajo_pending_confirmation(token_expires_at) WHERE token_expires_at IS NOT NULL;`
            }
        ];

        for (const idx of indexQueries) {
            try {
                await client.query(idx.query);
                console.log(`   ✅ Índice ${idx.name} creado`);
            } catch (idxError) {
                console.log(`   ⚠️  Índice ${idx.name} ya existe o error: ${idxError.code}`);
            }
        }

        console.log('\n🎉 ¡TABLA Y ÍNDICES CREADOS EXITOSAMENTE!');
        console.log('\nEstructura de la tabla:');
        console.log('  - id: Identificador único');
        console.log('  - email_usuario: Email del usuario (único)');
        console.log('  - datos_json: Datos del CV en formato JSON');
        console.log('  - confirmation_token: Token de confirmación único');
        console.log('  - token_expires_at: Fecha de expiración del token (24 horas)');
        console.log('  - fecha_creacion: Timestamp de creación');
        console.log('  - fecha_actualizacion: Timestamp de última actualización');

    } catch (error) {
        if (error.code === '42P07') {
            console.log('⚠️  La tabla bolsa_trabajo_pending_confirmation ya existe');
        } else {
            console.error('❌ Error al crear tabla:', error.message);
            throw error;
        }
    } finally {
        client.release();
        pool.end();
    }
};

createBolsaTrabajoPendingTable();

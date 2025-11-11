#!/usr/bin/env node

/**
 * Script para crear índices de optimización en la base de datos
 * Fecha: 19 de Octubre, 2025
 */

const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuración de la base de datos usando DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    devLogger.error('❌ Error: DATABASE_URL no está configurada en el archivo .env');
    process.exit(1);
}

async function createIndexes() {
    const client = new Client({
        connectionString: connectionString,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        devLogger.log('🔗 Conectando a la base de datos...');
        await client.connect();
        devLogger.log('✅ Conexión establecida\n');

        // Leer el archivo SQL
        const sqlFilePath = path.join(__dirname, 'create-database-indexes.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        devLogger.log('📄 Archivo SQL cargado correctamente');
        devLogger.log('📊 Creando índices de optimización...\n');

        // Separar el contenido en statements individuales
        // Eliminar comentarios de línea
        const cleanedSQL = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        // Separar por punto y coma, pero ignorar los que están dentro de comentarios de bloque
        const statements = cleanedSQL
            .split(/\/\*[\s\S]*?\*\//)
            .join('')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Ejecutar cada statement
        for (const statement of statements) {
            if (statement.trim().length === 0) continue;

            try {
                // Extraer nombre del índice o tabla del statement
                let entityName = 'unknown';
                if (statement.includes('CREATE INDEX')) {
                    const match = statement.match(/CREATE.*?INDEX.*?(\w+)\s+ON/i);
                    if (match) entityName = match[1];
                } else if (statement.includes('ANALYZE')) {
                    const match = statement.match(/ANALYZE\s+(\w+)/i);
                    if (match) entityName = match[1];
                } else if (statement.includes('SELECT')) {
                    entityName = 'Verificación';
                }

                await client.query(statement);
                devLogger.log(`✅ ${entityName}`);
                successCount++;
            } catch (error) {
                // Ignorar errores de índice ya existente
                if (error.code === '42P07' || error.message.includes('already exists')) {
                    devLogger.log(`⏭️  Índice ya existe (omitiendo)`);
                } else {
                    devLogger.error(`❌ Error: ${error.message}`);
                    errorCount++;
                    errors.push({
                        statement: statement.substring(0, 100),
                        error: error.message
                    });
                }
            }
        }

        devLogger.log('\n' + '='.repeat(60));
        devLogger.log('📊 RESUMEN DE CREACIÓN DE ÍNDICES');
        devLogger.log('='.repeat(60));
        devLogger.log(`✅ Índices creados exitosamente: ${successCount}`);
        devLogger.log(`❌ Errores encontrados: ${errorCount}`);
        devLogger.log('='.repeat(60));

        if (errors.length > 0) {
            devLogger.log('\n⚠️  ERRORES DETALLADOS:');
            errors.forEach((err, index) => {
                devLogger.log(`\n${index + 1}. ${err.statement}...`);
                devLogger.log(`   Error: ${err.error}`);
            });
        }

        // Ejecutar consulta de verificación de índices
        devLogger.log('\n📋 ÍNDICES CREADOS EN EL SISTEMA:');
        devLogger.log('='.repeat(60));

        const indexQuery = `
            SELECT
                schemaname,
                tablename,
                indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname;
        `;

        const result = await client.query(indexQuery);

        // Agrupar por tabla
        const indexesByTable = {};
        result.rows.forEach(row => {
            if (!indexesByTable[row.tablename]) {
                indexesByTable[row.tablename] = [];
            }
            indexesByTable[row.tablename].push(row.indexname);
        });

        Object.keys(indexesByTable).sort().forEach(tableName => {
            devLogger.log(`\n📁 ${tableName}:`);
            indexesByTable[tableName].forEach(indexName => {
                devLogger.log(`   - ${indexName}`);
            });
        });

        devLogger.log('\n' + '='.repeat(60));
        devLogger.log(`✅ Total de índices en el sistema: ${result.rows.length}`);
        devLogger.log('='.repeat(60));

        // Estadísticas de tamaño de índices
        devLogger.log('\n💾 TAMAÑO DE ÍNDICES:');
        devLogger.log('='.repeat(60));

        const sizeQuery = `
            SELECT
                schemaname,
                tablename,
                indexname,
                pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
            ORDER BY pg_relation_size(indexname::regclass) DESC
            LIMIT 10;
        `;

        const sizeResult = await client.query(sizeQuery);
        sizeResult.rows.forEach((row, index) => {
            devLogger.log(`${index + 1}. ${row.indexname.padEnd(40)} ${row.index_size}`);
        });

        devLogger.log('\n✅ Índices de optimización creados correctamente');

    } catch (error) {
        devLogger.error('\n❌ Error fatal:', error.message);
        devLogger.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
        devLogger.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar
devLogger.log('🚀 SCRIPT DE CREACIÓN DE ÍNDICES DE OPTIMIZACIÓN');
devLogger.log('='.repeat(60));
devLogger.log(`📅 Fecha: ${new Date().toLocaleString('es-MX')}`);
devLogger.log(`🔗 Connection String configurada: ✅`);
devLogger.log('='.repeat(60) + '\n');

createIndexes();

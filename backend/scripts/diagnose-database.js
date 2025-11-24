#!/usr/bin/env node

/**
 * 🔍 Script de Diagnóstico Database - FASE 30.5 TAREA 1
 *
 * Ejecuta queries diagnósticas en PostgreSQL/Neon para:
 * 1. Verificar configuración actual del pool
 * 2. Identificar queries lentas
 * 3. Ver estado de índices
 * 4. Analizar conexiones activas
 *
 * Uso: node backend/scripts/diagnose-database.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
const { Pool } = require('pg');
const devLogger = require('../utils/devLogger');

// Log de debug
console.log(`[DIAGNOSE-DB] DATABASE_URL: ${process.env.DATABASE_URL ? 'Loaded ✓' : 'NOT LOADED ✗'}`);

// Crear pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon requiere SSL
});

async function runDiagnostics() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 DIAGNÓSTICO DATABASE - FASE 30.5 TAREA 1');
  console.log('='.repeat(70) + '\n');

  try {
    // TEST 1: Verificar versión PostgreSQL
    console.log('📊 TEST 1: Versión PostgreSQL');
    console.log('-'.repeat(70));
    const versionResult = await pool.query('SELECT version();');
    console.log(versionResult.rows[0].version);
    console.log();

    // TEST 2: Ver configuración actual
    console.log('⚙️  TEST 2: Configuración PostgreSQL');
    console.log('-'.repeat(70));
    const configQueries = [
      'SHOW max_connections;',
      'SHOW shared_buffers;',
      'SHOW effective_cache_size;',
      'SHOW work_mem;',
      'SHOW maintenance_work_mem;',
      'SHOW statement_timeout;'
    ];

    for (const query of configQueries) {
      const result = await pool.query(query);
      const paramName = query.replace('SHOW ', '').replace(';', '');
      console.log(`  ${paramName}: ${result.rows[0][paramName.toLowerCase()]}`);
    }
    console.log();

    // TEST 3: Conexiones activas
    console.log('🔗 TEST 3: Conexiones Activas');
    console.log('-'.repeat(70));
    const connectionsResult = await pool.query(`
      SELECT
        datname,
        count(*) as total_connections,
        sum(case when state = 'active' then 1 else 0 end) as active,
        sum(case when state = 'idle' then 1 else 0 end) as idle,
        sum(case when state = 'idle in transaction' then 1 else 0 end) as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname IS NOT NULL
      GROUP BY datname
      ORDER BY total_connections DESC;
    `);

    if (connectionsResult.rows.length > 0) {
      console.log('Database\t\tTotal\tActive\tIdle\tIdle in Tx');
      connectionsResult.rows.forEach(row => {
        console.log(
          `${row.datname.substring(0, 20).padEnd(20)}\t${row.total_connections}\t${row.active}\t${row.idle}\t${row.idle_in_transaction}`
        );
      });
    } else {
      console.log('  No hay conexiones activas');
    }
    console.log();

    // TEST 4: Queries lentas (si está habilitado pg_stat_statements)
    console.log('⏱️  TEST 4: Queries Lentas (mean_exec_time > 100ms)');
    console.log('-'.repeat(70));
    let slowQueries = null; // Inicializar variable
    try {
      slowQueries = await pool.query(`
        SELECT
          query,
          calls,
          mean_exec_time::numeric(10,2) as mean_exec_time_ms,
          max_exec_time::numeric(10,2) as max_exec_time_ms,
          total_exec_time::numeric(12,2) as total_exec_time_ms
        FROM pg_stat_statements
        WHERE mean_exec_time > 100
        ORDER BY mean_exec_time DESC
        LIMIT 10;
      `);

      if (slowQueries.rows.length > 0) {
        console.log('Mean Time (ms)\tMax Time (ms)\tCalls\tQuery');
        slowQueries.rows.forEach(row => {
          const queryPreview = row.query.substring(0, 50).padEnd(50);
          console.log(
            `${row.mean_exec_time_ms}\t\t${row.max_exec_time_ms}\t\t${row.calls}\t${queryPreview}...`
          );
        });
      } else {
        console.log('  ✅ No hay queries lentas (todas < 100ms)');
      }
    } catch (error) {
      console.log('  ⚠️  pg_stat_statements no está habilitado');
      console.log('  Para habilitar: CREATE EXTENSION pg_stat_statements;');
    }
    console.log();

    // TEST 5: Índices por tabla
    console.log('📇 TEST 5: Estado de Índices por Tabla');
    console.log('-'.repeat(70));
    const indexesResult = await pool.query(`
      SELECT
        t.tablename,
        count(i.indexname) as index_count
      FROM pg_tables t
      LEFT JOIN pg_indexes i ON t.tablename = i.tablename AND t.schemaname = i.schemaname
      WHERE t.schemaname = 'public'
      GROUP BY t.tablename
      ORDER BY t.tablename;
    `);

    console.log('Tabla\t\t\t\tNúmero de Índices');
    indexesResult.rows.forEach(row => {
      console.log(`${row.tablename.substring(0, 30).padEnd(30)}\t${row.index_count}`);
    });
    console.log();

    // TEST 6: Tamaño de tablas
    console.log('💾 TEST 6: Tamaño de Tablas');
    console.log('-'.repeat(70));
    const sizeResult = await pool.query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10;
    `);

    console.log('Tabla\t\t\t\tTamaño');
    sizeResult.rows.forEach(row => {
      console.log(`${row.tablename.substring(0, 30).padEnd(30)}\t${row.size}`);
    });
    console.log();

    // TEST 7: Pool actual en Node.js
    console.log('📈 TEST 7: Estado del Pool en Node.js');
    console.log('-'.repeat(70));
    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
      max: pool.options.max
    };
    console.log(`  Total Conexiones: ${poolStats.total}`);
    console.log(`  Ociosas (idle): ${poolStats.idle}`);
    console.log(`  En Uso (active): ${poolStats.total - poolStats.idle}`);
    console.log(`  Esperando: ${poolStats.waiting}`);
    console.log(`  Máximo Permitido: ${poolStats.max}`);
    console.log(`  Utilización: ${Math.round((poolStats.total / poolStats.max) * 100)}%`);
    console.log();

    // TEST 8: Recomendaciones
    console.log('✅ RECOMENDACIONES BASADAS EN DIAGNÓSTICO');
    console.log('-'.repeat(70));

    // Analizar resultados y dar recomendaciones
    const recommendations = [];

    if (poolStats.total > poolStats.max * 0.8) {
      recommendations.push('⚠️  Pool utilizado > 80% - considerar aumentar max connections');
    } else {
      recommendations.push('✅ Pool tiene capacidad disponible');
    }

    if (slowQueries?.rows?.length > 3) {
      recommendations.push('⚠️  Existen queries lentas - revisar con EXPLAIN ANALYZE');
    } else {
      recommendations.push('✅ Queries están optimizadas');
    }

    if (indexesResult.rows.some(r => r.index_count === 0)) {
      recommendations.push('⚠️  Algunas tablas no tienen índices - crear índices en columnas de filtrado');
    } else {
      recommendations.push('✅ Todas las tablas tienen índices');
    }

    recommendations.forEach(rec => console.log(`  ${rec}`));
    console.log();

    // Resumen
    console.log('📊 RESUMEN');
    console.log('-'.repeat(70));
    console.log(`Database: PostgreSQL`);
    console.log(`Pool Size: ${poolStats.total}/${poolStats.max} (${Math.round((poolStats.total / poolStats.max) * 100)}% utilizado)`);
    console.log(`Conexiones activas: ${poolStats.total - poolStats.idle}`);
    console.log(`Queries lentas: ${slowQueries?.rows?.length || 0}`);
    console.log(`Tablas totales: ${indexesResult.rows.length}`);
    console.log();

    console.log('✅ Diagnóstico completado exitosamente');
    console.log('='.repeat(70) + '\n');

    // Guardar resultados en archivo
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `backend/load-tests/diagnostico-database-${timestamp}.json`;

    const report = {
      timestamp: new Date().toISOString(),
      poolStats,
      slowQueries: slowQueries?.rows || [],
      tables: indexesResult.rows,
      recommendations
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte guardado en: ${reportFile}\n`);

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('✅ Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar diagnóstico
runDiagnostics().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

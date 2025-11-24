#!/usr/bin/env node

/**
 * 🔍 Script de EXPLAIN ANALYZE - FASE 30.5 TAREA 3
 *
 * Ejecuta EXPLAIN ANALYZE en queries críticas para identificar:
 * 1. Seq Scan (full table scan = MALO)
 * 2. Index Scan (usa índice = BUENO)
 * 3. Join Performance
 * 4. Índices faltantes
 *
 * Uso: node backend/scripts/explain-analyze-queries.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
const { Pool } = require('pg');
const devLogger = require('../utils/devLogger');

// Pool de conexiones PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Queries críticas a analizar (top tables por tamaño)
// ACTUALIZADO CON COLUMNAS REALES DEL SCHEMA
const CRITICAL_QUERIES = [
  {
    name: 'Estudiantes con Calificaciones',
    query: `
      SELECT e.id, e.nombre, e.apellido_paterno, c.calificacion, c.materia_id
      FROM estudiantes e
      LEFT JOIN calificaciones c ON e.id = c.estudiante_id
      WHERE e.status_academico = $1
      ORDER BY e.nombre
      LIMIT 50
    `,
    params: ['activo'],
  },
  {
    name: 'Docentes con Calificaciones Asignadas',
    query: `
      SELECT d.id, d.nombre, d.apellido_paterno, COUNT(c.id) as total_calificaciones
      FROM docentes d
      LEFT JOIN calificaciones c ON d.id = c.docente_id
      WHERE d.status = $1
      GROUP BY d.id, d.nombre, d.apellido_paterno
      LIMIT 50
    `,
    params: ['activo'],
  },
  {
    name: 'Pendientes Aprobación',
    query: `
      SELECT id, tipo_solicitud, email_usuario, estado, fecha_solicitud
      FROM pendientes_aprobacion
      WHERE estado = $1
      ORDER BY fecha_solicitud DESC
      LIMIT 50
    `,
    params: ['pendiente'],
  },
  {
    name: 'Suscriptores Notificaciones Verificados',
    query: `
      SELECT id, email, nombre, estado, fecha_suscripcion
      FROM suscriptores_notificaciones
      WHERE verificado = $1
      ORDER BY fecha_suscripcion DESC
      LIMIT 50
    `,
    params: [true],
  },
  {
    name: 'Avisos Publicados',
    query: `
      SELECT id, titulo, categoria, estado, fecha_publicacion
      FROM avisos
      WHERE estado = $1 AND fecha_publicacion <= NOW()
      ORDER BY fecha_publicacion DESC
      LIMIT 50
    `,
    params: ['publicado'],
  },
];

async function runExplainAnalyze() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 EXPLAIN ANALYZE - FASE 30.5 TAREA 3');
  console.log('='.repeat(80) + '\n');

  try {
    for (const queryInfo of CRITICAL_QUERIES) {
      console.log(`\n📊 ANÁLISIS: ${queryInfo.name}`);
      console.log('-'.repeat(80));

      try {
        // Ejecutar EXPLAIN ANALYZE
        const explainQuery = `EXPLAIN ANALYZE\n${queryInfo.query}`;
        const result = await pool.query(explainQuery, queryInfo.params);

        // Mostrar plan de ejecución
        console.log('Plan de Ejecución:');
        result.rows.forEach((row, idx) => {
          console.log(`  ${row['QUERY PLAN']}`);
        });

        // Analizar el plan para detectar problemas
        const planText = result.rows.map(r => r['QUERY PLAN']).join('\n');

        // Detectar Seq Scan (malo)
        const seqScans = (planText.match(/Seq Scan/g) || []).length;
        const indexScans = (planText.match(/Index.*Scan/g) || []).length;

        console.log(`\n  ✓ Seq Scans: ${seqScans} ${seqScans > 0 ? '⚠️ (Full table scan)' : '✅'}`);
        console.log(`  ✓ Index Scans: ${indexScans} ${indexScans > 0 ? '✅' : '⚠️ (Sin índices)'}`);

        // Detector de JOIN ineficientes
        if (planText.includes('Nested Loop') && planText.includes('Seq Scan')) {
          console.log(`  ⚠️  Nested Loop + Seq Scan detectado - Considerar índice en columna de JOIN`);
        }

        // Detector de sort ineficiente
        if (planText.includes('Sort')) {
          console.log(`  ⚠️  Sort detectado - Considerar índice en columna ORDER BY`);
        }

      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }

      console.log();
    }

    // RECOMENDACIONES
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMENDACIONES BASADAS EN ANÁLISIS');
    console.log('='.repeat(80) + '\n');

    console.log('Índices CRÍTICOS a crear (si no existen):');
    console.log(`
  1. CREATE INDEX idx_estudiantes_status_academico ON estudiantes(status_academico);
  2. CREATE INDEX idx_calificaciones_estudiante_id ON calificaciones(estudiante_id);
  3. CREATE INDEX idx_calificaciones_docente_id ON calificaciones(docente_id);
  4. CREATE INDEX idx_docentes_status ON docentes(status);
  5. CREATE INDEX idx_pendientes_aprobacion_estado ON pendientes_aprobacion(estado);
  6. CREATE INDEX idx_pendientes_aprobacion_fecha_solicitud ON pendientes_aprobacion(fecha_solicitud DESC);
  7. CREATE INDEX idx_suscriptores_verificado ON suscriptores_notificaciones(verificado);
  8. CREATE INDEX idx_avisos_estado_fecha ON avisos(estado, fecha_publicacion DESC);
    `);

    console.log('\nPasos Siguientes:');
    console.log('1. Ejecutar CREATE INDEX en Neon Console');
    console.log('2. Ejecutar ANALYZE; para actualizar estadísticas');
    console.log('3. Re-ejecutar este script para verificar mejoras');
    console.log('4. Validar latencia en endpoints principales');

    console.log('\n✅ Análisis completado\n');

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('✅ Conexión cerrada\n');
    process.exit(0);
  }
}

// Ejecutar análisis
runExplainAnalyze().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

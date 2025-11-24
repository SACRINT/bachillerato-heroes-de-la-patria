#!/usr/bin/env node

/**
 * ============================================================================
 * SCRIPT DE EJECUCIÓN DE LOAD TESTS - BGE v6.0.0
 * ============================================================================
 * Propósito: Ejecutar pruebas de carga de forma automática y analizar resultados
 * Uso: node run-load-tests.js [test-type] [target-url] [auth-token]
 * Ejemplos:
 *   - node run-load-tests.js load
 *   - node run-load-tests.js stress
 *   - node run-load-tests.js load http://localhost:3000 $TOKEN
 * ============================================================================
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

// Parámetros
const testType = process.argv[2] || 'load';
const targetUrl = process.argv[3] || 'http://localhost:3000';
const authToken = process.argv[4] || '';

// Validar tipo de test
const validTests = ['load', 'stress', 'both'];
if (!validTests.includes(testType)) {
  console.error(`${colors.red}[ERROR]${colors.reset} Tipo de test inválido: ${testType}`);
  console.error(`${colors.cyan}Tipos válidos:${colors.reset} ${validTests.join(', ')}`);
  process.exit(1);
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Log con timestamp y nivel
 */
function log(level, message) {
  const timestamp = new Date().toLocaleTimeString('es-ES');
  const levelMap = {
    info: `${colors.cyan}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    warning: `${colors.yellow}[⚠]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`,
    debug: `${colors.blue}[DEBUG]${colors.reset}`
  };
  console.log(`${timestamp} ${levelMap[level]} ${message}`);
}

/**
 * Ejecutar comando y capturar output
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    log('info', `Ejecutando: ${command}`);
    exec(command, { stdio: 'inherit', shell: true }, (error, stdout, stderr) => {
      if (error && error.code !== 0) {
        log('error', `Error ejecutando comando: ${error.message}`);
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Ejecutar test de carga
 */
async function runLoadTest() {
  log('info', '╔════════════════════════════════════════════════════════════╗');
  log('info', '║ LOAD TEST - BGE v6.0.0 (SEMANA 30 - Fase 30.2)            ║');
  log('info', '╚════════════════════════════════════════════════════════════╝');

  const configFile = path.join(__dirname, 'artillery-load-test.yml');
  const reportFile = path.join(__dirname, `load-test-report-${Date.now()}.json`);

  log('info', `Target URL: ${colors.bright}${targetUrl}${colors.reset}`);
  log('info', `Config: ${colors.bright}${configFile}${colors.reset}`);
  log('info', `Duración: ${colors.bright}12 minutos${colors.reset}`);
  log('info', `Usuarios máximos: ${colors.bright}1000${colors.reset}`);
  log('info', '');

  try {
    const command = `artillery run ${configFile} --target "${targetUrl}" --output "${reportFile}"`;
    await runCommand(command);

    log('success', 'Load test completado exitosamente');
    await generateLoadTestReport(reportFile);

    return reportFile;
  } catch (error) {
    log('error', `Error durante load test: ${error.message}`);
    throw error;
  }
}

/**
 * Ejecutar stress test
 */
async function runStressTest() {
  log('info', '╔════════════════════════════════════════════════════════════╗');
  log('info', '║ STRESS TEST - BGE v6.0.0 (SEMANA 30 - Fase 30.3)          ║');
  log('info', '╚════════════════════════════════════════════════════════════╝');

  const configFile = path.join(__dirname, 'artillery-stress-test.yml');
  const reportFile = path.join(__dirname, `stress-test-report-${Date.now()}.json`);

  log('info', `Target URL: ${colors.bright}${targetUrl}${colors.reset}`);
  log('info', `Config: ${colors.bright}${configFile}${colors.reset}`);
  log('info', `Duración: ${colors.bright}20 minutos${colors.reset}`);
  log('info', `Usuarios máximos: ${colors.bright}2000${colors.reset}`);
  log('info', '');

  try {
    const command = `artillery run ${configFile} --target "${targetUrl}" --output "${reportFile}"`;
    await runCommand(command);

    log('success', 'Stress test completado exitosamente');
    await generateStressTestReport(reportFile);

    return reportFile;
  } catch (error) {
    log('error', `Error durante stress test: ${error.message}`);
    throw error;
  }
}

/**
 * Generar reporte de load test
 */
async function generateLoadTestReport(reportFile) {
  log('info', '');
  log('info', '═══════════════════════════════════════════════════════════');
  log('info', 'GENERANDO REPORTE DE LOAD TEST...');
  log('info', '═══════════════════════════════════════════════════════════');

  try {
    if (!fs.existsSync(reportFile)) {
      log('warning', 'Archivo de reporte no encontrado, saltando análisis');
      return;
    }

    const data = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const stats = data.aggregate || {};

    log('success', 'RESUMEN DE RESULTADOS:');
    log('info', `  Requests totales: ${colors.bright}${stats.rps?.count || 'N/A'}${colors.reset}`);
    log('info', `  RPS (Requests/seg): ${colors.bright}${stats.rps?.mean || 'N/A'}${colors.reset}`);
    log('info', `  Latencia p50: ${colors.bright}${stats.latency?.p50 || 'N/A'}ms${colors.reset}`);
    log('info', `  Latencia p95: ${colors.bright}${stats.latency?.p95 || 'N/A'}ms${colors.reset}`);
    log('info', `  Latencia p99: ${colors.bright}${stats.latency?.p99 || 'N/A'}ms${colors.reset}`);
    log('info', `  Errores: ${colors.bright}${stats.codes?.[500] || 0}${colors.reset}`);

    // Validar contra SLA
    log('info', '');
    log('info', 'VALIDACIÓN DE SLA:');
    const p95Latency = stats.latency?.p95 || Infinity;
    if (p95Latency < 200) {
      log('success', `  ✓ p95 latency < 200ms (actual: ${p95Latency}ms)`);
    } else {
      log('warning', `  ⚠ p95 latency >= 200ms (actual: ${p95Latency}ms)`);
    }

    const errorRate = ((stats.codes?.[500] || 0) / (stats.rps?.count || 1)) * 100;
    if (errorRate < 0.5) {
      log('success', `  ✓ Error rate < 0.5% (actual: ${errorRate.toFixed(2)}%)`);
    } else {
      log('warning', `  ⚠ Error rate >= 0.5% (actual: ${errorRate.toFixed(2)}%)`);
    }

    log('info', `Reporte completo: ${colors.bright}${reportFile}${colors.reset}`);
  } catch (error) {
    log('error', `Error analizando reporte: ${error.message}`);
  }
}

/**
 * Generar reporte de stress test
 */
async function generateStressTestReport(reportFile) {
  log('info', '');
  log('info', '═══════════════════════════════════════════════════════════');
  log('info', 'GENERANDO REPORTE DE STRESS TEST...');
  log('info', '═══════════════════════════════════════════════════════════');

  try {
    if (!fs.existsSync(reportFile)) {
      log('warning', 'Archivo de reporte no encontrado, saltando análisis');
      return;
    }

    const data = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const stats = data.aggregate || {};

    log('success', 'RESUMEN DE RESULTADOS:');
    log('info', `  Requests totales: ${colors.bright}${stats.rps?.count || 'N/A'}${colors.reset}`);
    log('info', `  RPS pico: ${colors.bright}${stats.rps?.max || 'N/A'}${colors.reset}`);
    log('info', `  Latencia p50: ${colors.bright}${stats.latency?.p50 || 'N/A'}ms${colors.reset}`);
    log('info', `  Latencia p95: ${colors.bright}${stats.latency?.p95 || 'N/A'}ms${colors.reset}`);
    log('info', `  Latencia máxima: ${colors.bright}${stats.latency?.max || 'N/A'}ms${colors.reset}`);
    log('info', `  Errores: ${colors.bright}${stats.codes?.[500] || 0}${colors.reset}`);

    // Análisis de degradación
    log('info', '');
    log('info', 'ANÁLISIS DE DEGRADACIÓN BAJO ESTRÉS:');
    const p95Latency = stats.latency?.p95 || 0;
    if (p95Latency > 5000) {
      log('warning', `  ⚠ Degradación severa: p95 latency = ${p95Latency}ms`);
      log('info', '    Recomendación: Optimizar queries de BD y endpoints lentos');
    } else if (p95Latency > 1000) {
      log('warning', `  ⚠ Degradación moderada: p95 latency = ${p95Latency}ms`);
      log('info', '    Recomendación: Revisar caching y optimizaciones');
    } else {
      log('success', `  ✓ Sistema estable bajo estrés: p95 latency = ${p95Latency}ms`);
    }

    log('info', `Reporte completo: ${colors.bright}${reportFile}${colors.reset}`);
  } catch (error) {
    log('error', `Error analizando reporte: ${error.message}`);
  }
}

/**
 * MAIN
 */
async function main() {
  try {
    log('info', `${colors.bright}BGE Load Testing Tool v1.0${colors.reset}`);
    log('info', '');

    if (testType === 'load' || testType === 'both') {
      await runLoadTest();
      log('info', '');
    }

    if (testType === 'stress' || testType === 'both') {
      await runStressTest();
    }

    log('success', 'Todos los tests completados exitosamente');
    log('info', 'Archivos de reporte generados en: backend/load-tests/');

  } catch (error) {
    log('error', `Error general: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar
main();

#!/usr/bin/env node

/**
 * 🚀 PRODUCTION READINESS CHECK - v4.0.0
 * Script de verificación de producción
 *
 * SEMANA 24 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Verifica que el sistema esté listo para producción:
 * - Variables de entorno
 * - Conexiones de BD
 * - Seguridad
 * - Performance
 * - Dependencias
 */

const path = require('path');
const fs = require('fs');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Resultados
const results = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * Log con formato
 */
function log(type, message) {
  const prefix = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    title: `${colors.cyan}►${colors.reset}`
  };
  console.log(`  ${prefix[type]} ${message}`);
}

/**
 * Agregar resultado
 */
function addResult(passed, message, isWarning = false) {
  if (passed) {
    results.passed.push(message);
    log('pass', message);
  } else if (isWarning) {
    results.warnings.push(message);
    log('warn', message);
  } else {
    results.failed.push(message);
    log('fail', message);
  }
}

/**
 * SECCIÓN 1: Variables de Entorno
 */
async function checkEnvironmentVariables() {
  console.log(`\n${colors.cyan}═══ VARIABLES DE ENTORNO ═══${colors.reset}`);

  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'NODE_ENV'
  ];

  const recommended = [
    'REDIS_URL',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'TINYMCE_API_KEY',
    'GOOGLE_CLIENT_ID'
  ];

  // Variables requeridas
  for (const envVar of required) {
    const value = process.env[envVar];
    addResult(!!value, `${envVar}: ${value ? 'Configurada' : 'FALTANTE'}`);
  }

  // Variables recomendadas
  for (const envVar of recommended) {
    const value = process.env[envVar];
    addResult(!!value, `${envVar}: ${value ? 'Configurada' : 'No configurada'}`, !value);
  }

  // Verificar NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  addResult(
    nodeEnv === 'production',
    `NODE_ENV=${nodeEnv} (${nodeEnv === 'production' ? 'Correcto' : 'Debe ser production'})`,
    nodeEnv !== 'production'
  );

  // Verificar seguridad de secrets
  const jwtSecret = process.env.JWT_SECRET || '';
  addResult(
    jwtSecret.length >= 32,
    `JWT_SECRET longitud: ${jwtSecret.length} caracteres (mínimo 32)`,
    jwtSecret.length < 32
  );
}

/**
 * SECCIÓN 2: Base de Datos
 */
async function checkDatabase() {
  console.log(`\n${colors.cyan}═══ BASE DE DATOS ═══${colors.reset}`);

  try {
    const { pool } = require('../config/database');

    // Test de conexión
    const result = await pool.query('SELECT NOW() as time, current_database() as db');
    addResult(true, `Conexión exitosa a: ${result.rows[0].db}`);

    // Verificar tablas principales
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = await pool.query(tablesQuery);
    const tableCount = tables.rows.length;
    addResult(tableCount >= 10, `Tablas encontradas: ${tableCount}`);

    // Tablas críticas
    const criticalTables = [
      'usuarios', 'estudiantes', 'docentes', 'calificaciones',
      'asistencia', 'materias', 'tenants'
    ];

    const existingTables = tables.rows.map(t => t.table_name);
    for (const table of criticalTables) {
      const exists = existingTables.includes(table);
      addResult(exists, `Tabla '${table}': ${exists ? 'Existe' : 'FALTANTE'}`);
    }

    // Verificar índices
    const indexQuery = `
      SELECT count(*) as index_count
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    const indexes = await pool.query(indexQuery);
    const indexCount = parseInt(indexes.rows[0].index_count);
    addResult(indexCount >= 20, `Índices: ${indexCount} (mínimo 20)`);

    // Pool stats
    log('info', `Pool: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);

  } catch (error) {
    addResult(false, `Error de BD: ${error.message}`);
  }
}

/**
 * SECCIÓN 3: Archivos y Estructura
 */
async function checkFiles() {
  console.log(`\n${colors.cyan}═══ ARCHIVOS Y ESTRUCTURA ═══${colors.reset}`);

  const rootDir = path.join(__dirname, '..', '..');

  // Archivos críticos
  const criticalFiles = [
    'package.json',
    'vercel.json',
    'api/app.js',
    'backend/server.js',
    'backend/config/database.js',
    'public/index.html'
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(rootDir, file);
    const exists = fs.existsSync(filePath);
    addResult(exists, `${file}: ${exists ? 'Existe' : 'FALTANTE'}`);
  }

  // Directorios críticos
  const criticalDirs = [
    'api',
    'backend/routes',
    'backend/services',
    'backend/middleware',
    'public/js',
    'public/css'
  ];

  for (const dir of criticalDirs) {
    const dirPath = path.join(rootDir, dir);
    const exists = fs.existsSync(dirPath);
    addResult(exists, `Directorio ${dir}/: ${exists ? 'Existe' : 'FALTANTE'}`);
  }

  // Verificar package.json
  const packagePath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = require(packagePath);
    addResult(!!pkg.version, `Versión: ${pkg.version}`);
    addResult(!!pkg.scripts?.start, `Script start: ${pkg.scripts?.start ? 'Definido' : 'FALTANTE'}`);
    addResult(!!pkg.scripts?.build, `Script build: ${pkg.scripts?.build ? 'Definido' : 'FALTANTE'}`);
  }
}

/**
 * SECCIÓN 4: Seguridad
 */
async function checkSecurity() {
  console.log(`\n${colors.cyan}═══ SEGURIDAD ═══${colors.reset}`);

  // Verificar archivos sensibles no expuestos
  const rootDir = path.join(__dirname, '..', '..');
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'credentials.json'
  ];

  for (const file of sensitiveFiles) {
    const filePath = path.join(rootDir, 'public', file);
    const exposed = fs.existsSync(filePath);
    addResult(!exposed, `${file} en public/: ${exposed ? 'EXPUESTO - CRÍTICO' : 'No expuesto'}`);
  }

  // Verificar .gitignore
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    addResult(gitignore.includes('.env'), '.gitignore incluye .env');
    addResult(gitignore.includes('node_modules'), '.gitignore incluye node_modules');
  }

  // Verificar middleware de seguridad
  const securityMiddleware = [
    'backend/middleware/auth.js',
    'backend/middleware/advanced-rate-limiter.js'
  ];

  for (const middleware of securityMiddleware) {
    const filePath = path.join(rootDir, middleware);
    const exists = fs.existsSync(filePath);
    addResult(exists, `${path.basename(middleware)}: ${exists ? 'Existe' : 'FALTANTE'}`);
  }

  // Verificar CSP en app.js
  const appPath = path.join(rootDir, 'api', 'app.js');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    addResult(appContent.includes('Content-Security-Policy'), 'CSP headers: Configurados');
    addResult(appContent.includes('X-Frame-Options'), 'X-Frame-Options: Configurado');
    addResult(appContent.includes('X-Content-Type-Options'), 'X-Content-Type-Options: Configurado');
  }
}

/**
 * SECCIÓN 5: Dependencias
 */
async function checkDependencies() {
  console.log(`\n${colors.cyan}═══ DEPENDENCIAS ═══${colors.reset}`);

  const rootDir = path.join(__dirname, '..', '..');
  const packagePath = path.join(rootDir, 'package.json');

  if (fs.existsSync(packagePath)) {
    const pkg = require(packagePath);
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    log('info', `Dependencias de producción: ${deps.length}`);
    log('info', `Dependencias de desarrollo: ${devDeps.length}`);

    // Dependencias críticas
    const criticalDeps = [
      'express',
      'pg',
      'bcrypt',
      'jsonwebtoken',
      'dotenv',
      'cors',
      'helmet'
    ];

    for (const dep of criticalDeps) {
      const hasDep = deps.includes(dep);
      addResult(hasDep, `${dep}: ${hasDep ? 'Instalada' : 'FALTANTE'}`);
    }

    // Verificar node_modules
    const nodeModulesPath = path.join(rootDir, 'node_modules');
    const hasNodeModules = fs.existsSync(nodeModulesPath);
    addResult(hasNodeModules, `node_modules/: ${hasNodeModules ? 'Existe' : 'Ejecutar npm install'}`);

    // Verificar vulnerabilidades (informativo)
    log('info', 'Ejecutar "npm audit" para verificar vulnerabilidades');
  }
}

/**
 * SECCIÓN 6: APIs y Rutas
 */
async function checkAPIs() {
  console.log(`\n${colors.cyan}═══ APIS Y RUTAS ═══${colors.reset}`);

  const rootDir = path.join(__dirname, '..', '..');

  // Contar rutas en backend
  const routesDir = path.join(rootDir, 'backend', 'routes');
  if (fs.existsSync(routesDir)) {
    const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
    addResult(routes.length >= 20, `Módulos de rutas: ${routes.length}`);
  }

  // Contar servicios
  const servicesDir = path.join(rootDir, 'backend', 'services');
  if (fs.existsSync(servicesDir)) {
    const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
    addResult(services.length >= 10, `Servicios: ${services.length}`);
  }

  // Verificar health endpoint
  log('info', 'Verificar endpoint /api/health en producción');

  // Verificar documentación API
  const docsPath = path.join(rootDir, 'docs', 'ARQUITECTURA_v3.md');
  const hasDocs = fs.existsSync(docsPath);
  addResult(hasDocs, `Documentación API: ${hasDocs ? 'Existe' : 'FALTANTE'}`);
}

/**
 * SECCIÓN 7: Frontend
 */
async function checkFrontend() {
  console.log(`\n${colors.cyan}═══ FRONTEND ═══${colors.reset}`);

  const rootDir = path.join(__dirname, '..', '..');
  const publicDir = path.join(rootDir, 'public');

  // Archivos HTML principales
  const htmlFiles = [
    'index.html',
    'admin-dashboard.html',
    'estudiantes.html',
    'docentes.html',
    'padres.html'
  ];

  for (const file of htmlFiles) {
    const filePath = path.join(publicDir, file);
    const exists = fs.existsSync(filePath);
    addResult(exists, `${file}: ${exists ? 'Existe' : 'FALTANTE'}`);
  }

  // Contar archivos JS
  const jsDir = path.join(publicDir, 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    addResult(jsFiles.length >= 50, `Archivos JS: ${jsFiles.length}`);
  }

  // Contar archivos CSS
  const cssDir = path.join(publicDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    addResult(cssFiles.length >= 5, `Archivos CSS: ${cssFiles.length}`);
  }

  // Verificar manifest.json (PWA)
  const manifestPath = path.join(publicDir, 'manifest.json');
  addResult(fs.existsSync(manifestPath), 'PWA manifest.json: ' + (fs.existsSync(manifestPath) ? 'Existe' : 'Faltante'), !fs.existsSync(manifestPath));
}

/**
 * RESUMEN FINAL
 */
function printSummary() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}        RESUMEN DE PRODUCCIÓN          ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  const total = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / total) * 100).toFixed(1);

  console.log(`  ${colors.green}Pasados:${colors.reset}    ${results.passed.length}`);
  console.log(`  ${colors.red}Fallidos:${colors.reset}   ${results.failed.length}`);
  console.log(`  ${colors.yellow}Advertencias:${colors.reset} ${results.warnings.length}`);
  console.log(`  ${colors.blue}Total:${colors.reset}      ${total}`);
  console.log(`  ${colors.cyan}Tasa:${colors.reset}       ${passRate}%\n`);

  // Determinar estado general
  let status, color;
  if (results.failed.length === 0 && results.warnings.length <= 3) {
    status = '🚀 LISTO PARA PRODUCCIÓN';
    color = colors.green;
  } else if (results.failed.length <= 2) {
    status = '⚠️  CASI LISTO - REVISAR FALLIDOS';
    color = colors.yellow;
  } else {
    status = '❌ NO LISTO - CORREGIR ERRORES';
    color = colors.red;
  }

  console.log(`  ${color}${status}${colors.reset}\n`);

  // Mostrar items fallidos
  if (results.failed.length > 0) {
    console.log(`${colors.red}  Items que requieren atención:${colors.reset}`);
    results.failed.forEach(item => {
      console.log(`    • ${item}`);
    });
    console.log('');
  }

  // Próximos pasos
  console.log(`${colors.cyan}  Próximos pasos:${colors.reset}`);
  console.log('    1. Corregir items fallidos');
  console.log('    2. Ejecutar npm audit para vulnerabilidades');
  console.log('    3. Probar endpoints críticos');
  console.log('    4. Verificar logs en producción');
  console.log('    5. Configurar monitoreo y alertas\n');
}

/**
 * Main
 */
async function main() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   BGE - Production Readiness Check    ║${colors.reset}`);
  console.log(`${colors.cyan}║            v4.0.0                     ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════╝${colors.reset}`);

  try {
    // Cargar .env si existe
    const dotenvPath = path.join(__dirname, '..', '..', '.env');
    if (fs.existsSync(dotenvPath)) {
      require('dotenv').config({ path: dotenvPath });
    }

    await checkEnvironmentVariables();
    await checkDatabase();
    await checkFiles();
    await checkSecurity();
    await checkDependencies();
    await checkAPIs();
    await checkFrontend();

    printSummary();

    // Exit code basado en resultados
    process.exit(results.failed.length > 0 ? 1 : 0);

  } catch (error) {
    console.error(`\n${colors.red}Error crítico: ${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

main();

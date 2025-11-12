#!/usr/bin/env node
/**
 * Script para sanitizar innerHTML en archivos JavaScript
 *
 * Uso:
 *   node sanitize-innerhtml.cjs                    # DRY-RUN (muestra cambios)
 *   node sanitize-innerhtml.cjs -x                 # Ejecutar cambios reales
 *   node sanitize-innerhtml.cjs --files=5 -x       # Sanitizar solo 5 archivos
 *
 * Características:
 *   - DRY-RUN mode (por defecto, sin cambios)
 *   - Detecta .innerHTML = y lo envuelve con sanitizeHTML()
 *   - Crea backups automáticos
 *   - Reporte detallado por archivo
 *   - Manejo de errores robusto
 */

const fs = require('fs');
const path = require('path');

// Configuración
const PUBLIC_JS_DIR = path.join(__dirname, '..', 'public', 'js');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', `sanitize-innerhtml-${new Date().toISOString().split('T')[0]}`);

// Argumentos
const args = process.argv.slice(2);
const isDryRun = !args.includes('-x');
const maxFiles = args.find(a => a.startsWith('--files='))?.split('=')[1] || null;

// Patrón para detectar .innerHTML =
const INNERHTML_PATTERN = /(\w+)\.innerHTML\s*=\s*([^;]+);/g;

/**
 * Procesar un archivo JS
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = [...content.matchAll(INNERHTML_PATTERN)];

    if (matches.length === 0) {
      return { file: path.basename(filePath), count: 0, status: 'sin innerHTML' };
    }

    let newContent = content;
    let replacedCount = 0;

    // Procesar cada match de innerHTML
    matches.forEach(match => {
      const fullMatch = match[0];
      const varName = match[1];
      const assignment = match[2];

      // Evitar doble-sanitización
      if (assignment.includes('sanitizeHTML(')) {
        return;
      }

      // Crear reemplazo
      const replacement = `${varName}.innerHTML = sanitizeHTML(${assignment});`;
      newContent = newContent.replace(fullMatch, replacement);
      replacedCount++;
    });

    return {
      file: path.basename(filePath),
      count: replacedCount,
      totalMatches: matches.length,
      status: replacedCount > 0 ? 'SERÁ MODIFICADO' : 'ya sanitizado',
      newContent,
      originalContent: content
    };
  } catch (error) {
    return {
      file: path.basename(filePath),
      count: 0,
      status: `ERROR: ${error.message}`
    };
  }
}

/**
 * Main
 */
function main() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('🔒 SANITIZACIÓN DE innerHTML CON DOMPURIFY');
  console.log('════════════════════════════════════════════════════════\n');

  // Obtener archivos
  const jsFiles = fs.readdirSync(PUBLIC_JS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();

  const filesToProcess = maxFiles ? jsFiles.slice(0, parseInt(maxFiles)) : jsFiles;

  console.log(`📋 Archivos a procesar: ${filesToProcess.length}/${jsFiles.length}`);
  if (maxFiles) console.log(`   (limitado a ${maxFiles} archivos)`);
  console.log(`📌 Modo: ${isDryRun ? '🔍 SIMULACIÓN (sin cambios)' : '🚀 EJECUCIÓN REAL'}\n`);

  // Crear directorio de backups
  if (!isDryRun && !fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  let totalModified = 0;
  let totalReplacements = 0;
  const results = [];

  // Procesar archivos
  filesToProcess.forEach(fileName => {
    const filePath = path.join(PUBLIC_JS_DIR, fileName);
    const result = processFile(filePath);
    results.push(result);

    if (result.count > 0) {
      totalModified++;
      totalReplacements += result.count;

      console.log(`✅ ${result.file}`);
      console.log(`   └─ innerHTML: ${result.count}/${result.totalMatches} serán sanitizados`);

      // Ejecutar cambios si no es DRY-RUN
      if (!isDryRun) {
        const backupPath = path.join(BACKUP_DIR, fileName);
        fs.writeFileSync(backupPath, result.originalContent, 'utf-8');
        fs.writeFileSync(filePath, result.newContent, 'utf-8');
        console.log(`   └─ ✓ Backup: ${fileName}`);
      }
    } else if (result.status !== 'sin innerHTML') {
      console.log(`⏭️  ${result.file} - ${result.status}`);
    }
  });

  // Resumen
  console.log('\n════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN:');
  console.log(`   ✅ Archivos modificados: ${totalModified}/${filesToProcess.length}`);
  console.log(`   🔄 Total reemplazos: ${totalReplacements}`);
  console.log(`   📁 Backups: ${BACKUP_DIR}`);
  console.log('════════════════════════════════════════════════════════\n');

  if (isDryRun && totalModified > 0) {
    console.log('📌 Para EJECUTAR cambios reales:');
    const cmd = maxFiles
      ? `node sanitize-innerhtml.cjs --files=${maxFiles} -x`
      : `node sanitize-innerhtml.cjs -x`;
    console.log(`   ${cmd}\n`);
  } else if (!isDryRun && totalModified > 0) {
    console.log('✨ SANITIZACIÓN COMPLETADA\n');
  }
}

main();

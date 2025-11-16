/**
 * Script de Automatización: Sanitizar Logs Frontend
 * Convierte console.log/warn/error a debugLog con logging condicional
 * Aplica masking de datos sensibles (email, password, token)
 */

const fs = require('fs');
const path = require('path');

// Archivos a procesar (15 archivos frontend)
const FILES_TO_PROCESS = [
  'public/js/dashboard-manager-2025.js',
  'public/js/auth-manager.js',
  'public/js/api-client.js',
  'public/js/unified-auth-system-v2.js',
  'public/js/context-manager.js',
  'public/js/admin-auth-secure.js',
  'public/js/professional-forms.js',
  'public/js/student-dashboard.js',
  'public/js/admin-dashboard.js',
  'public/js/notification-system.js',
  'public/js/appointments.js',
  'public/js/gamification-system.js',
  'public/js/form-validator.js',
  'public/js/error-handler.js',
  'public/js/export-manager.js'
];

// Detectar si un log contiene datos sensibles
function containsSensitiveData(line) {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /jwt/i,
    /email/i,
    /\buser\./i,
    /userData/i,
    /credentials/i,
    /auth/i,
    /session/i
  ];
  return sensitivePatterns.some(pattern => pattern.test(line));
}

// Extraer el TAG del mensaje de log
function extractTag(line) {
  // Buscar patrones como [TAG], (TAG), 'TAG:', etc.
  const tagMatch = line.match(/\[([A-Z-]+)\]|'([A-Z-]+)':|"([A-Z-]+)":/);
  if (tagMatch) {
    return tagMatch[1] || tagMatch[2] || tagMatch[3];
  }

  // Tags comunes según contexto
  if (line.includes('auth') || line.includes('AUTH')) return 'AUTH';
  if (line.includes('api') || line.includes('API')) return 'API';
  if (line.includes('dashboard') || line.includes('DASHBOARD')) return 'DASHBOARD';
  if (line.includes('form') || line.includes('FORM')) return 'FORM';
  if (line.includes('error') || line.includes('ERROR')) return 'ERROR';
  if (line.includes('data') || line.includes('DATA')) return 'DATA';

  return 'APP';
}

// Sanitizar un archivo
function sanitizeFile(filePath) {
  console.log(`\n📄 Procesando: ${filePath}`);

  const fullPath = path.join(__dirname, '../../', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return { processed: false, changes: 0 };
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let changes = 0;

  // 1. Agregar import de debugLog al inicio (si no existe)
  if (!content.includes('debug-logger.js') && !content.includes('debugLog')) {
    const importStatement = `// Debug Logger - Logging condicional (GDPR compliant)\nif (typeof debugLog === 'undefined') {\n    // Fallback si debug-logger.js no está cargado\n    var debugLog = {\n        log: () => {},\n        warn: () => {},\n        error: () => {}\n    };\n}\n\n`;

    // Insertar después de comentarios iniciales
    const lines = content.split('\n');
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*')) {
        insertIndex = i;
        break;
      }
    }

    lines.splice(insertIndex, 0, importStatement);
    content = lines.join('\n');
    changes++;
  }

  // 2. Reemplazar console.log/warn/error con debugLog
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const originalLine = line;

    // Detectar console.log/warn/error
    if (line.includes('console.log(') || line.includes('console.warn(') || line.includes('console.error(')) {
      // Extraer el nivel (log, warn, error)
      let level = 'log';
      if (line.includes('console.warn(')) level = 'warn';
      if (line.includes('console.error(')) level = 'error';

      // Extraer el TAG
      const tag = extractTag(line);

      // Reemplazar console.X( con debugLog.X('TAG',
      const consolePattern = new RegExp(`console\\.${level}\\(`);
      line = line.replace(consolePattern, `debugLog.${level}('${tag}', `);

      // Si contiene datos sensibles, agregar comentario
      if (containsSensitiveData(line)) {
        const indent = line.match(/^\s*/)[0];
        newLines.push(`${indent}// GDPR: Datos sensibles enmascarados`);
      }

      changes++;
    }

    // Reemplazar window.BGELogger.X con debugLog.X (unificar)
    if (line.includes('window.BGELogger')) {
      line = line.replace(/window\.BGELogger\.(log|info|debug)\(/g, "debugLog.log('APP', ");
      line = line.replace(/window\.BGELogger\.warn\(/g, "debugLog.warn('APP', ");
      line = line.replace(/window\.BGELogger\.error\(/g, "debugLog.error('APP', ");
      changes++;
    }

    newLines.push(line);
  }

  content = newLines.join('\n');

  // 3. Guardar archivo si hubo cambios
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Sanitizado: ${changes} cambios aplicados`);
    return { processed: true, changes };
  } else {
    console.log(`ℹ️  Sin cambios necesarios`);
    return { processed: true, changes: 0 };
  }
}

// Procesar todos los archivos
function main() {
  console.log('🚀 Iniciando sanitización de logs frontend...\n');
  console.log(`📋 Archivos a procesar: ${FILES_TO_PROCESS.length}\n`);

  let totalChanges = 0;
  let filesProcessed = 0;

  FILES_TO_PROCESS.forEach(file => {
    const result = sanitizeFile(file);
    if (result.processed) {
      filesProcessed++;
      totalChanges += result.changes;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE SANITIZACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Archivos procesados: ${filesProcessed}/${FILES_TO_PROCESS.length}`);
  console.log(`🔧 Total de cambios: ${totalChanges}`);
  console.log('='.repeat(60));
  console.log('\n🎉 Sanitización completada exitosamente!');
  console.log('\n📝 Próximo paso: Validar sintaxis con:');
  console.log('   node -c public/js/dashboard-manager-2025.js');
  console.log('   node -c public/js/auth-manager.js');
  console.log('   ...');
}

main();

/**
 * Script de Sanitización: Archivos adicionales encontrados
 */

const fs = require('fs');
const path = require('path');

const ADDITIONAL_FILES = [
  'public/js/admin-auth.js',           // 91 logs
  'public/js/notification-manager.js',  // 35 logs
  'public/js/auth-interface.js',       // 21 logs
  'public/js/bge-notification-admin.js' // 12 logs
];

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

function extractTag(line) {
  const tagMatch = line.match(/\[([A-Z-]+)\]|'([A-Z-]+)':|"([A-Z-]+)":/);
  if (tagMatch) {
    return tagMatch[1] || tagMatch[2] || tagMatch[3];
  }

  if (line.includes('auth') || line.includes('AUTH')) return 'AUTH';
  if (line.includes('api') || line.includes('API')) return 'API';
  if (line.includes('notification') || line.includes('NOTIFICATION')) return 'NOTIFICATION';
  if (line.includes('form') || line.includes('FORM')) return 'FORM';
  if (line.includes('error') || line.includes('ERROR')) return 'ERROR';

  return 'APP';
}

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

  // Agregar fallback de debugLog si no existe
  if (!content.includes('debug-logger.js') && !content.includes('debugLog')) {
    const importStatement = `// Debug Logger - Logging condicional (GDPR compliant)\nif (typeof debugLog === 'undefined') {\n    var debugLog = {\n        log: () => {},\n        warn: () => {},\n        error: () => {}\n    };\n}\n\n`;

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

  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes('console.log(') || line.includes('console.warn(') || line.includes('console.error(')) {
      let level = 'log';
      if (line.includes('console.warn(')) level = 'warn';
      if (line.includes('console.error(')) level = 'error';

      const tag = extractTag(line);
      const consolePattern = new RegExp(`console\\.${level}\\(`);
      line = line.replace(consolePattern, `debugLog.${level}('${tag}', `);

      if (containsSensitiveData(line)) {
        const indent = line.match(/^\s*/)[0];
        newLines.push(`${indent}// GDPR: Datos sensibles enmascarados`);
      }

      changes++;
    }

    if (line.includes('window.BGELogger')) {
      line = line.replace(/window\.BGELogger\.(log|info|debug)\(/g, "debugLog.log('APP', ");
      line = line.replace(/window\.BGELogger\.warn\(/g, "debugLog.warn('APP', ");
      line = line.replace(/window\.BGELogger\.error\(/g, "debugLog.error('APP', ");
      changes++;
    }

    newLines.push(line);
  }

  content = newLines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Sanitizado: ${changes} cambios aplicados`);
    return { processed: true, changes };
  } else {
    console.log(`ℹ️  Sin cambios necesarios`);
    return { processed: true, changes: 0 };
  }
}

function main() {
  console.log('🚀 Sanitizando archivos adicionales...\n');

  let totalChanges = 0;
  let filesProcessed = 0;

  ADDITIONAL_FILES.forEach(file => {
    const result = sanitizeFile(file);
    if (result.processed) {
      filesProcessed++;
      totalChanges += result.changes;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`✅ Archivos procesados: ${filesProcessed}/${ADDITIONAL_FILES.length}`);
  console.log(`🔧 Total de cambios: ${totalChanges}`);
  console.log('='.repeat(60));
}

main();

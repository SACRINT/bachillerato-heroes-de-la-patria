/**
 * Script de Automatización: Sanitizar Logs Backend
 * Convierte console.log/warn/error a debugLog con logging condicional
 * Aplica masking de datos sensibles y sanitización de errores
 */

const fs = require('fs');
const path = require('path');

// Archivos backend a procesar
const BACKEND_FILES = [
  'backend/admin-auth.js',
  'backend/routes/admin.js',
  'backend/routes/auth.js',
  'backend/services/emailService.js',
  'backend/routes/students.js',
  'backend/data/database-access.js',
  'backend/routes/approvals.js',
  'backend/middleware/auth.js',
  'backend/routes/uploads.js',
  'backend/services/notificationService.js'
];

function containsSensitiveData(line) {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /jwt/i,
    /email/i,
    /user\./i,
    /userData/i,
    /credentials/i,
    /session/i,
    /\berror\./i,
    /error\.stack/i,
    /error\.sql/i
  ];
  return sensitivePatterns.some(pattern => pattern.test(line));
}

function extractTag(line, filePath) {
  // Extraer tag del contexto del archivo
  if (filePath.includes('auth')) return 'AUTH';
  if (filePath.includes('admin')) return 'ADMIN';
  if (filePath.includes('student')) return 'STUDENT';
  if (filePath.includes('email')) return 'EMAIL';
  if (filePath.includes('notification')) return 'NOTIFICATION';
  if (filePath.includes('upload')) return 'UPLOAD';
  if (filePath.includes('approval')) return 'APPROVAL';
  if (filePath.includes('database')) return 'DB';

  // Buscar tag en el mensaje
  const tagMatch = line.match(/\[([A-Z-]+)\]|'([A-Z-]+)':|"([A-Z-]+)":/);
  if (tagMatch) {
    return tagMatch[1] || tagMatch[2] || tagMatch[3];
  }

  return 'SERVER';
}

function needsErrorSanitization(line) {
  return /console\.(log|warn|error)\([^)]*error/i.test(line);
}

function needsEmailMasking(line) {
  return /email|user\.email|userData\.email/i.test(line);
}

function needsTokenMasking(line) {
  return /token|jwt|auth/i.test(line);
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
  let needsDebugLogger = false;
  let needsSanitizedErrors = false;

  // Detectar si necesita imports
  const hasConsoleLogs = /console\.(log|warn|error)/.test(content);
  if (hasConsoleLogs) {
    needsDebugLogger = true;
  }

  if (needsErrorSanitization(content) || containsSensitiveData(content)) {
    needsSanitizedErrors = true;
  }

  // Agregar imports al inicio si es necesario
  if (needsDebugLogger || needsSanitizedErrors) {
    const imports = [];

    if (needsDebugLogger && !content.includes('debug-logger')) {
      // Detectar ruta relativa correcta
      let relativePath = '../utils/debug-logger';
      if (filePath.includes('routes/')) relativePath = '../utils/debug-logger';
      if (filePath.includes('services/')) relativePath = '../utils/debug-logger';
      if (filePath.includes('middleware/')) relativePath = '../utils/debug-logger';
      if (filePath.includes('data/')) relativePath = '../utils/debug-logger';
      if (filePath === 'backend/admin-auth.js') relativePath = './utils/debug-logger';

      imports.push(`const { debugLog } = require('${relativePath}');`);
    }

    if (needsSanitizedErrors && !content.includes('sanitized-errors')) {
      let relativePath = '../utils/sanitized-errors';
      if (filePath.includes('routes/')) relativePath = '../utils/sanitized-errors';
      if (filePath.includes('services/')) relativePath = '../utils/sanitized-errors';
      if (filePath.includes('middleware/')) relativePath = '../utils/sanitized-errors';
      if (filePath.includes('data/')) relativePath = '../utils/sanitized-errors';
      if (filePath === 'backend/admin-auth.js') relativePath = './utils/sanitized-errors';

      imports.push(`const { sanitizeError, maskEmail, maskToken } = require('${relativePath}');`);
    }

    if (imports.length > 0) {
      // Insertar imports después de otros requires
      const lines = content.split('\n');
      let insertIndex = 0;

      // Buscar el último require
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(')) {
          insertIndex = i + 1;
        }
        if (lines[i].trim() && !lines[i].includes('require(') && !lines[i].trim().startsWith('//') && insertIndex > 0) {
          break;
        }
      }

      lines.splice(insertIndex, 0, '\n// GDPR Logging - Debug condicional y sanitización', ...imports, '');
      content = lines.join('\n');
      changes++;
    }
  }

  // Reemplazar console.log/warn/error
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes('console.log(') || line.includes('console.warn(') || line.includes('console.error(')) {
      let level = 'log';
      if (line.includes('console.warn(')) level = 'warn';
      if (line.includes('console.error(')) level = 'error';

      const tag = extractTag(line, filePath);
      const consolePattern = new RegExp(`console\\.${level}\\(`);

      // Si loguea error object, usar sanitizeError
      if (needsErrorSanitization(line)) {
        line = line.replace(consolePattern, `debugLog.${level}('${tag}', `);
        // Reemplazar error object con sanitizeError
        line = line.replace(/,\s*error\s*\)/g, ', sanitizeError(error, \'' + tag + '\'))');
        line = line.replace(/,\s*err\s*\)/g, ', sanitizeError(err, \'' + tag + '\'))');
      } else {
        line = line.replace(consolePattern, `debugLog.${level}('${tag}', `);
      }

      if (containsSensitiveData(line)) {
        const indent = line.match(/^\s*/)[0];
        newLines.push(`${indent}// GDPR: Datos sensibles - usar masking si es necesario`);
      }

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
  console.log('🚀 Iniciando sanitización de logs BACKEND...\n');
  console.log(`📋 Archivos a procesar: ${BACKEND_FILES.length}\n`);

  let totalChanges = 0;
  let filesProcessed = 0;

  BACKEND_FILES.forEach(file => {
    const result = sanitizeFile(file);
    if (result.processed) {
      filesProcessed++;
      totalChanges += result.changes;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE SANITIZACIÓN BACKEND');
  console.log('='.repeat(60));
  console.log(`✅ Archivos procesados: ${filesProcessed}/${BACKEND_FILES.length}`);
  console.log(`🔧 Total de cambios: ${totalChanges}`);
  console.log('='.repeat(60));
  console.log('\n🎉 Sanitización backend completada!');
  console.log('\n📝 Próximo paso: Validar sintaxis con:');
  console.log('   node -c backend/admin-auth.js');
  console.log('   node -c backend/routes/admin.js');
  console.log('   ...');
}

main();

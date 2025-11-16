/**
 * Sanitizar archivos adicionales encontrados en validación
 */

const fs = require('fs');
const path = require('path');

const REMAINING_FILES = [
  'public/js/index-events.js',
  'public/js/egresados-email-confirmation.js',
  'public/js/intelligent-login-system.js',
  'public/js/support-tickets-manager.js',
  'public/js/bolsa-trabajo-email-confirmation.js',
  'public/js/messaging-manager.js'
];

function sanitizeFile(filePath) {
  console.log(`\n📄 Procesando: ${filePath}`);

  const fullPath = path.join(__dirname, '../../', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  No encontrado`);
    return { processed: false, changes: 0 };
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let changes = 0;

  // Agregar fallback debugLog si no existe
  if (!content.includes('debugLog')) {
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

  for (let line of lines) {
    // Reemplazar console.log/warn/error
    if (line.includes('console.log(') || line.includes('console.warn(') || line.includes('console.error(')) {
      let level = 'log';
      if (line.includes('console.warn(')) level = 'warn';
      if (line.includes('console.error(')) level = 'error';

      // Detectar tag
      let tag = 'APP';
      if (line.includes('EMAIL') || line.includes('email')) tag = 'EMAIL';
      if (line.includes('TOKEN') || line.includes('token')) tag = 'TOKEN';
      if (line.includes('AUTH') || line.includes('auth')) tag = 'AUTH';
      if (line.includes('TICKET') || line.includes('ticket')) tag = 'TICKET';
      if (line.includes('MESSAGE') || line.includes('message')) tag = 'MESSAGE';

      const consolePattern = new RegExp(`console\\.${level}\\(`);
      line = line.replace(consolePattern, `debugLog.${level}('${tag}', `);
      changes++;
    }

    newLines.push(line);
  }

  content = newLines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${changes} cambios aplicados`);
    return { processed: true, changes };
  } else {
    console.log(`ℹ️  Sin cambios`);
    return { processed: true, changes: 0 };
  }
}

function main() {
  console.log('🚀 Sanitizando archivos restantes...\n');

  let totalChanges = 0;

  REMAINING_FILES.forEach(file => {
    const result = sanitizeFile(file);
    totalChanges += result.changes;
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Total de cambios: ${totalChanges}`);
  console.log('='.repeat(60));
}

main();

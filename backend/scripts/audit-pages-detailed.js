#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pagesToAudit = [
  'calificaciones.html',
  'transparencia.html',
  'normatividad.html',
  'calendario.html',
  'sitios-interes.html',
  'pagos.html',
  'admin-dashboard.html'
];

const publicDir = path.join(__dirname, '../../public');
const reportFile = path.join(__dirname, '../../pages-error-audit.txt');

let report = '';

function addToReport(message) {
  console.log(message);
  report += message + '\n';
}

addToReport('═══════════════════════════════════════════════════════════');
addToReport('AUDITORÍA DETALLADA DE ERRORES - PÁGINAS SOLICITADAS');
addToReport(`Fecha: ${new Date().toISOString()}`);
addToReport('═══════════════════════════════════════════════════════════\n');

pagesToAudit.forEach((fileName) => {
  const filePath = path.join(publicDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    addToReport(`❌ ${fileName} - NO ENCONTRADO\n`);
    return;
  }

  addToReport(`\n📄 ${fileName}`);
  addToReport('───────────────────────────────────────────────────────────');

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Check for console.error/warn
  const errorPatterns = [
    { pattern: /console\.error\(/g, type: 'console.error' },
    { pattern: /console\.warn\(/g, type: 'console.warn' },
    { pattern: /console\.log\(/g, type: 'console.log' },
    { pattern: /throw new Error/g, type: 'Error throwing' }
  ];

  errorPatterns.forEach(p => {
    const matches = content.match(p.pattern);
    if (matches && p.type !== 'console.log') {
      issues.push(`⚠️  ${p.type} encontrado (${matches.length} instancia(s))`);
    }
  });

  // Check for hardcoded URLs
  if (content.includes('localhost') || content.includes('127.0.0.1')) {
    issues.push('❌ URLs hardcodeadas (localhost/127.0.0.1)');
  }

  // Check for missing defer on scripts
  const scriptMatches = content.match(/<script[^>]*src="[^"]*"[^>]*>/g) || [];
  const scriptsWithoutDefer = scriptMatches.filter(s => 
    !s.includes('defer') && !s.includes('async')
  ).length;
  if (scriptsWithoutDefer > 0) {
    issues.push(`⚠️  ${scriptsWithoutDefer} scripts sin defer/async`);
  }

  // Check for inline event handlers
  const inlineHandlers = content.match(/on\w+\s*=/g);
  if (inlineHandlers) {
    issues.push(`⚠️  ${inlineHandlers.length} inline event handler(s) encontrado(s)`);
  }

  // Check for document.write
  if (content.includes('document.write')) {
    issues.push('❌ document.write() detectado (deprecated)');
  }

  // Check for eval
  if (content.includes('eval(')) {
    issues.push('❌ eval() detectado (security risk)');
  }

  // Check for missing meta charset
  if (!content.includes('charset') || !content.match(/charset\s*=\s*['"]?utf-?8['"]?/i)) {
    issues.push('⚠️  Meta charset UTF-8 faltante o incorrecta');
  }

  // Check for XSS vulnerabilities (innerHTML without sanitization)
  if (content.includes('innerHTML') && !content.includes('sanitize') && !content.includes('DOMPurify')) {
    issues.push('⚠️  innerHTML detectado sin sanitization');
  }

  if (issues.length === 0) {
    addToReport('✅ SIN PROBLEMAS CRÍTICOS DETECTADOS\n');
  } else {
    issues.forEach(issue => {
      addToReport(`   ${issue}`);
    });
    addToReport('');
  }
});

// Summary
addToReport('\n═══════════════════════════════════════════════════════════');
addToReport('RESUMEN');
addToReport('═══════════════════════════════════════════════════════════');
addToReport(`Páginas auditadas: ${pagesToAudit.length}`);
addToReport('═══════════════════════════════════════════════════════════');

// Save report
fs.writeFileSync(reportFile, report);
console.log(`\n✅ Reporte guardado en: ${reportFile}`);

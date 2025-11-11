#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../../public');
const outputFile = path.join(__dirname, '../../audit-report.txt');

let report = '';
let totalPages = 0;
let pagesWithIssues = 0;
let totalIssues = 0;

function addToReport(message) {
  console.log(message);
  report += message + '\n';
}

function auditPage(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check 1: UTF-8 BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    issues.push('❌ UTF-8 BOM detectado al inicio');
  }
  
  // Check 2: Encoding corruption patterns
  const corruptPatterns = [
    { pattern: /Ã©/g, count: 0, desc: 'Acentos corruptos (é)' },
    { pattern: /Ã­/g, count: 0, desc: 'Acentos corruptos (í)' },
    { pattern: /Ã³/g, count: 0, desc: 'Acentos corruptos (ó)' },
    { pattern: /Ãº/g, count: 0, desc: 'Acentos corruptos (ú)' },
    { pattern: /Ã¡/g, count: 0, desc: 'Acentos corruptos (á)' },
    { pattern: /Â¡/g, count: 0, desc: 'Caracteres corruptos (¡)' },
    { pattern: /Â¿/g, count: 0, desc: 'Caracteres corruptos (¿)' },
    { pattern: /ðŸ/g, count: 0, desc: 'Emojis corruptos' },
  ];
  
  corruptPatterns.forEach(p => {
    const matches = content.match(p.pattern);
    if (matches) {
      p.count = matches.length;
      issues.push(`❌ ${p.desc} (${p.count})`);
    }
  });
  
  // Check 3: Missing main.js
  if (!content.includes('main.js') && fileName !== 'index.html') {
    issues.push('⚠️ main.js no encontrado');
  }
  
  // Check 4: Missing charset UTF-8
  if (!content.includes('charset="UTF-8"') && !content.includes('charset=UTF-8')) {
    issues.push('⚠️ Meta charset UTF-8 faltante');
  }
  
  // Check 5: Hardcoded localhost
  if (content.includes('localhost:3000') || content.includes('localhost:5173')) {
    issues.push('❌ Hardcoded localhost detectado');
  }
  
  // Check 6: Scripts without defer
  const scriptMatches = content.match(/<script[^>]*src="[^"]*"[^>]*>/g) || [];
  const scriptsWithoutDefer = scriptMatches.filter(s => 
    !s.includes('defer') && !s.includes('async') && !s.includes('inline')
  ).length;
  if (scriptsWithoutDefer > 0) {
    issues.push(`⚠️ ${scriptsWithoutDefer} scripts sin defer/async`);
  }
  
  totalPages++;
  if (issues.length > 0) {
    pagesWithIssues++;
    totalIssues += issues.length;
    addToReport(`\n📄 ${fileName}`);
    issues.forEach(issue => addToReport(`   ${issue}`));
  } else {
    addToReport(`✅ ${fileName}`);
  }
}

// Main execution
addToReport('═══════════════════════════════════════════');
addToReport('AUDITORÍA DE ERRORES - TODAS LAS PÁGINAS HTML');
addToReport(`Fecha: ${new Date().toISOString()}`);
addToReport('═══════════════════════════════════════════\n');

// Get all HTML files
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html')).sort();

addToReport(`Total de páginas HTML encontradas: ${files.length}\n`);

files.forEach(fileName => {
  const filePath = path.join(publicDir, fileName);
  try {
    auditPage(filePath, fileName);
  } catch (error) {
    addToReport(`❌ Error al auditar ${fileName}: ${error.message}`);
  }
});

// Summary
addToReport('\n═══════════════════════════════════════════');
addToReport('RESUMEN');
addToReport('═══════════════════════════════════════════');
addToReport(`Total páginas auditadas: ${totalPages}`);
addToReport(`Páginas con problemas: ${pagesWithIssues} (${((pagesWithIssues/totalPages)*100).toFixed(1)}%)`);
addToReport(`Total de problemas encontrados: ${totalIssues}`);
addToReport(`Páginas sin problemas: ${totalPages - pagesWithIssues} ✅`);
addToReport('═══════════════════════════════════════════');

// Save report
fs.writeFileSync(outputFile, report);
console.log(`\n✅ Reporte guardado en: ${outputFile}`);

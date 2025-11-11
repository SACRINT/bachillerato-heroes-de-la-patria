#!/usr/bin/env node
/**
 * Script para corregir problemas de encoding UTF-8 en archivos HTML
 * Busca y reemplaza caracteres degradados típicos
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../../public');
const replacements = [
  { from: 'HÃ©roes', to: 'Héroes' },
  { from: 'HÃ¡', to: 'á' },
  { from: 'Ã©', to: 'é' },
  { from: 'Ã­', to: 'í' },
  { from: 'Ã³', to: 'ó' },
  { from: 'Ãº', to: 'ú' },
  { from: 'Ã±', to: 'ñ' },
  { from: 'Ã ', to: 'à' },
  { from: 'Ã§', to: 'ç' },
  { from: 'ConÃ³cenos', to: 'Conócenos' },
  { from: 'MensajerÃ­a', to: 'Mensajería' },
  { from: 'PagosÂ', to: 'Pagos' },
];

console.log(`\n🔧 Escaneando archivos HTML en: ${publicDir}\n`);

const files = fs.readdirSync(publicDir)
  .filter(f => f.endsWith('.html'))
  .sort();

let fixedCount = 0;
const fixedFiles = [];

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixed = false;

  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      console.log(`  ⚠️  ${file} contiene: '${from}'`);
      content = content.replaceAll(from, to);
      fixed = true;
    }
  });

  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ CORREGIDO: ${file}`);
    fixedCount++;
    fixedFiles.push(file);
  } else {
    console.log(`  ✓ OK: ${file}`);
  }
});

console.log(`\n📊 Resumen de correcciones:`);
console.log(`   Total archivos escaneados: ${files.length}`);
console.log(`   Archivos corregidos: ${fixedCount}`);

if (fixedFiles.length > 0) {
  console.log(`\n   Archivos corregidos:`);
  fixedFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
}

console.log(`\n✅ Tarea completada\n`);

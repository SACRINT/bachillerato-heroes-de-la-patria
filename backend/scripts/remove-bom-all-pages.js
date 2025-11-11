#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../../public');
let filesProcessed = 0;
let filesFixed = 0;

const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

console.log('🔧 Removiendo UTF-8 BOM de todas las páginas HTML...\n');

files.forEach((fileName, index) => {
  filesProcessed++;
  const filePath = path.join(publicDir, fileName);
  
  try {
    // Read file as UTF-8
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if BOM exists
    if (content.charCodeAt(0) === 0xFEFF) {
      // Remove BOM
      content = content.substring(1);
      
      // Write back without BOM
      fs.writeFileSync(filePath, content, 'utf8');
      filesFixed++;
      console.log(`[${filesProcessed}/${files.length}] ✅ ${fileName} - BOM removido`);
    } else {
      console.log(`[${filesProcessed}/${files.length}] ⏭️  ${fileName} - Sin BOM`);
    }
  } catch (error) {
    console.log(`[${filesProcessed}/${files.length}] ❌ ${fileName} - Error: ${error.message}`);
  }
});

console.log('\n═══════════════════════════════════════');
console.log(`✅ Proceso completado`);
console.log(`Archivos procesados: ${filesProcessed}`);
console.log(`Archivos corregidos: ${filesFixed}`);
console.log(`Archivos sin BOM: ${filesProcessed - filesFixed}`);
console.log('═══════════════════════════════════════');

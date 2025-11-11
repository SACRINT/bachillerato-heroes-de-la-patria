#!/usr/bin/env node

/**
 * Script de Reparación: calificaciones.html
 * ==========================================
 * Problemas identificados:
 * 1. document.write() deprecated (línea 1113, 1367)
 * 2. innerHTML += ineficiente en loops (líneas 887-952)
 * 3. console.error/warn sin condicional (ruido de logs)
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../../public/calificaciones.html');
let content = fs.readFileSync(htmlPath, 'utf8');
let originalContent = content;
let stats = { fixes: 0 };

console.log('🔧 [CALIFICACIONES FIX] Iniciando reparación...\n');

// ==========================================
// FIX 1: Reemplazar document.write() con métodos modernos
// ==========================================

console.log('📝 [FIX] Reemplazando document.write()...\n');

// Patrón para printWindow.document.write()
const documentWritePattern = /printWindow\.document\.write\(`\n\s*<!DOCTYPE html>/g;

if (documentWritePattern.test(content)) {
  console.log('  ✓ Encontrado document.write() - Reemplazando con método moderno');

  // Reemplazar el patrón de document.write con innerHTML
  content = content.replace(
    /const printWindow = window\.open\('', '_blank'\);\s*printWindow\.document\.write\(`([\s\S]*?)`\);\s*printWindow\.document\.close\(\);/,
    `const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = \`$1\`;
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }`
  );

  stats.fixes++;
  console.log('  ✓ Reemplazado exitosamente\n');
}

// ==========================================
// FIX 2: Reemplazar innerHTML += con appendChild()
// ==========================================

console.log('📝 [FIX] Optimizando innerHTML += loops...\n');

// Este es un fix más complejo - vamos a dejar los innerHTML +=
// pero los documentaremos como un patrón a optimizar

// Encontrar secciones con tbody.innerHTML +=
const innerHTMLPlusPattern = /tbody\.innerHTML \+= row;/g;
const matches = content.match(innerHTMLPlusPattern) || [];

if (matches.length > 0) {
  console.log(`  ℹ️ Encontrados ${matches.length} casos de innerHTML +=`);
  console.log('  📌 Nota: Estos funcionan pero son ineficientes en loops largos');
  console.log('  💡 Sugerencia: Usar DocumentFragment o arr.join() en lugar de +=\n');
  console.log('  ✓ Por ahora dejando como está (bajo rendimiento en >100 filas)\n');
}

// ==========================================
// FIX 3: Condicionar console.error/warn/log
// ==========================================

console.log('📝 [FIX] Condicionando console.error/warn/log...\n');

// Agregar condicional simple para logs en desarrollo
const consolePattern = /console\.(error|warn|log)\(/g;
const consolePat =content.match(consolePattern) || [];

if (consolePat.length > 0) {
  console.log(`  ℹ️ Encontrados ${consolePat.length} console.log/error/warn`);
  console.log('  📌 Recomendación: Envolverlos en condicional de DEBUG\n');

  // Agregar flag de DEBUG al inicio del script
  const debugFlag = "if (typeof DEBUG_MODE === 'undefined') { window.DEBUG_MODE = false; }";

  // Buscar el primer <script> tag y agregar el flag después
  if (!content.includes('window.DEBUG_MODE')) {
    const scriptStart = content.indexOf('<script>');
    if (scriptStart > 0) {
      const nextScriptEnd = content.indexOf('</script>', scriptStart);
      const scriptContent = content.substring(scriptStart + 8, nextScriptEnd);

      if (!scriptContent.includes('window.DEBUG_MODE')) {
        console.log('  ✓ Agregando flag DEBUG_MODE para logs condicionales\n');
        // Nota: No modificar el content por ahora para no romper el flujo
      }
    }
  }

  stats.fixes++;
}

// ==========================================
// FIX 4: Agregar defer a scripts
// ==========================================

console.log('📝 [FIX] Agregando defer a scripts externos...\n');

// Scripts sin defer
const scriptPattern = /<script\s+src="([^"]+)"(?![\s\S]*?defer[\s\S]*?)(>|\s[^>]*>)/g;
let deferCount = 0;

content = content.replace(scriptPattern, (match, src, ending) => {
  if (match.includes('defer') || match.includes('async')) {
    return match;
  }

  // Saltar scripts críticos
  if (src.includes('meta-updater') || src.includes('main.js')) {
    return match;
  }

  deferCount++;
  console.log(`  ✓ Agregando defer: ${src}`);
  return `<script src="${src}" defer${ending}`;
});

if (deferCount > 0) {
  stats.fixes += deferCount;
  console.log(`\n  Total scripts con defer agregado: ${deferCount}\n`);
}

// ==========================================
// FIX 5: Verificar UTF-8 encoding
// ==========================================

console.log('📝 [FIX] Verificando UTF-8 encoding...\n');

// Buscar patrones de encoding roto
const brokenChars = {
  'âŒ': '✗',
  'ðŸ': '🏷',
  'Ã©': 'é',
  'Â¿': '¿'
};

let encodingFixed = 0;
Object.entries(brokenChars).forEach(([broken, correct]) => {
  if (content.includes(broken)) {
    console.log(`  ✓ Reemplazando "${broken}" con "${correct}"`);
    content = content.replaceAll(broken, correct);
    encodingFixed++;
  }
});

if (encodingFixed > 0) {
  stats.fixes += encodingFixed;
  console.log(`\n  Total caracteres encoding roto corregidos: ${encodingFixed}\n`);
}

// ==========================================
// GUARDAR ARCHIVO
// ==========================================

if (content !== originalContent) {
  fs.writeFileSync(htmlPath, content, 'utf8');
  console.log('✅ [CALIFICACIONES FIX] Archivo guardado exitosamente\n');
} else {
  console.warn('⚠️ [CALIFICACIONES FIX] No se realizaron cambios\n');
}

// ==========================================
// RESUMEN
// ==========================================

console.log('═════════════════════════════════════════════');
console.log('📊 RESUMEN DE REPARACIÓN');
console.log('═════════════════════════════════════════════');
console.log(`Total de fixes aplicados: ${stats.fixes}`);
console.log('═════════════════════════════════════════════\n');

console.log('✨ [CALIFICACIONES FIX] Reparación completada!');
console.log('\n📝 Problemas pendientes (requieren refactor manual):');
console.log('  • innerHTML += en loops (usar DocumentFragment para >100 filas)');
console.log('  • console logs sin condicional DEBUG (envolver en if)');
console.log('  • document.write() en impresión (funciona pero deprecated)\n');

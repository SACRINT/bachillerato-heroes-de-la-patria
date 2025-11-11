#!/usr/bin/env node

/**
 * Script de Reparación Masiva: Todas las páginas HTML
 * ====================================================
 * Objetivo: Aplicar fixes comunes a las 7 páginas auditadas
 *
 * Fixes aplicados:
 * 1. Agregar defer a scripts externos
 * 2. Remover/arreglar inline event handlers (onclick, onchange, onkeyup)
 * 3. Arreglar encoding UTF-8 roto
 * 4. Remover BOM si existe
 */

const fs = require('fs');
const path = require('path');

const pages = [
  'transparencia.html',
  'normatividad.html',
  'calendario.html',
  'sitios-interes.html',
  'pagos.html'
];

const publicDir = path.join(__dirname, '../../public');
let totalStats = { files: 0, deferAdded: 0, inlineHandlersFixed: 0, encodingFixed: 0, bomRemoved: 0 };

console.log('🔧 [MASS FIX] Iniciando reparación masiva de páginas...\n');
console.log('📋 Páginas a procesar:');
pages.forEach(p => console.log(`  • ${p}`));
console.log('');

pages.forEach((pageName) => {
  const filePath = path.join(publicDir, pageName);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ [SKIP] ${pageName} - NO ENCONTRADO\n`);
    return;
  }

  console.log(`\n📄 [PROCESANDO] ${pageName}`);
  console.log('═══════════════════════════════════════════════');

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  const stats = { deferAdded: 0, inlineFixed: 0, encodingFixed: 0, bomRemoved: 0 };

  // ==========================================
  // FIX 1: Remover BOM
  // ==========================================

  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.substring(1);
    stats.bomRemoved++;
    console.log('  ✓ BOM UTF-8 removido');
  }

  // ==========================================
  // FIX 2: Agregar defer a scripts
  // ==========================================

  const scriptPattern = /<script\s+src="([^"]+)"(?![\s\S]*?defer[\s\S]*?)(>|\s[^>]*>)/g;

  content = content.replace(scriptPattern, (match, src, ending) => {
    if (match.includes('defer') || match.includes('async')) {
      return match;
    }

    // Saltar scripts críticos
    if (src.includes('meta-updater') || src.includes('main.js') || src.includes('theme-manager')) {
      return match;
    }

    stats.deferAdded++;
    return `<script src="${src}" defer${ending}`;
  });

  if (stats.deferAdded > 0) {
    console.log(`  ✓ ${stats.deferAdded} scripts con defer agregado`);
  }

  // ==========================================
  // FIX 3: Conversión de inline handlers
  // ==========================================

  // onclick -> data-action
  const onclickCount = (content.match(/onclick="/g) || []).length;
  if (onclickCount > 0) {
    content = content.replace(/onclick="([^"]+)"/g, 'data-action="$1"');
    stats.inlineFixed += onclickCount;
    console.log(`  ✓ ${onclickCount} onclick handlers convertidos`);
  }

  // onchange -> data-change-handler
  const onchangeCount = (content.match(/onchange="/g) || []).length;
  if (onchangeCount > 0) {
    content = content.replace(/onchange="([^"]+)"/g, 'data-change-handler="$1"');
    stats.inlineFixed += onchangeCount;
    console.log(`  ✓ ${onchangeCount} onchange handlers convertidos`);
  }

  // onkeyup -> data-keyup-handler
  const onkeyupCount = (content.match(/onkeyup="/g) || []).length;
  if (onkeyupCount > 0) {
    content = content.replace(/onkeyup="([^"]+)"/g, 'data-keyup-handler="$1"');
    stats.inlineFixed += onkeyupCount;
    console.log(`  ✓ ${onkeyupCount} onkeyup handlers convertidos`);
  }

  // onmouseover/onmouseout -> remover (usar CSS hover)
  const hoverCount = (content.match(/\s+onmouseover="[^"]*"\s+onmouseout="[^"]*"/g) || []).length;
  if (hoverCount > 0) {
    content = content.replace(/\s+onmouseover="[^"]*"\s+onmouseout="[^"]*"/g, '');
    stats.inlineFixed += hoverCount;
    console.log(`  ✓ ${hoverCount} pares onmouseover/onmouseout removidos`);
  }

  // ==========================================
  // FIX 4: Arreglar encoding UTF-8 roto
  // ==========================================

  const brokenChars = {
    'âŒ': '✗',
    'ðŸ': '🏷',
    'Ã©': 'é',
    'Â¿': '¿',
    'Â¡': '¡',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ã ': 'à'
  };

  Object.entries(brokenChars).forEach(([broken, correct]) => {
    if (content.includes(broken)) {
      const count = (content.match(new RegExp(broken, 'g')) || []).length;
      content = content.replaceAll(broken, correct);
      stats.encodingFixed += count;
    }
  });

  if (stats.encodingFixed > 0) {
    console.log(`  ✓ ${stats.encodingFixed} caracteres encoding roto corregidos`);
  }

  // ==========================================
  // GUARDAR ARCHIVO
  // ==========================================

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  ✅ Archivo guardado exitosamente');
  } else {
    console.log('  ℹ️ Sin cambios necesarios');
  }

  // Actualizar totales
  totalStats.files++;
  totalStats.deferAdded += stats.deferAdded;
  totalStats.inlineHandlersFixed += stats.inlineFixed;
  totalStats.encodingFixed += stats.encodingFixed;
  totalStats.bomRemoved += stats.bomRemoved;
});

// ==========================================
// RESUMEN FINAL
// ==========================================

console.log('\n\n═════════════════════════════════════════════════════');
console.log('📊 RESUMEN FINAL DE REPARACIÓN MASIVA');
console.log('═════════════════════════════════════════════════════');
console.log(`Archivos procesados: ${totalStats.files}`);
console.log(`Scripts con defer agregados: ${totalStats.deferAdded}`);
console.log(`Inline handlers convertidos: ${totalStats.inlineHandlersFixed}`);
console.log(`Caracteres encoding roto corregidos: ${totalStats.encodingFixed}`);
console.log(`BOM removidos: ${totalStats.bomRemoved}`);
console.log('═════════════════════════════════════════════════════\n');

console.log('✨ [MASS FIX] Reparación masiva completada!');
console.log('\n🚀 Próximos pasos:');
console.log('  1. Ejecutar servidor: npm start (o nodemon)');
console.log('  2. Navegar a cada página auditada');
console.log('  3. Abrir DevTools (F12) y revisar consola');
console.log('  4. Verificar que NO hay errores/warnings críticos\n');

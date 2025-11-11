#!/usr/bin/env node

/**
 * Script: Agregar defer/async a scripts en admin-dashboard.html
 * ==============================================================
 * Objetivo: Agregar atributo 'defer' a todos los scripts externos
 * para mejorar performance y evitar bloqueo de renderizado
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../../public/admin-dashboard.html');
let content = fs.readFileSync(htmlPath, 'utf8');
let originalContent = content;
let stats = { replaced: 0, skipped: 0 };

console.log('⚡ [DEFER] Agregando defer/async a scripts en admin-dashboard.html...\n');

// ==========================================
// PASO 1: Agregar defer a scripts <script> tags
// ==========================================

// Patrón para scripts externos sin src al final
const scriptPattern = /<script\s+src="([^"]+)"(?![\s\S]*?defer[\s\S]*?)(>|\s[^>]*>)/g;

let matchCount = 0;
content = content.replace(scriptPattern, (match, src, ending) => {
  // Evitar agregar defer a:
  // 1. Scripts en el <head> que son críticos (meta-updater, framework-core, protección auth)
  // 2. Scripts que ya tienen defer o async

  if (match.includes('defer') || match.includes('async')) {
    stats.skipped++;
    return match;
  }

  const criticalScripts = [
    'bge-framework-core.js',
    'meta-updater.js'
  ];

  const isCritical = criticalScripts.some(script => src.includes(script));

  if (isCritical) {
    stats.skipped++;
    console.log(`  ⏭️ Saltando (crítico): ${src}`);
    return match;
  }

  matchCount++;
  stats.replaced++;

  // Reemplazar según si termina con > o tiene atributos
  const replacement = `<script src="${src}" defer${ending}`;
  console.log(`  ✓ Agregando defer: ${src}`);

  return replacement;
});

// ==========================================
// PASO 2: Casos especiales - scripts inline
// ==========================================

// Para scripts inline en el body, no agregar defer
// Ya que ya están siendo ejecutados en orden

// ==========================================
// PASO 3: Guardar archivo
// ==========================================

if (content !== originalContent) {
  fs.writeFileSync(htmlPath, content, 'utf8');
  console.log('\n✅ [DEFER] Archivo guardado exitosamente\n');
} else {
  console.warn('\n⚠️ [DEFER] No se realizaron cambios\n');
}

// ==========================================
// RESUMEN
// ==========================================

console.log('═════════════════════════════════════════════');
console.log('⚡ RESUMEN: ATRIBUTO DEFER AGREGADO');
console.log('═════════════════════════════════════════════');
console.log(`Scripts modificados: ${stats.replaced}`);
console.log(`Scripts saltados (ya tiene defer/async): ${stats.skipped}`);
console.log('═════════════════════════════════════════════\n');

console.log('✨ [DEFER] Optimización completada!');
console.log('📝 Beneficios:');
console.log('  • Scripts se cargan en paralelo con HTML');
console.log('  • Ejecutan después de que DOM esté listo');
console.log('  • Mejora velocidad percibida de carga (LCP)\n');

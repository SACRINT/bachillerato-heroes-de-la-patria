#!/usr/bin/env node
/**
 * SCRIPT DE INVENTARIO DE SCRIPTS FRONTEND
 * Fecha: 2025-11-09
 * Propósito: Analizar todos los archivos HTML y generar inventario de scripts JavaScript
 */

const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../../public');
const OUTPUT_FILE = path.join(__dirname, '../../docs/asset-inventory/active-frontend-scripts.md');

// Categorías de scripts
const CATEGORIES = {
  VENDOR: '📦 VENDOR',
  CORE: '🔧 CORE',
  UI: '🎨 UI',
  PAGES: '📊 PAGES',
  BUNDLES: '📦 BUNDLES',
  UNCLEAR: '❓ UNCLEAR'
};

// Patterns para categorización
const PATTERNS = {
  VENDOR: /^https?:\/\//,
  BUNDLES: /\.bundle\.js$/,
  CORE: /^js\/(main|context-manager|api-client|config|bge-framework-core|bge-security-module|theme-manager)\.js/,
  UI: /^js\/(form-|modal-|notification-|search-|chatbot|csp-|dark-mode)/,
  PAGES: /^js\/(admin-|student-|parent-|teacher-|egresados-|bolsa-|citas-|chatbot|calificaciones-|pagos-|padres-|estudiantes-|conocenos-|descargas-|index-|ar-vr-)/
};

function extractScripts(htmlFile) {
  const content = fs.readFileSync(htmlFile, 'utf-8');
  const scriptRegex = /<script\s+src=["']([^"']+)["']/g;
  const scripts = [];
  let match;

  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    // Ignorar scripts comentados
    const lineStart = content.lastIndexOf('\n', match.index);
    const lineEnd = content.indexOf('\n', match.index);
    const line = content.substring(lineStart, lineEnd);

    if (!line.trim().startsWith('<!--')) {
      scripts.push(src);
    }
  }

  return scripts;
}

function categorizeScript(scriptPath) {
  if (PATTERNS.VENDOR.test(scriptPath)) return CATEGORIES.VENDOR;
  if (PATTERNS.BUNDLES.test(scriptPath)) return CATEGORIES.BUNDLES;
  if (PATTERNS.CORE.test(scriptPath)) return CATEGORIES.CORE;
  if (PATTERNS.UI.test(scriptPath)) return CATEGORIES.UI;
  if (PATTERNS.PAGES.test(scriptPath)) return CATEGORIES.PAGES;
  return CATEGORIES.UNCLEAR;
}

function checkFileExists(scriptPath) {
  if (scriptPath.startsWith('http')) return 'CDN';

  // Remover query strings y paths absolutos
  const cleanPath = scriptPath.split('?')[0].replace(/^\//, '');
  const fullPath = path.join(PUBLIC_DIR, cleanPath);

  return fs.existsSync(fullPath) ? '✅ EXISTS' : '❌ NOT_FOUND';
}

function getFileSize(scriptPath) {
  if (scriptPath.startsWith('http')) return 'N/A';

  const cleanPath = scriptPath.split('?')[0].replace(/^\//, '');
  const fullPath = path.join(PUBLIC_DIR, cleanPath);

  try {
    const stats = fs.statSync(fullPath);
    const kb = (stats.size / 1024).toFixed(1);
    return `${kb} KB`;
  } catch {
    return 'N/A';
  }
}

function normalizeScriptPath(scriptPath) {
  // Remover query strings para deduplicación
  return scriptPath.split('?')[0];
}

async function analyzeScripts() {
  devLogger.log('🔍 Analizando archivos HTML en /public/...\n');

  const htmlFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));
  devLogger.log(`📄 Archivos HTML encontrados: ${htmlFiles.length}\n`);

  const allScripts = new Map(); // path -> {category, status, size, files[]}

  // Extraer scripts de cada HTML
  for (const htmlFile of htmlFiles) {
    const fullPath = path.join(PUBLIC_DIR, htmlFile);
    const scripts = extractScripts(fullPath);

    for (const script of scripts) {
      const normalized = normalizeScriptPath(script);

      if (!allScripts.has(normalized)) {
        allScripts.set(normalized, {
          original: script,
          category: categorizeScript(script),
          status: checkFileExists(script),
          size: getFileSize(script),
          files: []
        });
      }

      allScripts.get(normalized).files.push(htmlFile);
    }
  }

  devLogger.log(`✅ Scripts únicos encontrados: ${allScripts.size}\n`);

  // Generar reporte
  generateReport(htmlFiles, allScripts);
}

function generateReport(htmlFiles, scripts) {
  devLogger.log('📝 Generando reporte...\n');

  // Estadísticas por categoría
  const stats = {
    [CATEGORIES.VENDOR]: 0,
    [CATEGORIES.CORE]: 0,
    [CATEGORIES.UI]: 0,
    [CATEGORIES.PAGES]: 0,
    [CATEGORIES.BUNDLES]: 0,
    [CATEGORIES.UNCLEAR]: 0
  };

  let totalSize = 0;
  const problems = [];

  for (const [path, data] of scripts) {
    stats[data.category]++;

    if (data.status === '❌ NOT_FOUND') {
      problems.push({ path, issue: 'NOT_FOUND', files: data.files });
    }

    if (data.size !== 'N/A') {
      totalSize += parseFloat(data.size);
    }
  }

  // Generar Markdown
  let markdown = `# Inventario de Scripts JavaScript Activos

**Fecha de Generación:** ${new Date().toISOString().split('T')[0]}
**Total de Scripts Únicos:** ${scripts.size}
**Total de Archivos HTML Analizados:** ${htmlFiles.length}
**Tamaño Total Estimado:** ${totalSize.toFixed(1)} KB

---

## 📊 Resumen por Categoría

| Categoría | Cantidad | Porcentaje |
|-----------|----------|------------|
| ${CATEGORIES.VENDOR} | ${stats[CATEGORIES.VENDOR]} | ${((stats[CATEGORIES.VENDOR] / scripts.size) * 100).toFixed(1)}% |
| ${CATEGORIES.BUNDLES} | ${stats[CATEGORIES.BUNDLES]} | ${((stats[CATEGORIES.BUNDLES] / scripts.size) * 100).toFixed(1)}% |
| ${CATEGORIES.CORE} | ${stats[CATEGORIES.CORE]} | ${((stats[CATEGORIES.CORE] / scripts.size) * 100).toFixed(1)}% |
| ${CATEGORIES.UI} | ${stats[CATEGORIES.UI]} | ${((stats[CATEGORIES.UI] / scripts.size) * 100).toFixed(1)}% |
| ${CATEGORIES.PAGES} | ${stats[CATEGORIES.PAGES]} | ${((stats[CATEGORIES.PAGES] / scripts.size) * 100).toFixed(1)}% |
| ${CATEGORIES.UNCLEAR} | ${stats[CATEGORIES.UNCLEAR]} | ${((stats[CATEGORIES.UNCLEAR] / scripts.size) * 100).toFixed(1)}% |
| **TOTAL** | **${scripts.size}** | **100%** |

---

## 📦 Scripts por Categoría

`;

  // Generar secciones por categoría
  for (const category of Object.values(CATEGORIES)) {
    markdown += `### ${category}\n\n`;

    const categoryScripts = Array.from(scripts.entries())
      .filter(([_, data]) => data.category === category)
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [path, data] of categoryScripts) {
      markdown += `- \`${path}\` ${data.status}`;
      if (data.size !== 'N/A') {
        markdown += ` (${data.size})`;
      }
      markdown += `\n`;
    }

    markdown += `\n`;
  }

  // Problemas
  if (problems.length > 0) {
    markdown += `## 🚨 Problemas Encontrados\n\n`;
    markdown += `| Script | Estado | Usado en |\n`;
    markdown += `|--------|--------|----------|\n`;

    for (const problem of problems) {
      markdown += `| \`${problem.path}\` | ❌ NOT FOUND | ${problem.files.slice(0, 3).join(', ')}${problem.files.length > 3 ? '...' : ''} |\n`;
    }

    markdown += `\n`;
  }

  // Lista completa alfabética
  markdown += `## 📋 Lista Completa (Alfabética)\n\n`;

  const sortedScripts = Array.from(scripts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  let index = 1;
  for (const [path, data] of sortedScripts) {
    markdown += `${index}. \`${path}\` ${data.status}\n`;
    index++;
  }

  // Estadísticas finales
  markdown += `\n---\n\n## 📈 Estadísticas Detalladas\n\n`;
  markdown += `- Total de <script> tags procesados: ${Array.from(scripts.values()).reduce((sum, s) => sum + s.files.length, 0)}\n`;
  markdown += `- Scripts únicos: ${scripts.size}\n`;
  markdown += `- Scripts duplicados (con query strings): ${sortedScripts.filter(([p, d]) => p !== d.original).length}\n`;
  markdown += `- CDN externos: ${stats[CATEGORIES.VENDOR]}\n`;
  markdown += `- Scripts locales: ${scripts.size - stats[CATEGORIES.VENDOR]}\n`;
  markdown += `- Scripts con problemas: ${problems.length}\n`;
  markdown += `- Tamaño total (solo locales): ${totalSize.toFixed(1)} KB\n`;

  markdown += `\n---\n\n## ✅ Notas de Validación\n\n`;
  markdown += `- ✅ Verificado: Todos los scripts locales validados para existencia\n`;
  markdown += `- ✅ Categorizado: Cada script tiene una categoría asignada\n`;
  markdown += `- ✅ Deduplicado: Query strings removidos para análisis único\n`;
  markdown += `- ${problems.length === 0 ? '✅' : '⚠️'} Referencias: ${problems.length === 0 ? 'No hay referencias rotas' : `${problems.length} referencias con problemas`}\n`;

  // Escribir archivo
  fs.writeFileSync(OUTPUT_FILE, markdown);

  devLogger.log(`✅ Reporte generado: ${OUTPUT_FILE}`);
  devLogger.log(`\n📊 RESUMEN:`);
  devLogger.log(`   - Scripts únicos: ${scripts.size}`);
  devLogger.log(`   - Problemas: ${problems.length}`);
  devLogger.log(`   - Tamaño total: ${totalSize.toFixed(1)} KB\n`);
}

// Ejecutar
analyzeScripts().catch(console.error);

#!/usr/bin/env node
/**
 * STATIC PERFORMANCE ANALYZER - FASE 2 SEMANA 1
 * Analiza archivos HTML/JS/CSS sin necesidad de servidor corriendo
 * Genera métricas de performance baseline
 */

const fs = require('fs');
const path = require('path');

// Configuración
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const JS_DIR = path.join(PUBLIC_DIR, 'js');
const CSS_DIR = path.join(PUBLIC_DIR, 'css');
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'performance-reports');

// Asegurar que exista el directorio de salida
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔍 ANALIZADOR ESTÁTICO DE PERFORMANCE - FASE 2 SEMANA 1\n');

// ===== ANÁLISIS DE ARCHIVOS HTML =====
console.log('📄 Analizando archivos HTML...');
const htmlFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));
const htmlAnalysis = [];

for (const file of htmlFiles) {
    const filepath = path.join(PUBLIC_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');
    const stats = fs.statSync(filepath);

    // Contar scripts y CSS
    const scriptTags = (content.match(/<script/g) || []).length;
    const cssTags = (content.match(/<link.*stylesheet/g) || []).length;
    const inlineStyles = (content.match(/<style>/g) || []).length;
    const images = (content.match(/<img/g) || []).length;

    // Detectar frameworks/librerías
    const hasBootstrap = content.includes('bootstrap');
    const hasChartJS = content.includes('chart.js') || content.includes('chartjs');
    const hasjQuery = content.includes('jquery');

    htmlAnalysis.push({
        file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
        scriptTags,
        cssTags,
        inlineStyles,
        images,
        hasBootstrap,
        hasChartJS,
        hasjQuery
    });
}

// Ordenar por tamaño
htmlAnalysis.sort((a, b) => b.size - a.size);

console.log(`✓ Analizados ${htmlFiles.length} archivos HTML\n`);

// ===== ANÁLISIS DE ARCHIVOS JAVASCRIPT =====
console.log('📜 Analizando archivos JavaScript...');
let jsFiles = [];
if (fs.existsSync(JS_DIR)) {
    jsFiles = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));
}

const jsAnalysis = [];
let totalJSSize = 0;

for (const file of jsFiles) {
    const filepath = path.join(JS_DIR, file);
    const stats = fs.statSync(filepath);
    const content = fs.readFileSync(filepath, 'utf8');

    totalJSSize += stats.size;

    jsAnalysis.push({
        file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
        lines: content.split('\n').length
    });
}

jsAnalysis.sort((a, b) => b.size - a.size);

console.log(`✓ Analizados ${jsFiles.length} archivos JS (${(totalJSSize / 1024).toFixed(2)} KB total)\n`);

// ===== ANÁLISIS DE ARCHIVOS CSS =====
console.log('🎨 Analizando archivos CSS...');
let cssFiles = [];
if (fs.existsSync(CSS_DIR)) {
    cssFiles = fs.readdirSync(CSS_DIR).filter(f => f.endsWith('.css'));
}

const cssAnalysis = [];
let totalCSSSize = 0;

for (const file of cssFiles) {
    const filepath = path.join(CSS_DIR, file);
    const stats = fs.statSync(filepath);

    totalCSSSize += stats.size;

    cssAnalysis.push({
        file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2)
    });
}

cssAnalysis.sort((a, b) => b.size - a.size);

console.log(`✓ Analizados ${cssFiles.length} archivos CSS (${(totalCSSSize / 1024).toFixed(2)} KB total)\n`);

// ===== MÉTRICAS GENERALES =====
const metrics = {
    timestamp: new Date().toISOString(),
    html: {
        totalFiles: htmlFiles.length,
        totalSize: htmlAnalysis.reduce((sum, f) => sum + f.size, 0),
        averageScripts: (htmlAnalysis.reduce((sum, f) => sum + f.scriptTags, 0) / htmlFiles.length).toFixed(1),
        averageCSS: (htmlAnalysis.reduce((sum, f) => sum + f.cssTags, 0) / htmlFiles.length).toFixed(1),
        averageImages: (htmlAnalysis.reduce((sum, f) => sum + f.images, 0) / htmlFiles.length).toFixed(1)
    },
    js: {
        totalFiles: jsFiles.length,
        totalSize: totalJSSize,
        totalSizeKB: (totalJSSize / 1024).toFixed(2),
        averageSize: jsFiles.length > 0 ? (totalJSSize / jsFiles.length / 1024).toFixed(2) : 0
    },
    css: {
        totalFiles: cssFiles.length,
        totalSize: totalCSSSize,
        totalSizeKB: (totalCSSSize / 1024).toFixed(2),
        averageSize: cssFiles.length > 0 ? (totalCSSSize / cssFiles.length / 1024).toFixed(2) : 0
    },
    top10LargestHTML: htmlAnalysis.slice(0, 10),
    top10LargestJS: jsAnalysis.slice(0, 10),
    top10LargestCSS: cssAnalysis.slice(0, 10)
};

// ===== IDENTIFICAR PROBLEMAS =====
const problems = [];

// Problema 1: Archivos HTML muy grandes
const largeHTMLFiles = htmlAnalysis.filter(f => f.size > 100000); // >100KB
if (largeHTMLFiles.length > 0) {
    problems.push({
        severity: 'HIGH',
        category: 'HTML Size',
        description: `${largeHTMLFiles.length} archivos HTML mayores a 100KB`,
        impact: 'Tiempo de carga inicial lento',
        files: largeHTMLFiles.map(f => f.file)
    });
}

// Problema 2: Muchos scripts por página
const manyScripts = htmlAnalysis.filter(f => f.scriptTags > 20);
if (manyScripts.length > 0) {
    problems.push({
        severity: 'MEDIUM',
        category: 'Script Count',
        description: `${manyScripts.length} páginas con más de 20 scripts`,
        impact: 'Múltiples round-trips HTTP, bloqueo de rendering',
        files: manyScripts.map(f => `${f.file} (${f.scriptTags} scripts)`)
    });
}

// Problema 3: Archivos JS muy grandes
const largeJSFiles = jsAnalysis.filter(f => f.size > 50000); // >50KB
if (largeJSFiles.length > 0) {
    problems.push({
        severity: 'HIGH',
        category: 'JS Bundle Size',
        description: `${largeJSFiles.length} archivos JS mayores a 50KB`,
        impact: 'Parse time alto, impacta TBT y TTI',
        files: largeJSFiles.map(f => `${f.file} (${f.sizeKB} KB)`)
    });
}

// Problema 4: Total JS size muy grande
if (totalJSSize > 500000) { // >500KB
    problems.push({
        severity: 'CRITICAL',
        category: 'Total JS Size',
        description: `Total JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`,
        impact: 'Bandwidth alto, especialmente en mobile',
        recommendation: 'Implementar code splitting y lazy loading'
    });
}

// Problema 5: Inline styles
const inlineStylePages = htmlAnalysis.filter(f => f.inlineStyles > 0);
if (inlineStylePages.length > 0) {
    problems.push({
        severity: 'LOW',
        category: 'Inline Styles',
        description: `${inlineStylePages.length} páginas con estilos inline`,
        impact: 'No cacheable, aumenta HTML size',
        recommendation: 'Mover a archivos CSS externos'
    });
}

metrics.problems = problems;

// ===== GUARDAR REPORTE =====
const reportPath = path.join(OUTPUT_DIR, 'static-analysis-report.json');
fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));

console.log('📊 MÉTRICAS GENERALES:');
console.log(`   HTML: ${htmlFiles.length} archivos, ${(metrics.html.totalSize / 1024).toFixed(2)} KB`);
console.log(`   JS: ${jsFiles.length} archivos, ${metrics.js.totalSizeKB} KB`);
console.log(`   CSS: ${cssFiles.length} archivos, ${metrics.css.totalSizeKB} KB\n`);

console.log('🚨 PROBLEMAS IDENTIFICADOS:');
problems.forEach((p, i) => {
    console.log(`   ${i + 1}. [${p.severity}] ${p.category}`);
    console.log(`      ${p.description}`);
    console.log(`      Impacto: ${p.impact}\n`);
});

console.log(`✓ Reporte guardado en: ${reportPath}\n`);
console.log('✅ ANÁLISIS COMPLETADO');

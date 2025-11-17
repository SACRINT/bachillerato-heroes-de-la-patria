#!/usr/bin/env node
/**
 * 📊 PERFORMANCE BASELINE ANALYSIS
 *
 * Analiza el estado actual de performance del frontend para establecer
 * una línea base antes de aplicar optimizaciones.
 *
 * Métricas Core Web Vitals:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 800ms
 *
 * Semana 3 - Tarea 1: Performance Baseline
 * Fecha: 17 Noviembre 2025
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    publicDir: path.join(__dirname, '../../public'),
    pagesDir: path.join(__dirname, '../../public'),
    jsDir: path.join(__dirname, '../../public/js'),
    cssDir: path.join(__dirname, '../../public/css'),

    // Umbrales de performance (Core Web Vitals)
    thresholds: {
        lcp: { good: 2500, needsImprovement: 4000 }, // ms
        fid: { good: 100, needsImprovement: 300 }, // ms
        cls: { good: 0.1, needsImprovement: 0.25 }, // score
        fcp: { good: 1800, needsImprovement: 3000 }, // ms
        ttfb: { good: 800, needsImprovement: 1800 }, // ms

        // Tamaños de archivos
        jsSize: { good: 50, needsImprovement: 150 }, // KB
        cssSize: { good: 30, needsImprovement: 100 }, // KB
        imageSize: { good: 100, needsImprovement: 300 }, // KB

        // Cantidad de requests
        requests: { good: 30, needsImprovement: 50 },

        // Tiempo de carga total
        loadTime: { good: 3000, needsImprovement: 5000 } // ms
    }
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtener tamaño de archivo en KB
 */
async function getFileSize(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return (stats.size / 1024).toFixed(2); // KB
    } catch (error) {
        return 0;
    }
}

/**
 * Listar archivos recursivamente
 */
async function listFilesRecursive(dir, ext = '') {
    const files = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    files.push(...await listFilesRecursive(fullPath, ext));
                }
            } else if (entry.isFile()) {
                if (!ext || path.extname(entry.name) === ext) {
                    files.push(fullPath);
                }
            }
        }
    } catch (error) {
        // Directorio no existe
    }

    return files;
}

/**
 * Analizar archivo JavaScript para problemas de performance
 */
async function analyzeJSFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues = [];

    // Detectar problemas comunes
    if (content.includes('document.write(')) {
        issues.push('Uso de document.write() (blocking)');
    }

    if (content.includes('setTimeout') || content.includes('setInterval')) {
        const count = (content.match(/setTimeout|setInterval/g) || []).length;
        if (count > 10) {
            issues.push(`Muchos timers (${count}) - posible memory leak`);
        }
    }

    if (content.includes('innerHTML') && !content.includes('DOMPurify')) {
        const count = (content.match(/\.innerHTML\s*=/g) || []).length;
        issues.push(`${count} innerHTML sin DOMPurify (performance + security)`);
    }

    if (content.includes('querySelectorAll')) {
        const count = (content.match(/querySelectorAll/g) || []).length;
        if (count > 20) {
            issues.push(`Muchas querySelectorAll (${count}) - consider caching`);
        }
    }

    // Detectar scripts grandes (>100KB)
    const size = await getFileSize(filePath);
    if (size > 100) {
        issues.push(`Archivo muy grande (${size}KB) - considerar code splitting`);
    }

    return {
        size: parseFloat(size),
        lines: content.split('\n').length,
        issues
    };
}

/**
 * Analizar archivo CSS
 */
async function analyzeCSSFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues = [];

    // Detectar selectores complejos
    const complexSelectors = (content.match(/(\s+>\s+|\s+\+\s+|\s+~\s+)/g) || []).length;
    if (complexSelectors > 50) {
        issues.push(`Muchos selectores complejos (${complexSelectors})`);
    }

    // Detectar !important
    const importantCount = (content.match(/!important/g) || []).length;
    if (importantCount > 20) {
        issues.push(`Muchos !important (${importantCount}) - specificity issues`);
    }

    // Detectar duplicación de reglas
    const rules = content.match(/\{[^}]+\}/g) || [];
    const uniqueRules = new Set(rules);
    if (rules.length - uniqueRules.size > 50) {
        issues.push(`Duplicación de reglas CSS (~${rules.length - uniqueRules.size})`);
    }

    const size = await getFileSize(filePath);
    if (size > 100) {
        issues.push(`Archivo CSS grande (${size}KB) - considerar splitting`);
    }

    return {
        size: parseFloat(size),
        lines: content.split('\n').length,
        rules: rules.length,
        issues
    };
}

/**
 * Analizar páginas HTML
 */
async function analyzeHTMLPages() {
    const htmlFiles = await listFilesRecursive(CONFIG.pagesDir, '.html');
    const pagesAnalysis = [];

    for (const filePath of htmlFiles) {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(CONFIG.publicDir, filePath);

        // Contar scripts y CSS
        const scriptTags = (content.match(/<script[^>]*src=/gi) || []).length;
        const linkTags = (content.match(/<link[^>]*rel="stylesheet"/gi) || []).length;
        const inlineScripts = (content.match(/<script(?![^>]*src=)[^>]*>/gi) || []).length;
        const inlineStyles = (content.match(/<style/gi) || []).length;

        // Detectar imágenes sin lazy loading
        const imgTags = (content.match(/<img[^>]*>/gi) || []);
        const imgWithoutLazy = imgTags.filter(img => !img.includes('loading="lazy"')).length;

        // Detectar async/defer en scripts
        const scriptsWithoutAsync = (content.match(/<script[^>]*src=(?![^>]*(async|defer))/gi) || []).length;

        pagesAnalysis.push({
            file: relativePath,
            scripts: scriptTags,
            css: linkTags,
            inlineScripts,
            inlineStyles,
            imagesWithoutLazy: imgWithoutLazy,
            scriptsWithoutAsync
        });
    }

    return pagesAnalysis;
}

// ============================================
// ANÁLISIS PRINCIPAL
// ============================================

async function main() {
    console.log('📊 INICIANDO ANÁLISIS DE PERFORMANCE BASELINE\n');

    const results = {
        timestamp: new Date().toISOString(),
        summary: {
            totalJSFiles: 0,
            totalCSSFiles: 0,
            totalHTMLPages: 0,
            totalJSSize: 0,
            totalCSSSize: 0,
            averageJSSize: 0,
            averageCSSSize: 0,
            totalIssues: 0
        },
        jsAnalysis: [],
        cssAnalysis: [],
        pagesAnalysis: [],
        topIssues: [],
        recommendations: []
    };

    // ============================================
    // ANÁLISIS DE ARCHIVOS JAVASCRIPT
    // ============================================

    console.log('📄 Analizando archivos JavaScript...\n');
    const jsFiles = await listFilesRecursive(CONFIG.jsDir, '.js');
    results.summary.totalJSFiles = jsFiles.length;

    for (const filePath of jsFiles) {
        const analysis = await analyzeJSFile(filePath);
        const relativePath = path.relative(CONFIG.publicDir, filePath);

        results.jsAnalysis.push({
            file: relativePath,
            ...analysis
        });

        results.summary.totalJSSize += analysis.size;
        results.summary.totalIssues += analysis.issues.length;

        if (analysis.issues.length > 0) {
            console.log(`⚠️  ${relativePath}`);
            analysis.issues.forEach(issue => console.log(`   - ${issue}`));
        }
    }

    results.summary.averageJSSize = (results.summary.totalJSSize / jsFiles.length).toFixed(2);

    // ============================================
    // ANÁLISIS DE ARCHIVOS CSS
    // ============================================

    console.log('\n🎨 Analizando archivos CSS...\n');
    const cssFiles = await listFilesRecursive(CONFIG.cssDir, '.css');
    results.summary.totalCSSFiles = cssFiles.length;

    for (const filePath of cssFiles) {
        const analysis = await analyzeCSSFile(filePath);
        const relativePath = path.relative(CONFIG.publicDir, filePath);

        results.cssAnalysis.push({
            file: relativePath,
            ...analysis
        });

        results.summary.totalCSSSize += analysis.size;
        results.summary.totalIssues += analysis.issues.length;

        if (analysis.issues.length > 0) {
            console.log(`⚠️  ${relativePath}`);
            analysis.issues.forEach(issue => console.log(`   - ${issue}`));
        }
    }

    results.summary.averageCSSSize = (results.summary.totalCSSSize / cssFiles.length).toFixed(2);

    // ============================================
    // ANÁLISIS DE PÁGINAS HTML
    // ============================================

    console.log('\n📱 Analizando páginas HTML...\n');
    results.pagesAnalysis = await analyzeHTMLPages();
    results.summary.totalHTMLPages = results.pagesAnalysis.length;

    for (const page of results.pagesAnalysis) {
        const issues = [];

        if (page.scriptsWithoutAsync > 0) {
            issues.push(`${page.scriptsWithoutAsync} scripts sin async/defer`);
        }

        if (page.inlineScripts > 0) {
            issues.push(`${page.inlineScripts} scripts inline (CSP issue)`);
        }

        if (page.imagesWithoutLazy > 5) {
            issues.push(`${page.imagesWithoutLazy} imágenes sin lazy loading`);
        }

        if (issues.length > 0) {
            console.log(`📄 ${page.file}`);
            console.log(`   Scripts: ${page.scripts}, CSS: ${page.css}`);
            issues.forEach(issue => console.log(`   - ${issue}`));
        }
    }

    // ============================================
    // TOP ISSUES
    // ============================================

    console.log('\n🔝 TOP 10 ARCHIVOS MÁS GRANDES:\n');

    const allFiles = [
        ...results.jsAnalysis.map(f => ({ ...f, type: 'JS' })),
        ...results.cssAnalysis.map(f => ({ ...f, type: 'CSS' }))
    ].sort((a, b) => b.size - a.size).slice(0, 10);

    for (const file of allFiles) {
        console.log(`${file.type.padEnd(4)} ${file.size.toString().padStart(8)}KB - ${file.file}`);
        results.topIssues.push(file);
    }

    // ============================================
    // RECOMENDACIONES
    // ============================================

    console.log('\n💡 RECOMENDACIONES:\n');

    if (results.summary.totalJSSize > 1000) {
        const rec = `Total JS size es ${results.summary.totalJSSize.toFixed(0)}KB - Implementar code splitting`;
        console.log(`📦 ${rec}`);
        results.recommendations.push(rec);
    }

    if (results.summary.averageJSSize > 50) {
        const rec = `Tamaño promedio JS es ${results.summary.averageJSSize}KB - Considerar minificación y tree shaking`;
        console.log(`🌳 ${rec}`);
        results.recommendations.push(rec);
    }

    const pagesWithManyScripts = results.pagesAnalysis.filter(p => p.scripts > 20);
    if (pagesWithManyScripts.length > 0) {
        const rec = `${pagesWithManyScripts.length} páginas con más de 20 scripts - Bundle consolidation`;
        console.log(`📚 ${rec}`);
        results.recommendations.push(rec);
    }

    const totalImagesWithoutLazy = results.pagesAnalysis.reduce((sum, p) => sum + p.imagesWithoutLazy, 0);
    if (totalImagesWithoutLazy > 50) {
        const rec = `${totalImagesWithoutLazy} imágenes sin lazy loading - Implementar loading="lazy"`;
        console.log(`🖼️  ${rec}`);
        results.recommendations.push(rec);
    }

    // ============================================
    // GUARDAR REPORTE
    // ============================================

    console.log('\n📝 Guardando reporte...\n');

    const reportPath = path.join(__dirname, '../../docs/PERFORMANCE_BASELINE_REPORT.md');
    const reportContent = generateMarkdownReport(results);
    await fs.writeFile(reportPath, reportContent, 'utf-8');

    console.log(`✅ Reporte guardado: ${reportPath}\n`);

    // Resumen final
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📄 JavaScript:  ${results.summary.totalJSFiles} archivos, ${results.summary.totalJSSize.toFixed(0)}KB total`);
    console.log(`🎨 CSS:         ${results.summary.totalCSSFiles} archivos, ${results.summary.totalCSSSize.toFixed(0)}KB total`);
    console.log(`📱 HTML:        ${results.summary.totalHTMLPages} páginas`);
    console.log(`⚠️  Issues:     ${results.summary.totalIssues} detectados`);
    console.log(`💡 Recomendaciones: ${results.recommendations.length}\n`);
}

/**
 * Generar reporte en Markdown
 */
function generateMarkdownReport(results) {
    let md = `# 📊 PERFORMANCE BASELINE REPORT\n\n`;
    md += `**Fecha:** ${new Date(results.timestamp).toLocaleString('es-MX')}\n`;
    md += `**Script:** backend/scripts/performance-baseline-analysis.mjs\n\n`;
    md += `---\n\n`;

    md += `## 📊 RESUMEN\n\n`;
    md += `| Métrica | Valor |\n`;
    md += `|---------|-------|\n`;
    md += `| Archivos JavaScript | ${results.summary.totalJSFiles} |\n`;
    md += `| Archivos CSS | ${results.summary.totalCSSFiles} |\n`;
    md += `| Páginas HTML | ${results.summary.totalHTMLPages} |\n`;
    md += `| Tamaño total JS | ${results.summary.totalJSSize.toFixed(0)} KB |\n`;
    md += `| Tamaño total CSS | ${results.summary.totalCSSSize.toFixed(0)} KB |\n`;
    md += `| Tamaño promedio JS | ${results.summary.averageJSSize} KB |\n`;
    md += `| Tamaño promedio CSS | ${results.summary.averageCSSSize} KB |\n`;
    md += `| Issues detectados | ${results.summary.totalIssues} |\n\n`;

    md += `---\n\n`;
    md += `## 🔝 TOP 10 ARCHIVOS MÁS GRANDES\n\n`;
    md += `| Tipo | Tamaño (KB) | Archivo |\n`;
    md += `|------|-------------|----------|\n`;
    for (const file of results.topIssues) {
        md += `| ${file.type} | ${file.size} | ${file.file} |\n`;
    }
    md += `\n`;

    md += `---\n\n`;
    md += `## 💡 RECOMENDACIONES (${results.recommendations.length})\n\n`;
    for (let i = 0; i < results.recommendations.length; i++) {
        md += `${i + 1}. ${results.recommendations[i]}\n`;
    }
    md += `\n`;

    md += `---\n\n`;
    md += `## ✅ PRÓXIMOS PASOS\n\n`;
    md += `1. **Code Splitting**: Dividir bundles grandes en chunks más pequeños\n`;
    md += `2. **Tree Shaking**: Eliminar código no utilizado de bundles\n`;
    md += `3. **Lazy Loading**: Implementar loading="lazy" en imágenes\n`;
    md += `4. **Async/Defer**: Agregar async/defer a todos los scripts\n`;
    md += `5. **CSS Optimization**: PurgeCSS para eliminar CSS no usado\n`;
    md += `6. **Image Optimization**: Convertir a WebP, implementar srcset\n`;
    md += `7. **Bundle Consolidation**: Reducir cantidad de requests HTTP\n\n`;

    md += `---\n\n`;
    md += `**Estado:** SEMANA 3 - TAREA 1 COMPLETADA ✅\n`;

    return md;
}

// Ejecutar
main().catch(console.error);

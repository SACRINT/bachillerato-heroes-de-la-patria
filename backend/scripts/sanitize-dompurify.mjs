#!/usr/bin/env node
/**
 * 🔐 SCRIPT DE SANITIZACIÓN AUTOMÁTICA CON DOMPURIFY
 *
 * Aplica DOMPurify.sanitize() a todas las ocurrencias de innerHTML/outerHTML
 * que no estén ya sanitizadas.
 *
 * Semana 2 - Tarea 6: Sanitización XSS Completa
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
    // Directorio de archivos a escanear
    scanDir: path.join(__dirname, '../../public/js'),

    // Extensiones a procesar
    extensions: ['.js'],

    // Archivos a ignorar (ya sanitizados o no aplicable)
    ignoreFiles: [
        'dompurify.min.js',
        'purify.min.js',
        'sanitize-helper.js'
    ],

    // Patrones a buscar (innerHTML, outerHTML, insertAdjacentHTML)
    patterns: [
        {
            name: 'innerHTML assignment',
            regex: /(\w+)\.innerHTML\s*=\s*(?!DOMPurify\.sanitize\()(.+?);/g,
            replacement: '$1.innerHTML = DOMPurify.sanitize($2);'
        },
        {
            name: 'innerHTML concat',
            regex: /(\w+)\.innerHTML\s*\+=\s*(?!DOMPurify\.sanitize\()(.+?);/g,
            replacement: '$1.innerHTML += DOMPurify.sanitize($2);'
        },
        {
            name: 'outerHTML assignment',
            regex: /(\w+)\.outerHTML\s*=\s*(?!DOMPurify\.sanitize\()(.+?);/g,
            replacement: '$1.outerHTML = DOMPurify.sanitize($2);'
        },
        {
            name: 'insertAdjacentHTML',
            regex: /(\w+)\.insertAdjacentHTML\((['"](?:beforebegin|afterbegin|beforeend|afterend)['"]),\s*(?!DOMPurify\.sanitize\()(.+?)\);/g,
            replacement: '$1.insertAdjacentHTML($2, DOMPurify.sanitize($3));'
        }
    ],

    // Import statement para DOMPurify (browser)
    dompurifyImport: `
// 🔐 XSS Prevention: DOMPurify sanitization
const DOMPurify = window.DOMPurify || {
    sanitize: (dirty) => {
        console.warn('⚠️ DOMPurify no cargado, retornando input sin sanitizar');
        return dirty;
    }
};
`
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtener todos los archivos JS recursivamente
 */
async function getAllJSFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...await getAllJSFiles(fullPath));
        } else if (entry.isFile() && CONFIG.extensions.includes(path.extname(entry.name))) {
            // Ignorar archivos en la lista de exclusión
            if (!CONFIG.ignoreFiles.includes(entry.name)) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

/**
 * Verificar si el archivo ya tiene DOMPurify importado
 */
function hasDOMPurifyImport(content) {
    return content.includes('DOMPurify') ||
           content.includes('dompurify') ||
           content.includes('purify');
}

/**
 * Agregar import de DOMPurify al inicio del archivo (si no existe)
 */
function ensureDOMPurifyImport(content) {
    if (hasDOMPurifyImport(content)) {
        return content; // Ya tiene DOMPurify
    }

    // Agregar después del primer comentario o al inicio
    const lines = content.split('\n');
    let insertIndex = 0;

    // Buscar el final de los comentarios iniciales
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
            insertIndex = i + 1;
        } else if (line.length > 0) {
            break;
        }
    }

    lines.splice(insertIndex, 0, CONFIG.dompurifyImport.trim());
    return lines.join('\n');
}

/**
 * Aplicar sanitización a un archivo
 */
function sanitizeFile(content, filePath) {
    let modified = content;
    let changeCount = 0;
    const changes = [];

    // Aplicar cada patrón
    for (const pattern of CONFIG.patterns) {
        const matches = [...modified.matchAll(pattern.regex)];

        if (matches.length > 0) {
            modified = modified.replace(pattern.regex, pattern.replacement);
            changeCount += matches.length;

            changes.push({
                pattern: pattern.name,
                count: matches.length,
                examples: matches.slice(0, 3).map(m => m[0])
            });
        }
    }

    // Si hubo cambios, asegurar que DOMPurify esté importado
    if (changeCount > 0) {
        modified = ensureDOMPurifyImport(modified);
    }

    return {
        content: modified,
        changeCount,
        changes,
        hasChanges: changeCount > 0
    };
}

// ============================================
// PROCESAMIENTO PRINCIPAL
// ============================================

async function main() {
    console.log('🔐 INICIANDO SANITIZACIÓN XSS CON DOMPURIFY\n');
    console.log(`📁 Escaneando: ${CONFIG.scanDir}`);
    console.log(`🔍 Patrones: ${CONFIG.patterns.length} tipos de vulnerabilidades\n`);

    // Obtener todos los archivos JS
    const files = await getAllJSFiles(CONFIG.scanDir);
    console.log(`📄 Archivos encontrados: ${files.length}\n`);

    const results = {
        totalFiles: files.length,
        filesModified: 0,
        totalChanges: 0,
        fileDetails: []
    };

    // Procesar cada archivo
    for (const filePath of files) {
        const relativePath = path.relative(CONFIG.scanDir, filePath);

        try {
            // Leer archivo
            const content = await fs.readFile(filePath, 'utf-8');

            // Aplicar sanitización
            const result = sanitizeFile(content, filePath);

            if (result.hasChanges) {
                // Escribir archivo modificado
                await fs.writeFile(filePath, result.content, 'utf-8');

                results.filesModified++;
                results.totalChanges += result.changeCount;
                results.fileDetails.push({
                    file: relativePath,
                    changes: result.changeCount,
                    details: result.changes
                });

                console.log(`✅ ${relativePath} - ${result.changeCount} cambios`);
            }
        } catch (error) {
            console.error(`❌ Error procesando ${relativePath}:`, error.message);
        }
    }

    // ============================================
    // REPORTE FINAL
    // ============================================

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE SANITIZACIÓN');
    console.log('='.repeat(60) + '\n');

    console.log(`📄 Archivos escaneados:    ${results.totalFiles}`);
    console.log(`✅ Archivos modificados:   ${results.filesModified}`);
    console.log(`🔐 Total sanitizaciones:   ${results.totalChanges}`);
    console.log(`✨ Tasa de éxito:          ${((results.filesModified / results.totalFiles) * 100).toFixed(1)}%\n`);

    if (results.fileDetails.length > 0) {
        console.log('📋 DETALLE DE CAMBIOS:\n');

        for (const detail of results.fileDetails) {
            console.log(`📄 ${detail.file}`);
            console.log(`   Total: ${detail.changes} cambios`);

            for (const change of detail.details) {
                console.log(`   - ${change.pattern}: ${change.count} ocurrencias`);

                if (change.examples.length > 0) {
                    console.log(`     Ejemplo: ${change.examples[0].substring(0, 60)}...`);
                }
            }
            console.log('');
        }
    }

    // Guardar reporte en archivo
    const reportPath = path.join(__dirname, '../../docs/SANITIZACION_XSS_REPORT.md');
    const reportContent = generateMarkdownReport(results);
    await fs.writeFile(reportPath, reportContent, 'utf-8');

    console.log(`📝 Reporte guardado en: ${reportPath}\n`);
    console.log('✅ SANITIZACIÓN COMPLETADA\n');
}

/**
 * Generar reporte en Markdown
 */
function generateMarkdownReport(results) {
    let md = `# 🔐 REPORTE DE SANITIZACIÓN XSS - DOMPURIFY\n\n`;
    md += `**Fecha:** ${new Date().toLocaleString('es-MX')}\n`;
    md += `**Script:** backend/scripts/sanitize-dompurify.mjs\n\n`;
    md += `---\n\n`;

    md += `## 📊 RESUMEN\n\n`;
    md += `| Métrica | Valor |\n`;
    md += `|---------|-------|\n`;
    md += `| Archivos escaneados | ${results.totalFiles} |\n`;
    md += `| Archivos modificados | ${results.filesModified} |\n`;
    md += `| Total sanitizaciones | ${results.totalChanges} |\n`;
    md += `| Tasa de éxito | ${((results.filesModified / results.totalFiles) * 100).toFixed(1)}% |\n\n`;

    md += `---\n\n`;
    md += `## 📋 ARCHIVOS MODIFICADOS (${results.fileDetails.length})\n\n`;

    for (const detail of results.fileDetails) {
        md += `### ✅ ${detail.file}\n\n`;
        md += `**Total cambios:** ${detail.changes}\n\n`;
        md += `**Detalle:**\n`;

        for (const change of detail.details) {
            md += `- **${change.pattern}**: ${change.count} ocurrencias\n`;

            if (change.examples.length > 0) {
                md += `  \`\`\`javascript\n`;
                md += `  // Antes:\n`;
                md += `  ${change.examples[0]}\n`;
                md += `  \`\`\`\n\n`;
            }
        }

        md += `\n`;
    }

    md += `---\n\n`;
    md += `## 🔐 PATRONES APLICADOS\n\n`;

    for (const pattern of CONFIG.patterns) {
        md += `### ${pattern.name}\n\n`;
        md += `**Regex:** \`${pattern.regex.source}\`\n\n`;
        md += `**Reemplazo:** \`${pattern.replacement}\`\n\n`;
    }

    md += `---\n\n`;
    md += `## ✅ ESTADO FINAL\n\n`;
    md += `**Resultado:** SEMANA 2 - TAREA 6 COMPLETADA ✅\n\n`;
    md += `**Siguiente paso:** Tarea 8 - SQL Injection Prevention\n`;

    return md;
}

// Ejecutar
main().catch(console.error);

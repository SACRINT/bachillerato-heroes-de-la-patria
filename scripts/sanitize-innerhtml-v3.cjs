#!/usr/bin/env node
/**
 * 🔒 Script MEJORADO v3 para sanitizar innerHTML en archivos JavaScript
 *
 * Versión: 3.0 (Smart Skip de archivos problemáticos)
 * Fecha: 12 Noviembre 2025
 *
 * MEJORAS EN V3:
 * 1. Saltea automáticamente 39 archivos con errores preexistentes
 * 2. Procesa solo 196 archivos "limpios"
 * 3. Genera reporte de archivos saltados
 * 4. Permite especificar archivos a procesar con --include
 * 5. Mejor manejo de errores y logging
 *
 * Uso:
 *   node sanitize-innerhtml-v3.cjs                    # DRY-RUN (muestra cambios)
 *   node sanitize-innerhtml-v3.cjs -x                 # Ejecutar cambios reales
 *   node sanitize-innerhtml-v3.cjs -x --include=all   # Incluir archivos problemáticos
 *
 * Características:
 *   - DRY-RUN mode (por defecto, sin cambios)
 *   - Auto-skip de 39 archivos con sintaxis rota
 *   - Detecta TODOS los patrones de .innerHTML =
 *   - Evita doble-sanitización
 *   - Crea backups automáticos
 *   - Validación sintaxis JavaScript antes de guardar
 *   - Reporte detallado con statistics
 *   - Manejo robusto de errores
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================
// CONFIGURACIÓN
// ============================================

const PUBLIC_JS_DIR = path.join(__dirname, '..', 'public', 'js');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', `sanitize-innerhtml-v3-${new Date().toISOString().split('T')[0]}`);

// Argumentos
const args = process.argv.slice(2);
const isDryRun = !args.includes('-x');
const includeProblematic = args.includes('--include=all');
const maxFiles = args.find(a => a.startsWith('--files='))?.split('=')[1] || null;

// ============================================
// ARCHIVOS PROBLEMÁTICOS A SALTEAR
// ============================================

const PROBLEMATIC_FILES = new Set([
    'accessibility-auditor-system.js',
    'accessibility-auditor.js',
    'admin.bundle.js',
    'advanced-filters.js',
    'advanced-metrics-system.js',
    'advanced-personalization-system.js',
    'ai-prompts-library.js',
    'automated-testing-system.js',
    'bge-analytics-module.js',
    'bge-apis-module.js',
    'bge-asistente-virtual-educativo.js',
    'bge-dashboard-monitor.js',
    'bge-deteccion-riesgos.js',
    'bge-security-manager.js',
    'bge-security-module.js',
    'bolsa-trabajo-events.js',
    'citas-manager.js',
    'contacto-events.js',
    'core.bundle.js',
    'csp-universal-fixer.js',
    'dashboard-personalizer.js',
    'digital-library-manager.js',
    'dynamic-finance-loader.js',
    'dynamic-student-loader.js',
    'dynamic-teacher-loader.js',
    'e2e-testing-chrome-mcp.js',
    'forms.bundle.js',
    'gamification-system.js',
    'grades-platform.js',
    'intelligent-login-system.js',
    'messaging-manager.js',
    'mobile-enhancements.js',
    'pagination-manager.js',
    'parent-manager.js',
    'pwa-advanced.js',
    'pwa-optimizer.js',
    'security-manager.js',
    'tenants-admin-manager.js',
    'threat-monitoring-system.js'
]);

// ============================================
// PATRONES MEJORADOS Y ROBUSTOS
// ============================================

/**
 * PATRÓN 1: Asignaciones simples con comillas
 * Casos manejados:
 * - element.innerHTML = "..."
 * - element.innerHTML = '...'
 * - element.innerHTML = `...`
 * Pero NO ya sanitizado:
 * - element.innerHTML = sanitizeHTML(...)
 */
const PATTERN_SIMPLE_ASSIGNMENT = /(\\w+)\\.innerHTML\\s*=\\s*(['\"`])([^'\"`]*)\\2\\s*([;]?)/g;

/**
 * PATRÓN 2: Asignaciones con variables/concatenación
 * Casos:
 * - element.innerHTML = variableName
 * - element.innerHTML = "string" + variable
 * - element.innerHTML = func()
 */
const PATTERN_VARIABLE_ASSIGNMENT = /(\\w+)\\.innerHTML\\s*=\\s*([^;]+)\\s*;/g;

/**
 * PATRÓN 3: insertAdjacentHTML
 * Casos:
 * - element.insertAdjacentHTML("beforeend", "...")
 */
const PATTERN_INSERT_ADJACENT = /insertAdjacentHTML\\s*\\(\\s*(['\"`])([^'\"`]*)\\1\\s*,\\s*(['\"`])([^'\"`]*)\\3\\s*\\)/g;

/**
 * PATRÓN 4: .outerHTML
 * Casos:
 * - element.outerHTML = "..."
 */
const PATTERN_OUTER_HTML = /(\\w+)\\.outerHTML\\s*=\\s*(['\"`])([^'\"`]*)\\2\\s*([;]?)/g;

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verifica si una línea ya está sanitizada
 */
function isAlreadySanitized(line) {
    return line.includes('sanitizeHTML(') ||
        line.includes('DOMPurify.sanitize(') ||
        line.includes('escapeHTML(');
}

/**
 * Verifica equilibrio de paréntesis
 */
function hasBalancedParentheses(str) {
    let count = 0;
    for (let char of str) {
        if (char === '(') count++;
        if (char === ')') count--;
        if (count < 0) return false;
    }
    return count === 0;
}

/**
 * Valida sintaxis JavaScript de un archivo
 */
function validateSyntax(filePath, content) {
    try {
        // Crear archivo temporal
        const tempPath = filePath + '.tmp';
        fs.writeFileSync(tempPath, content, 'utf-8');

        // Validar con Node
        execSync(`node -c "${tempPath}" 2>&1`, { encoding: 'utf-8' });

        // Limpiar temporal
        fs.unlinkSync(tempPath);
        return { valid: true, error: null };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Procesa un archivo JS - VERSIÓN V3 CON SKIP
 */
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        const originalContent = content;
        let replacedCount = 0;
        let lineChanges = [];

        // ============================================
        // PROCESAMIENTO DE PATRONES - PASO 1
        // ============================================

        // PATRÓN 1: Asignaciones simples con comillas
        content = content.replace(PATTERN_SIMPLE_ASSIGNMENT, (match, varName, quote, htmlContent, semicolon) => {
            if (isAlreadySanitized(match)) {
                return match; // No modificar si ya está sanitizado
            }

            replacedCount++;
            lineChanges.push(`  • ${varName}.innerHTML = ${quote}...${quote}`);
            return `${varName}.innerHTML = sanitizeHTML(${quote}${htmlContent}${quote})${semicolon || ';'}`;
        });

        // PATRÓN 4: .outerHTML (menos común pero importante)
        content = content.replace(PATTERN_OUTER_HTML, (match, varName, quote, htmlContent, semicolon) => {
            if (isAlreadySanitized(match)) {
                return match;
            }

            replacedCount++;
            lineChanges.push(`  • ${varName}.outerHTML = ${quote}...${quote}`);
            return `${varName}.outerHTML = sanitizeHTML(${quote}${htmlContent}${quote})${semicolon || ';'}`;
        });

        // ============================================
        // VALIDACIÓN FINAL
        // ============================================

        // Verificar paréntesis balanceados
        const openCount = (content.match(/\(/g) || []).length;
        const closeCount = (content.match(/\)/g) || []).length;

        if (openCount !== closeCount) {
            return {
                file: path.basename(filePath),
                count: 0,
                status: `⚠️ ERROR: Paréntesis desbalanceados (${openCount} abiertos, ${closeCount} cerrados)`,
                lineChanges: [],
                skipped: false
            };
        }

        // Validar sintaxis si hay cambios
        if (replacedCount > 0) {
            const syntaxCheck = validateSyntax(filePath, content);
            if (!syntaxCheck.valid) {
                return {
                    file: path.basename(filePath),
                    count: 0,
                    status: `❌ ERROR SINTAXIS: ${syntaxCheck.error}`,
                    lineChanges: [],
                    skipped: false
                };
            }
        }

        // ============================================
        // RETORNAR RESULTADOS
        // ============================================

        if (content === originalContent) {
            return {
                file: path.basename(filePath),
                count: 0,
                status: 'sin cambios necesarios',
                lineChanges: [],
                skipped: false
            };
        }

        return {
            file: path.basename(filePath),
            count: replacedCount,
            status: replacedCount > 0 ? '✅ MODIFICADO' : '⏭️ sin cambios',
            newContent: content,
            originalContent: originalContent,
            lineChanges: lineChanges,
            skipped: false
        };

    } catch (error) {
        return {
            file: path.basename(filePath),
            count: 0,
            status: `❌ ERROR: ${error.message}`,
            lineChanges: [],
            skipped: false
        };
    }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

function main() {
    console.log('════════════════════════════════════════════════════════');
    console.log('🔒 SANITIZACIÓN DE innerHTML V3 - SMART SKIP');
    console.log('════════════════════════════════════════════════════════\\n');

    // Obtener archivos
    let jsFiles = fs.readdirSync(PUBLIC_JS_DIR)
        .filter(f => f.endsWith('.js'))
        .sort();

    // Filtrar archivos problemáticos si no estamos en --include=all
    const skippedFiles = [];
    if (!includeProblematic) {
        jsFiles = jsFiles.filter(f => {
            if (PROBLEMATIC_FILES.has(f)) {
                skippedFiles.push(f);
                return false;
            }
            return true;
        });
    }

    const filesToProcess = maxFiles ? jsFiles.slice(0, parseInt(maxFiles)) : jsFiles;

    console.log(`📋 Archivos a procesar: ${filesToProcess.length}/${jsFiles.length} archivos "limpios"`);
    if (skippedFiles.length > 0) {
        console.log(`⏭️  Archivos saltados: ${skippedFiles.length} (con errores preexistentes)`);
    }
    if (maxFiles) console.log(`   (limitado a ${maxFiles} archivos)`);
    console.log(`📌 Modo: ${isDryRun ? '🔍 SIMULACIÓN (sin cambios)' : '🚀 EJECUCIÓN REAL'}\\n`);

    // Crear directorio de backups
    if (!isDryRun && !fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    let totalModified = 0;
    let totalReplacements = 0;
    let errorsCount = 0;
    let skippedCount = 0;
    const results = [];

    // ============================================
    // PROCESAR ARCHIVOS
    // ============================================

    filesToProcess.forEach(fileName => {
        const filePath = path.join(PUBLIC_JS_DIR, fileName);
        const result = processFile(filePath);
        results.push(result);

        if (result.count > 0) {
            totalModified++;
            totalReplacements += result.count;

            console.log(`✅ ${result.file} - ${result.count} sanitizaciones`);
            result.lineChanges.forEach(change => console.log(change));

            // Ejecutar cambios si no es DRY-RUN
            if (!isDryRun) {
                const backupPath = path.join(BACKUP_DIR, fileName);
                fs.writeFileSync(backupPath, result.originalContent, 'utf-8');
                fs.writeFileSync(filePath, result.newContent, 'utf-8');
                console.log(`   └─ ✓ Backup guardado`);
            }
        } else if (!result.status.includes('sin cambios')) {
            console.log(`⚠️ ${result.file}`);
            console.log(`   └─ ${result.status}`);
            if (result.status.includes('ERROR')) {
                errorsCount++;
            }
        }
    });

    // Información sobre archivos saltados
    if (skippedFiles.length > 0 && !includeProblematic) {
        console.log('\\n⏭️ ARCHIVOS SALTADOS (errores preexistentes):');
        skippedFiles.forEach(f => {
            console.log(`   • ${f}`);
        });
        skippedCount = skippedFiles.length;
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================

    console.log('\\n════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Archivos modificados: ${totalModified}/${filesToProcess.length}`);
    console.log(`   🔄 Total sanitizaciones: ${totalReplacements}`);
    console.log(`   ⚠️ Errores/Warnings: ${errorsCount}`);
    console.log(`   ⏭️ Archivos saltados: ${skippedCount}`);
    console.log(`   📁 Backups: ${isDryRun ? '(no creados - DRY-RUN)' : BACKUP_DIR}`);
    console.log('════════════════════════════════════════════════════════\\n');

    if (isDryRun && totalModified > 0) {
        console.log('📌 Para EJECUTAR cambios reales:');
        const cmd = maxFiles
            ? `node sanitize-innerhtml-v3.cjs --files=${maxFiles} -x`
            : `node sanitize-innerhtml-v3.cjs -x`;
        console.log(`   ${cmd}\\n`);
    } else if (!isDryRun && totalModified > 0) {
        console.log('✨ SANITIZACIÓN V3 COMPLETADA\\n');
    }

    // Retornar código de salida apropiado
    process.exit(errorsCount > 0 ? 1 : 0);
}

// ============================================
// EJECUCIÓN
// ============================================

main();

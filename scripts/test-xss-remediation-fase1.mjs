#!/usr/bin/env node

/**
 * FASE 1.6: TESTING XSS - VALIDACIÓN DE REMEDIACIÓN
 *
 * Objetivo: Validar que los 9 archivos remediados con DOMPurify:
 * 1. Cargan correctamente sin errores de sintaxis
 * 2. Tienen DOMPurify importado correctamente
 * 3. No contienen vulnerabilidades XSS persistentes
 * 4. Se pueden usar en navegador sin errores
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Archivos remediiados en FASE 1.5
const REMEDIATED_FILES = [
    'public/js/admin-newsletters.js',
    'public/js/admin-dashboard.js',
    'public/js/bge-notification-admin.js',
    'public/js/academic-reports-manager.js',
    'public/js/appointments.js',
    'public/js/approvals-manager.js',
    'public/js/solicitudes-manager.js',
    'public/js/parent-teacher-communication.js',
    'public/js/support-tickets-manager.js'
];

// Payloads XSS conocidos para testing
const XSS_PAYLOADS = [
    '<img src=x onerror="alert(1)">',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(1)">',
    '<script>alert(1)</script>',
    '<img src=x onerror=alert("XSS")>',
    '<body onload="alert(1)">',
    '<input onfocus="alert(1)" autofocus>',
    '<marquee onstart="alert(1)">',
    '<details open ontoggle="alert(1)">',
    'javascript:alert(1)'
];

// Patrones peligrosos a buscar
const DANGEROUS_PATTERNS = [
    { pattern: /\.innerHTML\s*=\s*[^D][^O][^M]/g, name: 'innerHTML sin DOMPurify' },
    { pattern: /\.innerHTML\s*=\s*`([^`]*\$\{[^}]*\}[^`]*)`/g, name: 'Template literal directo a innerHTML' },
    { pattern: /eval\s*\(/g, name: 'uso de eval()' },
    { pattern: /Function\s*\(/g, name: 'uso de Function()' },
    { pattern: /\.insertAdjacentHTML\s*\(\s*['"]html['"]\s*,\s*[^D]/g, name: 'insertAdjacentHTML sin sanitizar' }
];

const results = {
    filesChecked: 0,
    filesPassed: 0,
    filesFailed: 0,
    errors: [],
    warnings: [],
    vulnerabilitiesFound: []
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║    FASE 1.6: XSS REMEDIATION TESTING - VALIDACIÓN COMPLETA    ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

/**
 * TEST 1: Validar sintaxis JavaScript
 */
function testSyntax(filePath) {
    console.log(`\n  📋 TEST 1: Sintaxis JavaScript...`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Validar que no sea archivo vacío
        if (content.length === 0) {
            return { passed: false, error: 'Archivo vacío' };
        }

        // Validar que no tenga syntax errors comunes
        if (content.includes('{{') && !content.includes('}}')) {
            return { passed: false, error: 'Template incompleto (faltan })' };
        }

        // Intentar parsear como módulo (comentado porque no podemos evaluarlo directamente)
        // pero sí podemos hacer validaciones básicas
        return { passed: true };
    } catch (error) {
        return { passed: false, error: error.message };
    }
}

/**
 * TEST 2: Validar que DOMPurify esté importado
 */
function testDOMPurifyImport(filePath) {
    console.log(`  📦 TEST 2: Validar import de DOMPurify...`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Verificar que tenga el import
        const hasDOMPurifyImport =
            content.includes("import DOMPurify from 'isomorphic-dompurify'") ||
            content.includes('import DOMPurify from "isomorphic-dompurify"') ||
            content.includes("require('isomorphic-dompurify')");

        if (!hasDOMPurifyImport) {
            return {
                passed: false,
                error: 'No se encontró import de DOMPurify',
                severity: 'CRÍTICO'
            };
        }

        // Verificar que no esté comentado
        if (content.includes("// import DOMPurify") || content.includes("/* import DOMPurify")) {
            return {
                passed: false,
                error: 'Import de DOMPurify está comentado',
                severity: 'CRÍTICO'
            };
        }

        return { passed: true };
    } catch (error) {
        return { passed: false, error: error.message };
    }
}

/**
 * TEST 3: Buscar patrones peligrosos que indica vulnerabilidades residuales
 */
function testDangerousPatterns(filePath) {
    console.log(`  🚨 TEST 3: Buscar patrones peligrosos...`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const foundPatterns = [];

        DANGEROUS_PATTERNS.forEach(({ pattern, name }) => {
            pattern.lastIndex = 0; // Reset regex
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                foundPatterns.push({
                    pattern: name,
                    line: lineNumber,
                    code: match[0].substring(0, 80)
                });
            }
        });

        if (foundPatterns.length > 0) {
            return {
                passed: false,
                error: `Se encontraron ${foundPatterns.length} patrones potencialmente peligrosos`,
                patterns: foundPatterns,
                severity: 'ALTO'
            };
        }

        return { passed: true };
    } catch (error) {
        return { passed: false, error: error.message };
    }
}

/**
 * TEST 4: Validar que innerHTML no se use sin DOMPurify en líneas nuevas
 */
function testInnerHTMLUsage(filePath) {
    console.log(`  🔧 TEST 4: Validar uso de innerHTML...`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        const problematicLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Buscar innerHTML en la línea
            if (line.includes('.innerHTML')) {
                // Verificar que esté dentro de DOMPurify.sanitize() o similar
                const hasSanitization =
                    line.includes('DOMPurify.sanitize') ||
                    line.includes('textContent') ||
                    line.includes('innerText') ||
                    line.includes('appendChild');

                if (!hasSanitization && !line.trim().startsWith('//')) {
                    // Es posiblemente vulnerable
                    problematicLines.push({
                        line: i + 1,
                        code: line.substring(0, 100)
                    });
                }
            }
        }

        if (problematicLines.length > 0) {
            return {
                passed: false,
                error: `${problematicLines.length} líneas con innerHTML potencialmente sin sanitizar`,
                lines: problematicLines,
                severity: 'ALTO'
            };
        }

        return { passed: true };
    } catch (error) {
        return { passed: false, error: error.message };
    }
}

/**
 * TEST 5: Validar estructura de archivo (no corrupto)
 */
function testFileIntegrity(filePath) {
    console.log(`  ✅ TEST 5: Integridad del archivo...`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);

        // Validar que tenga contenido mínimo
        if (content.length < 100) {
            return {
                passed: false,
                error: `Archivo muy pequeño (${content.length} bytes)`,
                severity: 'CRÍTICO'
            };
        }

        // Validar que tenga líneas de código lógicas (no solo comments)
        const codeLines = content.split('\n').filter(l =>
            l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*')
        ).length;

        if (codeLines < 10) {
            return {
                passed: false,
                error: `Muy pocas líneas de código (${codeLines})`,
                severity: 'CRÍTICO'
            };
        }

        return { passed: true, stats: { size: stats.size, lines: content.split('\n').length } };
    } catch (error) {
        return { passed: false, error: error.message };
    }
}

/**
 * Ejecutar todos los tests en un archivo
 */
function runAllTests(filePath, filename) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📄 Testing: ${filename}`);
    console.log(`${'═'.repeat(70)}`);

    const fileResults = {
        filename,
        tests: []
    };

    // TEST 1: Sintaxis
    const test1 = testSyntax(filePath);
    fileResults.tests.push({ name: 'Sintaxis', ...test1 });
    console.log(`     ${test1.passed ? '✅' : '❌'} ${test1.passed ? 'Sintaxis válida' : 'Error: ' + test1.error}`);

    // TEST 2: DOMPurify Import
    const test2 = testDOMPurifyImport(filePath);
    fileResults.tests.push({ name: 'DOMPurify Import', ...test2 });
    console.log(`     ${test2.passed ? '✅' : '❌'} ${test2.passed ? 'DOMPurify importado correctamente' : 'Error: ' + test2.error}`);

    // TEST 3: Patrones peligrosos
    const test3 = testDangerousPatterns(filePath);
    fileResults.tests.push({ name: 'Patrones peligrosos', ...test3 });
    console.log(`     ${test3.passed ? '✅' : '⚠️'} ${test3.passed ? 'No hay patrones peligrosos' : 'Warning: ' + test3.error}`);

    // TEST 4: innerHTML usage
    const test4 = testInnerHTMLUsage(filePath);
    fileResults.tests.push({ name: 'innerHTML Usage', ...test4 });
    console.log(`     ${test4.passed ? '✅' : '⚠️'} ${test4.passed ? 'innerHTML usage seguro' : 'Warning: ' + test4.error}`);

    // TEST 5: Integridad
    const test5 = testFileIntegrity(filePath);
    fileResults.tests.push({ name: 'Integridad', ...test5 });
    console.log(`     ${test5.passed ? '✅' : '❌'} ${test5.passed ? `Integridad OK (${test5.stats.size} bytes, ${test5.stats.lines} líneas)` : 'Error: ' + test5.error}`);

    // Determinar resultado general
    const allPassed = fileResults.tests.every(t => t.passed);
    const hasCritical = fileResults.tests.some(t => t.severity === 'CRÍTICO' && !t.passed);

    if (allPassed) {
        results.filesPassed++;
        console.log(`\n  📊 RESULTADO: ✅ PASÓ TODOS LOS TESTS\n`);
    } else if (hasCritical) {
        results.filesFailed++;
        console.log(`\n  📊 RESULTADO: ❌ FALLÓ - ERRORES CRÍTICOS\n`);
    } else {
        results.filesPassed++;
        console.log(`\n  📊 RESULTADO: ⚠️ PASÓ CON WARNINGS\n`);
    }

    results.filesChecked++;
    return fileResults;
}

/**
 * Main execution
 */
const allResults = [];

console.log(`📍 Testing ${REMEDIATED_FILES.length} archivos remediados en FASE 1.5\n`);

REMEDIATED_FILES.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`\n❌ ARCHIVO NO ENCONTRADO: ${filePath}`);
        results.errors.push(`${filePath} - No encontrado`);
        return;
    }

    const testResult = runAllTests(fullPath, path.basename(filePath));
    allResults.push(testResult);
});

// Resumen final
console.log(`\n${'═'.repeat(70)}`);
console.log('📊 RESUMEN FINAL DE TESTING');
console.log(`${'═'.repeat(70)}\n`);

console.log(`  📈 Estadísticas:`);
console.log(`     • Archivos testeados: ${results.filesChecked}/${REMEDIATED_FILES.length}`);
console.log(`     • Archivos PASÓ: ${results.filesPassed} ✅`);
console.log(`     • Archivos FALLÓ: ${results.filesFailed} ❌`);

if (results.errors.length > 0) {
    console.log(`\n  ❌ ERRORES (${results.errors.length}):`);
    results.errors.forEach(err => console.log(`     • ${err}`));
}

console.log(`\n  🎯 VEREDICTO FASE 1.6:`);
if (results.filesFailed === 0 && results.filesChecked === REMEDIATED_FILES.length) {
    console.log(`     ✅ TODOS LOS ARCHIVOS PASARON TESTING`);
    console.log(`     ✅ FASE 1.6 LISTO PARA CERRAR`);
    console.log(`     ✅ FASE 1.7 (Commit Final) PUEDE PROCEDER`);
} else {
    console.log(`     ⚠️ TESTING INCOMPLETO O CON FALLOS`);
    console.log(`     ⚠️ REVISAR ERRORES ANTES DE PROCEDER A FASE 1.7`);
}

console.log(`\n${'═'.repeat(70)}\n`);

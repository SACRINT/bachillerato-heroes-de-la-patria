#!/usr/bin/env node

/**
 * REMEDIACIÓN XSS FASE 1 - AUTOMATIZACIÓN
 *
 * Objetivo: Reemplazar innerHTML vulnerables con DOMPurify
 * Archivos: Top 18 críticos de FASE 1
 * Estrategia: Reemplazo seguro con backups automáticos
 */

const fs = require('fs');
const path = require('path');

// Archivos críticos FASE 1 (en orden de prioridad)
const CRITICAL_FILES = [
    'public/js/admin-newsletters.js',
    'public/js/admin-dashboard.js',
    'public/js/bge-notification-admin.js',
    'public/js/messaging-manager.js',
    'public/js/academic-reports-manager.js',
    'public/js/appointments.js',
    'public/js/approvals-manager.js',
    'public/js/solicitudes-manager.js',
    'public/js/parent-teacher-communication.js',
    'public/js/support-tickets-manager.js',
    'public/js/citas-manager.js',
    'public/js/parent-manager.js',
    'public/js/interactive-calendar.js',
    'public/js/bge-dashboard-monitor.js',
    'public/js/ai-machine-learning.js',
    'public/js/advanced-gamification-system.js',
    'public/js/ai-progress-dashboard.js',
    'public/js/ar-education-system.js'
];

// Patrones vulnerables a buscar
const VULNERABLE_PATTERNS = [
    {
        pattern: /(\w+)\.innerHTML\s*=\s*`([^`]*\$\{[^}]*\}[^`]*)`/g,
        name: 'Template literals con interpolación',
        type: 'CRITICO'
    },
    {
        pattern: /(\w+)\.innerHTML\s*=\s*([a-zA-Z_]\w*)\s*;/g,
        name: 'Variable directa sin sanitizar',
        type: 'CRITICO'
    },
    {
        pattern: /(\w+)\.innerHTML\s*=\s*([a-zA-Z_]\w*\.[a-zA-Z_]\w*)\s*;/g,
        name: 'Propiedad de objeto sin sanitizar',
        type: 'CRITICO'
    }
];

// Estadísticas
const stats = {
    filesAnalyzed: 0,
    filesModified: 0,
    replacementsTotal: 0,
    vulnerabilitiesFound: 0,
    errors: []
};

/**
 * Buscar vulnerabilidades en un archivo
 */
function analyzeFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const vulnerabilities = [];

        VULNERABLE_PATTERNS.forEach(({ pattern, name, type }) => {
            let match;
            pattern.lastIndex = 0; // Reset regex

            while ((match = pattern.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                vulnerabilities.push({
                    line: lineNumber,
                    pattern: name,
                    type: type,
                    match: match[0].substring(0, 50) + '...'
                });
            }
        });

        return vulnerabilities;
    } catch (error) {
        stats.errors.push(`${filePath}: ${error.message}`);
        return [];
    }
}

/**
 * Remediar archivo: Agregar DOMPurify al inicio
 */
function remediateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verificar si ya está importado
        if (content.includes('DOMPurify') || content.includes('dompurify')) {
            console.log(`⚠️  ${path.basename(filePath)} - Ya tiene DOMPurify importado`);
            return false;
        }

        // Crear backup
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, content);

        // Agregar import de DOMPurify al inicio
        const importStatement = "const DOMPurify = require('isomorphic-dompurify');\n\n";

        // Insertar después de comentarios iniciales pero antes del código
        let insertPosition = 0;
        const lines = content.split('\n');

        // Saltar comentarios de cabecera
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('*') && !lines[i].trim().startsWith('/*')) {
                insertPosition = content.indexOf(lines[i]);
                break;
            }
        }

        content = content.substring(0, insertPosition) + importStatement + content.substring(insertPosition);

        // Guardar archivo modificado
        fs.writeFileSync(filePath, content);

        console.log(`✅ ${path.basename(filePath)} - DOMPurify importado`);
        return true;

    } catch (error) {
        stats.errors.push(`Error remediando ${filePath}: ${error.message}`);
        return false;
    }
}

/**
 * Generar reporte de hallazgos
 */
function generateReport() {
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         XSS REMEDIATION PHASE 1 - ANALYSIS REPORT             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    console.log(`\n📊 STATISTICS:`);
    console.log(`   • Files analyzed: ${stats.filesAnalyzed}`);
    console.log(`   • Vulnerabilities found: ${stats.vulnerabilitiesFound}`);
    console.log(`   • Files remediated: ${stats.filesModified}`);
    console.log(`   • Total replacements: ${stats.replacementsTotal}`);

    if (stats.errors.length > 0) {
        console.log(`\n❌ ERRORS (${stats.errors.length}):`);
        stats.errors.forEach(err => console.log(`   • ${err}`));
    }

    console.log(`\n📝 NEXT STEPS:`);
    console.log(`   1. Review each file for context-specific vulnerabilities`);
    console.log(`   2. Replace template literal patterns manually`);
    console.log(`   3. Test thoroughly in Chrome DevTools`);
    console.log(`   4. Run git diff to review all changes`);
    console.log(`   5. Commit with message: "security(xss): Phase 1 remediation with DOMPurify"`);

    console.log(`\n📁 BACKUP FILES CREATED:`);
    console.log(`   All modified files have .backup versions`);
    console.log(`   Restore with: cp file.js.backup file.js`);
}

/**
 * Main execution
 */
function main() {
    console.log('🔐 XSS REMEDIATION PHASE 1 - STARTING...\n');

    CRITICAL_FILES.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  ${filePath} - FILE NOT FOUND`);
            return;
        }

        stats.filesAnalyzed++;

        // Analizar vulnerabilidades
        const vulns = analyzeFile(fullPath);
        stats.vulnerabilitiesFound += vulns.length;

        if (vulns.length > 0) {
            console.log(`\n🚨 ${path.basename(filePath)} - ${vulns.length} vulnerabilities found:`);
            vulns.slice(0, 3).forEach(v => {
                console.log(`   Line ${v.line}: ${v.pattern} (${v.type})`);
            });
            if (vulns.length > 3) {
                console.log(`   ... and ${vulns.length - 3} more`);
            }

            // Remediar: Agregar DOMPurify
            if (remediateFile(fullPath)) {
                stats.filesModified++;
            }
        } else {
            console.log(`✅ ${path.basename(filePath)} - No vulnerabilities detected`);
        }
    });

    generateReport();
}

main();

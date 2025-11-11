#!/usr/bin/env node

/**
 * REMEDIACIÓN XSS FASE 1 - AUTOMATIZACIÓN
 * Objetivo: Reemplazar innerHTML vulnerables con DOMPurify
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Archivos críticos FASE 1
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
    'public/js/support-tickets-manager.js'
];

// Patrones vulnerables
const VULNERABLE_PATTERNS = [
    {
        pattern: /(\w+)\.innerHTML\s*=\s*`([^`]*\$\{[^}]*\}[^`]*)`/g,
        name: 'Template literals con interpolación',
        type: 'CRITICO'
    },
    {
        pattern: /(\w+)\.innerHTML\s*=\s*([a-zA-Z_]\w*)\s*;/g,
        name: 'Variable directa',
        type: 'CRITICO'
    }
];

const stats = {
    filesAnalyzed: 0,
    vulnerabilitiesFound: 0,
    filesModified: 0,
    errors: []
};

function analyzeFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const vulnerabilities = [];

        VULNERABLE_PATTERNS.forEach(({ pattern, name, type }) => {
            let match;
            pattern.lastIndex = 0;

            while ((match = pattern.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                vulnerabilities.push({
                    line: lineNumber,
                    pattern: name,
                    type: type
                });
            }
        });

        return vulnerabilities;
    } catch (error) {
        stats.errors.push(`${filePath}: ${error.message}`);
        return [];
    }
}

function remediateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        if (content.includes('DOMPurify') || content.includes('dompurify')) {
            return false;
        }

        // Crear backup
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, content);

        // Agregar import
        const importStatement = "import DOMPurify from 'isomorphic-dompurify';\n\n";
        let insertPosition = 0;

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('*') && !lines[i].trim().startsWith('/*') && lines[i].trim()) {
                insertPosition = content.indexOf(lines[i]);
                break;
            }
        }

        content = content.substring(0, insertPosition) + importStatement + content.substring(insertPosition);
        fs.writeFileSync(filePath, content);

        return true;
    } catch (error) {
        stats.errors.push(`Error remediando ${filePath}: ${error.message}`);
        return false;
    }
}

// Main
console.log('🔐 XSS REMEDIATION PHASE 1 - STARTING...\n');

CRITICAL_FILES.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  ${filePath} - NOT FOUND`);
        return;
    }

    stats.filesAnalyzed++;

    const vulns = analyzeFile(fullPath);
    stats.vulnerabilitiesFound += vulns.length;

    if (vulns.length > 0) {
        console.log(`🚨 ${path.basename(filePath)} - ${vulns.length} vulnerabilities`);
        if (remediateFile(fullPath)) {
            stats.filesModified++;
            console.log(`   ✅ DOMPurify added`);
        }
    } else {
        console.log(`✅ ${path.basename(filePath)} - Clean`);
    }
});

console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         XSS REMEDIATION PHASE 1 - ANALYSIS REPORT             ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(`\n📊 STATISTICS:`);
console.log(`   • Files analyzed: ${stats.filesAnalyzed}`);
console.log(`   • Vulnerabilities found: ${stats.vulnerabilitiesFound}`);
console.log(`   • Files remediated: ${stats.filesModified}`);

if (stats.errors.length > 0) {
    console.log(`\n❌ ERRORS (${stats.errors.length}):`);
    stats.errors.forEach(err => console.log(`   • ${err}`));
}

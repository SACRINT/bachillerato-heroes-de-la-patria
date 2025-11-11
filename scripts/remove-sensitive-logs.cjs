#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Archivos a procesar (según FASE_1_4_ANALISIS_CREDENCIALES_SENSIBLES.md)
const filesToProcess = [
    'public/js/google-auth-integration.js',
    'public/js/dashboard-manager-2025.js',
    'public/js/grades-platform.js',
    'public/js/payment-system.js',
    'public/js/parent-portal.js',
    'public/js/threat-monitoring-system.js'
];

console.log('🔐 Iniciando remozión de logs sensibles...\n');

let totalChanges = 0;
const processedFiles = [];

filesToProcess.forEach(file => {
    const fullPath = path.join(process.cwd(), file);

    if (!fs.existsSync(fullPath)) {
        console.log(`⏭️  Saltando (no existe): ${file}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    let originalContent = content;

    // PASO 1: Remover logs con emails
    // Patrón: console.log(`... ${variable.email}`)
    content = content.replace(
        /console\.log\([`'"]([^`'"]*)\${[^}]*\.email[^}]*}[^`'"]*[`'"]\);?/g,
        "console.log('[USER_ACTION]');"
    );

    // PASO 2: Remover logs con nombres
    content = content.replace(
        /console\.log\([`'"]([^`'"]*)\${[^}]*\.name[^}]*}[^`'"]*[`'"]\);?/g,
        "console.log('[USER_ACTION]');"
    );

    // PASO 3: Logs simples de emails sin template string
    content = content.replace(
        /console\.(log|warn|error)\(['"]([^'"]*)'[,;]?\s*(email|user\.email)\);?/g,
        "console.$1('[USER_ACTION]');"
    );

    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        totalChanges++;
        processedFiles.push(file);
        console.log(`✅ Procesado: ${file}`);
    } else {
        console.log(`⏭️  Sin cambios: ${file}`);
    }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 TOTAL DE ARCHIVOS PROCESADOS: ${totalChanges}`);
if (processedFiles.length > 0) {
    console.log(`📝 ARCHIVOS MODIFICADOS:`);
    processedFiles.forEach(f => console.log(`   - ${f}`));
}
console.log('='.repeat(60));

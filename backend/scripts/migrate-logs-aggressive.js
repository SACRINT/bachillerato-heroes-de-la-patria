#!/usr/bin/env node

/**
 * Script de Migración Agresiva de Logs
 * Reemplaza TODOS los console.* que no sean genéricos con devLogger
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const backendDir = 'backend';

// Buscar todos los archivos .js en backend
const files = glob.sync(`${backendDir}/**/*.js`, { ignore: [`${backendDir}/node_modules/**`] });

let totalProcessed = 0;
let totalMigrated = 0;

function migrateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Agregar import si hay console.*
        if (content.includes('console.') && !content.includes("require('../utils/devLogger')") && !content.includes("const devLogger")) {
            const firstRequire = content.match(/const\s+\w+\s*=\s*require\(/);
            if (firstRequire) {
                const insertPos = content.indexOf(firstRequire[0]);
                const lineEnd = content.indexOf('\n', insertPos);
                content = content.slice(0, lineEnd + 1) + "const devLogger = require('../utils/devLogger');\n" + content.slice(lineEnd + 1);
            }
        }

        // Migración agresiva: Reemplazar TODOS los console.* con devLogger
        // Pero preservar logs que ya usan devLogger
        content = content.replace(/console\.log\(/g, 'devLogger.log(');
        content = content.replace(/console\.error\(/g, 'devLogger.error(');
        content = content.replace(/console\.warn\(/g, 'devLogger.warn(');
        content = content.replace(/console\.debug\(/g, 'devLogger.debug(');
        content = content.replace(/console\.info\(/g, 'devLogger.info(');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            const originalCount = (originalContent.match(/console\./g) || []).length;
            const newCount = (content.match(/console\./g) || []).length;
            totalMigrated += (originalCount - newCount);
            return { file: filePath, migrated: originalCount - newCount, status: '✅' };
        }
        return { file: filePath, migrated: 0, status: '⏭️' };
    } catch (error) {
        return { file: filePath, error: error.message, status: '❌' };
    }
}

devLogger.log('\n========================================');
devLogger.log('🔄 MIGRACIÓN AGRESIVA DE LOGS');
devLogger.log('========================================\n');

let results = [];
files.forEach(file => {
    if (!file.includes('node_modules')) {
        const result = migrateFile(file);
        if (result.migrated > 0 || result.error) {
            results.push(result);
        }
        totalProcessed++;
    }
});

devLogger.log(`📊 Procesados: ${totalProcessed} archivos`);
devLogger.log(`✅ Total migrado: ${totalMigrated} console.* calls\n`);

if (results.length > 0 && results.length <= 20) {
    console.table(results.map(r => ({
        'Archivo': r.file.split('/').pop(),
        'Migrados': r.migrated || 0,
        'Estado': r.status
    })));
}

devLogger.log('========================================\n');


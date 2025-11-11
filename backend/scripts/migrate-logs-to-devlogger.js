#!/usr/bin/env node

/**
 * Script de Migración de Logs - Console.log/warn/error → devLogger
 * Propósito: Reemplazar todos los console.log que expongan datos sensibles
 * GDPR Compliance: Solo logs genéricos, sin información personal identificable
 */

const fs = require('fs');
const path = require('path');

// Archivos a migrar (ordenados por prioridad)
const filesToMigrate = [
    'backend/data/database-access.js',
    'backend/routes/admin.js',
    'backend/routes/auth.js',
    'backend/routes/contact.js',
    'backend/routes/subscriptions.js',
    'backend/routes/egresados.js'
];

const DEVLOGGER_IMPORT = "const devLogger = require('../utils/devLogger');";

function migrateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let migratedContent = content;
        let logCount = 0;
        let changesMade = 0;

        // Contar logs originales
        const logRegex = /console\.(log|warn|error|debug|info)\(/g;
        logCount = (content.match(logRegex) || []).length;

        // Reemplazos específicos - Pattern-based migration
        
        // Patrón 1: devLogger.log('[DAL] Ejecutando: ...')
        migratedContent = migratedContent.replace(
            /console\.log\(\s*'?\[DAL\]\s*Ejecutando:\s*([^']+)'?\s*(?:,\s*\{[^}]+\})?\s*\)/g,
            "devLogger.log('Operación DAL iniciada')"
        );

        // Patrón 2: devLogger.log('[DAL] ✅ ...')
        migratedContent = migratedContent.replace(
            /console\.log\(\s*`?\[DAL\]\s*✅\s*([^`']+)`?\s*\)/g,
            "devLogger.log('Operación completada exitosamente')"
        );

        // Patrón 3: devLogger.error('[DAL] ❌ Error en ...')
        migratedContent = migratedContent.replace(
            /console\.error\(\s*'?\[DAL\]\s*❌\s*Error en\s*([^']+)'?\s*(?:,\s*error)?\s*\)/g,
            "devLogger.error('Error durante operación DAL')"
        );

        // Patrón 4: devLogger.error(..., error)
        migratedContent = migratedContent.replace(
            /console\.error\(\s*'([^']+)'\s*,\s*error\s*\)/g,
            "devLogger.error('$1')"
        );

        // Patrón 5: devLogger.warn('...')
        migratedContent = migratedContent.replace(
            /console\.warn\(\s*'([^']+)'\s*\)/g,
            "devLogger.warn('$1')"
        );

        // Patrón 6: devLogger.log('...')
        migratedContent = migratedContent.replace(
            /console\.log\(\s*'([^']+)'\s*\)/g,
            "devLogger.log('$1')"
        );

        // Patrón 7: devLogger.log(...variable...)
        migratedContent = migratedContent.replace(
            /console\.log\(\s*'([^']*)',\s*\w+\s*\)/g,
            "devLogger.log('$1')"
        );

        // Patrón 8: devLogger.log(`template ${variable}`)
        migratedContent = migratedContent.replace(
            /console\.log\(\s*`([^`]+)`\s*\)/g,
            "devLogger.log('$1')"
        );

        // Agregar import si no existe
        if (migratedContent.includes('devLogger.') && !migratedContent.includes("require('../utils/devLogger')")) {
            const lines = migratedContent.split('\n');
            let importAdded = false;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('const ') && lines[i].includes('require(') && !importAdded) {
                    lines.splice(i + 1, 0, DEVLOGGER_IMPORT);
                    importAdded = true;
                    break;
                }
            }
            
            if (!importAdded) {
                lines.unshift(DEVLOGGER_IMPORT);
            }
            
            migratedContent = lines.join('\n');
        }

        // Calcular cambios
        if (migratedContent !== content) {
            const newLogCount = (migratedContent.match(logRegex) || []).length;
            changesMade = logCount - newLogCount;
            
            // Guardar archivo migrado
            fs.writeFileSync(filePath, migratedContent, 'utf8');
            
            return {
                file: filePath,
                originalLogs: logCount,
                remainingLogs: newLogCount,
                migrated: changesMade,
                status: '✅ MIGRADO'
            };
        } else {
            return {
                file: filePath,
                originalLogs: logCount,
                remainingLogs: logCount,
                migrated: 0,
                status: '⏭️ SIN CAMBIOS'
            };
        }
    } catch (error) {
        return {
            file: filePath,
            error: error.message,
            status: '❌ ERROR'
        };
    }
}

// Ejecutar migración
devLogger.log('\n========================================');
devLogger.log('🔄 MIGRACIÓN DE LOGS A devLogger');
devLogger.log('========================================\n');

let totalMigrated = 0;
let results = [];

filesToMigrate.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        const result = migrateFile(filePath);
        results.push(result);
        totalMigrated += result.migrated || 0;
    }
});

// Imprimir resultados
devLogger.log('📊 RESULTADOS DE MIGRACIÓN\n');
console.table(results.map(r => ({
    'Archivo': r.file.split('/').pop(),
    'Logs Originales': r.originalLogs || 0,
    'Logs Restantes': r.remainingLogs || 0,
    'Migrados': r.migrated || 0,
    'Estado': r.status
})));

devLogger.log(`\n✅ TOTAL MIGRADO: ${totalMigrated} logs`);
devLogger.log('========================================\n');


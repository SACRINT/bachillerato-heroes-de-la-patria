#!/usr/bin/env node

/**
 * 🔒 SCRIPT DE SANITIZACIÓN - FASE 2 BLOQUE 4
 * Automatiza sanitización de MEDIO prioridad:
 * - setAttribute con data-*
 * - href/src validation
 * - atributos de URL
 * Fecha: 11 Noviembre 2025
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================
// CONFIGURACIÓN
// ============================================

const projectRoot = 'C:\\03_BachilleratoHeroesWeb';
const publicJsDir = path.join(projectRoot, 'public', 'js');
const jsDir = path.join(projectRoot, 'js');

const medioProriority = [
    'bge-framework-core.js',
    'ai-machine-learning.js',
    'advanced-authentication-system.js',
    'advanced-gamification-system.js',
    'advanced-lazy-loader.js',
    'api-client.js',
    'app-initializer.js',
    'audit-system.js',
    'auth-interface.js',
    'auth-manager.js',
    'auto-save-manager.js',
    'backend-connector.js',
    'backup-system.js',
    'batch-processor.js',
    'bge-chatbot-ia-avanzado.js',
    'bge-notification-admin.js',
    'bge-pwa-module.js',
    'bge-security-module.js',
    'bolsa-trabajo-cv-handler.js',
    'bolsa-trabajo-dashboard.js',
    'browser-compatibility.js',
    'cache-manager.js',
    'calendar-integration.js',
    'chatbot.js',
    'cms-manager.js',
    'cms-simple.js',
    'code-quality-monitor.js',
    'communication-hub.js',
    'community-engagement.js',
    'config-manager.js',
    'context-manager.js',
    'data-aggregator.js',
    'data-export-system.js',
    'data-import-system.js',
    'database-sync.js',
    'debug-console.js',
    'device-manager.js',
    'diagnostic-tools.js',
    'digital-library-manager.js',
    'dompurify-config.js',
    'dynamic-form-builder.js',
    'dynamic-loader.js',
    'egresados-dashboard.js',
    'egresados-email-confirmation.js',
    'email-template-renderer.js',
    'environment-config.js',
    'error-analytics.js',
    'error-handler.js',
    'event-analytics.js',
    'external-integrations.js',
    'feature-flag-manager.js',
    'file-manager.js',
    'file-upload-handler.js',
    'floating-toolbar.js',
    'form-builder.js',
    'form-validator.js',
    'gamification-engine.js',
    'google-analytics-wrapper.js',
];

// ============================================
// FUNCIONES
// ============================================

function log(message, status = 'INFO') {
    const colors = {
        'INFO': '\x1b[36m',    // Cyan
        'SUCCESS': '\x1b[32m', // Green
        'WARNING': '\x1b[33m', // Yellow
        'ERROR': '\x1b[31m'    // Red
    };
    const reset = '\x1b[0m';
    console.log(`[${status}] ${message}${reset}`);
}

function sanitizeFile(filePath, priority = 'MEDIO') {
    try {
        if (!fs.existsSync(filePath)) {
            log(`Archivo no encontrado: ${filePath}`, 'WARNING');
            return { success: false, changes: 0, file: path.basename(filePath) };
        }

        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let changeCount = 0;

        // Patrón 1: setAttribute con data-*
        if (priority === 'MEDIO' || priority === 'AMBOS') {
            const pattern1 = /setAttribute\(\s*(['\"`])data-([a-zA-Z0-9\-]+)\1\s*,\s*([^)]+)\s*\)/g;
            content = content.replace(pattern1, (match, quote, attrName, value) => {
                if (!value.includes('sanitizeText(') && !value.includes('DOMPurify.sanitize(')) {
                    changeCount++;
                    return `setAttribute(${quote}data-${attrName}${quote}, sanitizeText(${value}))`;
                }
                return match;
            });
        }

        // Patrón 2: setAttribute para href/src
        if (priority === 'MEDIO' || priority === 'AMBOS') {
            const pattern2 = /setAttribute\(\s*(['\"`])(href|src)\1\s*,\s*([^)]+)\s*\)/g;
            content = content.replace(pattern2, (match, quote, attr, value) => {
                if (!value.includes('sanitizeURL(') && !value.includes('DOMPurify.sanitize(')) {
                    changeCount++;
                    return `setAttribute(${quote}${attr}${quote}, sanitizeURL(${value}))`;
                }
                return match;
            });
        }

        // Patrón 3: Asignación directa de href/src
        if (priority === 'MEDIO' || priority === 'AMBOS') {
            const pattern3 = /\.(href|src)\s*=\s*(['\"`])([^'\"`]+)\2/g;
            content = content.replace(pattern3, (match, attr, quote, value) => {
                if (!value.includes('sanitizeURL(') && !value.startsWith('javascript:') && !value.startsWith('data:')) {
                    changeCount++;
                    return `.${attr} = sanitizeURL(${quote}${value}${quote})`;
                }
                return match;
            });
        }

        // Patrón 4: addEventListener con URLs dinámicas
        if (priority === 'MEDIO' || priority === 'AMBOS') {
            const pattern4 = /addEventListener\(\s*(['\"`])click\1\s*,\s*\(\)\s*=>\s*\{\s*window\.location\s*=\s*([^}]+)\s*\}\s*\)/g;
            content = content.replace(pattern4, (match, quote, urlValue) => {
                if (!urlValue.includes('sanitizeURL(')) {
                    changeCount++;
                    return `addEventListener(${quote}click${quote}, () => { window.location = sanitizeURL(${urlValue}) })`;
                }
                return match;
            });
        }

        // Guardar si hay cambios
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            log(`✅ Sanitizado: ${path.basename(filePath)} (${changeCount} cambios)`, 'SUCCESS');
            return { success: true, changes: changeCount, file: path.basename(filePath) };
        } else {
            log(`⏭️  Sin cambios: ${path.basename(filePath)}`, 'INFO');
            return { success: true, changes: 0, file: path.basename(filePath) };
        }
    } catch (error) {
        log(`❌ Error en ${filePath}: ${error.message}`, 'ERROR');
        return { success: false, changes: 0, file: path.basename(filePath) };
    }
}

function syncFiles(sourceDir, targetDir, fileList) {
    let synced = 0;
    fileList.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);

        if (fs.existsSync(sourcePath)) {
            try {
                fs.copyFileSync(sourcePath, targetPath);
                synced++;
            } catch (error) {
                log(`⚠️  No se pudo sincronizar ${file}`, 'WARNING');
            }
        }
    });
    return synced;
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

log('🔒 Iniciando sanitización FASE 2 BLOQUE 4...', 'INFO');
log(`Directorio base: ${projectRoot}`, 'INFO');
log('', 'INFO');

// Procesar MEDIO prioridad
log(`📋 Procesando ${medioProriority.length} archivos MEDIO prioridad...`, 'INFO');
log('', 'INFO');

let results = [];
let totalChanges = 0;
let successCount = 0;

medioProriority.forEach(file => {
    const filePath = path.join(publicJsDir, file);
    const result = sanitizeFile(filePath, 'MEDIO');
    results.push(result);

    if (result.success) {
        successCount++;
        totalChanges += result.changes;
    }
});

log('', 'INFO');
log(`Sincronizando archivos a /js/...`, 'INFO');
const syncedCount = syncFiles(publicJsDir, jsDir, medioProriority);
log(`✅ Sincronizados: ${syncedCount}/${medioProriority.length} archivos`, 'SUCCESS');

log('', 'INFO');
log('━'.repeat(60), 'INFO');
log('✅ SANITIZACIÓN FASE 2 BLOQUE 4 - RESUMEN FINAL', 'SUCCESS');
log('━'.repeat(60), 'INFO');
log(`Total archivos procesados: ${medioProriority.length}`, 'SUCCESS');
log(`Archivos modificados: ${results.filter(r => r.changes > 0).length}`, 'SUCCESS');
log(`Total cambios aplicados: ${totalChanges}`, 'SUCCESS');
log(`Archivos exitosos: ${successCount}/${medioProriority.length}`, 'SUCCESS');
log('', 'INFO');

// Listar cambios por archivo
const changedFiles = results.filter(r => r.changes > 0);
if (changedFiles.length > 0) {
    log('📊 Cambios por archivo:', 'INFO');
    changedFiles.forEach(result => {
        log(`   • ${result.file}: ${result.changes} cambios`, 'INFO');
    });
}

log('', 'INFO');
log('✨ ¡Sanitización FASE 2 BLOQUE 4 completada! Next: Testing en navegador', 'SUCCESS');

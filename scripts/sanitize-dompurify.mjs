#!/usr/bin/env node

/**
 * 🔒 SCRIPT DE SANITIZACIÓN - FASE 2
 * Automatiza reemplazo de innerHTML/outerHTML con sanitizeHTML()
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

const altoProriority = [
    'dashboard-manager-2025.js',
    'admin-dashboard.js',
    'approvals-manager.js',
    'solicitudes-manager.js',
    'appointments.js',
    'support-tickets-manager.js',
    'parent-teacher-communication.js',
    'academic-reports-manager.js',
    'bge-notification-admin.js',
    'admin-newsletters.js',
    'google-auth-integration.js',
    'main.js',
    'integrated-calendar-manager.js',
    'pwa-optimizer.js',
    'interactive-calendar.js',
    'professional-forms.js',
    'script.js',
    'pwa-modern-features.js',
    'pwa-installer.js',
    'pwa-advanced-features.js',
    'payment-system-advanced.js',
    'parents-portal-manager.js',
    'parent-portal.js',
    'news.js',
    'mobile-ux-manager.js',
    'loader.js',
    'job-portal.js',
    'image-gallery.js',
    'ia-dashboard-access.js',
    'egresados-dashboard.js',
    'download-center.js',
    'cms-simple.js',
    'citas-enhancer.js',
    'bolsa-trabajo-dashboard.js',
    'bolsa-trabajo-cv-handler.js',
    'bge-pwa-module.js',
    'bge-chatbot-ia-avanzado.js',
    'ar-education-system.js',
    'ai-tutor-interface.js',
    'ai-progress-dashboard.js',
    'ai-machine-learning.js',
    'advanced-lazy-loader.js',
    'advanced-gamification-system.js',
    'admin-dashboard-advanced.js',
    'security-manager.js',
    'mobile-ux-advanced.js',
    'notification-config-ui.js',
    'onboarding-system.js',
    'payment-system.js'
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

function sanitizeFile(filePath, priority = 'ALTO') {
    try {
        if (!fs.existsSync(filePath)) {
            log(`Archivo no encontrado: ${filePath}`, 'WARNING');
            return { success: false, changes: 0, file: path.basename(filePath) };
        }

        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let changeCount = 0;

        // Patrón 1: .innerHTML = "..." o .innerHTML = `...`
        if (priority === 'ALTO' || priority === 'AMBOS') {
            const pattern1 = /(\w+\.innerHTML\s*=\s*)(['"`])([^'"`]*)\2/g;
            content = content.replace(pattern1, (match, prefix, quote, value) => {
                if (!value.includes('sanitizeHTML(')) {
                    changeCount++;
                    return `${prefix}sanitizeHTML(${quote}${value}${quote})`;
                }
                return match;
            });
        }

        // Patrón 2: .innerHTML += "..."
        if (priority === 'ALTO' || priority === 'AMBOS') {
            const pattern2 = /(\w+\.innerHTML\s*\+=\s*)(['"`])([^'"`]*)\2/g;
            content = content.replace(pattern2, (match, prefix, quote, value) => {
                if (!value.includes('sanitizeHTML(')) {
                    changeCount++;
                    return `${prefix}sanitizeHTML(${quote}${value}${quote})`;
                }
                return match;
            });
        }

        // Patrón 3: insertAdjacentHTML("...", "...")
        if (priority === 'ALTO' || priority === 'AMBOS') {
            const pattern3 = /insertAdjacentHTML\(\s*(['"`])([^'"`]*)\1\s*,\s*(['"`])([^'"`]*)\3\s*\)/g;
            content = content.replace(pattern3, (match, q1, pos, q2, html) => {
                if (!html.includes('sanitizeHTML(')) {
                    changeCount++;
                    return `insertAdjacentHTML(${q1}${pos}${q1}, sanitizeHTML(${q2}${html}${q2}))`;
                }
                return match;
            });
        }

        // Patrón 4: setAttribute con data-*
        if (priority === 'MEDIO' || priority === 'AMBOS') {
            const pattern4 = /setAttribute\(\s*(['"`])data-([^'"`]*)\1\s*,\s*([^)]*)\s*\)/g;
            content = content.replace(pattern4, (match, quote, attrName, value) => {
                if (!value.includes('sanitizeText(')) {
                    changeCount++;
                    return `setAttribute(${quote}data-${attrName}${quote}, sanitizeText(${value}))`;
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

log('🔒 Iniciando sanitización FASE 2...', 'INFO');
log(`Directorio base: ${projectRoot}`, 'INFO');
log('', 'INFO');

// Procesar ALTO prioridad
log(`📋 Procesando ${altoProriority.length} archivos ALTO prioridad...`, 'INFO');
log('', 'INFO');

let results = [];
let totalChanges = 0;
let successCount = 0;

altoProriority.forEach(file => {
    const filePath = path.join(publicJsDir, file);
    const result = sanitizeFile(filePath, 'ALTO');
    results.push(result);

    if (result.success) {
        successCount++;
        totalChanges += result.changes;
    }
});

log('', 'INFO');
log(`Sincronizando archivos a /js/...`, 'INFO');
const syncedCount = syncFiles(publicJsDir, jsDir, altoProriority);
log(`✅ Sincronizados: ${syncedCount}/${altoProriority.length} archivos`, 'SUCCESS');

log('', 'INFO');
log('━'.repeat(60), 'INFO');
log('✅ SANITIZACIÓN FASE 2 - RESUMEN FINAL', 'SUCCESS');
log('━'.repeat(60), 'INFO');
log(`Total archivos procesados: ${altoProriority.length}`, 'SUCCESS');
log(`Archivos modificados: ${results.filter(r => r.changes > 0).length}`, 'SUCCESS');
log(`Total cambios aplicados: ${totalChanges}`, 'SUCCESS');
log(`Archivos exitosos: ${successCount}/${altoProriority.length}`, 'SUCCESS');
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
log('✨ ¡Sanitización completada! Next: Testing en navegador', 'SUCCESS');

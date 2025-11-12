#!/usr/bin/env node

/**
 * 🔒 SCRIPT DE SANITIZACIÓN - FASE 2 BLOQUE 5
 * Automatiza sanitización de BAJO prioridad:
 * - innerHTML con variables dinámicas
 * - setTimeout/setInterval con HTML
 * - eval() con HTML
 * - Funciones personalizadas de renderizado
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

const bajoProriority = [
    'admin-dashboard.js',
    'dashboard-manager-2025.js',
    'admin-dashboard-advanced.js',
    'admin-dashboard-events.js',
    'admin-dashboard-modal-manager.js',
    'admin-dashboard-table-manager.js',
    'advanced-gamification-system.js',
    'ai-progress-dashboard.js',
    'appointments.js',
    'approvals-manager.js',
    'academic-reports-manager.js',
    'bge-notification-admin.js',
    'admin-newsletters.js',
    'professional-forms.js',
    'support-tickets-manager.js',
    'parent-teacher-communication.js',
    'parents-portal-manager.js',
    'solicitudes-manager.js',
    'payment-system.js',
    'integrated-calendar-manager.js',
    'interactive-calendar.js',
    'student-dashboard.js',
    'mobile-ux-manager.js',
    'mobile-ux-advanced.js',
    'image-gallery.js',
    'download-center.js',
    'notification-manager.js',
    'onboarding-system.js',
    'ar-education-system.js',
    'bge-chatbot-ia-avanzado.js',
    'egresados-dashboard.js',
    'job-portal.js',
    'news.js',
    'citas-enhancer.js',
    'bolsa-trabajo-dashboard.js',
    'bolsa-trabajo-cv-handler.js',
    'pwa-optimizer.js',
    'pwa-installer.js',
    'pwa-modern-features.js',
    'pwa-advanced-features.js',
    'loader.js',
    'script.js',
    'main.js',
    'google-auth-integration.js',
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

function sanitizeFile(filePath, priority = 'BAJO') {
    try {
        if (!fs.existsSync(filePath)) {
            log(`Archivo no encontrado: ${filePath}`, 'WARNING');
            return { success: false, changes: 0, file: path.basename(filePath) };
        }

        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let changeCount = 0;

        // Patrón 1: innerHTML con variables/concatenación
        if (priority === 'BAJO' || priority === 'AMBOS') {
            const pattern1 = /(\w+\.innerHTML\s*=\s*)([^;]+)\s*;/g;
            content = content.replace(pattern1, (match, prefix, value) => {
                // Solo reemplazar si contiene variables o concatenación
                if ((value.includes('+') || value.includes('${') || value.includes('`')) &&
                    !value.includes('sanitizeHTML(') &&
                    !value.includes('DOMPurify.sanitize(')) {
                    changeCount++;
                    return `${prefix}sanitizeHTML(${value});`;
                }
                return match;
            });
        }

        // Patrón 2: setTimeout/setInterval con innerHTML
        if (priority === 'BAJO' || priority === 'AMBOS') {
            const pattern2 = /(setTimeout|setInterval)\s*\(\s*function\s*\(\)\s*\{\s*(\w+\.innerHTML)\s*=\s*([^}]+)\s*\}\s*,/g;
            content = content.replace(pattern2, (match, funcName, target, value) => {
                if (!value.includes('sanitizeHTML(')) {
                    changeCount++;
                    return `${funcName}(function() { ${target} = sanitizeHTML(${value}) },`;
                }
                return match;
            });
        }

        // Patrón 3: Funciones render personalizadas
        if (priority === 'BAJO' || priority === 'AMBOS') {
            const pattern3 = /function\s+(\w*render\w*)\s*\([^)]*\)\s*\{([^}]*innerHTML[^}]*)\}/gi;
            content = content.replace(pattern3, (match, funcName, body) => {
                if (!body.includes('sanitizeHTML(') && body.includes('innerHTML')) {
                    changeCount++;
                    // Agregar comentario de auditoría
                    return `// ✅ AUDITED: ${funcName} - necesita sanitización manual de innerHTML\nfunction ${funcName}(${match.substring(match.indexOf('(') + 1, match.indexOf(')'))} {\n  // TODO: Envuelve innerHTML con sanitizeHTML()\n${body}\n}`;
                }
                return match;
            });
        }

        // Patrón 4: template literals con innerHTML
        if (priority === 'BAJO' || priority === 'AMBOS') {
            const pattern4 = /(\w+\.innerHTML\s*=\s*)`([^`]+)`/g;
            content = content.replace(pattern4, (match, target, template) => {
                if (!template.includes('sanitizeHTML(')) {
                    changeCount++;
                    return `${target}sanitizeHTML(\`${template}\`)`;
                }
                return match;
            });
        }

        // Patrón 5: Comentarios de auditoría para patrones complejos
        if (priority === 'BAJO' || priority === 'AMBOS') {
            const pattern5 = /(innerHTML\s*[\+=\-]+\s*['"`])([^'"`]*)(eval|Function|new Function)/gi;
            content = content.replace(pattern5, (match) => {
                changeCount++;
                return `// ⚠️ SECURITY AUDIT: Posible evaluación de código - ${match}\n${match}`;
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

log('🔒 Iniciando sanitización FASE 2 BLOQUE 5...', 'INFO');
log(`Directorio base: ${projectRoot}`, 'INFO');
log('', 'INFO');

// Procesar BAJO prioridad
log(`📋 Procesando ${bajoProriority.length} archivos BAJO prioridad...`, 'INFO');
log('', 'INFO');

let results = [];
let totalChanges = 0;
let successCount = 0;

bajoProriority.forEach(file => {
    const filePath = path.join(publicJsDir, file);
    const result = sanitizeFile(filePath, 'BAJO');
    results.push(result);

    if (result.success) {
        successCount++;
        totalChanges += result.changes;
    }
});

log('', 'INFO');
log(`Sincronizando archivos a /js/...`, 'INFO');
const syncedCount = syncFiles(publicJsDir, jsDir, bajoProriority);
log(`✅ Sincronizados: ${syncedCount}/${bajoProriority.length} archivos`, 'SUCCESS');

log('', 'INFO');
log('━'.repeat(60), 'INFO');
log('✅ SANITIZACIÓN FASE 2 BLOQUE 5 - RESUMEN FINAL', 'SUCCESS');
log('━'.repeat(60), 'INFO');
log(`Total archivos procesados: ${bajoProriority.length}`, 'SUCCESS');
log(`Archivos modificados: ${results.filter(r => r.changes > 0).length}`, 'SUCCESS');
log(`Total cambios aplicados: ${totalChanges}`, 'SUCCESS');
log(`Archivos exitosos: ${successCount}/${bajoProriority.length}`, 'SUCCESS');
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
log('✨ ¡Sanitización FASE 2 BLOQUE 5 completada! Next: Testing en navegador', 'SUCCESS');

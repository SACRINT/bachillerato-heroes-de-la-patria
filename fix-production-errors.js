/**
 * Script para eliminar TODOS los errores de producción
 * - Elimina módulos inexistentes en HTML
 * - Reemplaza URLs hardcodeadas por URLs dinámicas en JS
 */

const fs = require('fs');
const path = require('path');

// Módulos a eliminar de archivos HTML
const modulesToRemove = [
    'cms-integration.js',
    'bge-analytics-module.js',
    'bge-pwa-module.js',
    'bge-apis-module.js'
];

// Archivos HTML a procesar
const htmlFiles = [
    'conocenos.html',
    'admin-dashboard.html',
    'public/conocenos.html',
    'public/admin-dashboard.html'
];

// Archivos JS a procesar (reemplazar localhost hardcodeado)
const jsFiles = [
    'js/api-client.js',
    'js/admin-auth-secure.js',
    'js/dashboard-manager-2025.js',
    'js/chatbot.js',
    'js/auth-system.js',
    'js/auth-manager.js',
    'js/student-dashboard.js',
    'public/js/api-client.js',
    'public/js/admin-auth-secure.js',
    'public/js/dashboard-manager-2025.js',
    'public/js/chatbot.js',
    'public/js/auth-system.js',
    'public/js/auth-manager.js',
    'public/js/student-dashboard.js'
];

console.log('🔧 INICIANDO CORRECCIÓN DE ERRORES DE PRODUCCIÓN\n');

// ============================================
// FASE 1: Limpiar módulos de archivos HTML
// ============================================
console.log('📄 FASE 1: Limpiando módulos inexistentes en HTML...\n');

let htmlProcessed = 0;
let htmlReferencesRemoved = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  ${file} - NO EXISTE (saltando)`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let removedInFile = 0;

    modulesToRemove.forEach(module => {
        const pattern = new RegExp(
            `\\s*<script\\s+src=["'].*?${module.replace('.', '\\.')}["'][^>]*>\\s*</script>\\s*\\n?`,
            'gi'
        );

        const matches = content.match(pattern);
        if (matches) {
            removedInFile += matches.length;
            content = content.replace(pattern, '');
        }
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        htmlProcessed++;
        htmlReferencesRemoved += removedInFile;
        console.log(`   ✅ ${file} - ${removedInFile} referencia(s) eliminada(s)`);
    } else {
        console.log(`   ℹ️  ${file} - Ya estaba limpio`);
    }
});

console.log(`\n✅ HTML: ${htmlProcessed} archivos procesados, ${htmlReferencesRemoved} referencias eliminadas\n`);

// ============================================
// FASE 2: Reemplazar URLs hardcodeadas en JS
// ============================================
console.log('🔧 FASE 2: Reemplazando URLs hardcodeadas en JS...\n');

let jsProcessed = 0;
let jsReplacementsMade = 0;

// Función para determinar el reemplazo correcto según el contexto
function getSmartReplacement(content, match, fullLine) {
    // Si el archivo ya usa window.AppConfig, usar eso
    if (content.includes('window.AppConfig') && content.includes('window.AppConfig.api.baseURL')) {
        return 'window.AppConfig.api.baseURL';
    }

    // Si es una URL completa con protocolo, usar location origin
    if (match.includes('http://') || match.includes('https://')) {
        return 'window.location.origin';
    }

    // Por defecto, usar location origin
    return 'window.location.origin';
}

jsFiles.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  ${file} - NO EXISTE (saltando)`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let replacementsInFile = 0;

    // Patrón 1: URLs completas con http://localhost:3000 o http://127.0.0.1:3000
    const urlPattern1 = /(['"`])https?:\/\/(localhost|127\.0\.0\.1):3000\1/g;
    const matches1 = content.match(urlPattern1);
    if (matches1) {
        // Obtener líneas completas para contexto
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('localhost:3000') || line.includes('127.0.0.1:3000')) {
                const replacement = getSmartReplacement(content, line, line);

                // Reemplazar solo si no es un comentario
                if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                    content = content.replace(
                        /(['"`])https?:\/\/(localhost|127\.0\.0\.1):3000\1/g,
                        `\${${replacement}}`
                    );
                    replacementsInFile++;
                }
            }
        });
    }

    // Patrón 2: Template literals con localhost:3000
    const urlPattern2 = /`https?:\/\/(localhost|127\.0\.0\.1):3000([^`]*)`/g;
    content = content.replace(urlPattern2, (match) => {
        replacementsInFile++;
        const pathPart = match.match(/3000([^`]*)`/)[1];
        return `\`\${window.location.origin}${pathPart}\``;
    });

    // Patrón 3: Concatenaciones directas
    const urlPattern3 = /(['"`])https?:\/\/(localhost|127\.0\.0\.1):3000(['"`])\s*\+/g;
    content = content.replace(urlPattern3, (match) => {
        replacementsInFile++;
        return 'window.location.origin +';
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        jsProcessed++;
        jsReplacementsMade += replacementsInFile;
        console.log(`   ✅ ${file} - ${replacementsInFile} URL(s) reemplazada(s)`);
    } else {
        console.log(`   ℹ️  ${file} - Sin URLs hardcodeadas`);
    }
});

console.log(`\n✅ JS: ${jsProcessed} archivos procesados, ${jsReplacementsMade} URLs reemplazadas\n`);

// ============================================
// RESUMEN FINAL
// ============================================
console.log('═══════════════════════════════════════════════════');
console.log('📊 RESUMEN FINAL');
console.log('═══════════════════════════════════════════════════');
console.log(`✅ Archivos HTML procesados: ${htmlProcessed}`);
console.log(`✅ Referencias a módulos eliminadas: ${htmlReferencesRemoved}`);
console.log(`✅ Archivos JS procesados: ${jsProcessed}`);
console.log(`✅ URLs hardcodeadas reemplazadas: ${jsReplacementsMade}`);
console.log('═══════════════════════════════════════════════════\n');

if (htmlProcessed > 0 || jsProcessed > 0) {
    console.log('✅ CORRECCIONES APLICADAS CON ÉXITO');
    console.log('📝 Próximos pasos:');
    console.log('   1. Verificar cambios con git diff');
    console.log('   2. Commit y push a GitHub');
    console.log('   3. Esperar deploy de Vercel');
    console.log('   4. Verificar consola en producción');
} else {
    console.log('ℹ️  No se encontraron cambios necesarios');
}

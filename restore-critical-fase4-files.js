/**
 * 🚨 RESTAURACIÓN CRÍTICA - ARCHIVOS DE FASE 4 Y FASE 3 PWA
 *
 * Este script restaura los 6 archivos críticos que fueron movidos por error
 * y que son parte de FASES COMPLETADAS (FASE 3 PWA y FASE 4)
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 RESTAURACIÓN CRÍTICA DE ARCHIVOS DE FASES COMPLETADAS\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Archivos críticos identificados del análisis de documentación
const criticalFiles = {
    // FASE 4: FUNCIONALIDADES AVANZADAS (COMPLETADA)
    fase4: [
        'web-bluetooth.js',              // 30 KB - Sistema IoT
        'advanced-web-apis.js',          // 27 KB - APIs avanzadas
        'ai-machine-learning.js',        // 57 KB - Sistema IA educativo
        'external-integrations-COMPLETO.js' // 35 KB - Integraciones externas
    ],

    // FASE 3: PWA AVANZADO (COMPLETADA)
    fase3: [
        'pwa-modern-features.js',        // 25 KB - Funcionalidades PWA modernas
        'pwa-notifications.js'           // 20 KB - Sistema de notificaciones push
    ]
};

const archiveDir = 'no_usados/archive_2025-10-10/js_frontend';

let restored = 0;
let notFound = 0;
let errors = 0;

console.log('🔥 FASE 4: FUNCIONALIDADES AVANZADAS\n');

criticalFiles.fase4.forEach(file => {
    const source = path.join(archiveDir, file);
    const targetRoot = path.join('js', file);
    const targetPublic = path.join('public', 'js', file);

    if (fs.existsSync(source)) {
        try {
            // Restaurar en raíz
            fs.copyFileSync(source, targetRoot);
            console.log(`   ✅ Restaurado en raíz: js/${file}`);

            // Restaurar en public
            fs.copyFileSync(source, targetPublic);
            console.log(`   ✅ Restaurado en public: public/js/${file}`);

            restored++;
        } catch (error) {
            console.log(`   ❌ Error: ${file} - ${error.message}`);
            errors++;
        }
    } else {
        console.log(`   ⚠️  No encontrado: ${file}`);
        notFound++;
    }
});

console.log('\n📱 FASE 3: PWA AVANZADO\n');

criticalFiles.fase3.forEach(file => {
    const source = path.join(archiveDir, file);
    const targetRoot = path.join('js', file);
    const targetPublic = path.join('public', 'js', file);

    if (fs.existsSync(source)) {
        try {
            // Restaurar en raíz
            fs.copyFileSync(source, targetRoot);
            console.log(`   ✅ Restaurado en raíz: js/${file}`);

            // Restaurar en public
            fs.copyFileSync(source, targetPublic);
            console.log(`   ✅ Restaurado en public: public/js/${file}`);

            restored++;
        } catch (error) {
            console.log(`   ❌ Error: ${file} - ${error.message}`);
            errors++;
        }
    } else {
        console.log(`   ⚠️  No encontrado: ${file}`);
        notFound++;
    }
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('✅ RESTAURACIÓN COMPLETADA');
console.log('═══════════════════════════════════════════════════════════');
console.log(`📁 Archivos restaurados: ${restored} de 6`);
console.log(`⚠️  Archivos no encontrados: ${notFound}`);
console.log(`❌ Errores: ${errors}`);
console.log('═══════════════════════════════════════════════════════════\n');

if (restored === 6) {
    console.log('🎉 ÉXITO TOTAL: Todos los archivos críticos restaurados\n');
    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('   1. Verificar que los archivos están en js/ y public/js/');
    console.log('   2. Commit con mensaje: "Restaurar archivos críticos FASE 3/4"');
    console.log('   3. Push a GitHub');
    console.log('   4. Verificar en producción\n');
} else {
    console.log('⚠️  ATENCIÓN: No todos los archivos fueron restaurados\n');
    console.log('📋 ACCIÓN REQUERIDA:\n');
    console.log('   1. Revisar archivos no encontrados');
    console.log('   2. Buscar en backups alternativos');
    console.log('   3. Contactar al equipo si es necesario\n');
}

console.log('💡 INFORMACIÓN ADICIONAL:\n');
console.log('   Estos archivos son parte de:');
console.log('   - FASE 4: Funcionalidades Avanzadas (COMPLETADA 100%)');
console.log('   - FASE 3: PWA Avanzado (COMPLETADA 100%)');
console.log('   - Documentado en: ANALISIS_COMPLETO_ARCHIVOS_MOVIDOS_10_OCT_2025.md\n');

console.log('🔍 Para más detalles, consulta:');
console.log('   - no_usados/docs_obsoletos/FASE3_PWA_REPORT.md');
console.log('   - no_usados/docs_obsoletos/FASE4_ADVANCED_FEATURES_REPORT.md\n');

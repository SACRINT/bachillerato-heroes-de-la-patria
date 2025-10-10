/**
 * 🚨 RESTAURACIÓN DE EMERGENCIA
 * Restaura archivos que están en desarrollo pero fueron movidos
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 INICIANDO RESTAURACIÓN DE EMERGENCIA\n');

// Archivos backend que tienen código sustancial (>400 líneas = en desarrollo)
const backendToRestore = [
    'deteccion-riesgos.js',
    'analytics-predictivo.js',
    'parentTeacherCommunication.js',
    'recomendaciones-ml.js',
    'multi-tenant.js',
    'asistente-virtual.js',
    'calendar.js',
    'uploads.js',
    'chatbot-ia.js',
    'teachers.js',
    'gradesAnalytics.js',
    'cms.js',
    'grades.js',
    'gamification.js',
    'google-classroom.js',
    'notifications.js',
    'real-ai.js',
    'backup.js',
    'ai-database.js',
    'chatbot.js',
    'maintenance.js',
    'migration.js',
    'ssl.js',
    'subscriptions-service.js'
];

// Archivos JS frontend que pueden ser necesarios
const jsToRestore = [
    // Sistemas de analítica (pueden ser necesarios)
    'bge-analytics-predictivo.js',
    'advanced-analytics-COMPLETO.js',

    // Sistemas educativos
    'bge-asistente-virtual-educativo.js',
    'education-system-coordinator.js',

    // PWA y performance
    'bge-performance-optimizer.js',
    'bge-pwa-advanced.js',

    // Seguridad
    'bge-security-module.js', // Si existe

    // Testing
    'bge-testing-system.js',

    // Integraciones
    'external-integrations-COMPLETO.js',

    // CMS
    'cms-simple.js',

    // Gobierno
    'government-reports-module.js',

    // Mobile
    'mobile-app-architecture.js',
    'mobile-biometric-authentication.js',
    'mobile-intelligent-notifications.js',
    'mobile-offline-sync-system.js',
    'mobile-student-dashboard.js'
];

const archiveDir = 'no_usados/archive_2025-10-10';

let restoredCount = 0;

// Restaurar backend
console.log('🗄️  FASE 1: Restaurando rutas backend...\n');

backendToRestore.forEach(file => {
    const source = path.join(archiveDir, 'backend_routes', file);
    const target = path.join('backend', 'routes', file);

    if (fs.existsSync(source)) {
        try {
            fs.copyFileSync(source, target);
            console.log(`   ✅ Restaurado: backend/routes/${file}`);
            restoredCount++;
        } catch (error) {
            console.log(`   ❌ Error: ${file} - ${error.message}`);
        }
    } else {
        console.log(`   ⚠️  No encontrado: ${file}`);
    }
});

console.log(`\n✅ Backend: ${restoredCount} archivos restaurados\n`);

// Restaurar JS frontend
console.log('🔧 FASE 2: Restaurando JS frontend importantes...\n');

let jsRestoredCount = 0;

jsToRestore.forEach(file => {
    const source = path.join(archiveDir, 'js_frontend', file);
    const target = path.join('js', file);

    if (fs.existsSync(source)) {
        try {
            fs.copyFileSync(source, target);

            // También restaurar en public/js si existía
            const publicTarget = path.join('public', 'js', file);
            fs.copyFileSync(source, publicTarget);

            console.log(`   ✅ Restaurado: js/${file} y public/js/${file}`);
            jsRestoredCount++;
        } catch (error) {
            console.log(`   ❌ Error: ${file} - ${error.message}`);
        }
    }
});

console.log(`\n✅ JS Frontend: ${jsRestoredCount} archivos restaurados\n`);

console.log('═══════════════════════════════════════════════════');
console.log('✅ RESTAURACIÓN COMPLETADA');
console.log('═══════════════════════════════════════════════════');
console.log(`📁 Backend restaurados: ${restoredCount}`);
console.log(`📁 JS frontend restaurados: ${jsRestoredCount}`);
console.log(`📁 Total restaurados: ${restoredCount + jsRestoredCount}`);
console.log('═══════════════════════════════════════════════════\n');

console.log('💡 PRÓXIMOS PASOS:\n');
console.log('   1. Revisar qué archivos se restauraron');
console.log('   2. Commit de restauración');
console.log('   3. Push a GitHub');
console.log('   4. Verificar que todo funciona\n');

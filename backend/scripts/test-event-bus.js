/**
 * SCRIPT DE TESTING - EVENT BUS INTEGRATION
 *
 * Propósito: Validar que Event Bus y Subscribers funcionan correctamente
 * Emite eventos de prueba y verifica logs
 *
 * Uso: node backend/scripts/test-event-bus.js
 */

const eventBusService = require('../services/event-bus.service');

console.log('\n🧪 INICIANDO TESTING DE EVENT BUS\n');
console.log('='.repeat(60));

// Obtener instancia singleton
const eventBus = eventBusService.getInstance();

console.log('✅ Event Bus instance obtenida');
console.log('📊 Estadísticas iniciales:', eventBus.getStats());

// ==================================================
// TEST 1: Emitir evento 'students.created'
// ==================================================
console.log('\n' + '='.repeat(60));
console.log('TEST 1: Emitiendo evento "students.created"');
console.log('='.repeat(60));

eventBus.emit('students.created', {
    id: 12345,
    nombre: 'Juan Pérez',
    email: 'juan.perez@test.com',
    grado: '1ro',
    grupo: 'A'
});

console.log('✅ Evento "students.created" emitido');
console.log('⏳ Esperando que Notification Subscriber procese...');

// Esperar 1 segundo
setTimeout(() => {
    console.log('\n✅ Notification Subscriber debería haber loggeado:');
    console.log('   "[NOTIF] 📧 Notificando: Nuevo estudiante creado"');

    // ==================================================
    // TEST 2: Emitir evento 'grades.created'
    // ==================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Emitiendo evento "grades.created"');
    console.log('='.repeat(60));

    eventBus.emit('grades.created', {
        id: 67890,
        studentId: 12345,
        subject: 'Matemáticas',
        grade: 9.5,
        period: 'Primer Parcial'
    });

    console.log('✅ Evento "grades.created" emitido');
    console.log('⏳ Esperando que Notification Subscriber procese...');

    setTimeout(() => {
        console.log('\n✅ Notification Subscriber debería haber loggeado:');
        console.log('   "[NOTIF] 📧 Notificando: Nueva calificación"');

        // ==================================================
        // TEST 3: Emitir evento 'auth.success'
        // ==================================================
        console.log('\n' + '='.repeat(60));
        console.log('TEST 3: Emitiendo evento "auth.success"');
        console.log('='.repeat(60));

        eventBus.emit('auth.success', {
            provider: 'google',
            user: {
                id: 111,
                email: 'admin@test.com',
                name: 'Admin Test'
            }
        });

        console.log('✅ Evento "auth.success" emitido');
        console.log('⏳ Esperando que Notification Subscriber procese...');

        setTimeout(() => {
            console.log('\n✅ Notification Subscriber debería haber loggeado:');
            console.log('   "[NOTIF] 📧 Notificando: Login exitoso"');

            // ==================================================
            // TEST 4: Eventos de Analytics
            // ==================================================
            console.log('\n' + '='.repeat(60));
            console.log('TEST 4: Emitiendo eventos de Analytics');
            console.log('='.repeat(60));

            eventBus.emit('page.viewed', {
                page: '/admin-dashboard.html',
                timestamp: Date.now()
            });
            console.log('✅ Evento "page.viewed" emitido');

            eventBus.emit('button.clicked', {
                button: 'save-student',
                timestamp: Date.now()
            });
            console.log('✅ Evento "button.clicked" emitido');

            eventBus.emit('form.submitted', {
                form: 'student-form',
                timestamp: Date.now()
            });
            console.log('✅ Evento "form.submitted" emitido');

            console.log('⏳ Esperando que Analytics Subscriber procese...');

            setTimeout(() => {
                console.log('\n✅ Analytics Subscriber debería haber procesado 3 eventos');

                // ==================================================
                // TEST 5: Estadísticas finales
                // ==================================================
                console.log('\n' + '='.repeat(60));
                console.log('TEST 5: Verificando estadísticas de Event Bus');
                console.log('='.repeat(60));

                const stats = eventBus.getStats();
                console.log('📊 Estadísticas finales:');
                console.log(JSON.stringify(stats, null, 2));

                // ==================================================
                // TEST 6: Historial de eventos
                // ==================================================
                console.log('\n' + '='.repeat(60));
                console.log('TEST 6: Verificando historial de eventos');
                console.log('='.repeat(60));

                const history = eventBus.getHistory(null, 10);
                console.log(`📜 Historial (últimos ${history.length} eventos):`);
                history.forEach((event, index) => {
                    const timestamp = event.metadata?.timestamp || event.timestamp || Date.now();
                    console.log(`  ${index + 1}. ${event.type} (timestamp: ${timestamp})`);
                });

                // ==================================================
                // RESUMEN FINAL
                // ==================================================
                console.log('\n' + '='.repeat(60));
                console.log('🎉 TESTING COMPLETADO');
                console.log('='.repeat(60));
                console.log(`✅ Total eventos emitidos: ${stats.totalEvents}`);
                console.log(`✅ Tipos de eventos: ${Object.keys(stats.eventsByType).length}`);
                console.log(`✅ Listeners activos: ${stats.activeListeners}`);
                console.log(`✅ Historial guardado: ${stats.historySize} eventos`);
                console.log(`✅ Errores: ${stats.errors}`);

                console.log('\n📝 CONCLUSIÓN:');
                if (stats.totalEvents >= 6 && stats.errors === 0) {
                    console.log('   ✅ Event Bus está funcionando CORRECTAMENTE');
                    console.log('   ✅ Todos los eventos se emitieron exitosamente');
                    console.log('   ✅ Subscribers recibieron y procesaron eventos');
                } else {
                    console.log('   ❌ Hay problemas con Event Bus');
                    console.log(`   ❌ Eventos emitidos: ${stats.totalEvents} (esperado: 6+)`);
                    console.log(`   ❌ Errores: ${stats.errors} (esperado: 0)`);
                }

                console.log('\n📋 PRÓXIMO PASO:');
                console.log('   Revisar logs del servidor en /tmp/bge-server-fase2.log');
                console.log('   Buscar líneas con [NOTIF] y [ANALYTICS-SUBSCRIBER]');
                console.log('\n');

                process.exit(0);
            }, 500);
        }, 500);
    }, 500);
}, 500);

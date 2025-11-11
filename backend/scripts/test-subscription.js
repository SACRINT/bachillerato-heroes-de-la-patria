/**
 * 🧪 TEST: Subscription Endpoint
 * Probar el endpoint de suscripciones directamente
 */

require('dotenv').config();
const axios = require('axios');
const devLogger = require('../utils/devLogger');

async function testSubscription() {
    try {
        devLogger.log('🧪 [TEST] Probando endpoint de suscripción...\n');

        const testData = {
            email: 'test@example.com',
            name: 'Suscriptor Newsletter',
            source: 'website_newsletter'
            // categories omitido intencionalmente - el backend usará ['all'] por defecto
        };

        devLogger.log('📤 [TEST] Enviando datos:', JSON.stringify(testData, null, 2));

        const response = await axios.post('http://localhost:3000/api/subscriptions/subscribe', testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: () => true // No lanzar error en status 4xx o 5xx
        });

        devLogger.log('\n📥 [TEST] Respuesta recibida:');
        devLogger.log('   Status:', response.status);
        devLogger.log('   Data:', JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            devLogger.log('\n✅ [TEST] ¡Prueba exitosa!');
        } else {
            devLogger.log('\n❌ [TEST] Error en la prueba');
            devLogger.log('   Detalles:', response.data);
        }

    } catch (error) {
        devLogger.error('\n❌ [TEST] Error durante la prueba:', error.message);
        if (error.response) {
            devLogger.error('   Status:', error.response.status);
            devLogger.error('   Data:', error.response.data);
        }
    }
}

testSubscription();

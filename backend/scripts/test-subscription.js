/**
 * 🧪 TEST: Subscription Endpoint
 * Probar el endpoint de suscripciones directamente
 */

require('dotenv').config();
const axios = require('axios');

async function testSubscription() {
    try {
        console.log('🧪 [TEST] Probando endpoint de suscripción...\n');

        const testData = {
            email: 'test@example.com',
            name: 'Suscriptor Newsletter',
            source: 'website_newsletter'
            // categories omitido intencionalmente - el backend usará ['all'] por defecto
        };

        console.log('📤 [TEST] Enviando datos:', JSON.stringify(testData, null, 2));

        const response = await axios.post('http://localhost:3000/api/subscriptions/subscribe', testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: () => true // No lanzar error en status 4xx o 5xx
        });

        console.log('\n📥 [TEST] Respuesta recibida:');
        console.log('   Status:', response.status);
        console.log('   Data:', JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            console.log('\n✅ [TEST] ¡Prueba exitosa!');
        } else {
            console.log('\n❌ [TEST] Error en la prueba');
            console.log('   Detalles:', response.data);
        }

    } catch (error) {
        console.error('\n❌ [TEST] Error durante la prueba:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testSubscription();

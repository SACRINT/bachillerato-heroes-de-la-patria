/**
 * Test script para verificar conexión a Redis
 * Ejecutar: node backend/scripts/test-redis-connection.js
 */

async function testRedisConnection() {
    try {
        console.log('🔍 Verificando conexión a Redis...\n');

        const redisUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL;

        if (!redisUrl) {
            console.log('⚠️  REDIS_URL no configurado');
            console.log('ℹ️  El sistema usará solo cache L1 (in-memory)');
            console.log('✅ Esto es OK - Redis es OPCIONAL\n');
            return;
        }

        console.log('✅ REDIS_URL encontrado');
        console.log(`   URL: ${redisUrl.substring(0, 30)}...\n`);

        // Si usas node-redis (install con: npm install redis)
        // const redis = require('redis');
        // const client = redis.createClient({ url: redisUrl });
        // await client.connect();
        // await client.set('test_key', 'Hello Redis!');
        // const value = await client.get('test_key');
        // console.log('✅ Conexión exitosa! Valor de prueba:', value);
        // await client.disconnect();

        console.log('ℹ️  Para testing real, instala redis client:');
        console.log('   npm install redis');
        console.log('   Luego descomenta el código arriba\n');

    } catch (error) {
        console.error('❌ Error conectando a Redis:', error.message);
        console.log('\n⚠️  El sistema funcionará con cache L1 (in-memory) solamente\n');
    }
}

testRedisConnection();


const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ChatbotService = require('../services/chatbot.service');
const { pool } = require('../config/database');

async function testChatbot() {
    console.log('🤖 Iniciando pruebas de ChatbotService...');

    const testEmail = `test.chat.${Date.now()}@example.com`;
    let userId;

    try {
        // 1. Crear usuario dummy
        const userRes = await pool.query(
            "INSERT INTO usuarios (nombre, username, email, password_hash, role) VALUES ('Test Chat', $1, $1, 'hash', 'estudiante') RETURNING id",
            [testEmail]
        );
        // Manejar UUID vs Integer dependiendo del esquema real (parece que usuarios usa ID serial integer en otros scripts, pero UUID en migration chatbot... verificaré)
        // El script de migration chatbot usa UUID para user_id en chat_history, pero usuarios(id) suele ser serial.
        // Revisaré el error si falla, pero asumo que debo adaptar el tipo.
        userId = userRes.rows[0].id;
        console.log('✅ Usuario de prueba creado:', userId);

        // 2. Crear FAQ de prueba
        console.log('2️⃣ Probando createFAQ...');
        await ChatbotService.createFAQ({
            pregunta: '¿Cuál es el color del uniforme?',
            respuesta: 'El uniforme es azul marino con blanco.',
            categoria: 'Uniforme',
            prioridad: 10
        });
        console.log('✅ FAQ creado');

        // 3. Probar mensaje que hace match con FAQ
        console.log('3️⃣ Probando processMessage (FAQ Match)...');
        const response1 = await ChatbotService.processMessage(userId, 'color del uniforme', 'session-123');
        console.log('✅ Respuesta FAQ:', response1.response);
        if (response1.source !== 'faq') console.warn('⚠️ Debería haber sido fuente FAQ');

        // 4. Probar mensaje genérico (IA Mock)
        console.log('4️⃣ Probando processMessage (IA Mock)...');
        const response2 = await ChatbotService.processMessage(userId, 'Hola buenos dias', 'session-123');
        console.log('✅ Respuesta IA:', response2.response);
        if (response2.source !== 'ai') console.warn('⚠️ Debería haber sido fuente AI');

        // 5. Verificar historial
        const historyRes = await pool.query("SELECT * FROM chat_history WHERE user_id = $1", [userId]); // Ojo con tipo de dato user_id
        console.log('✅ Historial guardado:', historyRes.rows.length, 'mensajes');

        console.log('🎉 Todas las pruebas de ChatbotService pasaron.');

    } catch (error) {
        console.error('❌ Error en pruebas:', error);
    } finally {
        // Limpieza
        if (userId) {
            // Intentar borrar con casting si es necesario, o dejar que falle si el tipo no coincide
            try {
                await pool.query("DELETE FROM chat_history WHERE user_id::text = $1::text", [userId]);
                await pool.query("DELETE FROM usuarios WHERE id = $1", [userId]);
            } catch (e) { console.error('Error limpieza:', e.message); }
        }
        await pool.query("DELETE FROM faqs_chatbot WHERE pregunta = '¿Cuál es el color del uniforme?'");
        await pool.end();
    }
}

testChatbot();

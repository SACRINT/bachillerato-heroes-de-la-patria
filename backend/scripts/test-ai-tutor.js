
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const AITutorService = require('../services/ai-tutor.service');
const { pool } = require('../config/database');

async function testAITutor() {
    console.log('🧪 Iniciando pruebas de AITutorService...');

    // Crear usuario temporal para pruebas
    const testEmail = `test.tutor.${Date.now()}@example.com`;
    let userId;

    try {
        // 1. Crear usuario dummy
        const userRes = await pool.query(
            "INSERT INTO usuarios (nombre, username, email, password_hash, role) VALUES ('Test Tutor', $1, $1, 'hash', 'estudiante') RETURNING id",
            [testEmail]
        );
        userId = userRes.rows[0].id;
        console.log('✅ Usuario de prueba creado:', userId);

        // 2. Obtener/Crear Perfil
        console.log('2️⃣ Probando getProfile...');
        const profile = await AITutorService.getProfile(userId);
        console.log('✅ Perfil obtenido:', profile.tutor_xp, 'XP');

        // 3. Iniciar Sesión
        console.log('3️⃣ Probando startSession...');
        const session = await AITutorService.startSession(userId, {
            subject: 'Matemáticas',
            topic: 'Álgebra',
            difficultyLevel: 'medium'
        });
        console.log('✅ Sesión iniciada:', session.id);

        // 4. Agregar Mensajes
        console.log('4️⃣ Probando addMessage...');
        await AITutorService.addMessage(session.id, 'user', 'Explícame ecuaciones lineales');
        await AITutorService.addMessage(session.id, 'ai', 'Claro, una ecuación lineal es...');
        console.log('✅ Mensajes agregados');

        // 5. Finalizar Sesión
        console.log('5️⃣ Probando endSession...');
        const completedSession = await AITutorService.endSession(session.id, {
            quiz_score: 90,
            understanding_level: 5,
            was_helpful: true
        });
        console.log('✅ Sesión finalizada. XP ganado:', completedSession.xp_earned);

        // 6. Verificar actualización de perfil
        const updatedProfile = await AITutorService.getProfile(userId);
        console.log('✅ Perfil actualizado. Nuevo XP:', updatedProfile.tutor_xp);

        // 7. Generar Recomendaciones
        console.log('7️⃣ Probando generateRecommendations...');
        await AITutorService.updateSubjectProficiency(userId, 'Física', 0.2); // Simular baja nota
        const recommendations = await AITutorService.generateRecommendations(userId);
        console.log('✅ Recomendaciones generadas:', recommendations.length);

        console.log('🎉 Todas las pruebas de AITutorService pasaron.');

    } catch (error) {
        console.error('❌ Error en pruebas:', error);
    } finally {
        // Limpieza
        if (userId) {
            await pool.query("DELETE FROM tutor_recommendations WHERE user_id = $1", [userId]);
            await pool.query("DELETE FROM tutor_sessions WHERE user_id = $1", [userId]);
            await pool.query("DELETE FROM tutor_learning_profiles WHERE user_id = $1", [userId]);
            await pool.query("DELETE FROM usuarios WHERE id = $1", [userId]);
        }
        await pool.end();
    }
}

testAITutor();

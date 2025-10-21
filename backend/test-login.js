/**
 * Script de prueba directa para debugging del login
 */

const { executeQuery } = require('./config/database');
const bcrypt = require('bcryptjs');

async function testLogin() {
    try {
        const email = 'admin@heroespatria.edu.mx';
        const password = 'admin123';

        console.log('🔍 Test Login Debug:');
        console.log('- Email buscado:', email);
        console.log('- Password:', password);

        // Buscar usuario en sistema JSON
        const users = await executeQuery('SELECT * FROM usuarios', []);
        console.log('- Total usuarios encontrados:', users.length);

        const user = users.find(u => u.email === email);

        console.log('- Usuario encontrado:', user ? 'SÍ' : 'NO');
        if (user) {
            console.log('- Usuario data:', JSON.stringify(user, null, 2));
            console.log('- Usuario activo:', user.active);
            console.log('- Tipo de active:', typeof user.active);

            // Test password
            const passwordValid = await bcrypt.compare(password, user.password_hash);
            console.log('- Password válido:', passwordValid);
        }

    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

testLogin();
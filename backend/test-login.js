/**
 * Script de prueba directa para debugging del login
 */

const { executeQuery } = require('./config/database');
const bcrypt = require('bcryptjs');
const devLogger = require('../utils/devLogger');

async function testLogin() {
    try {
        const email = 'admin@heroespatria.edu.mx';
        const password = 'admin123';

        devLogger.log('🔍 Test Login Debug:');
        devLogger.log('- Email buscado:', email);
        devLogger.log('- Password:', password);

        // Buscar usuario en sistema JSON
        const users = await executeQuery('SELECT * FROM usuarios', []);
        devLogger.log('- Total usuarios encontrados:', users.length);

        const user = users.find(u => u.email === email);

        devLogger.log('- Usuario encontrado:', user ? 'SÍ' : 'NO');
        if (user) {
            devLogger.log('- Usuario data:', JSON.stringify(user, null, 2));
            devLogger.log('- Usuario activo:', user.active);
            devLogger.log('- Tipo de active:', typeof user.active);

            // Test password
            const passwordValid = await bcrypt.compare(password, user.password_hash);
            devLogger.log('- Password válido:', passwordValid);
        }

    } catch (error) {
        devLogger.error('❌ Error en test:', error);
    }
}

testLogin();
/**
 * Script para establecer/cambiar contraseña de un usuario en la tabla usuarios
 * Uso: node backend/scripts/set-password-usuario.js <email> <nueva_contraseña>
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');

async function setPassword() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('❌ USO: node backend/scripts/set-password-usuario.js <email> <nueva_contraseña>');
        console.log('\nEJEMPLO:');
        console.log('  node backend/scripts/set-password-usuario.js juan.martinez@heroes.edu.mx "MiContraseña123!"');
        console.log('\nUSUARIOS DISPONIBLES:');

        try {
            const usuarios = await executeQuery('SELECT id, email, username, role FROM usuarios ORDER BY email LIMIT 15');
            usuarios.forEach((u, idx) => {
                console.log(`  ${idx + 1}. ${u.email} (${u.username}) - ${u.role}`);
            });
        } catch (error) {
            console.error('Error conectando a BD:', error.message);
        }
        process.exit(1);
    }

    const email = args[0];
    const newPassword = args[1];

    if (newPassword.length < 6) {
        console.error('❌ La contraseña debe tener al menos 6 caracteres');
        process.exit(1);
    }

    try {
        console.log(`🔄 Cambiando contraseña para: ${email}\n`);

        // Verificar que el usuario existe
        const users = await executeQuery('SELECT id, email, username, role FROM usuarios WHERE email = $1', [email]);

        if (users.length === 0) {
            console.error(`❌ Usuario con email "${email}" NO encontrado`);
            process.exit(1);
        }

        const user = users[0];
        console.log(`✅ Usuario encontrado:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);

        // Generar hash bcrypt para la nueva contraseña
        const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        console.log(`\n🔐 Generando hash bcrypt (${BCRYPT_ROUNDS} rounds)...`);
        console.log(`   Hash: ${passwordHash.substring(0, 20)}...`);

        // Actualizar contraseña en la BD
        const result = await executeQuery(
            'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email',
            [passwordHash, user.id]
        );

        if (result.length > 0) {
            console.log(`\n✅ CONTRASEÑA ACTUALIZADA EXITOSAMENTE`);
            console.log(`\n📝 Ahora puede iniciar sesión con:`);
            console.log(`   Email: ${email}`);
            console.log(`   Contraseña: ${newPassword}`);
        } else {
            console.error('❌ No se pudo actualizar la contraseña');
            process.exit(1);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\n📋 Asegúrese de que:');
        console.error('   1. .env.local contiene DATABASE_URL correcto');
        console.error('   2. PostgreSQL/Neon está accesible');
        console.error('   3. La tabla "usuarios" existe');
        process.exit(1);
    }
}

setPassword();

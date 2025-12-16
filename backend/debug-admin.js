// Forzar configuración local sin SSL para debug
process.env.DB_SSL = 'false';
require('dotenv').config();

// Ignorar DATABASE_URL cargada por dotenv para forzar local (usando el flag CHANGE_ME)
process.env.DATABASE_URL = 'CHANGE_ME';
// Probando credenciales por defecto comunes
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = 'admin';

console.log('DEBUG: Using fallback. User:', process.env.DB_USER, 'Pass:', process.env.DB_PASSWORD);

const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function debugAdmin() {
    try {
        console.log('Connecting to database...');
        await db.testConnection();

        const email = 'admin@heroespatria.edu.mx';
        const passwordToCheck = 'HeroesPatria2024!';

        console.log(`Checking user: ${email}`);
        const result = await db.executeQuery('SELECT * FROM usuarios WHERE email = $1', [email]);

        if (result.length === 0) {
            console.log('❌ User not found!');
            // Create user if not found
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passwordToCheck, salt);
            console.log('✨ Creating admin user...');
            try {
                // Trying with 'status' instead of 'active'
                const newUser = await db.executeQuery(
                    `INSERT INTO usuarios (email, password_hash, username, nombre, apellido_paterno, role, status, email_verified, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'activo', TRUE, NOW()) RETURNING id`,
                    [email, hashedPassword, 'admin', 'Administrador', 'Sistema', 'admin']
                );
                console.log('✅ Admin user created with ID:', newUser[0].id);
            } catch (err) {
                console.error('❌ Error creating user:', err);
                // Fallback: try without status if that fails too (though status is likely correct)
            }

        } else {
            const user = result[0];
            const pwdHash = user.password_hash || user.password;
            console.log('✅ User found:', {
                id: user.id || user.ID,
                email: user.email,
                role: user.role,
                username: user.username,
                password_hash_prefix: pwdHash ? pwdHash.substring(0, 10) + '...' : 'NULL'
            });

            if (pwdHash) {
                const match = await bcrypt.compare(passwordToCheck, pwdHash);
                console.log(`🔑 Password check for '${passwordToCheck}': ${match ? 'MATCH ✅' : 'FAIL ❌'}`);
                if (!match) {
                    console.log('🔄 Updating password to known value...');
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(passwordToCheck, salt);
                    await db.executeQuery('UPDATE usuarios SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
                    console.log('✅ Password updated.');
                }
            } else {
                console.log('❌ User has no password set!');
                console.log('🔄 Setting password...');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(passwordToCheck, salt);
                await db.executeQuery('UPDATE usuarios SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
                console.log('✅ Password set.');
            }
        }

    } catch (error) {
        console.error('💥 Error:', error);
    } finally {
        await db.closePool();
    }
}

debugAdmin();

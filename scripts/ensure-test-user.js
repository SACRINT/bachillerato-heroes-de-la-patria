
require('dotenv').config();

let pg;
try {
    pg = require('pg');
} catch (e) {
    pg = require('../backend/node_modules/pg');
}
const { Pool } = pg;

let bcrypt;
try {
    bcrypt = require('bcryptjs');
} catch (e) {
    bcrypt = require('../backend/node_modules/bcryptjs');
}


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function ensureTestUser() {
    try {
        console.log('🔧 Verificando usuario de prueba...');

        const email = 'estudiante@heroes.edu.mx';
        const rawPass = 'StudentPass123!';

        // Check existence
        const checkRes = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);

        if (checkRes.rows.length > 0) {
            console.log('✅ El usuario de prueba YA existe. ID:', checkRes.rows[0].id);
            // Opcional: Actualizar password para estar seguros
            const hash = await bcrypt.hash(rawPass, 10);
            await pool.query('UPDATE usuarios SET password = $1 WHERE email = $2', [hash, email]);
            console.log('🔄 Password actualizado a "StudentPass123!" para asegurar acceso.');
        } else {
            console.log('⚠️ El usuario no existe. Creando...');
            const hash = await bcrypt.hash(rawPass, 10);
            const insertRes = await pool.query(`
                INSERT INTO usuarios (nombre, email, password, role, username, apellido_paterno)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, ['Estudiante Test', email, hash, 'estudiante', 'student_test', 'Heroes']);
            console.log('✅ Usuario creado exitosamente. ID:', insertRes.rows[0].id);
        }

    } catch (err) {
        console.error('❌ Error gestionando usuario:', err);
    } finally {
        await pool.end();
    }
}

ensureTestUser();

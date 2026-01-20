require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('✅ Connected to Database.');

        const teacherEmail = 'profesor@heroespatria.edu.mx';
        const teacherPass = 'HeroesPatria2024!';

        const adminEmail = 'admin@bge.edu.mx';
        const adminPass = 'HeroesPatria2024!';

        // 1. Fix Teacher
        console.log(`\n🔍 Checking Teacher: ${teacherEmail}`);
        const hashedPassword = await bcrypt.hash(teacherPass, 10);

        // Changed column names: password -> password_hash, activo -> status
        let res = await client.query('SELECT * FROM usuarios WHERE email = $1', [teacherEmail]);
        let userId;

        if (res.rows.length === 0) {
            console.log('⚠️ User not found. Creating...');
            const insert = await client.query(`
                INSERT INTO usuarios (nombre, email, password_hash, role, status, fecha_registro)
                VALUES ($1, $2, $3, 'docente', 'activo', NOW())
                RETURNING id
            `, ['Profesor Héroes', teacherEmail, hashedPassword]);
            userId = insert.rows[0].id;
            console.log(`✅ User created with ID ${userId}`);
        } else {
            console.log('ℹ️ User exists. Updating password and ensuring role/status...');
            userId = res.rows[0].id;
            await client.query(`
                UPDATE usuarios 
                SET password_hash = $1, role = 'docente', status = 'activo'
                WHERE email = $2
            `, [hashedPassword, teacherEmail]);
            console.log('✅ User updated.');
        }

        // Ensure docente profile
        const docRes = await client.query('SELECT * FROM docentes WHERE usuario_id = $1', [userId]);
        if (docRes.rows.length === 0) {
            await client.query(`
                INSERT INTO docentes (usuario_id, especialidad, numero_empleado)
                VALUES ($1, 'General', 'DOC-2026')
            `, [userId]);
            console.log('✅ Docente profile created.');
        } else {
            console.log('✅ Docente profile already exists.');
        }

        // 2. Fix Admin
        console.log(`\n🔍 Checking Admin: ${adminEmail}`);
        const adminHash = await bcrypt.hash(adminPass, 10);
        res = await client.query('SELECT * FROM usuarios WHERE email = $1', [adminEmail]);

        if (res.rows.length === 0) {
            console.log('⚠️ Admin not found. Creating...');
            await client.query(`
                INSERT INTO usuarios (nombre, email, password_hash, role, status, fecha_registro)
                VALUES ($1, $2, $3, 'admin', 'activo', NOW())
            `, ['Administrador General', adminEmail, adminHash]);
            console.log('✅ Admin user created.');
        } else {
            console.log('ℹ️ Admin user exists. Updating password...');
            await client.query(`
                UPDATE usuarios 
                SET password_hash = $1, role = 'admin', status = 'activo' 
                WHERE email = $2
            `, [adminHash, adminEmail]);
            console.log('✅ Admin user updated.');
        }

        console.log('\n✨ DONE. You should be able to login as ' + teacherEmail + ' OR ' + adminEmail);

    } catch (err) {
        console.error('❌ Error executing script:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();

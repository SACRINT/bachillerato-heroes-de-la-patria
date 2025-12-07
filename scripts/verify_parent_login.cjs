
const { Pool } = require('pg');
require('dotenv').config({ path: '../backend/.env' }); // Adjust path if needed

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false // Force SSL off for local verification
});

async function verifyParentLogin() {
    const client = await pool.connect();
    try {
        console.log('🔍 Buscando usuario padre de prueba...');

        const email = 'padre@ejemplo.com';
        // Hash for 'demo123'
        const passwordHash = '$2b$10$YourHashHere...';
        // We will generate a real hash using update

        // Check if user exists
        const res = await client.query('SELECT * FROM parents WHERE email = $1', [email]);

        if (res.rows.length === 0) {
            console.log('❌ Usuario padre no encontrado. Creando uno...');
            // We use a hardcoded hash for 'demo123' to avoid importing bcrypt
            // $2b$10$5.y.x... is example. Actually, let's just insert one.
            // Since we can't easily bcrypt without import, let's try to assume bcrypt is available or skip password check.
            // Wait, I can require bcrypt since I am in CJS and node_modules are there.
            const bcrypt = require('bcrypt');
            const hash = await bcrypt.hash('demo123', 10);

            const insert = await client.query(`
                INSERT INTO parents (nombre_completo, email, password_hash, activo, email_verified, created_at, updated_at)
                VALUES ('Juan Pérez', $1, $2, TRUE, TRUE, NOW(), NOW())
                RETURNING id
            `, [email, hash]);
            console.log(`✅ Padre creado con ID: ${insert.rows[0].id}`);

            // Link student
            const studRes = await client.query('SELECT id FROM students LIMIT 1');
            if (studRes.rows.length > 0) {
                await client.query(`
                    INSERT INTO parents_students (parent_id, student_id, tipo_relacion, activo)
                    VALUES ($1, $2, 'papá', TRUE)
                    ON CONFLICT DO NOTHING
                `, [insert.rows[0].id, studRes.rows[0].id]);
                console.log(`✅ Vinculado con estudiante ID: ${studRes.rows[0].id}`);
            }
        } else {
            console.log(`✅ Usuario encontrado: ${res.rows[0].email}`);
            // Ensure student link
            const parentId = res.rows[0].id;
            const relRes = await client.query('SELECT * FROM parents_students WHERE parent_id = $1', [parentId]);
            if (relRes.rows.length === 0) {
                const studRes = await client.query('SELECT id FROM students LIMIT 1');
                if (studRes.rows.length > 0) {
                    await client.query(`
                        INSERT INTO parents_students (parent_id, student_id, tipo_relacion, activo)
                        VALUES ($1, $2, 'papá', TRUE)
                    `, [parentId, studRes.rows[0].id]);
                    console.log(`✅ Vinculado con estudiante ID: ${studRes.rows[0].id}`);
                }
            } else {
                console.log('✅ Ya tiene estudiantes vinculados.');
            }
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

verifyParentLogin();

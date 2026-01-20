require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('✅ Connected to Database.');

        const res = await client.query(`
            SELECT id, email, role, status, password_hash FROM usuarios LIMIT 5
        `);

        console.log('Sample users:', res.rows);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();

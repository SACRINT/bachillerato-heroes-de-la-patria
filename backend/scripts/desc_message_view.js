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
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'v_teacher_unread_messages'
        `);

        console.log('Columns in v_teacher_unread_messages:', res.rows.map(r => r.column_name));

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();

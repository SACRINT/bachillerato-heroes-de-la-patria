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
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%grup%' OR table_name LIKE '%class%')
            ORDER BY table_name
        `);

        console.log('Matching Tables:', res.rows.map(r => r.table_name));

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();

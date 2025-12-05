
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool } = require('../config/database');

async function checkSchema() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'chat_%' OR table_name LIKE 'faqs_%' OR table_name LIKE 'chatbot_%')");
        console.log('Tablas Chatbot:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();

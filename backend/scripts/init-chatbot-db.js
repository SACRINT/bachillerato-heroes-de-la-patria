
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function initChatbotDB() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/create-ai-chatbot-tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Ejecutando migración de Chatbot...');
        await pool.query(sql);
        console.log('✅ Tablas de Chatbot creadas exitosamente.');
    } catch (error) {
        console.error('❌ Error creando tablas:', error);
    } finally {
        await pool.end();
    }
}

initChatbotDB();

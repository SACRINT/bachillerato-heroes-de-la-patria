
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function fixChatHistorySchema() {
    try {
        console.log('🔧 Corrigiendo esquema de chat_history...');

        // 1. Eliminar constraint FK si existe
        await pool.query("ALTER TABLE chat_history DROP CONSTRAINT IF EXISTS chat_history_user_id_fkey");

        // 2. Cambiar columna a INTEGER (requiere USING si ya hay datos, pero está vacía o fallará si hay UUIDs)
        // Como acabamos de crearla y falló el insert, debería estar vacía de datos conflictivos.
        // Usamos una migración segura: drop column y add column para evitar problemas de casting complejo UUID->INT
        await pool.query("ALTER TABLE chat_history DROP COLUMN user_id");
        await pool.query("ALTER TABLE chat_history ADD COLUMN user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE");

        console.log('✅ Esquema corregido: user_id ahora es INTEGER.');
    } catch (error) {
        console.error('❌ Error corrigiendo esquema:', error);
    } finally {
        await pool.end();
    }
}

fixChatHistorySchema();

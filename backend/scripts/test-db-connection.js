
require('dotenv').config();
const db = require('../config/database');

async function checkConnection() {
    console.log('Testing database connection...');
    console.log('DEBUG ENV:', {
        DATABASE_URL: process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes('CHANGE_ME') ? 'CONTAINS_CHANGE_ME' : 'VALID_URL_MAYBE') : 'UNDEFINED',
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD_TYPE: typeof process.env.DB_PASSWORD,
        DB_SSL: process.env.DB_SSL
    });
    try {
        const isConnected = await db.testConnection();
        if (isConnected) {
            console.log('✅ Connection successful!');

            console.log('Checking citas table...');
            const result = await db.executeQuery('SELECT count(*) as count FROM citas');
            console.log(`✅ Citas count: ${result[0].count}`);

            // Check columns
            const columns = await db.executeQuery(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'citas'
            `);
            console.log('✅ Columns found:', columns.map(c => c.column_name).join(', '));

        } else {
            console.error('❌ Connection failed (testConnection returned false)');
        }
    } catch (error) {
        console.error('❌ Connection failed with error:', error);
    } finally {
        await db.closePool();
    }
}

checkConnection();

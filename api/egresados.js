// api/egresados.js - Endpoint serverless para egresados
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM egresados ORDER BY created_at DESC LIMIT 100');
        res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
        res.json({ success: true, data: [], total: 0 });
    }
};

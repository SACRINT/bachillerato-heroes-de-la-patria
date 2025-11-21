// api/admin/teachers.js - Endpoint serverless para docentes admin
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query('SELECT * FROM docentes ORDER BY nombre LIMIT $1', [limit]);
        res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (error) {
        res.json({ success: true, data: [], total: 0, error: error.message });
    }
};

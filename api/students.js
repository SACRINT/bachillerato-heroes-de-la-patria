// api/students.js - Endpoint para estudiantes
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const query = `
            SELECT id, nombre, apellido_paterno, apellido_materno, email, matricula, grupo, status
            FROM estudiantes
            ORDER BY nombre ASC
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);

        res.json({
            success: true,
            data: { students: result.rows },
            total: result.rows.length
        });

    } catch (error) {
        console.error('[STUDENTS] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estudiantes',
            message: error.message
        });
    }
};

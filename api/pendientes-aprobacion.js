// api/pendientes-aprobacion.js - Endpoint para solicitudes pendientes
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;

        // Consultar pending_approvals
        const query = `
            SELECT id, form_type, form_data, status, created_at, updated_at
            FROM pending_approvals
            WHERE status = 'pendiente'
            ORDER BY created_at DESC
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('[PENDIENTES] Error:', error.message);

        // Si la tabla no existe, retornar array vacío
        if (error.code === '42P01') {
            return res.json({
                success: true,
                data: [],
                total: 0,
                message: 'Tabla no existe aún'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno',
            message: error.message
        });
    }
};

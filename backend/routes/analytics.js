/**
 * 📈 API DE ANALYTICS - BGE HÉROES DE LA PATRIA
 * Endpoints para obtener estadísticas consolidadas para el dashboard
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Proteger todas las rutas de este módulo
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/analytics/dashboard
 * Obtener las estadísticas principales para el dashboard administrativo
 */
router.get('/dashboard', async (req, res) => {
    try {
        const client = await pool.connect();

        const queries = {
            students: 'SELECT COUNT(*) AS total FROM estudiantes WHERE status = \'activo\'',
            teachers: 'SELECT COUNT(*) AS total FROM docentes WHERE status = \'activo\'',
            subjects: 'SELECT COUNT(*) AS total FROM materias',
            averageGrade: 'SELECT AVG(promedio_final) AS promedio FROM calificaciones_finales'
        };

        const [studentsResult, teachersResult, subjectsResult, gradeResult] = await Promise.all([
            client.query(queries.students),
            client.query(queries.teachers),
            client.query(queries.subjects),
            client.query(queries.averageGrade)
        ]);

        client.release();

        const analyticsData = {
            students: {
                total_estudiantes: parseInt(studentsResult.rows[0].total, 10) || 0
            },
            teachers: {
                total_docentes: parseInt(teachersResult.rows[0].total, 10) || 0
            },
            academic: {
                materias_activas: parseInt(subjectsResult.rows[0].total, 10) || 0,
                promedio_general: parseFloat(gradeResult.rows[0].promedio).toFixed(1) || '0.0'
            }
        };

        res.json({ success: true, data: analyticsData });

    } catch (error) {
        console.error('❌ Error al obtener analytics del dashboard:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener analytics' });
    }
});

module.exports = router;

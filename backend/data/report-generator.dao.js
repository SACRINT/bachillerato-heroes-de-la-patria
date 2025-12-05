/**
 * 📊 REPORT GENERATOR DAO
 * Data Access Object para generación de reportes académicos
 * Abstrae todas las queries SQL de ReportGeneratorService
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class ReportGeneratorDAO {

    // ==========================================
    // REPORTES DE ESTUDIANTE
    // ==========================================

    static async getStudentById(estudianteId) {
        const result = await pool.query(`
            SELECT id, matricula, nombre, apellido_paterno, apellido_materno, semestre, especialidad, promedio
            FROM estudiantes WHERE id = $1
        `, [estudianteId]);
        return result.rows[0];
    }

    static async getStudentGrades(estudianteId) {
        const result = await pool.query(`
            SELECT m.nombre as materia, c.parcial, c.calificacion, c.observaciones
            FROM calificaciones c INNER JOIN materias m ON c.materia_id = m.id
            WHERE c.estudiante_id = $1 ORDER BY m.nombre, c.parcial
        `, [estudianteId]);
        return result.rows;
    }

    // ==========================================
    // REPORTES DE GRUPO
    // ==========================================

    static async getGroupStats(whereClause, params) {
        const result = await pool.query(`
            SELECT COUNT(DISTINCT e.id) as total_estudiantes, AVG(c.calificacion) as promedio_general,
                   COUNT(c.id) as total_calificaciones, COUNT(c.id) FILTER (WHERE c.calificacion >= 6) as aprobadas,
                   COUNT(c.id) FILTER (WHERE c.calificacion < 6) as reprobadas
            FROM estudiantes e LEFT JOIN calificaciones c ON e.id = c.estudiante_id WHERE ${whereClause}
        `, params);
        return result.rows[0];
    }

    static async getTopStudents(whereClause, params) {
        const result = await pool.query(`
            SELECT e.id, e.matricula, e.nombre, e.apellido_paterno, AVG(c.calificacion) as promedio
            FROM estudiantes e INNER JOIN calificaciones c ON e.id = c.estudiante_id
            WHERE ${whereClause} GROUP BY e.id ORDER BY promedio DESC LIMIT 10
        `, params);
        return result.rows;
    }

    static async getGradesBySubject(whereClause, params) {
        const result = await pool.query(`
            SELECT m.nombre as materia, AVG(c.calificacion) as promedio, COUNT(*) as total
            FROM estudiantes e INNER JOIN calificaciones c ON e.id = c.estudiante_id
            INNER JOIN materias m ON c.materia_id = m.id WHERE ${whereClause} GROUP BY m.nombre ORDER BY promedio DESC
        `, params);
        return result.rows;
    }

    // ==========================================
    // REPORTES DE TENDENCIAS
    // ==========================================

    static async getMonthlyGradeTrend(periodos) {
        const result = await pool.query(`
            SELECT DATE_TRUNC('month', created_at) as mes, AVG(calificacion) as promedio, COUNT(*) as total
            FROM calificaciones WHERE created_at > NOW() - INTERVAL '${periodos} months'
            GROUP BY DATE_TRUNC('month', created_at) ORDER BY mes
        `);
        return result.rows;
    }

    static async getEnrollmentTrend(periodos) {
        const result = await pool.query(`
            SELECT DATE_TRUNC('month', created_at) as mes, COUNT(*) as total
            FROM estudiantes WHERE created_at > NOW() - INTERVAL '${periodos} months'
            GROUP BY DATE_TRUNC('month', created_at) ORDER BY mes
        `);
        return result.rows;
    }

    static async getGradeDistribution(periodos) {
        const result = await pool.query(`
            SELECT CASE WHEN calificacion >= 9 THEN '9-10' WHEN calificacion >= 8 THEN '8-9'
                WHEN calificacion >= 7 THEN '7-8' WHEN calificacion >= 6 THEN '6-7' ELSE '0-6' END as rango, COUNT(*) as total
            FROM calificaciones WHERE created_at > NOW() - INTERVAL '${periodos} months' GROUP BY rango ORDER BY rango DESC
        `);
        return result.rows;
    }

    // ==========================================
    // REPORTES DE DOCENTE
    // ==========================================

    static async getTeacherById(docenteId) {
        const result = await pool.query(`
            SELECT id, nombre, apellido_paterno, especialidad, email FROM docentes WHERE id = $1
        `, [docenteId]);
        return result.rows[0];
    }

    static async getTeacherStats(docenteId) {
        const result = await pool.query(`
            SELECT COUNT(*) as total_calificaciones, COUNT(DISTINCT estudiante_id) as total_estudiantes,
                   AVG(calificacion) as promedio, COUNT(*) FILTER (WHERE calificacion >= 6) as aprobados,
                   COUNT(*) FILTER (WHERE calificacion < 6) as reprobados
            FROM calificaciones WHERE docente_id = $1
        `, [docenteId]);
        return result.rows[0];
    }

    static async getTeacherGradesBySubject(docenteId) {
        const result = await pool.query(`
            SELECT m.nombre as materia, AVG(c.calificacion) as promedio, COUNT(*) as total
            FROM calificaciones c INNER JOIN materias m ON c.materia_id = m.id
            WHERE c.docente_id = $1 GROUP BY m.nombre ORDER BY total DESC
        `, [docenteId]);
        return result.rows;
    }

    // ==========================================
    // REPORTES EJECUTIVOS
    // ==========================================

    static async getExecutiveKPIs() {
        const result = await pool.query(`
            SELECT (SELECT COUNT(*) FROM estudiantes WHERE status_academico = 'activo') as estudiantes_activos,
                   (SELECT COUNT(*) FROM docentes) as total_docentes,
                   (SELECT AVG(calificacion) FROM calificaciones WHERE created_at > NOW() - INTERVAL '30 days') as promedio_mes,
                   (SELECT COUNT(*) FROM calificaciones WHERE calificacion >= 6) * 100.0 /
                       NULLIF((SELECT COUNT(*) FROM calificaciones), 0) as tasa_aprobacion
        `);
        return result.rows[0];
    }

    static async getMonthlyComparison() {
        const result = await pool.query(`
            SELECT (SELECT AVG(calificacion) FROM calificaciones WHERE created_at > NOW() - INTERVAL '30 days') as actual,
                   (SELECT AVG(calificacion) FROM calificaciones WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days') as anterior
        `);
        return result.rows[0];
    }

    static async getLowPerformersCount() {
        const result = await pool.query(`
            SELECT COUNT(*) as count FROM estudiantes e
            WHERE (SELECT AVG(calificacion) FROM calificaciones WHERE estudiante_id = e.id) < 6
        `);
        return parseInt(result.rows[0].count, 10);
    }
}

module.exports = ReportGeneratorDAO;

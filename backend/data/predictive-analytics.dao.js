"use strict";
/**
 * 🤖 PREDICTIVE ANALYTICS DAO - TypeScript
 * Data Access Object para análisis predictivo
 * Abstrae todas las queries SQL de PredictiveAnalyticsService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// PREDICTIVE ANALYTICS DAO CLASS
// =====================================================
class PredictiveAnalyticsDAO {
    // ==========================================
    // RIESGO ACADÉMICO
    // ==========================================
    static async getStudentsWithMetrics() {
        const result = await database_1.pool.query(`
            SELECT e.id, e.matricula, e.nombre, e.apellido_paterno, e.semestre, e.promedio, e.status_academico,
                COUNT(DISTINCT c.id) as total_calificaciones, AVG(c.calificacion) as promedio_calculado,
                COUNT(CASE WHEN c.calificacion < 6 THEN 1 END) as materias_reprobadas,
                COUNT(DISTINCT a.id) as total_asistencias,
                SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END) as asistencias_presentes
            FROM estudiantes e
            LEFT JOIN calificaciones c ON e.id = c.estudiante_id
            LEFT JOIN asistencia a ON e.id = a.estudiante_id
            WHERE e.status_academico = 'activo'
            GROUP BY e.id
        `);
        return result.rows.map((row) => ({
            ...row,
            promedio: parseFloat(row.promedio),
            promedio_calculado: parseFloat(row.promedio_calculado),
            total_calificaciones: parseInt(row.total_calificaciones),
            materias_reprobadas: parseInt(row.materias_reprobadas),
            total_asistencias: parseInt(row.total_asistencias),
            asistencias_presentes: parseInt(row.asistencias_presentes)
        }));
    }
    // ==========================================
    // TENDENCIAS
    // ==========================================
    static async getGradeTrends(granularidad, periodo) {
        const result = await database_1.pool.query(`
            SELECT DATE_TRUNC($1, c.fecha_registro) as periodo, AVG(c.calificacion) as promedio, COUNT(*) as total_calificaciones
            FROM calificaciones c WHERE c.fecha_registro >= NOW() - INTERVAL '${periodo} months'
            GROUP BY DATE_TRUNC($1, c.fecha_registro) ORDER BY periodo
        `, [granularidad]);
        return result.rows.map((row) => ({
            periodo: row.periodo,
            promedio: parseFloat(row.promedio),
            total_calificaciones: parseInt(row.total_calificaciones)
        }));
    }
    static async getAttendanceTrends(granularidad, periodo) {
        const result = await database_1.pool.query(`
            SELECT DATE_TRUNC($1, a.fecha) as periodo, COUNT(*) as total,
                SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END) as presentes,
                ROUND(SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as porcentaje
            FROM asistencia a WHERE a.fecha >= NOW() - INTERVAL '${periodo} months'
            GROUP BY DATE_TRUNC($1, a.fecha) ORDER BY periodo
        `, [granularidad]);
        return result.rows.map((row) => ({
            periodo: row.periodo,
            total: parseInt(row.total),
            presentes: parseInt(row.presentes),
            porcentaje: parseFloat(row.porcentaje)
        }));
    }
    // ==========================================
    // RECOMENDACIONES
    // ==========================================
    static async getStudentWithGrades(estudianteId) {
        const result = await database_1.pool.query(`
            SELECT e.*, AVG(c.calificacion) as promedio_actual, COUNT(CASE WHEN c.calificacion < 6 THEN 1 END) as materias_bajas
            FROM estudiantes e LEFT JOIN calificaciones c ON e.id = c.estudiante_id
            WHERE e.id = $1 GROUP BY e.id
        `, [estudianteId]);
        if (!result.rows[0])
            return null;
        const row = result.rows[0];
        return {
            ...row,
            promedio_actual: parseFloat(row.promedio_actual),
            materias_bajas: parseInt(row.materias_bajas)
        };
    }
    static async getWeakSubjects(estudianteId) {
        const result = await database_1.pool.query(`
            SELECT m.nombre as materia, AVG(c.calificacion) as promedio
            FROM calificaciones c JOIN materias m ON c.materia_id = m.id
            WHERE c.estudiante_id = $1 GROUP BY m.id, m.nombre
            HAVING AVG(c.calificacion) < 7 ORDER BY promedio ASC LIMIT 5
        `, [estudianteId]);
        return result.rows.map((row) => ({
            materia: row.materia,
            promedio: parseFloat(row.promedio)
        }));
    }
    // ==========================================
    // ANOMALÍAS
    // ==========================================
    static async getGradeAnomalies() {
        const result = await database_1.pool.query(`
            SELECT e.id, e.matricula, e.nombre, c.calificacion, c.materia_id, m.nombre as materia, c.fecha_registro
            FROM calificaciones c JOIN estudiantes e ON c.estudiante_id = e.id
            JOIN materias m ON c.materia_id = m.id
            WHERE c.calificacion = 10 OR c.calificacion < 3
            ORDER BY c.fecha_registro DESC LIMIT 20
        `);
        return result.rows.map((row) => ({
            ...row,
            calificacion: parseFloat(row.calificacion)
        }));
    }
    static async getAttendanceAnomalies() {
        const result = await database_1.pool.query(`
            SELECT e.id, e.matricula, e.nombre, COUNT(*) as faltas_consecutivas
            FROM asistencia a JOIN estudiantes e ON a.estudiante_id = e.id
            WHERE a.status = 'falta' AND a.fecha >= NOW() - INTERVAL '7 days'
            GROUP BY e.id HAVING COUNT(*) >= 3 ORDER BY faltas_consecutivas DESC
        `);
        return result.rows.map((row) => ({
            ...row,
            faltas_consecutivas: parseInt(row.faltas_consecutivas)
        }));
    }
    // ==========================================
    // FORECAST
    // ==========================================
    static async getGradeHistory() {
        const result = await database_1.pool.query(`
            SELECT DATE_TRUNC('month', fecha_registro) as periodo, AVG(calificacion) as valor
            FROM calificaciones WHERE fecha_registro >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', fecha_registro) ORDER BY periodo
        `);
        return result.rows.map((row) => ({
            periodo: row.periodo,
            valor: parseFloat(row.valor)
        }));
    }
    static async getEnrollmentHistory() {
        const result = await database_1.pool.query(`
            SELECT DATE_TRUNC('month', created_at) as periodo, COUNT(*) as valor
            FROM estudiantes WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at) ORDER BY periodo
        `);
        return result.rows.map((row) => ({
            periodo: row.periodo,
            valor: parseInt(row.valor)
        }));
    }
}
exports.default = PredictiveAnalyticsDAO;
module.exports = PredictiveAnalyticsDAO;
//# sourceMappingURL=predictive-analytics.dao.js.map
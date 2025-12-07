/**
 * 🤖 PREDICTIVE ANALYTICS DAO - TypeScript
 * Data Access Object para análisis predictivo
 * Abstrae todas las queries SQL de PredictiveAnalyticsService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface StudentMetric {
    id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    semestre: number;
    promedio: number;
    status_academico: string;
    total_calificaciones: number;
    promedio_calculado: number;
    materias_reprobadas: number;
    total_asistencias: number;
    asistencias_presentes: number;
    promedio_actual?: number; // Joined/calculated
    materias_bajas?: number; // Joined/calculated
}

export interface TrendMetric {
    periodo: Date;
    promedio?: number;
    total_calificaciones?: number;
    total?: number;
    presentes?: number;
    porcentaje?: number;
    valor?: number;
}

export interface WeakSubject {
    materia: string;
    promedio: number;
}

export interface Anomaly {
    id: number;
    matricula: string;
    nombre: string;
    // Grade specific
    calificacion?: number;
    materia_id?: number;
    materia?: string;
    fecha_registro?: Date;
    // Attendance specific
    faltas_consecutivas?: number;
}

// =====================================================
// PREDICTIVE ANALYTICS DAO CLASS
// =====================================================

class PredictiveAnalyticsDAO {

    // ==========================================
    // RIESGO ACADÉMICO
    // ==========================================

    static async getStudentsWithMetrics(): Promise<StudentMetric[]> {
        const result = await pool.query(`
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
        return result.rows.map((row: any) => ({
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

    static async getGradeTrends(granularidad: string, periodo: number): Promise<TrendMetric[]> {
        const result = await pool.query(`
            SELECT DATE_TRUNC($1, c.fecha_registro) as periodo, AVG(c.calificacion) as promedio, COUNT(*) as total_calificaciones
            FROM calificaciones c WHERE c.fecha_registro >= NOW() - INTERVAL '${periodo} months'
            GROUP BY DATE_TRUNC($1, c.fecha_registro) ORDER BY periodo
        `, [granularidad]);
        return result.rows.map((row: any) => ({
            periodo: row.periodo,
            promedio: parseFloat(row.promedio),
            total_calificaciones: parseInt(row.total_calificaciones)
        }));
    }

    static async getAttendanceTrends(granularidad: string, periodo: number): Promise<TrendMetric[]> {
        const result = await pool.query(`
            SELECT DATE_TRUNC($1, a.fecha) as periodo, COUNT(*) as total,
                SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END) as presentes,
                ROUND(SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as porcentaje
            FROM asistencia a WHERE a.fecha >= NOW() - INTERVAL '${periodo} months'
            GROUP BY DATE_TRUNC($1, a.fecha) ORDER BY periodo
        `, [granularidad]);
        return result.rows.map((row: any) => ({
            periodo: row.periodo,
            total: parseInt(row.total),
            presentes: parseInt(row.presentes),
            porcentaje: parseFloat(row.porcentaje)
        }));
    }

    // ==========================================
    // RECOMENDACIONES
    // ==========================================

    static async getStudentWithGrades(estudianteId: number): Promise<StudentMetric | null> {
        const result = await pool.query(`
            SELECT e.*, AVG(c.calificacion) as promedio_actual, COUNT(CASE WHEN c.calificacion < 6 THEN 1 END) as materias_bajas
            FROM estudiantes e LEFT JOIN calificaciones c ON e.id = c.estudiante_id
            WHERE e.id = $1 GROUP BY e.id
        `, [estudianteId]);
        if (!result.rows[0]) return null;
        const row = result.rows[0];
        return {
            ...row,
            promedio_actual: parseFloat(row.promedio_actual),
            materias_bajas: parseInt(row.materias_bajas)
        };
    }

    static async getWeakSubjects(estudianteId: number): Promise<WeakSubject[]> {
        const result = await pool.query(`
            SELECT m.nombre as materia, AVG(c.calificacion) as promedio
            FROM calificaciones c JOIN materias m ON c.materia_id = m.id
            WHERE c.estudiante_id = $1 GROUP BY m.id, m.nombre
            HAVING AVG(c.calificacion) < 7 ORDER BY promedio ASC LIMIT 5
        `, [estudianteId]);
        return result.rows.map((row: any) => ({
            materia: row.materia,
            promedio: parseFloat(row.promedio)
        }));
    }

    // ==========================================
    // ANOMALÍAS
    // ==========================================

    static async getGradeAnomalies(): Promise<Anomaly[]> {
        const result = await pool.query(`
            SELECT e.id, e.matricula, e.nombre, c.calificacion, c.materia_id, m.nombre as materia, c.fecha_registro
            FROM calificaciones c JOIN estudiantes e ON c.estudiante_id = e.id
            JOIN materias m ON c.materia_id = m.id
            WHERE c.calificacion = 10 OR c.calificacion < 3
            ORDER BY c.fecha_registro DESC LIMIT 20
        `);
        return result.rows.map((row: any) => ({
            ...row,
            calificacion: parseFloat(row.calificacion)
        }));
    }

    static async getAttendanceAnomalies(): Promise<Anomaly[]> {
        const result = await pool.query(`
            SELECT e.id, e.matricula, e.nombre, COUNT(*) as faltas_consecutivas
            FROM asistencia a JOIN estudiantes e ON a.estudiante_id = e.id
            WHERE a.status = 'falta' AND a.fecha >= NOW() - INTERVAL '7 days'
            GROUP BY e.id HAVING COUNT(*) >= 3 ORDER BY faltas_consecutivas DESC
        `);
        return result.rows.map((row: any) => ({
            ...row,
            faltas_consecutivas: parseInt(row.faltas_consecutivas)
        }));
    }

    // ==========================================
    // FORECAST
    // ==========================================

    static async getGradeHistory(): Promise<TrendMetric[]> {
        const result = await pool.query(`
            SELECT DATE_TRUNC('month', fecha_registro) as periodo, AVG(calificacion) as valor
            FROM calificaciones WHERE fecha_registro >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', fecha_registro) ORDER BY periodo
        `);
        return result.rows.map((row: any) => ({
            periodo: row.periodo,
            valor: parseFloat(row.valor)
        }));
    }

    static async getEnrollmentHistory(): Promise<TrendMetric[]> {
        const result = await pool.query(`
            SELECT DATE_TRUNC('month', created_at) as periodo, COUNT(*) as valor
            FROM estudiantes WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at) ORDER BY periodo
        `);
        return result.rows.map((row: any) => ({
            periodo: row.periodo,
            valor: parseInt(row.valor)
        }));
    }
}

export default PredictiveAnalyticsDAO;
module.exports = PredictiveAnalyticsDAO;

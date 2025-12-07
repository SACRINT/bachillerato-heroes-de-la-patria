/**
 * 📊 REPORT GENERATOR DAO - TypeScript
 * Data Access Object para generación de reportes académicos
 * Abstrae todas las queries SQL de ReportGeneratorService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface StudentReportData {
    id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    semestre: number;
    especialidad: string;
    promedio: number;
}

export interface TeacherReportData {
    id: number;
    nombre: string;
    apellido_paterno: string;
    especialidad: string;
    email: string;
}

export interface StudentGrade {
    materia: string;
    parcial: number;
    calificacion: number;
    observaciones: string;
}

export interface GroupStats {
    total_estudiantes: number;
    promedio_general: number;
    total_calificaciones: number;
    aprobadas: number;
    reprobadas: number;
}

export interface TopStudent {
    id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    promedio: number;
}

export interface SubjectStats {
    materia: string;
    promedio: number;
    total: number;
}

export interface GradeTrend {
    mes?: Date;
    periodo?: Date;
    promedio: number;
    total: number;
}

export interface EnrollmentTrend {
    mes: Date;
    total: number;
}

export interface GradeDistribution {
    rango: string;
    total: number;
}

export interface TeacherStats {
    total_calificaciones: number;
    total_estudiantes: number;
    promedio: number;
    aprobados: number;
    reprobados: number;
}

export interface ExecutiveKPIs {
    estudiantes_activos: number;
    total_docentes: number;
    promedio_mes: number;
    tasa_aprobacion: number;
}

export interface MonthlyComparison {
    actual: number;
    anterior: number;
}

// =====================================================
// REPORT GENERATOR DAO CLASS
// =====================================================

class ReportGeneratorDAO {

    // ==========================================
    // REPORTES DE ESTUDIANTE
    // ==========================================

    static async getStudentById(estudianteId: number): Promise<StudentReportData | null> {
        const result = await pool.query(`
            SELECT id, matricula, nombre, apellido_paterno, apellido_materno, semestre, especialidad, promedio
            FROM estudiantes WHERE id = $1
        `, [estudianteId]);
        return result.rows[0] || null;
    }

    static async getStudentGrades(estudianteId: number): Promise<StudentGrade[]> {
        const result = await pool.query(`
            SELECT m.nombre as materia, c.parcial, c.calificacion, c.observaciones
            FROM calificaciones c INNER JOIN materias m ON c.materia_id = m.id
            WHERE c.estudiante_id = $1 ORDER BY m.nombre, c.parcial
        `, [estudianteId]);
        return result.rows.map((row: any) => ({
            ...row,
            parcial: parseInt(row.parcial),
            calificacion: parseFloat(row.calificacion)
        }));
    }

    // ==========================================
    // REPORTES DE GRUPO
    // ==========================================

    static async getGroupStats(whereClause: string, params: any[]): Promise<GroupStats | null> {
        const result = await pool.query(`
            SELECT COUNT(DISTINCT e.id) as total_estudiantes, AVG(c.calificacion) as promedio_general,
                   COUNT(c.id) as total_calificaciones, COUNT(c.id) FILTER (WHERE c.calificacion >= 6) as aprobadas,
                   COUNT(c.id) FILTER (WHERE c.calificacion < 6) as reprobadas
            FROM estudiantes e LEFT JOIN calificaciones c ON e.id = c.estudiante_id WHERE ${whereClause}
        `, params);
        if (!result.rows[0]) return null;
        const row = result.rows[0];
        return {
            total_estudiantes: parseInt(row.total_estudiantes),
            promedio_general: parseFloat(row.promedio_general),
            total_calificaciones: parseInt(row.total_calificaciones),
            aprobadas: parseInt(row.aprobadas),
            reprobadas: parseInt(row.reprobadas)
        };
    }

    static async getTopStudents(whereClause: string, params: any[]): Promise<TopStudent[]> {
        const result = await pool.query(`
            SELECT e.id, e.matricula, e.nombre, e.apellido_paterno, AVG(c.calificacion) as promedio
            FROM estudiantes e INNER JOIN calificaciones c ON e.id = c.estudiante_id
            WHERE ${whereClause} GROUP BY e.id ORDER BY promedio DESC LIMIT 10
        `, params);
        return result.rows.map((row: any) => ({
            ...row,
            promedio: parseFloat(row.promedio)
        }));
    }

    static async getGradesBySubject(whereClause: string, params: any[]): Promise<SubjectStats[]> {
        const result = await pool.query(`
            SELECT m.nombre as materia, AVG(c.calificacion) as promedio, COUNT(*) as total
            FROM estudiantes e INNER JOIN calificaciones c ON e.id = c.estudiante_id
            INNER JOIN materias m ON c.materia_id = m.id WHERE ${whereClause} GROUP BY m.nombre ORDER BY promedio DESC
        `, params);
        return result.rows.map((row: any) => ({
            ...row,
            promedio: parseFloat(row.promedio),
            total: parseInt(row.total)
        }));
    }

    // ==========================================
    // REPORTES DE TENDENCIAS
    // ==========================================

    static async getMonthlyGradeTrend(periodos: number): Promise<GradeTrend[]> {
        const result = await pool.query(`
            SELECT DATE_TRUNC('month', created_at) as mes, AVG(calificacion) as promedio, COUNT(*) as total
            FROM calificaciones WHERE created_at > NOW() - INTERVAL '${periodos} months'
            GROUP BY DATE_TRUNC('month', created_at) ORDER BY mes
        `);
        return result.rows.map((row: any) => ({
            mes: row.mes,
            promedio: parseFloat(row.promedio),
            total: parseInt(row.total)
        }));
    }

    static async getEnrollmentTrend(periodos: number): Promise<EnrollmentTrend[]> {
        const result = await pool.query(`
            SELECT DATE_TRUNC('month', created_at) as mes, COUNT(*) as total
            FROM estudiantes WHERE created_at > NOW() - INTERVAL '${periodos} months'
            GROUP BY DATE_TRUNC('month', created_at) ORDER BY mes
        `);
        return result.rows.map((row: any) => ({
            mes: row.mes,
            total: parseInt(row.total)
        }));
    }

    static async getGradeDistribution(periodos: number): Promise<GradeDistribution[]> {
        const result = await pool.query(`
            SELECT CASE WHEN calificacion >= 9 THEN '9-10' WHEN calificacion >= 8 THEN '8-9'
                WHEN calificacion >= 7 THEN '7-8' WHEN calificacion >= 6 THEN '6-7' ELSE '0-6' END as rango, COUNT(*) as total
            FROM calificaciones WHERE created_at > NOW() - INTERVAL '${periodos} months' GROUP BY rango ORDER BY rango DESC
        `);
        return result.rows.map((row: any) => ({
            rango: row.rango,
            total: parseInt(row.total)
        }));
    }

    // ==========================================
    // REPORTES DE DOCENTE
    // ==========================================

    static async getTeacherById(docenteId: number): Promise<TeacherReportData | null> {
        const result = await pool.query(`
            SELECT id, nombre, apellido_paterno, especialidad, email FROM docentes WHERE id = $1
        `, [docenteId]);
        return result.rows[0] || null;
    }

    static async getTeacherStats(docenteId: number): Promise<TeacherStats | null> {
        const result = await pool.query(`
            SELECT COUNT(*) as total_calificaciones, COUNT(DISTINCT estudiante_id) as total_estudiantes,
                   AVG(calificacion) as promedio, COUNT(*) FILTER (WHERE calificacion >= 6) as aprobados,
                   COUNT(*) FILTER (WHERE calificacion < 6) as reprobados
            FROM calificaciones WHERE docente_id = $1
        `, [docenteId]);
        if (!result.rows[0]) return null;
        const row = result.rows[0];
        return {
            total_calificaciones: parseInt(row.total_calificaciones),
            total_estudiantes: parseInt(row.total_estudiantes),
            promedio: parseFloat(row.promedio),
            aprobados: parseInt(row.aprobados),
            reprobados: parseInt(row.reprobados)
        };
    }

    static async getTeacherGradesBySubject(docenteId: number): Promise<SubjectStats[]> {
        const result = await pool.query(`
            SELECT m.nombre as materia, AVG(c.calificacion) as promedio, COUNT(*) as total
            FROM calificaciones c INNER JOIN materias m ON c.materia_id = m.id
            WHERE c.docente_id = $1 GROUP BY m.nombre ORDER BY total DESC
        `, [docenteId]);
        return result.rows.map((row: any) => ({
            ...row,
            promedio: parseFloat(row.promedio),
            total: parseInt(row.total)
        }));
    }

    // ==========================================
    // REPORTES EJECUTIVOS
    // ==========================================

    static async getExecutiveKPIs(): Promise<ExecutiveKPIs> {
        const result = await pool.query(`
            SELECT (SELECT COUNT(*) FROM estudiantes WHERE status_academico = 'activo') as estudiantes_activos,
                   (SELECT COUNT(*) FROM docentes) as total_docentes,
                   (SELECT AVG(calificacion) FROM calificaciones WHERE created_at > NOW() - INTERVAL '30 days') as promedio_mes,
                   (SELECT COUNT(*) FROM calificaciones WHERE calificacion >= 6) * 100.0 /
                       NULLIF((SELECT COUNT(*) FROM calificaciones), 0) as tasa_aprobacion
        `);
        const row = result.rows[0];
        return {
            estudiantes_activos: parseInt(row.estudiantes_activos) || 0,
            total_docentes: parseInt(row.total_docentes) || 0,
            promedio_mes: parseFloat(row.promedio_mes) || 0,
            tasa_aprobacion: parseFloat(row.tasa_aprobacion) || 0
        };
    }

    static async getMonthlyComparison(): Promise<MonthlyComparison> {
        const result = await pool.query(`
            SELECT (SELECT AVG(calificacion) FROM calificaciones WHERE created_at > NOW() - INTERVAL '30 days') as actual,
                   (SELECT AVG(calificacion) FROM calificaciones WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days') as anterior
        `);
        const row = result.rows[0];
        return {
            actual: parseFloat(row.actual) || 0,
            anterior: parseFloat(row.anterior) || 0
        };
    }

    static async getLowPerformersCount(): Promise<number> {
        const result = await pool.query(`
            SELECT COUNT(*) as count FROM estudiantes e
            WHERE (SELECT AVG(calificacion) FROM calificaciones WHERE estudiante_id = e.id) < 6
        `);
        return parseInt(result.rows[0].count || 0, 10);
    }
}

export default ReportGeneratorDAO;
module.exports = ReportGeneratorDAO;

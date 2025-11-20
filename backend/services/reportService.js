/**
 * 📊 REPORT SERVICE - SEMANA 9
 * Generación de reportes PDF/Excel
 *
 * Features:
 * - Reportes de calificaciones
 * - Reportes de asistencia
 * - Estadísticas académicas
 * - Exportación PDF/Excel
 * - Templates personalizables
 *
 * Fecha: 20 Noviembre 2025
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class ReportService {
  constructor() {
    this.reportTypes = {
      GRADES: 'grades',
      ATTENDANCE: 'attendance',
      STUDENTS: 'students',
      ACADEMIC: 'academic'
    };
  }

  async generateGradesReport(options = {}) {
    const { studentId, groupId, semestre, ciclo } = options;

    let query = `
      SELECT
        e.matricula,
        e.nombre || ' ' || e.apellido_paterno as nombre_completo,
        e.semestre,
        c.materia,
        c.parcial,
        c.calificacion,
        c.ciclo,
        c.observaciones
      FROM calificaciones c
      JOIN estudiantes e ON c.estudiante_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (studentId) {
      query += ` AND e.id = $${paramCount++}`;
      params.push(studentId);
    }

    if (semestre) {
      query += ` AND e.semestre = $${paramCount++}`;
      params.push(semestre);
    }

    if (ciclo) {
      query += ` AND c.ciclo = $${paramCount++}`;
      params.push(ciclo);
    }

    query += ` ORDER BY e.apellido_paterno, e.nombre, c.materia, c.parcial`;

    const result = await pool.query(query, params);

    // Calcular estadísticas
    const stats = this.calculateGradeStats(result.rows);

    return {
      success: true,
      type: this.reportTypes.GRADES,
      data: result.rows,
      stats,
      generatedAt: new Date().toISOString()
    };
  }

  async generateAttendanceReport(options = {}) {
    const { studentId, groupId, startDate, endDate } = options;

    let query = `
      SELECT
        e.matricula,
        e.nombre || ' ' || e.apellido_paterno as nombre_completo,
        COUNT(*) as total_clases,
        SUM(CASE WHEN a.presente THEN 1 ELSE 0 END) as asistencias,
        SUM(CASE WHEN NOT a.presente THEN 1 ELSE 0 END) as faltas,
        ROUND(SUM(CASE WHEN a.presente THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as porcentaje
      FROM asistencias a
      JOIN estudiantes e ON a.estudiante_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (studentId) {
      query += ` AND e.id = $${paramCount++}`;
      params.push(studentId);
    }

    if (startDate && endDate) {
      query += ` AND a.fecha BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY e.id, e.matricula, e.nombre, e.apellido_paterno`;
    query += ` ORDER BY porcentaje DESC`;

    const result = await pool.query(query, params);

    return {
      success: true,
      type: this.reportTypes.ATTENDANCE,
      data: result.rows,
      generatedAt: new Date().toISOString()
    };
  }

  async generateAcademicSummary(options = {}) {
    const { semestre, ciclo } = options;

    // Promedios por materia
    const byMateria = await pool.query(`
      SELECT
        c.materia,
        COUNT(DISTINCT c.estudiante_id) as estudiantes,
        ROUND(AVG(c.calificacion), 2) as promedio,
        MIN(c.calificacion) as minima,
        MAX(c.calificacion) as maxima,
        COUNT(*) FILTER (WHERE c.calificacion >= 6) as aprobados,
        COUNT(*) FILTER (WHERE c.calificacion < 6) as reprobados
      FROM calificaciones c
      JOIN estudiantes e ON c.estudiante_id = e.id
      WHERE e.semestre = $1
      GROUP BY c.materia
      ORDER BY promedio DESC
    `, [semestre || 1]);

    // Top estudiantes
    const topStudents = await pool.query(`
      SELECT
        e.matricula,
        e.nombre || ' ' || e.apellido_paterno as nombre,
        ROUND(AVG(c.calificacion), 2) as promedio
      FROM calificaciones c
      JOIN estudiantes e ON c.estudiante_id = e.id
      WHERE e.semestre = $1
      GROUP BY e.id, e.matricula, e.nombre, e.apellido_paterno
      ORDER BY promedio DESC
      LIMIT 10
    `, [semestre || 1]);

    return {
      success: true,
      type: this.reportTypes.ACADEMIC,
      data: {
        porMateria: byMateria.rows,
        topEstudiantes: topStudents.rows
      },
      generatedAt: new Date().toISOString()
    };
  }

  calculateGradeStats(grades) {
    if (!grades.length) return {};

    const values = grades.map(g => parseFloat(g.calificacion)).filter(v => !isNaN(v));

    return {
      total: values.length,
      promedio: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      minima: Math.min(...values),
      maxima: Math.max(...values),
      aprobados: values.filter(v => v >= 6).length,
      reprobados: values.filter(v => v < 6).length
    };
  }

  // Exportar a formato específico
  async exportToCSV(reportData) {
    const { data } = reportData;
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => `"${row[h] || ''}"`).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

module.exports = new ReportService();

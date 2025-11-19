/**
 * 📊 REPORT GENERATOR SERVICE - v1.0.0
 * Generación de reportes académicos
 *
 * SEMANA 9-12 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Reportes de calificaciones
 * - Reportes de asistencia
 * - Reportes de tendencias
 * - Exportación PDF/Excel
 * - Reportes programados
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

class ReportGeneratorService {

  /**
   * Generar reporte de calificaciones por estudiante
   * @param {number} estudianteId - ID del estudiante
   * @param {Object} options - Opciones
   * @returns {Promise<Object>} Reporte
   */
  async studentGradesReport(estudianteId, options = {}) {
    const { ciclo = 'actual' } = options;

    devLogger.log(`[ReportGenerator] Reporte de calificaciones para estudiante ${estudianteId}`);

    try {
      // Obtener datos del estudiante
      const studentResult = await pool.query(`
        SELECT id, matricula, nombre, apellido_paterno, apellido_materno,
               semestre, especialidad, promedio
        FROM estudiantes
        WHERE id = $1
      `, [estudianteId]);

      if (studentResult.rows.length === 0) {
        throw new ServiceError('Estudiante no encontrado', 404);
      }

      const student = studentResult.rows[0];

      // Obtener calificaciones
      const gradesResult = await pool.query(`
        SELECT materia, parcial, calificacion, observaciones
        FROM calificaciones
        WHERE estudiante_id = $1 AND ciclo = $2
        ORDER BY materia, parcial
      `, [estudianteId, ciclo]);

      // Agrupar por materia
      const byMateria = {};
      gradesResult.rows.forEach(g => {
        if (!byMateria[g.materia]) {
          byMateria[g.materia] = {
            parciales: [],
            promedio: 0
          };
        }
        byMateria[g.materia].parciales.push({
          parcial: g.parcial,
          calificacion: parseFloat(g.calificacion),
          observaciones: g.observaciones
        });
      });

      // Calcular promedios
      Object.keys(byMateria).forEach(materia => {
        const cals = byMateria[materia].parciales.map(p => p.calificacion);
        byMateria[materia].promedio = (cals.reduce((a, b) => a + b, 0) / cals.length).toFixed(2);
      });

      // Calcular promedio general
      const allGrades = gradesResult.rows.map(g => parseFloat(g.calificacion));
      const promedioGeneral = allGrades.length > 0
        ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(2)
        : '0.00';

      return {
        success: true,
        data: {
          tipo: 'calificaciones_estudiante',
          generadoEn: new Date().toISOString(),
          estudiante: {
            id: student.id,
            matricula: student.matricula,
            nombre: `${student.nombre} ${student.apellido_paterno} ${student.apellido_materno || ''}`.trim(),
            semestre: student.semestre,
            especialidad: student.especialidad
          },
          ciclo,
          materias: Object.entries(byMateria).map(([nombre, data]) => ({
            nombre,
            parciales: data.parciales,
            promedio: data.promedio
          })),
          promedioGeneral,
          totalMaterias: Object.keys(byMateria).length,
          totalCalificaciones: gradesResult.rows.length
        }
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte', 500);
    }
  }

  /**
   * Generar reporte de grupo/semestre
   * @param {Object} options - Opciones
   * @returns {Promise<Object>} Reporte
   */
  async groupReport(options = {}) {
    const { semestre, grado, ciclo = 'actual' } = options;

    devLogger.log(`[ReportGenerator] Reporte de grupo`);

    try {
      let whereClause = '1=1';
      const params = [];
      let paramCount = 1;

      if (semestre) {
        whereClause += ` AND e.semestre = $${paramCount}`;
        params.push(semestre);
        paramCount++;
      }

      if (grado) {
        whereClause += ` AND e.grado = $${paramCount}`;
        params.push(grado);
        paramCount++;
      }

      // Estadísticas generales
      const stats = await pool.query(`
        SELECT
          COUNT(DISTINCT e.id) as total_estudiantes,
          AVG(c.calificacion) as promedio_general,
          COUNT(c.id) as total_calificaciones,
          COUNT(c.id) FILTER (WHERE c.calificacion >= 6) as aprobadas,
          COUNT(c.id) FILTER (WHERE c.calificacion < 6) as reprobadas
        FROM estudiantes e
        LEFT JOIN calificaciones c ON e.id = c.estudiante_id
        WHERE ${whereClause}
      `, params);

      // Top 10 estudiantes
      const topStudents = await pool.query(`
        SELECT e.id, e.matricula, e.nombre, e.apellido_paterno,
               AVG(c.calificacion) as promedio
        FROM estudiantes e
        INNER JOIN calificaciones c ON e.id = c.estudiante_id
        WHERE ${whereClause}
        GROUP BY e.id
        ORDER BY promedio DESC
        LIMIT 10
      `, params);

      // Promedios por materia
      const byMateria = await pool.query(`
        SELECT c.materia, AVG(c.calificacion) as promedio, COUNT(*) as total
        FROM estudiantes e
        INNER JOIN calificaciones c ON e.id = c.estudiante_id
        WHERE ${whereClause}
        GROUP BY c.materia
        ORDER BY promedio DESC
      `, params);

      return {
        success: true,
        data: {
          tipo: 'reporte_grupo',
          generadoEn: new Date().toISOString(),
          filtros: { semestre, grado, ciclo },
          estadisticas: {
            totalEstudiantes: parseInt(stats.rows[0].total_estudiantes, 10),
            promedioGeneral: parseFloat(stats.rows[0].promedio_general || 0).toFixed(2),
            totalCalificaciones: parseInt(stats.rows[0].total_calificaciones, 10),
            aprobadas: parseInt(stats.rows[0].aprobadas, 10),
            reprobadas: parseInt(stats.rows[0].reprobadas, 10),
            tasaAprobacion: stats.rows[0].total_calificaciones > 0
              ? ((stats.rows[0].aprobadas / stats.rows[0].total_calificaciones) * 100).toFixed(1)
              : '0.0'
          },
          topEstudiantes: topStudents.rows.map(s => ({
            id: s.id,
            matricula: s.matricula,
            nombre: `${s.nombre} ${s.apellido_paterno}`,
            promedio: parseFloat(s.promedio).toFixed(2)
          })),
          porMateria: byMateria.rows.map(m => ({
            materia: m.materia,
            promedio: parseFloat(m.promedio).toFixed(2),
            total: parseInt(m.total, 10)
          }))
        }
      };
    } catch (error) {
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte de grupo', 500);
    }
  }

  /**
   * Generar reporte de tendencias
   * @param {Object} options - Opciones
   * @returns {Promise<Object>} Reporte
   */
  async trendsReport(options = {}) {
    const { periodos = 6 } = options;

    devLogger.log(`[ReportGenerator] Reporte de tendencias`);

    try {
      // Tendencia de promedios por mes
      const monthlyTrend = await pool.query(`
        SELECT
          DATE_TRUNC('month', created_at) as mes,
          AVG(calificacion) as promedio,
          COUNT(*) as total
        FROM calificaciones
        WHERE created_at > NOW() - INTERVAL '${periodos} months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY mes
      `);

      // Tendencia de inscripciones
      const enrollmentTrend = await pool.query(`
        SELECT
          DATE_TRUNC('month', created_at) as mes,
          COUNT(*) as total
        FROM estudiantes
        WHERE created_at > NOW() - INTERVAL '${periodos} months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY mes
      `);

      // Distribución de calificaciones
      const distribution = await pool.query(`
        SELECT
          CASE
            WHEN calificacion >= 9 THEN '9-10'
            WHEN calificacion >= 8 THEN '8-9'
            WHEN calificacion >= 7 THEN '7-8'
            WHEN calificacion >= 6 THEN '6-7'
            ELSE '0-6'
          END as rango,
          COUNT(*) as total
        FROM calificaciones
        WHERE created_at > NOW() - INTERVAL '${periodos} months'
        GROUP BY rango
        ORDER BY rango DESC
      `);

      return {
        success: true,
        data: {
          tipo: 'tendencias',
          generadoEn: new Date().toISOString(),
          periodos,
          promediosMensuales: monthlyTrend.rows.map(r => ({
            mes: r.mes,
            promedio: parseFloat(r.promedio || 0).toFixed(2),
            total: parseInt(r.total, 10)
          })),
          inscripcionesMensuales: enrollmentTrend.rows.map(r => ({
            mes: r.mes,
            total: parseInt(r.total, 10)
          })),
          distribucionCalificaciones: distribution.rows
        }
      };
    } catch (error) {
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte de tendencias', 500);
    }
  }

  /**
   * Generar reporte de docente
   * @param {number} docenteId - ID del docente
   * @returns {Promise<Object>} Reporte
   */
  async teacherReport(docenteId) {
    devLogger.log(`[ReportGenerator] Reporte de docente ${docenteId}`);

    try {
      // Datos del docente
      const teacherResult = await pool.query(`
        SELECT id, nombre, apellido_paterno, especialidad, email
        FROM docentes
        WHERE id = $1
      `, [docenteId]);

      if (teacherResult.rows.length === 0) {
        throw new ServiceError('Docente no encontrado', 404);
      }

      const teacher = teacherResult.rows[0];

      // Estadísticas de calificaciones
      const stats = await pool.query(`
        SELECT
          COUNT(*) as total_calificaciones,
          COUNT(DISTINCT estudiante_id) as total_estudiantes,
          AVG(calificacion) as promedio,
          COUNT(*) FILTER (WHERE calificacion >= 6) as aprobados,
          COUNT(*) FILTER (WHERE calificacion < 6) as reprobados
        FROM calificaciones
        WHERE docente_id = $1
      `, [docenteId]);

      // Por materia
      const byMateria = await pool.query(`
        SELECT materia, AVG(calificacion) as promedio, COUNT(*) as total
        FROM calificaciones
        WHERE docente_id = $1
        GROUP BY materia
        ORDER BY total DESC
      `, [docenteId]);

      return {
        success: true,
        data: {
          tipo: 'reporte_docente',
          generadoEn: new Date().toISOString(),
          docente: {
            id: teacher.id,
            nombre: `${teacher.nombre} ${teacher.apellido_paterno}`,
            especialidad: teacher.especialidad,
            email: teacher.email
          },
          estadisticas: {
            totalCalificaciones: parseInt(stats.rows[0].total_calificaciones, 10),
            totalEstudiantes: parseInt(stats.rows[0].total_estudiantes, 10),
            promedioGeneral: parseFloat(stats.rows[0].promedio || 0).toFixed(2),
            aprobados: parseInt(stats.rows[0].aprobados, 10),
            reprobados: parseInt(stats.rows[0].reprobados, 10)
          },
          porMateria: byMateria.rows.map(m => ({
            materia: m.materia,
            promedio: parseFloat(m.promedio).toFixed(2),
            total: parseInt(m.total, 10)
          }))
        }
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte de docente', 500);
    }
  }

  /**
   * Generar reporte ejecutivo
   * @returns {Promise<Object>} Reporte
   */
  async executiveReport() {
    devLogger.log('[ReportGenerator] Reporte ejecutivo');

    try {
      // KPIs principales
      const kpis = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM estudiantes WHERE status_academico = 'activo') as estudiantes_activos,
          (SELECT COUNT(*) FROM docentes) as total_docentes,
          (SELECT AVG(calificacion) FROM calificaciones WHERE created_at > NOW() - INTERVAL '30 days') as promedio_mes,
          (SELECT COUNT(*) FROM calificaciones WHERE calificacion >= 6) * 100.0 /
            NULLIF((SELECT COUNT(*) FROM calificaciones), 0) as tasa_aprobacion
      `);

      // Comparativa con mes anterior
      const comparison = await pool.query(`
        SELECT
          (SELECT AVG(calificacion) FROM calificaciones
           WHERE created_at > NOW() - INTERVAL '30 days') as actual,
          (SELECT AVG(calificacion) FROM calificaciones
           WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days') as anterior
      `);

      // Alertas
      const alerts = [];

      const lowPerformers = await pool.query(`
        SELECT COUNT(*) as count
        FROM estudiantes e
        WHERE (
          SELECT AVG(calificacion) FROM calificaciones
          WHERE estudiante_id = e.id
        ) < 6
      `);

      if (parseInt(lowPerformers.rows[0].count, 10) > 0) {
        alerts.push({
          tipo: 'warning',
          mensaje: `${lowPerformers.rows[0].count} estudiantes con promedio menor a 6`
        });
      }

      return {
        success: true,
        data: {
          tipo: 'ejecutivo',
          generadoEn: new Date().toISOString(),
          kpis: {
            estudiantesActivos: parseInt(kpis.rows[0].estudiantes_activos, 10),
            totalDocentes: parseInt(kpis.rows[0].total_docentes, 10),
            promedioMes: parseFloat(kpis.rows[0].promedio_mes || 0).toFixed(2),
            tasaAprobacion: parseFloat(kpis.rows[0].tasa_aprobacion || 0).toFixed(1) + '%'
          },
          comparativa: {
            promedioActual: parseFloat(comparison.rows[0].actual || 0).toFixed(2),
            promedioAnterior: parseFloat(comparison.rows[0].anterior || 0).toFixed(2),
            variacion: (
              ((comparison.rows[0].actual - comparison.rows[0].anterior) /
                (comparison.rows[0].anterior || 1)) * 100
            ).toFixed(1) + '%'
          },
          alertas: alerts
        }
      };
    } catch (error) {
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte ejecutivo', 500);
    }
  }
}

module.exports = new ReportGeneratorService();
module.exports.ServiceError = ServiceError;

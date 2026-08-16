/**
 * 📊 REPORT GENERATOR SERVICE - v2.0.0
 * Generación de reportes académicos
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar ReportGeneratorDAO
 * - Sin SQL directo en el servicio
 */

const ReportGeneratorDAO = require('../data/report-generator.dao.js');
const devLogger = require('../utils/devLogger.js');

class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

class ReportGeneratorService {

  async studentGradesReport(estudianteId, options = {}) {
    const { ciclo = 'actual' } = options;
    devLogger.log(`[ReportGenerator] Reporte de calificaciones para estudiante ${estudianteId}`);

    try {
      const student = await ReportGeneratorDAO.getStudentById(estudianteId);
      if (!student) throw new ServiceError('Estudiante no encontrado', 404);

      const grades = await ReportGeneratorDAO.getStudentGrades(estudianteId);

      // Agrupar por materia
      const byMateria = {};
      grades.forEach(g => {
        if (!byMateria[g.materia]) byMateria[g.materia] = { parciales: [], promedio: 0 };
        byMateria[g.materia].parciales.push({ parcial: g.parcial, calificacion: parseFloat(g.calificacion), observaciones: g.observaciones });
      });

      // Calcular promedios
      Object.keys(byMateria).forEach(materia => {
        const cals = byMateria[materia].parciales.map(p => p.calificacion);
        byMateria[materia].promedio = (cals.reduce((a, b) => a + b, 0) / cals.length).toFixed(2);
      });

      const allGrades = grades.map(g => parseFloat(g.calificacion));
      const promedioGeneral = allGrades.length > 0 ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(2) : '0.00';

      return {
        success: true,
        data: {
          tipo: 'calificaciones_estudiante',
          generadoEn: new Date().toISOString(),
          estudiante: { id: student.id, matricula: student.matricula, nombre: `${student.nombre} ${student.apellido_paterno} ${student.apellido_materno || ''}`.trim(), semestre: student.semestre, especialidad: student.especialidad },
          ciclo,
          materias: Object.entries(byMateria).map(([nombre, data]) => ({ nombre, parciales: data.parciales, promedio: data.promedio })),
          promedioGeneral,
          totalMaterias: Object.keys(byMateria).length,
          totalCalificaciones: grades.length
        }
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte', 500);
    }
  }

  async groupReport(options = {}) {
    const { semestre, grado, ciclo = 'actual' } = options;
    devLogger.log(`[ReportGenerator] Reporte de grupo`);

    try {
      let whereClause = '1=1';
      const params = [];

      if (semestre) { params.push(semestre); whereClause += ` AND e.semestre = $${params.length}`; }
      if (grado) { params.push(grado); whereClause += ` AND e.grado = $${params.length}`; }

      const stats = await ReportGeneratorDAO.getGroupStats(whereClause, params);
      const topStudents = await ReportGeneratorDAO.getTopStudents(whereClause, params);
      const byMateria = await ReportGeneratorDAO.getGradesBySubject(whereClause, params);

      return {
        success: true,
        data: {
          tipo: 'reporte_grupo',
          generadoEn: new Date().toISOString(),
          filtros: { semestre, grado, ciclo },
          estadisticas: {
            totalEstudiantes: parseInt(stats.total_estudiantes, 10),
            promedioGeneral: parseFloat(stats.promedio_general || 0).toFixed(2),
            totalCalificaciones: parseInt(stats.total_calificaciones, 10),
            aprobadas: parseInt(stats.aprobadas, 10),
            reprobadas: parseInt(stats.reprobadas, 10),
            tasaAprobacion: stats.total_calificaciones > 0 ? ((stats.aprobadas / stats.total_calificaciones) * 100).toFixed(1) : '0.0'
          },
          topEstudiantes: topStudents.map(s => ({ id: s.id, matricula: s.matricula, nombre: `${s.nombre} ${s.apellido_paterno}`, promedio: parseFloat(s.promedio).toFixed(2) })),
          porMateria: byMateria.map(m => ({ materia: m.materia, promedio: parseFloat(m.promedio).toFixed(2), total: parseInt(m.total, 10) }))
        }
      };
    } catch (error) {
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte de grupo', 500);
    }
  }

  async trendsReport(options = {}) {
    const { periodos = 6 } = options;
    devLogger.log(`[ReportGenerator] Reporte de tendencias`);

    try {
      const monthlyTrend = await ReportGeneratorDAO.getMonthlyGradeTrend(periodos);
      const enrollmentTrend = await ReportGeneratorDAO.getEnrollmentTrend(periodos);
      const distribution = await ReportGeneratorDAO.getGradeDistribution(periodos);

      return {
        success: true,
        data: {
          tipo: 'tendencias',
          generadoEn: new Date().toISOString(),
          periodos,
          promediosMensuales: monthlyTrend.map(r => ({ mes: r.mes, promedio: parseFloat(r.promedio || 0).toFixed(2), total: parseInt(r.total, 10) })),
          inscripcionesMensuales: enrollmentTrend.map(r => ({ mes: r.mes, total: parseInt(r.total, 10) })),
          distribucionCalificaciones: distribution
        }
      };
    } catch (error) {
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte de tendencias', 500);
    }
  }

  async teacherReport(docenteId) {
    devLogger.log(`[ReportGenerator] Reporte de docente ${docenteId}`);

    try {
      const teacher = await ReportGeneratorDAO.getTeacherById(docenteId);
      if (!teacher) throw new ServiceError('Docente no encontrado', 404);

      const stats = await ReportGeneratorDAO.getTeacherStats(docenteId);
      const byMateria = await ReportGeneratorDAO.getTeacherGradesBySubject(docenteId);

      return {
        success: true,
        data: {
          tipo: 'reporte_docente',
          generadoEn: new Date().toISOString(),
          docente: { id: teacher.id, nombre: `${teacher.nombre} ${teacher.apellido_paterno}`, especialidad: teacher.especialidad, email: teacher.email },
          estadisticas: {
            totalCalificaciones: parseInt(stats.total_calificaciones, 10),
            totalEstudiantes: parseInt(stats.total_estudiantes, 10),
            promedioGeneral: parseFloat(stats.promedio || 0).toFixed(2),
            aprobados: parseInt(stats.aprobados, 10),
            reprobados: parseInt(stats.reprobados, 10)
          },
          porMateria: byMateria.map(m => ({ materia: m.materia, promedio: parseFloat(m.promedio).toFixed(2), total: parseInt(m.total, 10) }))
        }
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[ReportGenerator] Error:', error.message);
      throw new ServiceError('Error generando reporte de docente', 500);
    }
  }

  async executiveReport() {
    devLogger.log('[ReportGenerator] Reporte ejecutivo');

    try {
      const kpis = await ReportGeneratorDAO.getExecutiveKPIs();
      const comparison = await ReportGeneratorDAO.getMonthlyComparison();
      const lowPerformers = await ReportGeneratorDAO.getLowPerformersCount();

      const alerts = [];
      if (lowPerformers > 0) {
        alerts.push({ tipo: 'warning', mensaje: `${lowPerformers} estudiantes con promedio menor a 6` });
      }

      return {
        success: true,
        data: {
          tipo: 'ejecutivo',
          generadoEn: new Date().toISOString(),
          kpis: {
            estudiantesActivos: parseInt(kpis.estudiantes_activos, 10),
            totalDocentes: parseInt(kpis.total_docentes, 10),
            promedioMes: parseFloat(kpis.promedio_mes || 0).toFixed(2),
            tasaAprobacion: parseFloat(kpis.tasa_aprobacion || 0).toFixed(1) + '%'
          },
          comparativa: {
            promedioActual: parseFloat(comparison.actual || 0).toFixed(2),
            promedioAnterior: parseFloat(comparison.anterior || 0).toFixed(2),
            variacion: (((comparison.actual - comparison.anterior) / (comparison.anterior || 1)) * 100).toFixed(1) + '%'
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

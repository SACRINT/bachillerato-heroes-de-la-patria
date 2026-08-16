/**
 * Report Service - Capa de servicios para generación de reportes
 * Genera reportes académicos, de asistencia y analíticos
 * GDPR Compliant - Logging condicional
 */

const { debugLog } = require('../utils/debug-logger.js');
const { sanitizeError } = require('../utils/sanitized-errors.js');
const db = require('../data/database-access.js');

class ReportService {
  /**
   * Generar reporte de estudiante
   * @param {number} studentId - ID del estudiante
   * @param {string} reportType - Tipo de reporte (academic, attendance, complete)
   * @returns {Promise<Object>} Reporte generado
   */
  async generateStudentReport(studentId, reportType = 'complete') {
    debugLog.log('REPORT', `Generating ${reportType} report`, { studentId });

    try {
      const student = await db.getStudentById(studentId);

      if (!student) {
        throw new Error('Estudiante no encontrado');
      }

      const report = {
        student: {
          id: student.id,
          nombre: student.nombre,
          email: student.email
        },
        generatedAt: new Date().toISOString(),
        reportType: reportType
      };

      // Incluir calificaciones si el tipo lo requiere
      if (reportType === 'academic' || reportType === 'complete') {
        const grades = await db.getStudentGrades(studentId);
        report.grades = grades;
        report.academicStats = this._calculateAcademicStats(grades);
      }

      // Incluir asistencia si el tipo lo requiere
      if (reportType === 'attendance' || reportType === 'complete') {
        const attendance = await db.getStudentAttendance(studentId);
        report.attendance = attendance;
        report.attendanceStats = this._calculateAttendanceStats(attendance);
      }

      debugLog.log('REPORT', 'Report generated successfully', { studentId, reportType });

      return report;
    } catch (error) {
      debugLog.error('REPORT', 'Error generating student report', sanitizeError(error, 'generateStudentReport'));
      throw error;
    }
  }

  /**
   * Generar reporte de grupo/clase
   * @param {number} groupId - ID del grupo
   * @returns {Promise<Object>} Reporte del grupo
   */
  async generateGroupReport(groupId) {
    debugLog.log('REPORT', 'Generating group report', { groupId });

    try {
      const students = await db.getStudentsByGroup(groupId);
      const grades = await db.getGradesByGroup(groupId);

      const report = {
        groupId: groupId,
        studentCount: students.length,
        generatedAt: new Date().toISOString(),
        students: students,
        statistics: {
          average: this._calculateGroupAverage(grades),
          highestGrade: this._getHighestGrade(grades),
          lowestGrade: this._getLowestGrade(grades),
          passRate: this._calculatePassRate(grades)
        }
      };

      debugLog.log('REPORT', 'Group report generated', { groupId, studentCount: students.length });

      return report;
    } catch (error) {
      debugLog.error('REPORT', 'Error generating group report', sanitizeError(error, 'generateGroupReport'));
      throw error;
    }
  }

  /**
   * Obtener analíticas generales del sistema
   * @param {Object} filters - Filtros de fecha, grupo, etc
   * @returns {Promise<Object>} Analíticas
   */
  async getAnalytics(filters = {}) {
    debugLog.log('REPORT', 'Generating analytics', { filterCount: Object.keys(filters).length });

    try {
      const analytics = await db.getAnalytics(filters);

      debugLog.log('REPORT', 'Analytics generated successfully');

      return analytics;
    } catch (error) {
      debugLog.error('REPORT', 'Error generating analytics', sanitizeError(error, 'getAnalytics'));
      throw error;
    }
  }

  /**
   * Exportar reporte a formato específico
   * @param {Object} reportData - Datos del reporte
   * @param {string} format - Formato (json, csv, pdf)
   * @returns {Promise<Buffer|String>} Reporte exportado
   */
  async exportReport(reportData, format = 'json') {
    debugLog.log('REPORT', `Exporting report to ${format}`);

    try {
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(reportData, null, 2);

        case 'csv':
          return this._convertToCSV(reportData);

        case 'pdf':
          // TODO: Implementar generación de PDF
          throw new Error('Exportación a PDF aún no implementada');

        default:
          throw new Error(`Formato no soportado: ${format}`);
      }
    } catch (error) {
      debugLog.error('REPORT', 'Error exporting report', sanitizeError(error, 'exportReport'));
      throw error;
    }
  }

  /**
   * Calcular estadísticas académicas
   * @private
   */
  _calculateAcademicStats(grades) {
    if (!grades || grades.length === 0) {
      return { average: 0, total: 0 };
    }

    const total = grades.reduce((sum, grade) => sum + (grade.calificacion || 0), 0);
    const average = total / grades.length;

    return {
      average: Math.round(average * 100) / 100,
      total: grades.length,
      passed: grades.filter(g => g.calificacion >= 6).length,
      failed: grades.filter(g => g.calificacion < 6).length
    };
  }

  /**
   * Calcular estadísticas de asistencia
   * @private
   */
  _calculateAttendanceStats(attendance) {
    if (!attendance || attendance.length === 0) {
      return { percentage: 0, total: 0 };
    }

    const present = attendance.filter(a => a.status === 'present' || a.status === 'presente').length;
    const percentage = (present / attendance.length) * 100;

    return {
      percentage: Math.round(percentage * 100) / 100,
      total: attendance.length,
      present: present,
      absent: attendance.length - present
    };
  }

  /**
   * Calcular promedio de grupo
   * @private
   */
  _calculateGroupAverage(grades) {
    if (!grades || grades.length === 0) return 0;
    const sum = grades.reduce((acc, g) => acc + (g.calificacion || 0), 0);
    return Math.round((sum / grades.length) * 100) / 100;
  }

  /**
   * Obtener calificación más alta
   * @private
   */
  _getHighestGrade(grades) {
    if (!grades || grades.length === 0) return 0;
    return Math.max(...grades.map(g => g.calificacion || 0));
  }

  /**
   * Obtener calificación más baja
   * @private
   */
  _getLowestGrade(grades) {
    if (!grades || grades.length === 0) return 0;
    return Math.min(...grades.map(g => g.calificacion || 0));
  }

  /**
   * Calcular tasa de aprobación
   * @private
   */
  _calculatePassRate(grades) {
    if (!grades || grades.length === 0) return 0;
    const passed = grades.filter(g => (g.calificacion || 0) >= 6).length;
    return Math.round((passed / grades.length) * 100 * 100) / 100;
  }

  /**
   * Convertir datos a CSV
   * @private
   */
  _convertToCSV(data) {
    // Implementación básica de conversión a CSV
    // TODO: Mejorar para manejar estructuras complejas
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).join(',')).join('\n');
      return `${headers}\n${rows}`;
    }

    return JSON.stringify(data);
  }
}

module.exports = new ReportService();

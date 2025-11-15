/**
 * Export Service - Capa de servicios para exportación de datos
 * Maneja exportación a múltiples formatos (CSV, JSON, Excel, PDF)
 * GDPR Compliant - Logging condicional
 */

const { debugLog } = require('../utils/debug-logger');
const { sanitizeError } = require('../utils/sanitized-errors');

class ExportService {
  /**
   * Exportar datos a formato especificado
   * @param {Array|Object} data - Datos a exportar
   * @param {string} format - Formato (json, csv, excel, pdf)
   * @param {Object} options - Opciones de exportación
   * @returns {Promise<Buffer|String>} Datos exportados
   */
  async exportData(data, format = 'json', options = {}) {
    debugLog.log('EXPORT', `Exporting data to ${format}`, {
      dataType: Array.isArray(data) ? 'array' : 'object',
      itemCount: Array.isArray(data) ? data.length : 1
    });

    try {
      switch (format.toLowerCase()) {
        case 'json':
          return this.exportToJSON(data, options);

        case 'csv':
          return this.exportToCSV(data, options);

        case 'excel':
          return this.exportToExcel(data, options);

        case 'pdf':
          return this.exportToPDF(data, options);

        default:
          throw new Error(`Formato no soportado: ${format}`);
      }
    } catch (error) {
      debugLog.error('EXPORT', `Error exporting to ${format}`, sanitizeError(error, 'exportData'));
      throw error;
    }
  }

  /**
   * Exportar a JSON
   * @param {*} data - Datos
   * @param {Object} options - Opciones (pretty, indent)
   * @returns {string} JSON string
   */
  exportToJSON(data, options = {}) {
    debugLog.log('EXPORT', 'Exporting to JSON');

    try {
      const indent = options.pretty ? (options.indent || 2) : null;
      const json = JSON.stringify(data, null, indent);

      debugLog.log('EXPORT', 'JSON export completed', { size: json.length });

      return json;
    } catch (error) {
      debugLog.error('EXPORT', 'Error exporting to JSON', sanitizeError(error, 'exportToJSON'));
      throw error;
    }
  }

  /**
   * Exportar a CSV
   * @param {Array} data - Array de objetos
   * @param {Object} options - Opciones (headers, delimiter, columns)
   * @returns {string} CSV string
   */
  exportToCSV(data, options = {}) {
    debugLog.log('EXPORT', 'Exporting to CSV', { rows: data.length });

    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Los datos deben ser un array no vacío');
      }

      const delimiter = options.delimiter || ',';
      const includeHeaders = options.headers !== false;
      const columns = options.columns || Object.keys(data[0]);

      let csv = '';

      // Agregar headers si está habilitado
      if (includeHeaders) {
        csv += columns.map(col => this._escapeCSVValue(col)).join(delimiter) + '\n';
      }

      // Agregar filas
      for (const row of data) {
        const values = columns.map(col => {
          const value = row[col];
          return this._escapeCSVValue(value);
        });

        csv += values.join(delimiter) + '\n';
      }

      debugLog.log('EXPORT', 'CSV export completed', { rows: data.length, columns: columns.length });

      return csv;
    } catch (error) {
      debugLog.error('EXPORT', 'Error exporting to CSV', sanitizeError(error, 'exportToCSV'));
      throw error;
    }
  }

  /**
   * Exportar a Excel (XLSX)
   * @param {Array} data - Array de objetos
   * @param {Object} options - Opciones (sheetName, columns)
   * @returns {Promise<Buffer>} Excel buffer
   */
  async exportToExcel(data, options = {}) {
    debugLog.log('EXPORT', 'Exporting to Excel', { rows: data.length });

    try {
      // TODO: Implementar con librería xlsx o exceljs
      // Por ahora, lanzar error indicando que no está implementado
      throw new Error('Exportación a Excel aún no implementada. Use CSV como alternativa.');
    } catch (error) {
      debugLog.error('EXPORT', 'Error exporting to Excel', sanitizeError(error, 'exportToExcel'));
      throw error;
    }
  }

  /**
   * Exportar a PDF
   * @param {*} data - Datos
   * @param {Object} options - Opciones (title, orientation, pageSize)
   * @returns {Promise<Buffer>} PDF buffer
   */
  async exportToPDF(data, options = {}) {
    debugLog.log('EXPORT', 'Exporting to PDF');

    try {
      // TODO: Implementar con librería pdfkit o puppeteer
      // Por ahora, lanzar error indicando que no está implementado
      throw new Error('Exportación a PDF aún no implementada. Use JSON o CSV como alternativa.');
    } catch (error) {
      debugLog.error('EXPORT', 'Error exporting to PDF', sanitizeError(error, 'exportToPDF'));
      throw error;
    }
  }

  /**
   * Exportar tabla de estudiantes
   * @param {Array} students - Array de estudiantes
   * @param {string} format - Formato de exportación
   * @returns {Promise<string|Buffer>} Datos exportados
   */
  async exportStudents(students, format = 'csv') {
    debugLog.log('EXPORT', `Exporting ${students.length} students to ${format}`);

    try {
      // Seleccionar solo campos seguros (GDPR compliant)
      const safeData = students.map(student => ({
        id: student.id,
        nombre: student.nombre,
        email: student.email,
        role: student.role,
        status: student.status,
        created_at: student.created_at
      }));

      return await this.exportData(safeData, format, {
        headers: true,
        columns: ['id', 'nombre', 'email', 'role', 'status', 'created_at']
      });
    } catch (error) {
      debugLog.error('EXPORT', 'Error exporting students', sanitizeError(error, 'exportStudents'));
      throw error;
    }
  }

  /**
   * Exportar reporte de calificaciones
   * @param {Array} grades - Array de calificaciones
   * @param {string} format - Formato de exportación
   * @returns {Promise<string|Buffer>} Datos exportados
   */
  async exportGrades(grades, format = 'csv') {
    debugLog.log('EXPORT', `Exporting ${grades.length} grades to ${format}`);

    try {
      const safeData = grades.map(grade => ({
        estudiante_id: grade.estudiante_id,
        estudiante_nombre: grade.estudiante_nombre,
        materia: grade.materia,
        calificacion: grade.calificacion,
        periodo: grade.periodo,
        fecha: grade.fecha
      }));

      return await this.exportData(safeData, format, {
        headers: true,
        columns: ['estudiante_id', 'estudiante_nombre', 'materia', 'calificacion', 'periodo', 'fecha']
      });
    } catch (error) {
      debugLog.error('EXPORT', 'Error exporting grades', sanitizeError(error, 'exportGrades'));
      throw error;
    }
  }

  /**
   * Exportar reporte de asistencia
   * @param {Array} attendance - Array de asistencias
   * @param {string} format - Formato de exportación
   * @returns {Promise<string|Buffer>} Datos exportados
   */
  async exportAttendance(attendance, format = 'csv') {
    debugLog.log('EXPORT', `Exporting ${attendance.length} attendance records to ${format}`);

    try {
      const safeData = attendance.map(record => ({
        estudiante_id: record.estudiante_id,
        estudiante_nombre: record.estudiante_nombre,
        fecha: record.fecha,
        status: record.status,
        materia: record.materia
      }));

      return await this.exportData(safeData, format, {
        headers: true,
        columns: ['estudiante_id', 'estudiante_nombre', 'fecha', 'status', 'materia']
      });
    } catch (error) {
      debugLog.error('EXPORT', 'Error exporting attendance', sanitizeError(error, 'exportAttendance'));
      throw error;
    }
  }

  /**
   * Escapar valor para CSV (manejar comas, comillas, saltos de línea)
   * @private
   */
  _escapeCSVValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue = String(value);

    // Si contiene comas, comillas o saltos de línea, debe estar entre comillas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      // Escapar comillas dobles duplicándolas
      stringValue = stringValue.replace(/"/g, '""');
      return `"${stringValue}"`;
    }

    return stringValue;
  }

  /**
   * Convertir datos a formato tabular (para Excel/PDF)
   * @private
   */
  _convertToTable(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header]));

    return { headers, rows };
  }

  /**
   * Generar nombre de archivo con timestamp
   * @param {string} baseName - Nombre base del archivo
   * @param {string} extension - Extensión (.csv, .json, etc)
   * @returns {string} Nombre de archivo con timestamp
   */
  generateFilename(baseName, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${baseName}_${timestamp}.${extension}`;
  }
}

module.exports = new ExportService();

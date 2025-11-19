/**
 * 🎓 STUDENT SERVICE - Enhanced v2.0.0
 * Capa de servicios para gestión de estudiantes
 *
 * SEMANA 2 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Paginación y filtrado avanzado
 * - Estadísticas y analytics
 * - Exportación CSV/JSON
 * - Validación robusta
 * - Error handling con ServiceError
 *
 * GDPR Compliant - Logging condicional
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');
const db = require('../data/database-access');

/**
 * Clase de error personalizada para servicios
 */
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

class StudentService {
  /**
   * Obtener lista de estudiantes con filtros opcionales
   * @param {Object} filters - Filtros de búsqueda (role, status, search, etc)
   * @returns {Promise<Array>} Lista de estudiantes
   */
  async getStudents(filters = {}) {
    debugLog.log('STUDENT', 'Fetching students', { filterCount: Object.keys(filters).length });

    try {
      const students = await db.getStudents(filters);
      debugLog.log('STUDENT', 'Students fetched successfully', { count: students.length });
      return students;
    } catch (error) {
      debugLog.error('STUDENT', 'Error fetching students', sanitizeError(error, 'getStudents'));
      throw error;
    }
  }

  /**
   * Obtener un estudiante por ID
   * @param {number} id - ID del estudiante
   * @returns {Promise<Object>} Datos del estudiante
   */
  async getStudentById(id) {
    debugLog.log('STUDENT', 'Fetching student by ID', { id });

    try {
      const student = await db.getStudentById(id);

      if (!student) {
        debugLog.warn('STUDENT', 'Student not found', { id });
        throw new Error('Estudiante no encontrado');
      }

      return student;
    } catch (error) {
      debugLog.error('STUDENT', 'Error fetching student', sanitizeError(error, 'getStudentById'));
      throw error;
    }
  }

  /**
   * Crear un nuevo estudiante
   * @param {Object} data - Datos del estudiante
   * @returns {Promise<Object>} Estudiante creado
   */
  async createStudent(data) {
    debugLog.log('STUDENT', 'Creating new student');

    try {
      // Validar datos requeridos
      this._validateStudentData(data);

      const student = await db.createStudent(data);
      debugLog.log('STUDENT', 'Student created successfully', { id: student.id });

      return student;
    } catch (error) {
      debugLog.error('STUDENT', 'Error creating student', sanitizeError(error, 'createStudent'));
      throw error;
    }
  }

  /**
   * Actualizar datos de un estudiante
   * @param {number} id - ID del estudiante
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Estudiante actualizado
   */
  async updateStudent(id, data) {
    debugLog.log('STUDENT', 'Updating student', { id });

    try {
      // Verificar que el estudiante existe
      await this.getStudentById(id);

      const updatedStudent = await db.updateStudent(id, data);
      debugLog.log('STUDENT', 'Student updated successfully', { id });

      return updatedStudent;
    } catch (error) {
      debugLog.error('STUDENT', 'Error updating student', sanitizeError(error, 'updateStudent'));
      throw error;
    }
  }

  /**
   * Eliminar un estudiante
   * @param {number} id - ID del estudiante
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async deleteStudent(id) {
    debugLog.log('STUDENT', 'Deleting student', { id });

    try {
      // Verificar que el estudiante existe
      await this.getStudentById(id);

      await db.deleteStudent(id);
      debugLog.log('STUDENT', 'Student deleted successfully', { id });

      return true;
    } catch (error) {
      debugLog.error('STUDENT', 'Error deleting student', sanitizeError(error, 'deleteStudent'));
      throw error;
    }
  }

  /**
   * Obtener calificaciones de un estudiante
   * @param {number} studentId - ID del estudiante
   * @returns {Promise<Array>} Lista de calificaciones
   */
  async getStudentGrades(studentId) {
    debugLog.log('STUDENT', 'Fetching student grades', { studentId });

    try {
      const grades = await db.getStudentGrades(studentId);
      return grades;
    } catch (error) {
      debugLog.error('STUDENT', 'Error fetching grades', sanitizeError(error, 'getStudentGrades'));
      throw error;
    }
  }

  /**
   * Obtener asistencia de un estudiante
   * @param {number} studentId - ID del estudiante
   * @returns {Promise<Array>} Lista de asistencias
   */
  async getStudentAttendance(studentId) {
    debugLog.log('STUDENT', 'Fetching student attendance', { studentId });

    try {
      const attendance = await db.getStudentAttendance(studentId);
      return attendance;
    } catch (error) {
      debugLog.error('STUDENT', 'Error fetching attendance', sanitizeError(error, 'getStudentAttendance'));
      throw error;
    }
  }

  /**
   * Validar datos de estudiante
   * @private
   */
  _validateStudentData(data) {
    const requiredFields = ['nombre', 'email'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new ServiceError(`Campos requeridos faltantes: ${missingFields.join(', ')}`, 400);
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ServiceError('Email inválido', 400);
    }
  }

  // ==================== MÉTODOS AVANZADOS (v2.0.0) ====================

  /**
   * Obtener todos los estudiantes con paginación y filtros
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Object>} Datos y metadata de paginación
   */
  async getAll(options = {}) {
    const {
      search = '',
      grado = '',
      status = '',
      page = 1,
      limit = 50,
      sortBy = 'apellido_paterno',
      sortOrder = 'ASC'
    } = options;

    devLogger.log('[StudentService] getAll con filtros');

    try {
      let query = `
        SELECT id, matricula, nombre, apellido_paterno, apellido_materno,
               especialidad, semestre, promedio, status_academico, email
        FROM estudiantes
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (search) {
        query += ` AND (nombre ILIKE $${paramCount} OR apellido_paterno ILIKE $${paramCount} OR matricula ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      if (grado) {
        query += ` AND grado = $${paramCount}`;
        params.push(grado);
        paramCount++;
      }

      if (status) {
        query += ` AND status_academico = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      // Count total
      const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Sort and paginate
      const allowedSort = ['id', 'matricula', 'nombre', 'apellido_paterno', 'promedio', 'semestre'];
      const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'apellido_paterno';
      const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      return {
        success: true,
        data: result.rows.map(s => this._transformStudent(s)),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      devLogger.error('[StudentService] Error en getAll:', error.message);
      throw new ServiceError('Error al obtener estudiantes', 500);
    }
  }

  /**
   * Obtener estadísticas de estudiantes
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats() {
    devLogger.log('[StudentService] Obteniendo estadísticas');

    try {
      const stats = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status_academico = 'activo') as activos,
          COUNT(*) FILTER (WHERE status_academico = 'baja') as bajas,
          AVG(promedio) as promedio_general
        FROM estudiantes
      `);

      const bySemester = await pool.query(`
        SELECT semestre, COUNT(*) as total
        FROM estudiantes
        WHERE status_academico = 'activo'
        GROUP BY semestre
        ORDER BY semestre
      `);

      return {
        success: true,
        data: {
          totals: {
            total: parseInt(stats.rows[0].total, 10),
            activos: parseInt(stats.rows[0].activos, 10),
            bajas: parseInt(stats.rows[0].bajas, 10)
          },
          promedioGeneral: parseFloat(stats.rows[0].promedio_general || 0).toFixed(2),
          porSemestre: bySemester.rows
        }
      };
    } catch (error) {
      devLogger.error('[StudentService] Error en getStats:', error.message);
      throw new ServiceError('Error al obtener estadísticas', 500);
    }
  }

  /**
   * Búsqueda avanzada de estudiantes
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Object>} Resultados
   */
  async search(query) {
    if (!query || query.length < 2) {
      throw new ServiceError('La búsqueda debe tener al menos 2 caracteres', 400);
    }

    devLogger.log(`[StudentService] Búsqueda: "${query}"`);

    try {
      const result = await pool.query(`
        SELECT id, matricula, nombre, apellido_paterno, apellido_materno,
               email, semestre, promedio, status_academico
        FROM estudiantes
        WHERE nombre ILIKE $1 OR apellido_paterno ILIKE $1 OR matricula ILIKE $1 OR email ILIKE $1
        ORDER BY apellido_paterno, nombre
        LIMIT 100
      `, [`%${query}%`]);

      return {
        success: true,
        data: result.rows.map(s => this._transformStudent(s)),
        total: result.rows.length
      };
    } catch (error) {
      devLogger.error('[StudentService] Error en search:', error.message);
      throw new ServiceError('Error en búsqueda', 500);
    }
  }

  /**
   * Exportar estudiantes a CSV o JSON
   * @param {string} format - Formato (csv/json)
   * @returns {Promise<Object>} Datos exportados
   */
  async export(format = 'json') {
    devLogger.log(`[StudentService] Exportando en formato: ${format}`);

    try {
      const { data } = await this.getAll({ limit: 10000 });

      if (format === 'csv') {
        const headers = ['ID', 'Matrícula', 'Nombre', 'Apellido Paterno', 'Email', 'Semestre', 'Promedio'];
        const rows = data.map(s => [
          s.id, s.matricula, s.nombre, s.apellidoPaterno, s.email, s.semestre, s.promedio
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');

        return {
          success: true,
          format: 'csv',
          data: csv,
          filename: `estudiantes_${new Date().toISOString().split('T')[0]}.csv`
        };
      }

      return {
        success: true,
        format: 'json',
        data,
        filename: `estudiantes_${new Date().toISOString().split('T')[0]}.json`
      };
    } catch (error) {
      devLogger.error('[StudentService] Error en export:', error.message);
      throw new ServiceError('Error al exportar', 500);
    }
  }

  /**
   * Transformar datos de estudiante para respuesta
   * @private
   */
  _transformStudent(student) {
    if (!student) return null;

    return {
      id: student.id,
      matricula: student.matricula,
      nombre: student.nombre,
      apellidoPaterno: student.apellido_paterno,
      apellidoMaterno: student.apellido_materno,
      nombreCompleto: [student.nombre, student.apellido_paterno, student.apellido_materno].filter(Boolean).join(' '),
      email: student.email,
      especialidad: student.especialidad,
      semestre: student.semestre,
      promedio: parseFloat(student.promedio || 0).toFixed(2),
      status: student.status_academico || 'activo'
    };
  }
}

module.exports = new StudentService();
module.exports.ServiceError = ServiceError;

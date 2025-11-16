/**
 * Student Service - Capa de servicios para gestión de estudiantes
 * Separa la lógica de negocio de las rutas
 * GDPR Compliant - Logging condicional
 */

const { debugLog } = require('../utils/debug-logger');
const { sanitizeError } = require('../utils/sanitized-errors');
const db = require('../data/database-access');

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
    const requiredFields = ['nombre', 'email', 'role'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Email inválido');
    }
  }
}

module.exports = new StudentService();

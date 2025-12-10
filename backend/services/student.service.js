"use strict";
/**
 * Student Service - TypeScript
 * Capa de servicios para gestión de estudiantes
 * Separa la lógica de negocio de las rutas
 * GDPR Compliant - Logging condicional
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const devLogger_1 = __importDefault(require("../utils/devLogger"));
const sanitized_errors_1 = require("../utils/sanitized-errors");
const student_dao_1 = __importDefault(require("../data/student.dao"));
const grades_dao_1 = __importDefault(require("../data/grades.dao"));
const attendance_dao_1 = __importDefault(require("../data/attendance.dao"));
class StudentService {
    /**
     * Obtener lista de estudiantes con filtros opcionales
     */
    async getStudents(filters = {}) {
        devLogger_1.default.log('[StudentService] Fetching students');
        try {
            const students = await student_dao_1.default.list(filters, 100, 0);
            devLogger_1.default.log(`[StudentService] Students fetched: ${students.length}`);
            return students;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error fetching students', (0, sanitized_errors_1.sanitizeError)(error, 'getStudents'));
            throw error;
        }
    }
    /**
     * Obtener un estudiante por ID
     */
    async getStudentById(id) {
        devLogger_1.default.log(`[StudentService] Fetching student by ID: ${id}`);
        try {
            const student = await student_dao_1.default.get(id);
            if (!student) {
                devLogger_1.default.warn(`[StudentService] Student not found: ${id}`);
                throw new Error('Estudiante no encontrado');
            }
            return student;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error fetching student', (0, sanitized_errors_1.sanitizeError)(error, 'getStudentById'));
            throw error;
        }
    }
    /**
     * Crear un nuevo estudiante
     */
    async createStudent(data) {
        devLogger_1.default.log('[StudentService] Creating new student');
        try {
            this._validateStudentData(data);
            const student = await student_dao_1.default.create(data);
            devLogger_1.default.log(`[StudentService] Student created: ${student.id}`);
            return student;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error creating student', (0, sanitized_errors_1.sanitizeError)(error, 'createStudent'));
            throw error;
        }
    }
    /**
     * Actualizar datos de un estudiante
     */
    async updateStudent(id, data) {
        devLogger_1.default.log(`[StudentService] Updating student: ${id}`);
        try {
            await this.getStudentById(id);
            const updatedStudent = await student_dao_1.default.update(id, data);
            devLogger_1.default.log(`[StudentService] Student updated: ${id}`);
            return updatedStudent;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error updating student', (0, sanitized_errors_1.sanitizeError)(error, 'updateStudent'));
            throw error;
        }
    }
    /**
     * Eliminar un estudiante
     */
    async deleteStudent(id) {
        devLogger_1.default.log(`[StudentService] Deleting student: ${id}`);
        try {
            await this.getStudentById(id);
            await student_dao_1.default.delete(id);
            devLogger_1.default.log(`[StudentService] Student deleted: ${id}`);
            return true;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error deleting student', (0, sanitized_errors_1.sanitizeError)(error, 'deleteStudent'));
            throw error;
        }
    }
    /**
     * Obtener calificaciones de un estudiante
     */
    async getStudentGrades(studentId) {
        devLogger_1.default.log(`[StudentService] Fetching grades for student: ${studentId}`);
        try {
            const grades = await grades_dao_1.default.getByStudent(studentId);
            return grades;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error fetching grades', (0, sanitized_errors_1.sanitizeError)(error, 'getStudentGrades'));
            throw error;
        }
    }
    /**
     * Obtener asistencia de un estudiante
     */
    async getStudentAttendance(studentId) {
        devLogger_1.default.log(`[StudentService] Fetching attendance for student: ${studentId}`);
        try {
            const attendance = await attendance_dao_1.default.getByStudent(studentId);
            return attendance;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error fetching attendance', (0, sanitized_errors_1.sanitizeError)(error, 'getStudentAttendance'));
            throw error;
        }
    }
    /**
     * Obtener estadísticas de estudiantes
     */
    async getStats(filters = {}) {
        devLogger_1.default.log('[StudentService] Fetching student statistics');
        try {
            const total = await student_dao_1.default.count(filters);
            const stats = {
                total_students: total,
                active_students: await student_dao_1.default.count({ ...filters, status: 'activo' })
            };
            devLogger_1.default.log('[StudentService] Statistics fetched successfully');
            return stats;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error fetching statistics', (0, sanitized_errors_1.sanitizeError)(error, 'getStats'));
            throw error;
        }
    }
    /**
     * Obtener todos los estudiantes con paginación
     */
    async getAll(filters = {}, pagination = { page: 1, limit: 50 }) {
        devLogger_1.default.log(`[StudentService] Fetching all students page ${pagination.page}`);
        try {
            const offset = (pagination.page - 1) * pagination.limit;
            const data = await student_dao_1.default.list(filters, pagination.limit, offset);
            const total = await student_dao_1.default.count(filters);
            const result = {
                data,
                total,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: Math.ceil(total / pagination.limit)
            };
            devLogger_1.default.log(`[StudentService] Students fetched: ${result.data.length} of ${result.total}`);
            return result;
        }
        catch (error) {
            devLogger_1.default.error('[StudentService] Error fetching all students', (0, sanitized_errors_1.sanitizeError)(error, 'getAll'));
            throw error;
        }
    }
    /**
     * Validar datos de estudiante
     */
    _validateStudentData(data) {
        const requiredFields = ['nombre', 'email', 'role'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Email inválido');
        }
    }
}
exports.default = new StudentService();
module.exports = new StudentService();
//# sourceMappingURL=student.service.js.map
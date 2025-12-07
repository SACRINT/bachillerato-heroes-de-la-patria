/**
 * Student Service - TypeScript
 * Capa de servicios para gestión de estudiantes
 * Separa la lógica de negocio de las rutas
 * GDPR Compliant - Logging condicional
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import devLogger from '../utils/devLogger';
import { sanitizeError } from '../utils/sanitized-errors';
import StudentDAO from '../data/student.dao';
import GradeDAO from '../data/grades.dao';
import AttendanceDAO from '../data/attendance.dao';

export interface StudentServiceFilters {
    role?: string;
    status?: string;
    search?: string;
    grado?: string;
    grupo?: string;
    [key: string]: any;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

class StudentService {

    /**
     * Obtener lista de estudiantes con filtros opcionales
     */
    async getStudents(filters: StudentServiceFilters = {}): Promise<any[]> {
        devLogger.log('[StudentService] Fetching students');

        try {
            const students = await StudentDAO.list(filters, 100, 0);
            devLogger.log(`[StudentService] Students fetched: ${students.length}`);
            return students;
        } catch (error: any) {
            devLogger.error('[StudentService] Error fetching students', sanitizeError(error, 'getStudents'));
            throw error;
        }
    }

    /**
     * Obtener un estudiante por ID
     */
    async getStudentById(id: number): Promise<any> {
        devLogger.log(`[StudentService] Fetching student by ID: ${id}`);

        try {
            const student = await StudentDAO.get(id);

            if (!student) {
                devLogger.warn(`[StudentService] Student not found: ${id}`);
                throw new Error('Estudiante no encontrado');
            }

            return student;
        } catch (error: any) {
            devLogger.error('[StudentService] Error fetching student', sanitizeError(error, 'getStudentById'));
            throw error;
        }
    }

    /**
     * Crear un nuevo estudiante
     */
    async createStudent(data: any): Promise<any> {
        devLogger.log('[StudentService] Creating new student');

        try {
            this._validateStudentData(data);

            const student = await StudentDAO.create(data);
            devLogger.log(`[StudentService] Student created: ${student.id}`);

            return student;
        } catch (error: any) {
            devLogger.error('[StudentService] Error creating student', sanitizeError(error, 'createStudent'));
            throw error;
        }
    }

    /**
     * Actualizar datos de un estudiante
     */
    async updateStudent(id: number, data: any): Promise<any> {
        devLogger.log(`[StudentService] Updating student: ${id}`);

        try {
            await this.getStudentById(id);

            const updatedStudent = await StudentDAO.update(id, data);
            devLogger.log(`[StudentService] Student updated: ${id}`);

            return updatedStudent;
        } catch (error: any) {
            devLogger.error('[StudentService] Error updating student', sanitizeError(error, 'updateStudent'));
            throw error;
        }
    }

    /**
     * Eliminar un estudiante
     */
    async deleteStudent(id: number): Promise<boolean> {
        devLogger.log(`[StudentService] Deleting student: ${id}`);

        try {
            await this.getStudentById(id);

            await StudentDAO.delete(id);
            devLogger.log(`[StudentService] Student deleted: ${id}`);

            return true;
        } catch (error: any) {
            devLogger.error('[StudentService] Error deleting student', sanitizeError(error, 'deleteStudent'));
            throw error;
        }
    }

    /**
     * Obtener calificaciones de un estudiante
     */
    async getStudentGrades(studentId: number): Promise<any[]> {
        devLogger.log(`[StudentService] Fetching grades for student: ${studentId}`);

        try {
            const grades = await GradeDAO.getByStudent(studentId);
            return grades;
        } catch (error: any) {
            devLogger.error('[StudentService] Error fetching grades', sanitizeError(error, 'getStudentGrades'));
            throw error;
        }
    }

    /**
     * Obtener asistencia de un estudiante
     */
    async getStudentAttendance(studentId: number): Promise<any[]> {
        devLogger.log(`[StudentService] Fetching attendance for student: ${studentId}`);

        try {
            const attendance = await AttendanceDAO.getByStudent(studentId);
            return attendance;
        } catch (error: any) {
            devLogger.error('[StudentService] Error fetching attendance', sanitizeError(error, 'getStudentAttendance'));
            throw error;
        }
    }

    /**
     * Obtener estadísticas de estudiantes
     */
    async getStats(filters: any = {}): Promise<any> {
        devLogger.log('[StudentService] Fetching student statistics');

        try {
            const total = await StudentDAO.count(filters);
            const stats = {
                total_students: total,
                active_students: await StudentDAO.count({ ...filters, status: 'activo' })
            };
            devLogger.log('[StudentService] Statistics fetched successfully');
            return stats;
        } catch (error: any) {
            devLogger.error('[StudentService] Error fetching statistics', sanitizeError(error, 'getStats'));
            throw error;
        }
    }

    /**
     * Obtener todos los estudiantes con paginación
     */
    async getAll(filters: StudentServiceFilters = {}, pagination: PaginationOptions = { page: 1, limit: 50 }): Promise<any> {
        devLogger.log(`[StudentService] Fetching all students page ${pagination.page}`);

        try {
            const offset = (pagination.page - 1) * pagination.limit;
            const data = await StudentDAO.list(filters, pagination.limit, offset);
            const total = await StudentDAO.count(filters);

            const result = {
                data,
                total,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: Math.ceil(total / pagination.limit)
            };

            devLogger.log(`[StudentService] Students fetched: ${result.data.length} of ${result.total}`);
            return result;
        } catch (error: any) {
            devLogger.error('[StudentService] Error fetching all students', sanitizeError(error, 'getAll'));
            throw error;
        }
    }

    /**
     * Validar datos de estudiante
     */
    private _validateStudentData(data: any): void {
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

export default new StudentService();
module.exports = new StudentService();

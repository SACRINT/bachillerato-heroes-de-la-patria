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
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
const student_dao_1 = __importDefault(require('../data/student.dao.js'));
const grades_dao_1 = __importDefault(require('../data/grades.dao.js'));
const attendance_dao_1 = __importDefault(require('../data/attendance.dao.js'));
const database_1 = require('../config/database.js');
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
     * Validar formato de email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Valida datos de estudiante
     */
    _validateStudentData(data) {
        const requiredFields = ['nombre', 'email', 'role'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
        }
        if (!StudentService.isValidEmail(data.email)) {
            throw new Error('Email inválido');
        }
    }

    /**
     * DASHBOARD: Obtener datos agregados para dashboard
     */
    async getDashboardData(userId) {
        try {
            // 1. Obtener perfil primero para tener studentId
            const profile = await this.getStudentProfile(userId);

            // Si no tiene perfil de estudiante (ej. usuario nuevo sin registro completo), devolver default
            if (!profile) {
                return this._getDefaultDashboardData();
            }

            const studentId = profile.id;

            // 2. Obtener resto de datos en paralelo
            // getStudentGrades usa studentId (DAO)
            // getStudentSchedule/Assignments usan userId (SQL JOIN)
            const [grades, schedule, assignments, notifications] = await Promise.all([
                this.getStudentGrades(studentId).catch(() => []),
                this.getStudentSchedule(userId),
                this.getStudentAssignments(userId, { status: 'pending' }),
                this.getStudentNotifications(userId, { unread_only: true })
            ]);

            // Calcular promedio
            const numericGrades = (grades || []).map(g => parseFloat(g.calificacion)).filter(n => !isNaN(n));
            const promedio = numericGrades.length > 0
                ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(2)
                : '0.00';

            return {
                student_id: profile.id,
                matricula: profile.matricula,
                nombre_completo: `${profile.nombre} ${profile.apellido_paterno}`,
                profile: profile,
                statistics: {
                    promedio_general: promedio,
                    tareas_pendientes: (assignments || []).length,
                    notificaciones_nuevas: (notifications || []).length,
                    materias_cursando: schedule ? new Set(schedule.map(s => s.materia)).size : 0
                },
                recent_grades: (grades || []).slice(0, 5),
                pending_assignments: assignments || [],
                recent_notifications: notifications || [],
                schedule_today: schedule || []
            };
        } catch (error) {
            devLogger_1.default.error('[StudentService] Dashboard error', (0, sanitized_errors_1.sanitizeError)(error, 'getDashboardData'));
            return this._getDefaultDashboardData();
        }
    }

    async getStudentProfile(userId) {
        try {
            // Schema real de estudiantes (sin grupo, turno, nia)
            const query = `
                SELECT e.id, e.matricula, e.especialidad, e.semestre, e.fecha_ingreso,
                       u.nombre, u.apellido_paterno, u.apellido_materno, u.email, u.telefono, u.foto_url
                FROM estudiantes e
                JOIN usuarios u ON e.usuario_id = u.id
                WHERE u.id = $1 AND u.status = 'activo'
            `;
            const result = await (0, database_1.executeQuery)(query, [userId]);
            return result[0] || null;
        } catch (e) {
            devLogger_1.default.warn('[StudentService] Error fetching profile', e);
            return null;
        }
    }

    async getStudentSchedule(userId) {
        try {
            // Schema real de horarios (con grupo_id)
            const query = `
                SELECT h.dia, h.hora_inicio, h.hora_fin, h.aula,
                       m.nombre as materia, 
                       d.nombre || ' ' || d.apellido_paterno as docente
                FROM horarios h
                JOIN estudiantes e ON h.grupo_id = e.grupo_id
                JOIN usuarios u ON e.usuario_id = u.id
                LEFT JOIN materias m ON h.materia_id = m.id
                LEFT JOIN docentes doc ON h.docente_id = doc.id
                LEFT JOIN usuarios d ON doc.usuario_id = d.id
                WHERE u.id = $1 AND h.activo = true
                ORDER BY h.dia, h.hora_inicio
            `;
            const result = await (0, database_1.executeQuery)(query, [userId]);
            return result || [];
        } catch (e) {
            devLogger_1.default.warn('[StudentService] Error fetching schedule', e);
            return []; // Retornar vacío en vez de mock
        }
    }

    async getStudentAssignments(userId, filters) {
        try {
            // Fix: t.status = 'publicada'
            let query = `
                SELECT t.id, t.titulo, t.descripcion, t.fecha_entrega, t.tipo,
                       m.nombre as materia,
                       CASE WHEN et.id IS NOT NULL THEN 'entregada' ELSE 'pendiente' END as estado
                FROM tareas t
                JOIN estudiantes e ON t.grupo_id = e.grupo_id
                JOIN usuarios u ON e.usuario_id = u.id
                LEFT JOIN materias m ON t.materia_id = m.id
                LEFT JOIN entregas_tareas et ON et.tarea_id = t.id AND et.estudiante_id = e.id
                WHERE u.id = $1 AND t.status = 'publicada'
            `;
            if (filters.status === 'pending') query += " AND et.id IS NULL";
            query += " ORDER BY t.fecha_entrega ASC LIMIT 10";
            const result = await (0, database_1.executeQuery)(query, [userId]);
            return result || [];
        } catch (e) {
            devLogger_1.default.warn('[StudentService] Error fetching assignments', e);
            return [];
        }
    }

    async getStudentNotifications(userId, filters) {
        try {
            const query = `SELECT * FROM notificaciones_usuario WHERE usuario_id = $1 ORDER BY fecha_creacion DESC LIMIT 5`;
            const result = await (0, database_1.executeQuery)(query, [userId]);
            return result || [];
        } catch (e) { return []; }
    }

    _getDefaultDashboardData() {
        return {
            statistics: { promedio_general: '0.00', tareas_pendientes: 0, notificaciones_nuevas: 0, materias_cursando: 0 },
            recent_grades: [], pending_assignments: [], recent_notifications: [], schedule_today: []
        };
    }
}
exports.default = new StudentService();
module.exports = new StudentService();
//# sourceMappingURL=student.service.js.map
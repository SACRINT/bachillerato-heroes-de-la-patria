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

    // ============================================
    // DASHBOARD ESTUDIANTIL METHODS
    // ============================================

    /**
     * Autenticar estudiante por matrícula/email y contraseña
     */
    async authenticateStudent(matricula: string, password: string): Promise<{ success: boolean; student?: any; message?: string }> {
        devLogger.log('[StudentService] Authenticating student');

        try {
            // Import bcrypt here to avoid circular dependencies
            const bcrypt = require('bcryptjs');
            const { executeQuery } = require('../config/database');

            const query = `
                SELECT 
                    u.id as user_id,
                    u.password_hash,
                    u.email,
                    u.nombre,
                    u.apellido_paterno,
                    u.apellido_materno,
                    e.id as student_id,
                    e.matricula,
                    e.especialidad,
                    e.semestre,
                    e.grupo
                FROM usuarios u
                JOIN estudiantes e ON e.usuario_id = u.id
                WHERE (e.matricula = $1 OR u.email = $1) AND u.status = 'activo'
            `;

            const result = await executeQuery(query, [matricula]);

            if (!result || result.length === 0) {
                return { success: false, message: 'Estudiante no encontrado' };
            }

            const user = result[0];

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return { success: false, message: 'Contraseña incorrecta' };
            }

            return {
                success: true,
                student: {
                    id: user.student_id,
                    userId: user.user_id,
                    matricula: user.matricula,
                    name: `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno || ''}`.trim(),
                    email: user.email,
                    specialty: user.especialidad,
                    semester: user.semestre,
                    group: user.grupo
                }
            };
        } catch (error: any) {
            devLogger.error('[StudentService] Authentication error', sanitizeError(error, 'authenticateStudent'));
            return { success: false, message: 'Error de autenticación' };
        }
    }

    /**
     * Obtener datos del dashboard estudiantil
     */
    async getDashboardData(userId: number): Promise<any> {
        devLogger.log(`[StudentService] Fetching dashboard data for user: ${userId}`);

        try {
            const [profile, grades, schedule, assignments, notifications] = await Promise.all([
                this.getStudentProfile(userId),
                this.getStudentGrades(userId),
                this.getStudentSchedule(userId),
                this.getStudentAssignments(userId, { status: 'pending' }),
                this.getStudentNotifications(userId, { unread_only: true })
            ]);

            const promedioGeneral = grades.length > 0
                ? grades.reduce((sum: number, g: any) => sum + (parseFloat(g.promedio) || 0), 0) / grades.length
                : 0;

            return {
                profile,
                statistics: {
                    promedio_general: promedioGeneral.toFixed(2),
                    tareas_pendientes: assignments.length,
                    notificaciones_nuevas: notifications.length,
                    materias_cursando: grades.length
                },
                recent_grades: grades.slice(0, 4),
                pending_assignments: assignments.slice(0, 5),
                recent_notifications: notifications.slice(0, 5),
                schedule_today: this._getTodaySchedule(schedule)
            };
        } catch (error: any) {
            devLogger.error('[StudentService] Dashboard data error', sanitizeError(error, 'getDashboardData'));
            return this._getDefaultDashboardData();
        }
    }

    private _getTodaySchedule(schedule: any[]): any[] {
        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const today = days[new Date().getDay()];
        return schedule.filter(item => item.dia?.toLowerCase() === today);
    }

    private _getDefaultDashboardData(): any {
        return {
            profile: null,
            statistics: { promedio_general: '0.00', tareas_pendientes: 0, notificaciones_nuevas: 0, materias_cursando: 0 },
            recent_grades: [],
            pending_assignments: [],
            recent_notifications: [],
            schedule_today: []
        };
    }

    /**
     * Obtener perfil del estudiante
     */
    async getStudentProfile(userId: number): Promise<any> {
        devLogger.log(`[StudentService] Fetching profile for user: ${userId}`);

        try {
            const { executeQuery } = require('../config/database');
            const query = `
                SELECT 
                    e.id, e.matricula, e.nia, e.especialidad, e.semestre, e.grupo, e.turno, e.generacion, e.fecha_ingreso,
                    u.nombre, u.apellido_paterno, u.apellido_materno, u.email, u.telefono, u.foto_url, u.created_at
                FROM estudiantes e
                JOIN usuarios u ON e.usuario_id = u.id
                WHERE u.id = $1 AND u.status = 'activo'
            `;

            const result = await executeQuery(query, [userId]);

            if (result && result.length > 0) {
                const row = result[0];
                return {
                    ...row,
                    nombre_completo: `${row.nombre} ${row.apellido_paterno} ${row.apellido_materno || ''}`.trim()
                };
            }

            return null;
        } catch (error: any) {
            devLogger.error('[StudentService] Profile fetch error', sanitizeError(error, 'getStudentProfile'));
            return null;
        }
    }

    /**
     * Obtener horario del estudiante
     */
    async getStudentSchedule(userId: number): Promise<any[]> {
        devLogger.log(`[StudentService] Fetching schedule for user: ${userId}`);

        try {
            const { executeQuery } = require('../config/database');
            const query = `
                SELECT 
                    h.id, h.dia, h.hora_inicio, h.hora_fin, h.aula,
                    m.nombre as materia, m.clave as clave_materia,
                    d.nombre || ' ' || d.apellido_paterno as docente
                FROM horarios h
                JOIN estudiantes e ON h.grupo_id = e.grupo_id
                JOIN usuarios u ON e.usuario_id = u.id
                LEFT JOIN materias m ON h.materia_id = m.id
                LEFT JOIN docentes doc ON h.docente_id = doc.id
                LEFT JOIN usuarios d ON doc.usuario_id = d.id
                WHERE u.id = $1 AND h.activo = true
                ORDER BY 
                    CASE h.dia WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3 WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 ELSE 6 END,
                    h.hora_inicio
            `;

            const result = await executeQuery(query, [userId]);
            return result || this._getDefaultSchedule();
        } catch (error: any) {
            devLogger.error('[StudentService] Schedule fetch error', sanitizeError(error, 'getStudentSchedule'));
            return this._getDefaultSchedule();
        }
    }

    private _getDefaultSchedule(): any[] {
        return [
            { dia: 'lunes', hora_inicio: '08:00', hora_fin: '08:50', materia: 'Matemáticas III', aula: 'A-101', docente: 'Prof. García' },
            { dia: 'lunes', hora_inicio: '08:50', hora_fin: '09:40', materia: 'Física III', aula: 'Lab-1', docente: 'Prof. López' },
            { dia: 'martes', hora_inicio: '08:00', hora_fin: '08:50', materia: 'Programación', aula: 'CC-1', docente: 'Prof. Hernández' },
            { dia: 'miercoles', hora_inicio: '08:00', hora_fin: '08:50', materia: 'Química III', aula: 'Lab-2', docente: 'Prof. Martínez' },
            { dia: 'jueves', hora_inicio: '08:00', hora_fin: '08:50', materia: 'Inglés V', aula: 'B-203', docente: 'Prof. Smith' },
            { dia: 'viernes', hora_inicio: '08:00', hora_fin: '08:50', materia: 'Historia', aula: 'C-105', docente: 'Prof. Juárez' }
        ];
    }

    /**
     * Obtener tareas del estudiante
     */
    async getStudentAssignments(userId: number, filters: any = {}): Promise<any[]> {
        devLogger.log(`[StudentService] Fetching assignments for user: ${userId}`);

        try {
            const { executeQuery } = require('../config/database');
            let query = `
                SELECT 
                    t.id, t.titulo, t.descripcion, t.fecha_entrega, t.tipo,
                    m.nombre as materia,
                    CASE 
                        WHEN et.id IS NOT NULL THEN 'entregada'
                        WHEN t.fecha_entrega < CURRENT_DATE THEN 'vencida'
                        ELSE 'pendiente'
                    END as estado
                FROM tareas t
                JOIN estudiantes e ON t.grupo_id = e.grupo_id
                JOIN usuarios u ON e.usuario_id = u.id
                LEFT JOIN materias m ON t.materia_id = m.id
                LEFT JOIN entregas_tareas et ON et.tarea_id = t.id AND et.estudiante_id = e.id
                WHERE u.id = $1 AND t.activo = true
            `;

            if (filters.status === 'pending') {
                query += ` AND et.id IS NULL AND t.fecha_entrega >= CURRENT_DATE`;
            }

            query += ' ORDER BY t.fecha_entrega ASC LIMIT 10';

            const result = await executeQuery(query, [userId]);
            return result || this._getDefaultAssignments();
        } catch (error: any) {
            devLogger.error('[StudentService] Assignments fetch error', sanitizeError(error, 'getStudentAssignments'));
            return this._getDefaultAssignments();
        }
    }

    private _getDefaultAssignments(): any[] {
        const today = new Date();
        return [
            { id: 1, titulo: 'Ejercicios de derivadas', materia: 'Matemáticas III', fecha_entrega: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], estado: 'pendiente' },
            { id: 2, titulo: 'Práctica de laboratorio', materia: 'Química III', fecha_entrega: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], estado: 'pendiente' },
            { id: 3, titulo: 'Proyecto web', materia: 'Programación', fecha_entrega: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], estado: 'pendiente' }
        ];
    }

    /**
     * Obtener notificaciones del estudiante
     */
    async getStudentNotifications(userId: number, filters: any = {}): Promise<any[]> {
        devLogger.log(`[StudentService] Fetching notifications for user: ${userId}`);

        try {
            const { executeQuery } = require('../config/database');
            let query = `
                SELECT id, titulo, mensaje, tipo, prioridad, leida, fecha_creacion, url_destino
                FROM notificaciones_usuario
                WHERE usuario_id = $1
            `;

            if (filters.unread_only) {
                query += ` AND leida = false`;
            }

            query += ' ORDER BY fecha_creacion DESC LIMIT 20';

            const result = await executeQuery(query, [userId]);
            return result || this._getDefaultNotifications();
        } catch (error: any) {
            devLogger.error('[StudentService] Notifications fetch error', sanitizeError(error, 'getStudentNotifications'));
            return this._getDefaultNotifications();
        }
    }

    private _getDefaultNotifications(): any[] {
        const today = new Date();
        return [
            { id: 1, titulo: 'Nueva tarea asignada', mensaje: 'Se ha asignado una nueva tarea en Matemáticas III', tipo: 'assignment', leida: false, fecha_creacion: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString() },
            { id: 2, titulo: 'Calificación publicada', mensaje: 'Nueva calificación disponible en Física III', tipo: 'grade', leida: false, fecha_creacion: new Date(today.getTime() - 48 * 60 * 60 * 1000).toISOString() },
            { id: 3, titulo: 'Recordatorio de examen', mensaje: 'Examen parcial próxima semana', tipo: 'reminder', leida: true, fecha_creacion: new Date(today.getTime() - 72 * 60 * 60 * 1000).toISOString() }
        ];
    }

    /**
     * Validar formato de email
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

        if (!StudentService.isValidEmail(data.email)) {
            throw new Error('Email inválido');
        }
    }
}

export default new StudentService();
module.exports = new StudentService();

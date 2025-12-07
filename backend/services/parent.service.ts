/**
 * 👨‍👩‍👧 PARENT SERVICE - TypeScript
 * Lógica de negocio para el portal de padres
 * Migración TypeScript: 07 Diciembre 2025
 */

import ParentDAO from '../data/parent.dao';
import GradeDAO from '../data/grades.dao';
import AttendanceDAO from '../data/attendance.dao';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import devLogger from '../utils/devLogger';

export interface ParentLoginResponse {
    token: string;
    parent: {
        id: number;
        nombre: string;
        email: string;
    };
}

class ParentService {

    /**
     * Autenticación de padres
     */
    async login(email: string, password: string): Promise<ParentLoginResponse> {
        const parent = await ParentDAO.findByEmail(email);

        if (!parent) {
            throw new Error('Credenciales inválidas');
        }

        // Esquema legacy no tiene campo activo ni email_verified por ahora
        // if (!parent.activo) ...
        // if (!parent.email_verified) ...

        const passwordMatch = await bcrypt.compare(password, parent.password_hash);
        if (!passwordMatch) {
            throw new Error('Credenciales inválidas');
        }

        // Actualizar last_login (Campo no existe en esquema actual)
        // await ParentDAO.update(parent.id, { last_login: new Date() });

        // Generar Token
        const token = jwt.sign(
            {
                id: parent.id,
                email: parent.email,
                role: 'parent'
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        return {
            token,
            parent: {
                id: parent.id,
                nombre: parent.nombre,
                email: parent.email
            }
        };
    }

    /**
     * Registro de nuevos padres
     */
    async register(data: any): Promise<any> {
        // Verificar si existe
        const existing = await ParentDAO.findByEmail(data.email);
        if (existing) {
            throw new Error('El email ya está registrado');
        }

        // Hash password
        const password_hash = await bcrypt.hash(data.password, 10);

        // Crear
        const newParent = await ParentDAO.create({
            ...data,
            password_hash
        });

        // TODO: Enviar email de verificación (Integrar NotificationService)

        return newParent;
    }

    /**
     * Obtener Dashboard completo
     */
    async getDashboard(parentId: number): Promise<any> {
        const students = await ParentDAO.getStudentsByParentId(parentId);
        const unreadNotifications = await ParentDAO.countUnreadNotifications(parentId);
        const unreadMessages = await ParentDAO.countUnreadMessages(parentId);
        const pendingPayments = await ParentDAO.getPendingPaymentsSummary(parentId);

        return {
            students,
            summary: {
                total_students: students.length,
                unread_notifications: unreadNotifications,
                unread_messages: unreadMessages,
                pending_payments: pendingPayments
            }
        };
    }

    /**
     * Obtener calificaciones de un estudiante (con verificación de permisos)
     */
    async getStudentGrades(parentId: number, studentId: number, filters: any = {}): Promise<any> {
        // 1. Verificar permisos
        const permission = await ParentDAO.checkPermission(parentId, studentId);
        if (!permission) {
            throw new Error('No tiene permisos para ver este estudiante');
        }
        if (!permission.ver_calificaciones) {
            throw new Error('No tiene permisos para ver calificaciones');
        }

        // 2. Obtener calificaciones (usando GradeDAO)
        // Usamos getAll para poder filtrar si es necesario, aunque por defecto traemos todo del estudiante
        const gradesResult = await GradeDAO.getAll({
            estudianteId: studentId,
            periodo: filters.periodo
        });

        const grades = gradesResult.rows;

        // 3. Calcular promedio (usando GradeDAO o calculando aquí)
        let promedio = 0;
        if (grades && grades.length > 0) {
            const sum = grades.reduce((acc: number, g: any) => acc + parseFloat((g.calificacion || 0).toString()), 0);
            promedio = parseFloat((sum / grades.length).toFixed(2));
        }

        return {
            grades,
            summary: {
                promedio_general: promedio,
                total_materias: grades.length
            }
        };
    }

    /**
     * Obtener asistencia de un estudiante
     */
    async getStudentAttendance(parentId: number, studentId: number, filters: any = {}): Promise<any> {
        // 1. Verificar permisos
        const permission = await ParentDAO.checkPermission(parentId, studentId);
        if (!permission) {
            throw new Error('No tiene permisos para ver este estudiante');
        }
        if (!permission.ver_asistencia) {
            throw new Error('No tiene permisos para ver asistencia');
        }

        // 2. Obtener asistencia (usando AttendanceDAO)
        const attendance = await AttendanceDAO.getByStudent(studentId, filters);

        // 3. Obtener estadísticas mensuales
        const stats = await AttendanceDAO.getSummaryByStudent(studentId);

        return {
            attendance,
            stats_monthly: stats
        };
    }

    // ==========================================
    // MÉTODOS ADMINISTRATIVOS
    // ==========================================

    async getAllParents(): Promise<any> {
        return await ParentDAO.findAll();
    }

    async createParentAdmin(data: any): Promise<any> {
        const existing = await ParentDAO.findByEmail(data.email);
        if (existing) throw new Error('El email ya está registrado');

        const password_hash = await bcrypt.hash(data.password, 10);
        // Remove password from object before sending to DAO
        const { password, ...otherData } = data;
        return await ParentDAO.create({ ...otherData, password_hash });
    }

    async updateParent(id: number, data: any): Promise<any> {
        // Si hay password, hashear
        if (data.password) {
            data.password_hash = await bcrypt.hash(data.password, 10);
            delete data.password;
        }

        // Si cambia email, verificar unicidad
        if (data.email) {
            const existing = await ParentDAO.findByEmail(data.email);
            if (existing && existing.id !== id) {
                throw new Error('El email ya está en uso');
            }
        }

        return await ParentDAO.update(id, data);
    }

    async deleteParent(id: number): Promise<any> {
        return await ParentDAO.delete(id);
    }
}

export default new ParentService();
module.exports = new ParentService();

"use strict";
/**
 * 👨‍👩‍👧 PARENT SERVICE - TypeScript
 * Lógica de negocio para el portal de padres
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parent_dao_1 = __importDefault(require('../data/parent.dao.js'));
const grades_dao_1 = __importDefault(require('../data/grades.dao.js'));
const attendance_dao_1 = __importDefault(require('../data/attendance.dao.js'));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class ParentService {
    /**
     * Autenticación de padres
     */
    async login(email, password) {
        const parent = await parent_dao_1.default.findByEmail(email);
        if (!parent) {
            throw new Error('Credenciales inválidas');
        }
        // Esquema legacy no tiene campo activo ni email_verified por ahora
        // if (!parent.activo) ...
        // if (!parent.email_verified) ...
        const passwordMatch = await bcrypt_1.default.compare(password, parent.password_hash);
        if (!passwordMatch) {
            throw new Error('Credenciales inválidas');
        }
        // Actualizar last_login (Campo no existe en esquema actual)
        // await ParentDAO.update(parent.id, { last_login: new Date() });
        // Generar Token
        const token = jsonwebtoken_1.default.sign({
            id: parent.id,
            email: parent.email,
            role: 'parent'
        }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
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
    async register(data) {
        // Verificar si existe
        const existing = await parent_dao_1.default.findByEmail(data.email);
        if (existing) {
            throw new Error('El email ya está registrado');
        }
        // Hash password
        const password_hash = await bcrypt_1.default.hash(data.password, 10);
        // Crear
        const newParent = await parent_dao_1.default.create({
            ...data,
            password_hash
        });
        // TODO: Enviar email de verificación (Integrar NotificationService)
        return newParent;
    }
    /**
     * Obtener Dashboard completo
     */
    async getDashboard(parentId) {
        const students = await parent_dao_1.default.getStudentsByParentId(parentId);
        const unreadNotifications = await parent_dao_1.default.countUnreadNotifications(parentId);
        const unreadMessages = await parent_dao_1.default.countUnreadMessages(parentId);
        const pendingPayments = await parent_dao_1.default.getPendingPaymentsSummary(parentId);
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
    async getStudentGrades(parentId, studentId, filters = {}) {
        // 1. Verificar permisos
        const permission = await parent_dao_1.default.checkPermission(parentId, studentId);
        if (!permission) {
            throw new Error('No tiene permisos para ver este estudiante');
        }
        if (!permission.ver_calificaciones) {
            throw new Error('No tiene permisos para ver calificaciones');
        }
        // 2. Obtener calificaciones (usando GradeDAO)
        // Usamos getAll para poder filtrar si es necesario, aunque por defecto traemos todo del estudiante
        const gradesResult = await grades_dao_1.default.getAll({
            estudianteId: studentId,
            periodo: filters.periodo
        });
        const grades = gradesResult.rows;
        // 3. Calcular promedio (usando GradeDAO o calculando aquí)
        let promedio = 0;
        if (grades && grades.length > 0) {
            const sum = grades.reduce((acc, g) => acc + parseFloat((g.calificacion || 0).toString()), 0);
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
    async getStudentAttendance(parentId, studentId, filters = {}) {
        // 1. Verificar permisos
        const permission = await parent_dao_1.default.checkPermission(parentId, studentId);
        if (!permission) {
            throw new Error('No tiene permisos para ver este estudiante');
        }
        if (!permission.ver_asistencia) {
            throw new Error('No tiene permisos para ver asistencia');
        }
        // 2. Obtener asistencia (usando AttendanceDAO)
        const attendance = await attendance_dao_1.default.getByStudent(studentId, filters);
        // 3. Obtener estadísticas mensuales
        const stats = await attendance_dao_1.default.getSummaryByStudent(studentId);
        return {
            attendance,
            stats_monthly: stats
        };
    }
    // ==========================================
    // MÉTODOS ADMINISTRATIVOS
    // ==========================================
    async getAllParents() {
        return await parent_dao_1.default.findAll();
    }
    async createParentAdmin(data) {
        const existing = await parent_dao_1.default.findByEmail(data.email);
        if (existing)
            throw new Error('El email ya está registrado');
        const password_hash = await bcrypt_1.default.hash(data.password, 10);
        // Remove password from object before sending to DAO
        const { password, ...otherData } = data;
        return await parent_dao_1.default.create({ ...otherData, password_hash });
    }
    async updateParent(id, data) {
        // Si hay password, hashear
        if (data.password) {
            data.password_hash = await bcrypt_1.default.hash(data.password, 10);
            delete data.password;
        }
        // Si cambia email, verificar unicidad
        if (data.email) {
            const existing = await parent_dao_1.default.findByEmail(data.email);
            if (existing && existing.id !== id) {
                throw new Error('El email ya está en uso');
            }
        }
        return await parent_dao_1.default.update(id, data);
    }
    async deleteParent(id) {
        return await parent_dao_1.default.delete(id);
    }
}
exports.default = new ParentService();
module.exports = new ParentService();
//# sourceMappingURL=parent.service.js.map
/**
 * 👨‍👩‍👧 PARENT SERVICE
 * Lógica de negocio para el portal de padres
 */

const ParentDAO = require('../data/parent.dao');
const GradeDAO = require('../data/grade.dao');
const AttendanceDAO = require('../data/attendance.dao');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const ServiceError = require('../utils/ServiceError');
const devLogger = require('../utils/devLogger');

class ParentService {

    /**
     * Autenticación de padres
     */
    async login(email, password) {
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
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            parent: {
                id: parent.id,
                nombre: parent.nombre, // Esquema actual usa 'nombre'
                email: parent.email
            }
        };
    }

    /**
     * Registro de nuevos padres
     */
    async register(data) {
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
    async getDashboard(parentId) {
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
    async getStudentGrades(parentId, studentId, filters = {}) {
        // 1. Verificar permisos
        const permission = await ParentDAO.checkPermission(parentId, studentId);
        if (!permission) {
            throw new Error('No tiene permisos para ver este estudiante');
        }
        if (!permission.ver_calificaciones) {
            throw new Error('No tiene permisos para ver calificaciones');
        }

        // 2. Obtener calificaciones (usando GradeDAO)
        // Filtros: periodo, ciclo_escolar
        const grades = await GradeDAO.getByStudent(studentId, {
            ...filters,
            visible_padres: true
        });

        // 3. Calcular promedio (usando GradeDAO o calculando aquí)
        // GradeDAO.getAverage devuelve promedio de un ciclo.
        // Si no hay ciclo en filtros, quizás queramos el general.
        // Por simplicidad, calculamos sobre los resultados devueltos si es necesario, 
        // o llamamos a getAverage si tenemos ciclo.

        let promedio = 0;
        if (grades && grades.length > 0) {
            const sum = grades.reduce((acc, g) => acc + parseFloat(g.calificacion || 0), 0);
            promedio = (sum / grades.length).toFixed(2);
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

    async getAllParents() {
        return await ParentDAO.findAll();
    }

    async createParentAdmin(data) {
        const existing = await ParentDAO.findByEmail(data.email);
        if (existing) throw new Error('El email ya está registrado');

        const password_hash = await bcrypt.hash(data.password, 10);
        return await ParentDAO.create({ ...data, password_hash });
    }

    async updateParent(id, data) {
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

    async deleteParent(id) {
        return await ParentDAO.delete(id);
    }
}

module.exports = new ParentService();

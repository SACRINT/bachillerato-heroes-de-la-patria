"use strict";
/**
 * 👨‍🏫 TEACHER SERVICE - TypeScript
 * Capa de servicios para gestión de docentes
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = void 0;
const teacher_dao_1 = __importDefault(require('../data/teacher.dao.js'));
const user_dao_1 = __importDefault(require('../data/user.dao.js'));
const eventBus_service_1 = __importDefault(require('./eventBus.service.js'));
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}
exports.ServiceError = ServiceError;
class TeacherService {
    /**
     * Obtener todos los docentes con filtros
     */
    async getAll(options = {}) {
        try {
            const teachers = await teacher_dao_1.default.list(options, options.limit || 20, options.offset || 0);
            const total = await teacher_dao_1.default.count(options);
            return {
                success: true,
                data: teachers,
                pagination: {
                    page: options.page || 1,
                    limit: options.limit || 20,
                    total,
                    pages: Math.ceil(total / (options.limit || 20))
                }
            };
        }
        catch (error) {
            devLogger_1.default.error('[TeacherService] Error en getAll:', error.message);
            throw new ServiceError('Error al obtener docentes', 500);
        }
    }
    /**
     * Obtener docente por ID
     */
    async getById(id) {
        if (!id)
            throw new ServiceError('ID requerido', 400);
        try {
            const teacher = await teacher_dao_1.default.get(id);
            if (!teacher)
                throw new ServiceError('Docente no encontrado', 404);
            // Obtener materias que imparte
            const subjects = await teacher_dao_1.default.getSubjects(id);
            return {
                success: true,
                data: {
                    teacher,
                    subjects,
                    statistics: { total_materias: subjects.length }
                }
            };
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[TeacherService] Error en getById:', error.message);
            throw new ServiceError('Error al obtener docente', 500);
        }
    }
    /**
     * Crear nuevo docente
     */
    async create(data, createdBy) {
        this._validateCreateData(data);
        try {
            // Verificar que email no exista
            const existingUser = await user_dao_1.default.getByEmail(data.email);
            if (existingUser) {
                throw new ServiceError('El email ya está registrado', 409);
            }
            // Verificar que número de empleado no exista
            const existingTeacher = await teacher_dao_1.default.getByEmployeeNumber(data.numero_empleado);
            if (existingTeacher) {
                throw new ServiceError('El número de empleado ya existe', 409);
            }
            // Crear usuario primero
            const passwordHash = await bcryptjs_1.default.hash(data.password || 'default', parseInt(process.env.BCRYPT_ROUNDS || '12'));
            const newUser = await user_dao_1.default.create({
                email: data.email,
                password_hash: passwordHash,
                username: data.numero_empleado, // Usar como username
                nombre: data.nombre,
                apellido_paterno: data.apellido_paterno,
                apellido_materno: data.apellido_materno || null,
                role: 'docente',
                active: true
            });
            // Crear registro de docente
            const newTeacher = await teacher_dao_1.default.create(newUser.id, data);
            // Emitir evento
            eventBus_service_1.default.getInstance().emit('teacher:created', {
                teacherId: newTeacher.id,
                userId: newUser.id,
                numero_empleado: data.numero_empleado,
                createdBy
            });
            devLogger_1.default.log(`✅ Docente creado: ${data.numero_empleado} (${data.nombre})`);
            return {
                success: true,
                data: { ...newTeacher, email: newUser.email },
                message: 'Docente creado exitosamente'
            };
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[TeacherService] Error en create:', error.message);
            throw new ServiceError('Error al crear docente', 500);
        }
    }
    /**
     * Actualizar docente
     */
    async update(id, data, updatedBy) {
        if (!id)
            throw new ServiceError('ID requerido', 400);
        try {
            const existing = await teacher_dao_1.default.get(id);
            if (!existing)
                throw new ServiceError('Docente no encontrado', 404);
            const updated = await teacher_dao_1.default.update(id, data);
            eventBus_service_1.default.getInstance().emit('teacher:updated', {
                teacherId: id,
                updatedFields: Object.keys(data),
                updatedBy
            });
            return {
                success: true,
                data: updated,
                message: 'Docente actualizado'
            };
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[TeacherService] Error en update:', error.message);
            throw new ServiceError('Error al actualizar docente', 500);
        }
    }
    /**
     * Desactivar docente (soft delete)
     */
    async deactivate(id, deactivatedBy) {
        if (!id)
            throw new ServiceError('ID requerido', 400);
        try {
            const existing = await teacher_dao_1.default.get(id);
            if (!existing)
                throw new ServiceError('Docente no encontrado', 404);
            await teacher_dao_1.default.deactivate(id);
            eventBus_service_1.default.getInstance().emit('teacher:deactivated', {
                teacherId: id,
                deactivatedBy
            });
            return {
                success: true,
                message: 'Docente desactivado'
            };
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[TeacherService] Error en deactivate:', error.message);
            throw new ServiceError('Error al desactivar docente', 500);
        }
    }
    /**
     * Obtener horario de un docente
     */
    async getSchedule(teacherId) {
        if (!teacherId)
            throw new ServiceError('ID requerido', 400);
        try {
            const schedule = await teacher_dao_1.default.getSchedule(teacherId);
            return { success: true, data: schedule };
        }
        catch (error) {
            devLogger_1.default.error('[TeacherService] Error en getSchedule:', error.message);
            throw new ServiceError('Error al obtener horario', 500);
        }
    }
    /**
     * Obtener directorio público de docentes
     */
    async getPublicDirectory(especialidad = null) {
        try {
            const teachers = await teacher_dao_1.default.getPublicDirectory(especialidad);
            return {
                success: true,
                data: teachers,
                total: teachers.length
            };
        }
        catch (error) {
            devLogger_1.default.error('[TeacherService] Error en getPublicDirectory:', error.message);
            throw new ServiceError('Error al obtener directorio', 500);
        }
    }
    /**
     * Obtener especialidades disponibles
     */
    async getSpecialties() {
        try {
            const specialties = await teacher_dao_1.default.getSpecialties();
            return { success: true, data: specialties };
        }
        catch (error) {
            devLogger_1.default.error('[TeacherService] Error en getSpecialties:', error.message);
            throw new ServiceError('Error al obtener especialidades', 500);
        }
    }
    // --- Private Helpers ---
    _validateCreateData(data) {
        if (!data.email)
            throw new ServiceError('Email requerido', 400);
        if (!data.password)
            throw new ServiceError('Contraseña requerida', 400);
        if (!data.nombre)
            throw new ServiceError('Nombre requerido', 400);
        if (!data.apellido_paterno)
            throw new ServiceError('Apellido paterno requerido', 400);
        if (!data.numero_empleado)
            throw new ServiceError('Número de empleado requerido', 400);
        if (!data.especialidad)
            throw new ServiceError('Especialidad requerida', 400);
        if (!data.tipo_contrato || !['base', 'contrato', 'honorarios'].includes(data.tipo_contrato)) {
            throw new ServiceError('Tipo de contrato inválido', 400);
        }
    }
}
exports.default = new TeacherService();
module.exports = new TeacherService();
module.exports.ServiceError = ServiceError;
//# sourceMappingURL=teacher.service.js.map
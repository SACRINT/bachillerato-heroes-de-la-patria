/**
 * 👨‍🏫 TEACHER SERVICE - TypeScript
 * Capa de servicios para gestión de docentes
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import TeacherDAO from '../data/teacher.dao';
import UserDAO from '../data/user.dao';
import EventBus from './eventBus.service';
import devLogger from '../utils/devLogger';
import bcrypt from 'bcryptjs';

// =====================================================
// INTERFACES
// =====================================================

export interface TeacherData {
    id?: number;
    email: string;
    password?: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    numero_empleado: string;
    especialidad: string;
    tipo_contrato: 'base' | 'contrato' | 'honorarios';
    [key: string]: any;
}

export class ServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}

class TeacherService {

    /**
     * Obtener todos los docentes con filtros
     */
    async getAll(options: any = {}): Promise<any> {
        try {
            const teachers = await TeacherDAO.list(options, options.limit || 20, options.offset || 0);
            const total = await TeacherDAO.count(options);

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
        } catch (error: any) {
            devLogger.error('[TeacherService] Error en getAll:', error.message);
            throw new ServiceError('Error al obtener docentes', 500);
        }
    }

    /**
     * Obtener docente por ID
     */
    async getById(id: number): Promise<any> {
        if (!id) throw new ServiceError('ID requerido', 400);

        try {
            const teacher = await TeacherDAO.get(id);
            if (!teacher) throw new ServiceError('Docente no encontrado', 404);

            // Obtener materias que imparte
            const subjects = await TeacherDAO.getSubjects(id);

            return {
                success: true,
                data: {
                    teacher,
                    subjects,
                    statistics: { total_materias: subjects.length }
                }
            };
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[TeacherService] Error en getById:', error.message);
            throw new ServiceError('Error al obtener docente', 500);
        }
    }

    /**
     * Crear nuevo docente
     */
    async create(data: TeacherData, createdBy: number): Promise<any> {
        this._validateCreateData(data);

        try {
            // Verificar que email no exista
            const existingUser = await UserDAO.getByEmail(data.email);
            if (existingUser) {
                throw new ServiceError('El email ya está registrado', 409);
            }

            // Verificar que número de empleado no exista
            const existingTeacher = await TeacherDAO.getByEmployeeNumber(data.numero_empleado);
            if (existingTeacher) {
                throw new ServiceError('El número de empleado ya existe', 409);
            }

            // Crear usuario primero
            const passwordHash = await bcrypt.hash(data.password || 'default', parseInt(process.env.BCRYPT_ROUNDS || '12'));
            const newUser = await UserDAO.create({
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
            const newTeacher = await TeacherDAO.create(newUser.id, data);

            // Emitir evento
            EventBus.getInstance().emit('teacher:created', {
                teacherId: newTeacher.id,
                userId: newUser.id,
                numero_empleado: data.numero_empleado,
                createdBy
            });

            devLogger.log(`✅ Docente creado: ${data.numero_empleado} (${data.nombre})`);

            return {
                success: true,
                data: { ...newTeacher, email: newUser.email },
                message: 'Docente creado exitosamente'
            };
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[TeacherService] Error en create:', error.message);
            throw new ServiceError('Error al crear docente', 500);
        }
    }

    /**
     * Actualizar docente
     */
    async update(id: number, data: any, updatedBy: number): Promise<any> {
        if (!id) throw new ServiceError('ID requerido', 400);

        try {
            const existing = await TeacherDAO.get(id);
            if (!existing) throw new ServiceError('Docente no encontrado', 404);

            const updated = await TeacherDAO.update(id, data);

            EventBus.getInstance().emit('teacher:updated', {
                teacherId: id,
                updatedFields: Object.keys(data),
                updatedBy
            });

            return {
                success: true,
                data: updated,
                message: 'Docente actualizado'
            };
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[TeacherService] Error en update:', error.message);
            throw new ServiceError('Error al actualizar docente', 500);
        }
    }

    /**
     * Desactivar docente (soft delete)
     */
    async deactivate(id: number, deactivatedBy: number): Promise<any> {
        if (!id) throw new ServiceError('ID requerido', 400);

        try {
            const existing = await TeacherDAO.get(id);
            if (!existing) throw new ServiceError('Docente no encontrado', 404);

            await TeacherDAO.deactivate(id);

            EventBus.getInstance().emit('teacher:deactivated', {
                teacherId: id,
                deactivatedBy
            });

            return {
                success: true,
                message: 'Docente desactivado'
            };
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[TeacherService] Error en deactivate:', error.message);
            throw new ServiceError('Error al desactivar docente', 500);
        }
    }

    /**
     * Obtener horario de un docente
     */
    async getSchedule(teacherId: number): Promise<any> {
        if (!teacherId) throw new ServiceError('ID requerido', 400);

        try {
            const schedule = await TeacherDAO.getSchedule(teacherId);
            return { success: true, data: schedule };
        } catch (error: any) {
            devLogger.error('[TeacherService] Error en getSchedule:', error.message);
            throw new ServiceError('Error al obtener horario', 500);
        }
    }

    /**
     * Obtener directorio público de docentes
     */
    async getPublicDirectory(especialidad: string | null = null): Promise<any> {
        try {
            const teachers = await TeacherDAO.getPublicDirectory(especialidad);
            return {
                success: true,
                data: teachers,
                total: teachers.length
            };
        } catch (error: any) {
            devLogger.error('[TeacherService] Error en getPublicDirectory:', error.message);
            throw new ServiceError('Error al obtener directorio', 500);
        }
    }

    /**
     * Obtener especialidades disponibles
     */
    async getSpecialties(): Promise<any> {
        try {
            const specialties = await TeacherDAO.getSpecialties();
            return { success: true, data: specialties };
        } catch (error: any) {
            devLogger.error('[TeacherService] Error en getSpecialties:', error.message);
            throw new ServiceError('Error al obtener especialidades', 500);
        }
    }

    // --- Private Helpers ---

    private _validateCreateData(data: TeacherData) {
        if (!data.email) throw new ServiceError('Email requerido', 400);
        if (!data.password) throw new ServiceError('Contraseña requerida', 400);
        if (!data.nombre) throw new ServiceError('Nombre requerido', 400);
        if (!data.apellido_paterno) throw new ServiceError('Apellido paterno requerido', 400);
        if (!data.numero_empleado) throw new ServiceError('Número de empleado requerido', 400);
        if (!data.especialidad) throw new ServiceError('Especialidad requerida', 400);
        if (!data.tipo_contrato || !['base', 'contrato', 'honorarios'].includes(data.tipo_contrato)) {
            throw new ServiceError('Tipo de contrato inválido', 400);
        }
    }
}

export default new TeacherService();
module.exports = new TeacherService();
module.exports.ServiceError = ServiceError;

/**
 * Student Service
 * Capa de lógica de negocio para estudiantes
 * 
 * Responsabilidades:
 * - Validar datos de entrada
 * - Ejecutar lógica de negocio
 * - Emitir eventos para Event Bus
 * - Coordinar múltiples DAOs si es necesario
 * - NO ejecuta SQL directo (usa StudentDAO)
 */

const StudentDAO = require('../data/student.dao');
const EventBus = require('./eventBus.service');
const { debugLog } = require('../utils/debug-logger');

class StudentService {
    /**
     * Obtener estudiante por ID
     * @param {number} id - ID del estudiante
     * @returns {Promise<Object>}
     */
    static async getStudent(id) {
        // Validación
        if (!id || isNaN(id)) {
            throw new Error('ID de estudiante inválido');
        }

        // Obtener de DAO
        const student = await StudentDAO.get(id);

        if (!student) {
            throw new Error(`Estudiante no encontrado: ${id}`);
        }

        // Emitir evento
        EventBus.getInstance().emit('student:loaded', { id, student });

        debugLog.log('STUDENT', `📚 Estudiante cargado: ${student.nombre} ${student.apellido_paterno}`);

        return student;
    }

    /**
     * Obtener perfil completo de estudiante (con calificaciones y asistencia)
     * @param {number} id - ID del estudiante
     * @returns {Promise<Object>}
     */
    static async getStudentProfile(id) {
        // Obtener datos básicos
        const student = await this.getStudent(id);

        // TODO: En futuras semanas, agregar:
        // const grades = await GradeService.getByStudent(id);
        // const attendance = await AttendanceService.getByStudent(id);

        const profile = {
            student,
            // grades,
            // attendance
        };

        // Emitir evento
        EventBus.getInstance().emit('student:profile:loaded', { id, profile });

        return profile;
    }

    /**
     * Listar estudiantes con filtros
     * @param {Object} filters - Filtros de búsqueda
     * @param {Object} pagination - Paginación
     * @returns {Promise<Object>}
     */
    static async listStudents(filters = {}, pagination = {}) {
        const limit = pagination.limit || 20;
        const offset = pagination.offset || 0;

        // Validación de límites
        if (limit > 100) {
            throw new Error('Límite máximo es 100 registros');
        }

        // Obtener datos y total
        const [students, total] = await Promise.all([
            StudentDAO.list(filters, limit, offset),
            StudentDAO.count(filters)
        ]);

        const result = {
            data: students,
            pagination: {
                limit,
                offset,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: Math.floor(offset / limit) + 1
            }
        };

        debugLog.log('STUDENT', `📋 Listado de estudiantes: ${students.length}/${total}`);

        return result;
    }

    /**
     * Crear nuevo estudiante
     * @param {Object} data - Datos del estudiante
     * @returns {Promise<Object>}
     */
    static async createStudent(data) {
        // Validación
        this.validateStudentData(data);

        // Verificar email único
        const existingEmail = await StudentDAO.getByEmail(data.email);
        if (existingEmail) {
            throw new Error(`Email ya registrado: ${data.email}`);
        }

        // Verificar CURP único (si se proporciona)
        if (data.curp) {
            const existingCURP = await StudentDAO.getByCURP(data.curp);
            if (existingCURP) {
                throw new Error(`CURP ya registrado: ${data.curp}`);
            }
        }

        // Crear en base de datos
        const student = await StudentDAO.create(data);

        // Emitir evento
        EventBus.getInstance().emit('student:created', { student });

        debugLog.log('STUDENT', `✅ Estudiante creado: ${student.nombre} ${student.apellido_paterno} (ID: ${student.id})`);

        return student;
    }

    /**
     * Actualizar estudiante
     * @param {number} id - ID del estudiante
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>}
     */
    static async updateStudent(id, data) {
        // Validar que existe
        const existing = await this.getStudent(id);

        // Validar datos
        this.validateStudentData(data, false);

        // Verificar email único (si cambió)
        if (data.email && data.email !== existing.email) {
            const existingEmail = await StudentDAO.getByEmail(data.email);
            if (existingEmail && existingEmail.id !== id) {
                throw new Error(`Email ya registrado: ${data.email}`);
            }
        }

        // Verificar CURP único (si cambió)
        if (data.curp && data.curp !== existing.curp) {
            const existingCURP = await StudentDAO.getByCURP(data.curp);
            if (existingCURP && existingCURP.id !== id) {
                throw new Error(`CURP ya registrado: ${data.curp}`);
            }
        }

        // Actualizar
        const student = await StudentDAO.update(id, data);

        // Emitir evento
        EventBus.getInstance().emit('student:updated', { id, student, previousData: existing });

        debugLog.log('STUDENT', `📝 Estudiante actualizado: ${student.nombre} ${student.apellido_paterno} (ID: ${id})`);

        return student;
    }

    /**
     * Eliminar estudiante (soft delete)
     * @param {number} id - ID del estudiante
     * @returns {Promise<boolean>}
     */
    static async deleteStudent(id) {
        // Validar que existe
        const existing = await this.getStudent(id);

        // Soft delete
        await StudentDAO.delete(id);

        // Emitir evento
        EventBus.getInstance().emit('student:deleted', { id, student: existing });

        debugLog.log('STUDENT', `🗑️ Estudiante eliminado (soft): ${existing.nombre} ${existing.apellido_paterno} (ID: ${id})`);

        return true;
    }

    /**
     * Obtener estudiantes por grado y grupo
     * @param {string} grado - Grado
     * @param {string} grupo - Grupo
     * @returns {Promise<Array>}
     */
    static async getByGroup(grado, grupo) {
        // Validación
        if (!grado || !grupo) {
            throw new Error('Grado y grupo son requeridos');
        }

        const students = await StudentDAO.getByGroup(grado, grupo);

        debugLog.log('STUDENT', `👥 Estudiantes de ${grado}${grupo}: ${students.length}`);

        return students;
    }

    /**
     * Validar datos de estudiante
     * @param {Object} data - Datos a validar
     * @param {boolean} isCreate - Si es creación (requiere todos los campos)
     * @private
     */
    static validateStudentData(data, isCreate = true) {
        const errors = [];

        // Validaciones para creación
        if (isCreate) {
            if (!data.nombre || data.nombre.trim().length < 2) {
                errors.push('Nombre debe tener al menos 2 caracteres');
            }

            if (!data.apellido_paterno || data.apellido_paterno.trim().length < 2) {
                errors.push('Apellido paterno debe tener al menos 2 caracteres');
            }

            if (!data.email || !this.isValidEmail(data.email)) {
                errors.push('Email inválido');
            }

            if (!data.fecha_nacimiento) {
                errors.push('Fecha de nacimiento es requerida');
            }

            if (!data.grado) {
                errors.push('Grado es requerido');
            }

            if (!data.grupo) {
                errors.push('Grupo es requerido');
            }
        }

        // Validaciones para actualización (solo si se proporcionan)
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Email inválido');
        }

        if (data.grado && !['1', '2', '3', '4', '5', '6'].includes(data.grado)) {
            errors.push('Grado debe ser 1, 2, 3, 4, 5 o 6');
        }

        if (data.turno && !['matutino', 'vespertino'].includes(data.turno)) {
            errors.push('Turno debe ser "matutino" o "vespertino"');
        }

        if (data.fecha_nacimiento) {
            const fechaNacimiento = new Date(data.fecha_nacimiento);
            const today = new Date();
            const age = today.getFullYear() - fechaNacimiento.getFullYear();

            if (age < 12 || age > 25) {
                errors.push('Edad debe estar entre 12 y 25 años');
            }
        }

        if (errors.length > 0) {
            throw new Error(`Validación fallida: ${errors.join(', ')}`);
        }

        return true;
    }

    /**
     * Validar formato de email
     * @param {string} email - Email a validar
     * @returns {boolean}
     * @private
     */
    static isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
}

module.exports = StudentService;

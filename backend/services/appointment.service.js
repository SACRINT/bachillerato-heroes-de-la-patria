/**
 * 📅 APPOINTMENT SERVICE - Business Logic Layer
 * Servicio de gestión de citas
 * 
 * Patrón Service Layer - Consolida lógica de citas
 * Integra DAO, EventBus y Notificaciones
 */

const AppointmentDAO = require('../data/appointment.dao');
const EventBus = require('./eventBus.service').getInstance();
const NotificationService = require('./notification.service');
const devLogger = require('../utils/devLogger');
const crypto = require('crypto');

class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}

class AppointmentService {

    /**
     * Crear nueva cita
     */
    async createAppointment(data) {
        // 1. Validaciones básicas
        this._validateAppointmentData(data);

        // 2. Validar fecha futura
        const appointmentDate = new Date(`${data.fecha_solicitada}T${data.hora_solicitada}`);
        if (appointmentDate <= new Date()) {
            throw new ServiceError('La cita debe ser en una fecha y hora futura', 400);
        }

        // 3. Validar disponibilidad (Evitar conflictos)
        const isAvailable = await AppointmentDAO.checkAvailability(data.fecha_solicitada, data.hora_solicitada);
        if (!isAvailable) {
            throw new ServiceError('El horario seleccionado no está disponible', 409);
        }

        // 4. Rate Limiting (Máximo 3 citas activas por día por usuario)
        const dailyCount = await AppointmentDAO.countByUserAndDate(data.email, data.fecha_solicitada);
        if (dailyCount >= 3) {
            throw new ServiceError('Has alcanzado el límite de citas para este día', 429);
        }

        try {
            // 5. Generar ID y Token
            const lastId = await AppointmentDAO.getLastCitaId();
            const newCitaId = this._generateCitaId(lastId);
            const token = crypto.randomBytes(32).toString('hex');

            // 6. Preparar datos
            const appointmentData = {
                ...data,
                cita_id: newCitaId,
                token_confirmacion: token,
                estado: 'pendiente',
                metadata: {
                    departamento: data.departamento,
                    ...data.metadata
                }
            };

            // 7. Guardar en BD
            const appointment = await AppointmentDAO.create(appointmentData);

            // 8. Notificar y Emitir Evento
            EventBus.emit('appointment:created', appointment);

            // Enviar notificación al usuario (Email simulado vía NotificationService/EventBus)
            // En un sistema real, aquí se llamaría al servicio de email
            // await emailService.sendConfirmation(appointment);

            devLogger.log(`📅 Cita creada: ${newCitaId} para ${data.email}`);
            return appointment;

        } catch (error) {
            devLogger.error('[AppointmentService] Error creando cita:', error.message);
            throw new ServiceError('Error al procesar la cita', 500);
        }
    }

    /**
     * Obtener cita por ID
     */
    async getAppointment(id) {
        try {
            const appointment = await AppointmentDAO.get(id);
            if (!appointment) throw new ServiceError('Cita no encontrada', 404);
            return appointment;
        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al obtener cita', 500);
        }
    }

    /**
     * Listar citas
     */
    async listAppointments(filters) {
        try {
            return await AppointmentDAO.list(filters);
        } catch (error) {
            throw new ServiceError('Error al listar citas', 500);
        }
    }

    /**
     * Confirmar cita (vía token o admin)
     */
    async confirmAppointment(idOrToken, isToken = false) {
        try {
            let appointment;
            if (isToken) {
                appointment = await AppointmentDAO.getByToken(idOrToken);
            } else {
                appointment = await AppointmentDAO.get(idOrToken);
            }

            if (!appointment) throw new ServiceError('Cita no encontrada', 404);
            if (appointment.estado !== 'pendiente') throw new ServiceError('La cita no está en estado pendiente', 400);

            const updated = await AppointmentDAO.update(appointment.id, {
                estado: 'aprobada',
                confirmada: true,
                fecha_aprobada: new Date()
            });

            EventBus.emit('appointment:confirmed', updated);

            // Notificar al usuario
            await NotificationService.createNotification({
                usuario_id: appointment.usuario_id || 0, // Si hay usuario registrado
                titulo: 'Cita Confirmada',
                mensaje: `Tu cita ${appointment.cita_id} ha sido confirmada.`,
                tipo: 'success',
                canal: 'email' // Preferencia
            }).catch(err => devLogger.warn('No se pudo enviar notificación de confirmación', err));

            return updated;

        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al confirmar cita', 500);
        }
    }

    /**
     * Actualizar cita
     */
    async updateAppointment(id, data) {
        try {
            const appointment = await AppointmentDAO.get(id);
            if (!appointment) throw new ServiceError('Cita no encontrada', 404);

            // Validar si se intenta cambiar fecha/hora y verificar disponibilidad
            if (data.fecha_solicitada || data.hora_solicitada) {
                const fecha = data.fecha_solicitada || appointment.fecha_solicitada;
                const hora = data.hora_solicitada || appointment.hora_solicitada;

                // Solo verificar si cambiaron
                if (fecha !== appointment.fecha_solicitada || hora !== appointment.hora_solicitada) {
                    const isAvailable = await AppointmentDAO.checkAvailability(fecha, hora);
                    if (!isAvailable) {
                        throw new ServiceError('El nuevo horario seleccionado no está disponible', 409);
                    }
                }
            }

            const updated = await AppointmentDAO.update(id, data);
            EventBus.emit('appointment:updated', updated);
            return updated;

        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al actualizar cita', 500);
        }
    }

    /**
     * Eliminar cita (Hard Delete - Solo Admin)
     */
    async deleteAppointment(id) {
        try {
            const appointment = await AppointmentDAO.get(id);
            if (!appointment) throw new ServiceError('Cita no encontrada', 404);

            const deleted = await AppointmentDAO.delete(id);
            if (!deleted) throw new ServiceError('No se pudo eliminar la cita', 500);

            EventBus.emit('appointment:deleted', { id, cita_id: appointment.cita_id });
            return true;

        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al eliminar cita', 500);
        }
    }

    /**
     * Cancelar cita
     */
    async cancelAppointment(id, reason) {
        try {
            const appointment = await AppointmentDAO.get(id);
            if (!appointment) throw new ServiceError('Cita no encontrada', 404);

            const updated = await AppointmentDAO.update(id, {
                estado: 'cancelada',
                motivo_rechazo: reason,
                fecha_rechazada: new Date()
            });

            EventBus.emit('appointment:cancelled', updated);
            return updated;

        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al cancelar cita', 500);
        }
    }

    /**
     * Verificar disponibilidad pública
     */
    async checkAvailability(fecha, hora) {
        return await AppointmentDAO.checkAvailability(fecha, hora);
    }

    // ==========================================
    // HELPERS
    // ==========================================

    _validateAppointmentData(data) {
        if (!data.nombre_completo) throw new ServiceError('Nombre completo requerido', 400);
        if (!data.email) throw new ServiceError('Email requerido', 400);
        if (!data.fecha_solicitada) throw new ServiceError('Fecha requerida', 400);
        if (!data.hora_solicitada) throw new ServiceError('Hora requerida', 400);
        if (!data.motivo) throw new ServiceError('Motivo requerido', 400);
    }

    _generateCitaId(lastId) {
        const year = new Date().getFullYear();
        if (!lastId) return `CITA-${year}-0001`;

        const parts = lastId.split('-');
        const lastSequence = parseInt(parts[2]);
        const newSequence = (lastSequence + 1).toString().padStart(4, '0');

        return `CITA-${year}-${newSequence}`;
    }
}

module.exports = new AppointmentService();
module.exports.ServiceError = ServiceError;

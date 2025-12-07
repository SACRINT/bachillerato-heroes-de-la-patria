/**
 * 📅 APPOINTMENT SERVICE - TypeScript Version
 * Servicio de gestión de citas
 * 
 * Patrón Service Layer - Consolida lógica de citas
 * Integra DAO, EventBus y Notificaciones
 */

import crypto from 'crypto';
const AppointmentDAO = require('../data/appointment.dao');
const EventBus = require('./eventBus.service').getInstance();
const NotificationService = require('./notification.service');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface AppointmentData {
    nombre_completo: string;
    email: string;
    telefono?: string;
    fecha_solicitada: string;
    hora_solicitada: string;
    motivo: string;
    departamento?: string;
    descripcion?: string;
    metadata?: Record<string, any>;
}

export interface AppointmentRecord extends AppointmentData {
    id: number;
    cita_id: string;
    token_confirmacion: string;
    estado: 'pendiente' | 'aprobada' | 'cancelada' | 'completada';
    confirmada: boolean;
    usuario_id?: number;
    fecha_aprobada?: Date;
    fecha_rechazada?: Date;
    motivo_rechazo?: string;
    created_at: Date;
    updated_at: Date;
}

export interface AppointmentFilters {
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    email?: string;
    departamento?: string;
    limit?: number;
    offset?: number;
}

export interface AppointmentUpdateData {
    fecha_solicitada?: string;
    hora_solicitada?: string;
    motivo?: string;
    estado?: string;
    confirmada?: boolean;
    fecha_aprobada?: Date;
    fecha_rechazada?: Date;
    motivo_rechazo?: string;
}

// ============================================
// SERVICE ERROR CLASS
// ============================================

export class ServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}

// ============================================
// APPOINTMENT SERVICE CLASS
// ============================================

class AppointmentService {

    /**
     * Crear nueva cita
     */
    async createAppointment(data: AppointmentData): Promise<AppointmentRecord> {
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
                estado: 'pendiente' as const,
                metadata: {
                    departamento: data.departamento,
                    ...data.metadata
                }
            };

            // 7. Guardar en BD
            const appointment = await AppointmentDAO.create(appointmentData);

            // 8. Notificar y Emitir Evento
            EventBus.emit('appointment:created', appointment);

            devLogger.log(`📅 Cita creada: ${newCitaId} para ${data.email}`);
            return appointment;

        } catch (error: any) {
            devLogger.error('[AppointmentService] Error creando cita:', error.message);
            throw new ServiceError('Error al procesar la cita', 500);
        }
    }

    /**
     * Obtener cita por ID
     */
    async getAppointment(id: number): Promise<AppointmentRecord> {
        try {
            const appointment = await AppointmentDAO.get(id);
            if (!appointment) throw new ServiceError('Cita no encontrada', 404);
            return appointment;
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al obtener cita', 500);
        }
    }

    /**
     * Listar citas
     */
    async listAppointments(filters: AppointmentFilters): Promise<AppointmentRecord[]> {
        try {
            return await AppointmentDAO.list(filters);
        } catch (error: any) {
            throw new ServiceError('Error al listar citas', 500);
        }
    }

    /**
     * Confirmar cita (vía token o admin)
     */
    async confirmAppointment(idOrToken: string | number, isToken: boolean = false): Promise<AppointmentRecord> {
        try {
            let appointment: AppointmentRecord | null;
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
                usuario_id: appointment.usuario_id || 0,
                titulo: 'Cita Confirmada',
                mensaje: `Tu cita ${appointment.cita_id} ha sido confirmada.`,
                tipo: 'success',
                canal: 'email'
            }).catch((err: Error) => devLogger.warn('No se pudo enviar notificación de confirmación', err));

            return updated;

        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al confirmar cita', 500);
        }
    }

    /**
     * Actualizar cita
     */
    async updateAppointment(id: number, data: AppointmentUpdateData): Promise<AppointmentRecord> {
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

        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al actualizar cita', 500);
        }
    }

    /**
     * Eliminar cita (Hard Delete - Solo Admin)
     */
    async deleteAppointment(id: number): Promise<boolean> {
        try {
            const appointment = await AppointmentDAO.get(id);
            if (!appointment) throw new ServiceError('Cita no encontrada', 404);

            const deleted = await AppointmentDAO.delete(id);
            if (!deleted) throw new ServiceError('No se pudo eliminar la cita', 500);

            EventBus.emit('appointment:deleted', { id, cita_id: appointment.cita_id });
            return true;

        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al eliminar cita', 500);
        }
    }

    /**
     * Cancelar cita
     */
    async cancelAppointment(id: number, reason: string): Promise<AppointmentRecord> {
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

        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Error al cancelar cita', 500);
        }
    }

    /**
     * Verificar disponibilidad pública
     */
    async checkAvailability(fecha: string, hora: string): Promise<boolean> {
        return await AppointmentDAO.checkAvailability(fecha, hora);
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private _validateAppointmentData(data: AppointmentData): void {
        if (!data.nombre_completo) throw new ServiceError('Nombre completo requerido', 400);
        if (!data.email) throw new ServiceError('Email requerido', 400);
        if (!data.fecha_solicitada) throw new ServiceError('Fecha requerida', 400);
        if (!data.hora_solicitada) throw new ServiceError('Hora requerida', 400);
        if (!data.motivo) throw new ServiceError('Motivo requerido', 400);
    }

    private _generateCitaId(lastId: string | null): string {
        const year = new Date().getFullYear();
        if (!lastId) return `CITA-${year}-0001`;

        const parts = lastId.split('-');
        const lastSequence = parseInt(parts[2]);
        const newSequence = (lastSequence + 1).toString().padStart(4, '0');

        return `CITA-${year}-${newSequence}`;
    }
}

// ============================================
// EXPORTS
// ============================================

const appointmentService = new AppointmentService();

export { AppointmentService };
export default appointmentService;

// CommonJS compatibility
module.exports = appointmentService;
module.exports.AppointmentService = AppointmentService;
module.exports.ServiceError = ServiceError;

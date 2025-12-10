/**
 * 📅 APPOINTMENT SERVICE - TypeScript Version
 * Servicio de gestión de citas
 *
 * Patrón Service Layer - Consolida lógica de citas
 * Integra DAO, EventBus y Notificaciones
 */
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
export declare class ServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
declare class AppointmentService {
    /**
     * Crear nueva cita
     */
    createAppointment(data: AppointmentData): Promise<AppointmentRecord>;
    /**
     * Obtener cita por ID
     */
    getAppointment(id: number): Promise<AppointmentRecord>;
    /**
     * Listar citas
     */
    listAppointments(filters: AppointmentFilters): Promise<AppointmentRecord[]>;
    /**
     * Confirmar cita (vía token o admin)
     */
    confirmAppointment(idOrToken: string | number, isToken?: boolean): Promise<AppointmentRecord>;
    /**
     * Actualizar cita
     */
    updateAppointment(id: number, data: AppointmentUpdateData): Promise<AppointmentRecord>;
    /**
     * Eliminar cita (Hard Delete - Solo Admin)
     */
    deleteAppointment(id: number): Promise<boolean>;
    /**
     * Cancelar cita
     */
    cancelAppointment(id: number, reason: string): Promise<AppointmentRecord>;
    /**
     * Verificar disponibilidad pública
     */
    checkAvailability(fecha: string, hora: string): Promise<boolean>;
    private _validateAppointmentData;
    private _generateCitaId;
}
declare const appointmentService: AppointmentService;
export { AppointmentService };
export default appointmentService;
//# sourceMappingURL=appointmentService.d.ts.map
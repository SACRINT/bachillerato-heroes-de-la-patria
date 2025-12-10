export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
/**
 * Crear nueva cita
 */
export declare function createAppointment(data: any): Promise<any>;
/**
 * Obtener cita por ID
 */
export declare function getAppointment(id: any): Promise<any>;
/**
 * Listar citas
 */
export declare function listAppointments(filters: any): Promise<any>;
/**
 * Confirmar cita (vía token o admin)
 */
export declare function confirmAppointment(idOrToken: any, isToken?: boolean): Promise<any>;
/**
 * Actualizar cita
 */
export declare function updateAppointment(id: any, data: any): Promise<any>;
/**
 * Eliminar cita (Hard Delete - Solo Admin)
 */
export declare function deleteAppointment(id: any): Promise<boolean>;
/**
 * Cancelar cita
 */
export declare function cancelAppointment(id: any, reason: any): Promise<any>;
/**
 * Verificar disponibilidad pública
 */
export declare function checkAvailability(fecha: any, hora: any): Promise<any>;
export declare function _validateAppointmentData(data: any): void;
export declare function _generateCitaId(lastId: any): string;
//# sourceMappingURL=appointment.service.d.ts.map
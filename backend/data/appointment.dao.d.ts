/**
 * 📅 APPOINTMENT DAO - TypeScript
 * Gestión de citas y agenda
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface AppointmentRow {
    id: number;
    cita_id: string;
    nombre_completo: string;
    email: string;
    telefono?: string;
    tipo_persona: string;
    motivo: string;
    descripcion?: string;
    fecha_solicitada: Date;
    hora_solicitada: string;
    token_confirmacion: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada' | 'completada';
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export interface AppointmentCreateData {
    cita_id: string;
    nombre_completo: string;
    email: string;
    telefono?: string;
    tipo_persona: string;
    motivo: string;
    descripcion?: string;
    fecha_solicitada: Date | string;
    hora_solicitada: string;
    token_confirmacion: string;
    estado?: string;
    metadata?: Record<string, any>;
}
export interface AppointmentUpdateData {
    [key: string]: any;
}
export interface AppointmentFilters {
    email?: string;
    estado?: string;
    fecha?: Date | string;
    fecha_inicio?: Date | string;
    fecha_fin?: Date | string;
    tipo_persona?: string;
    limit?: number;
}
declare class AppointmentDAO {
    static create(data: AppointmentCreateData): Promise<AppointmentRow>;
    static get(id: number | string): Promise<AppointmentRow | undefined>;
    static getByToken(token: string): Promise<AppointmentRow | undefined>;
    static update(id: number, data: AppointmentUpdateData): Promise<AppointmentRow | null>;
    static delete(id: number): Promise<boolean>;
    static list(filters?: AppointmentFilters): Promise<AppointmentRow[]>;
    static checkAvailability(fecha: Date | string, hora: string): Promise<boolean>;
    static countByUserAndDate(email: string, fecha: Date | string): Promise<number>;
    static getLastCitaId(): Promise<string | null>;
}
export default AppointmentDAO;
//# sourceMappingURL=appointment.dao.d.ts.map
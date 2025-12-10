/**
 * 📅 EVENTOS DAO - TypeScript
 * Capa de acceso a datos para eventos.
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface Evento {
    id: number;
    titulo: string;
    descripcion: string;
    imagen_url?: string;
    fecha_inicio: Date;
    fecha_fin?: Date;
    ubicacion?: string;
    modalidad: string;
    link_virtual?: string;
    categoria: string;
    tipo?: string;
    etiquetas?: string[];
    estado: string;
    organizador?: string;
    organizador_id?: number;
    contacto_email?: string;
    contacto_telefono?: string;
    capacidad_maxima?: number;
    inscripciones_abiertas: boolean;
    requiere_inscripcion: boolean;
    slug: string;
    destacado: boolean;
    ip_address?: string;
    user_agent?: string;
    fecha_modificacion?: Date;
    created_at?: Date;
    cupo_maximo?: number;
    inscripciones_actuales?: number;
    color_hex?: string;
    title?: string;
    start?: Date;
    end?: Date;
}
export interface CreateEventoInput {
    titulo: string;
    descripcion: string;
    imagen_url?: string;
    fecha_inicio: Date | string;
    fecha_fin?: Date | string;
    ubicacion?: string;
    modalidad?: string;
    link_virtual?: string;
    categoria?: string;
    tipo?: string;
    etiquetas?: string[];
    estado?: string;
    organizador?: string;
    organizador_id?: number;
    contacto_email?: string;
    contacto_telefono?: string;
    capacidad_maxima?: number;
    inscripciones_abiertas?: boolean;
    requiere_inscripcion?: boolean;
    slug: string;
    destacado?: boolean;
    ip_address?: string;
    user_agent?: string;
}
export interface UpdateEventoInput extends Partial<CreateEventoInput> {
}
export interface EventoStats {
    total: number;
    publicadas: number;
    borradores: number;
    cancelados: number;
    finalizados: number;
    destacados: number;
    presenciales: number;
    virtuales: number;
    hibridos: number;
}
export interface GetEventsOptions {
    estado?: string;
    categoria?: string;
    modalidad?: string;
    destacado?: boolean | string;
    limit?: number;
    offset?: number;
}
export interface GetCalendarOptions {
    start?: string;
    end?: string;
    categoria?: string;
    modalidad?: string;
}
declare class EventosDAO {
    static slugExists(slug: string): Promise<boolean>;
    static create(data: CreateEventoInput): Promise<Evento>;
    static getAll(options: GetEventsOptions): Promise<{
        eventos: Evento[];
        total: number;
    }>;
    static getStats(): Promise<EventoStats>;
    static getById(id: number | string): Promise<Evento | null>;
    static getBySlug(slug: string): Promise<Evento | null>;
    static update(id: number | string, data: UpdateEventoInput): Promise<Evento | null>;
    static getCalendarEvents(options: GetCalendarOptions): Promise<Evento[]>;
}
export default EventosDAO;
//# sourceMappingURL=eventos.dao.d.ts.map
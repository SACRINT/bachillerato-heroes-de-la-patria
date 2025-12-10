/**
 * 📝 QUEJAS DAO - TypeScript
 * Data Access Object para quejas y sugerencias
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface QuejaRow {
    id: number;
    nombre: string;
    email: string;
    subject: 'queja' | 'sugerencia' | 'felicitacion';
    message: string;
    form_type: string;
    ip_address?: string;
    user_agent?: string;
    status: 'pendiente' | 'en_revision' | 'respondida';
    respuesta?: string;
    respondido_por?: number;
    fecha_creacion: Date;
    fecha_respuesta?: Date;
    fecha_actualizacion?: Date;
}
export interface QuejaCreateData {
    nombre: string;
    email: string;
    subject: string;
    message: string;
    form_type?: string;
    ip_address?: string;
    user_agent?: string;
}
export interface QuejaStats {
    total: number;
    pendientes: number;
    en_revision: number;
    respondidas: number;
    quejas: number;
    sugerencias: number;
    felicitaciones: number;
    hoy: number;
    esta_semana: number;
}
declare class QuejasDAO {
    static create(data: QuejaCreateData): Promise<QuejaRow>;
    static getAll(filters: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<QuejaRow[]>;
    static getStats(): Promise<QuejaStats>;
    static getById(id: number): Promise<QuejaRow | null>;
    static update(id: number, data: {
        status?: string;
        respuesta?: string;
        respondido_por?: number;
    }): Promise<QuejaRow | null>;
    static delete(id: number): Promise<{
        id: number;
    } | null>;
}
export default QuejasDAO;
//# sourceMappingURL=quejas.dao.d.ts.map
/**
 * 📧 SUSCRIPTORES DAO - TypeScript
 * Capa de acceso a datos para suscriptores de notificaciones.
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface Suscriptor {
    id: number;
    email: string;
    nombre: string;
    notif_convocatorias: boolean;
    notif_becas: boolean;
    notif_eventos: boolean;
    notif_noticias: boolean;
    notif_todas: boolean;
    estado: string;
    verificado: boolean;
    fecha_verificacion?: Date;
    total_enviados: number;
    total_abiertos: number;
    ultimo_envio?: Date;
    fuente?: string;
    fecha_registro: Date;
    fecha_actualizacion?: Date;
}
export interface SuscriptorStats {
    total: number;
    porEstado: {
        estado: string;
        cantidad: number;
    }[];
    porVerificacion: {
        verificado: boolean;
        cantidad: number;
    }[];
    porTipo: {
        convocatorias: number;
        becas: number;
        eventos: number;
        noticias: number;
        todas: number;
    };
    nuevosUltimos7Dias: number;
    tasaAperturaPromedio: number;
}
export interface CreateSuscriptorInput {
    email: string;
    nombre?: string;
    notif_convocatorias: boolean;
    notif_becas: boolean;
    notif_eventos: boolean;
    notif_noticias: boolean;
    notif_todas: boolean;
    token_verificacion: string;
    ip_registro?: string;
    user_agent?: string;
    fuente?: string;
}
export interface SuscriptorPreferences {
    notif_convocatorias: boolean;
    notif_becas: boolean;
    notif_eventos: boolean;
    notif_noticias: boolean;
    notif_todas: boolean;
}
declare class SuscriptoresDAO {
    static getAll(): Promise<Suscriptor[]>;
    static getByEstado(estado: string): Promise<Suscriptor[]>;
    static getActivosForEmail(tipo?: string): Promise<{
        email: string;
        nombre: string;
    }[]>;
    static getStats(): Promise<SuscriptorStats>;
    static getById(id: number): Promise<Suscriptor | null>;
    static getByEmail(email: string): Promise<{
        id: number;
        estado: string;
    } | null>;
    static create(data: CreateSuscriptorInput): Promise<{
        id: number;
    }>;
    static reactivate(email: string, prefs: SuscriptorPreferences): Promise<void>;
    static updatePreferences(email: string, prefs: SuscriptorPreferences): Promise<void>;
    static update(id: number, data: Partial<Suscriptor>): Promise<any>;
    static verifyEmail(token: string): Promise<any>;
    static cancel(email: string): Promise<any>;
    static registerSend(id: number, abierto?: boolean): Promise<any>;
    static delete(id: number): Promise<any>;
}
export default SuscriptoresDAO;
//# sourceMappingURL=suscriptores.dao.d.ts.map
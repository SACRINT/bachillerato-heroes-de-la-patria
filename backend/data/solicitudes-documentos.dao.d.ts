/**
 * 📄 SOLICITUDES DOCUMENTOS DAO - TypeScript
 * Capa de acceso a datos para solicitudes de documentos.
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface CreateSolicitudInput {
    nombre: string;
    email: string;
    tipo_usuario: string;
    documento_solicitado: string;
    motivo: string;
    nivel_urgencia: string;
    ip_address: string;
    user_agent: string;
}
export interface SolicitudDocumento {
    id: number;
    nombre: string;
    email: string;
    tipo_usuario: string;
    documento_solicitado: string;
    motivo: string;
    nivel_urgencia: string;
    status: string;
    notas_admin?: string;
    procesado_por?: number;
    ip_address: string;
    user_agent: string;
    fecha_solicitud: Date;
    fecha_procesado?: Date;
}
export interface SolicitudFilter {
    status?: string;
    tipo_usuario?: string;
    nivel_urgencia?: string;
    limit?: number;
    offset?: number;
}
export interface SolicitudListResult {
    data: SolicitudDocumento[];
    total: number;
}
export interface SolicitudStats {
    total: number;
    pendientes: number;
    en_proceso: number;
    completados: number;
    rechazados: number;
    urgentes: number;
    alta_urgencia: number;
    hoy: number;
    esta_semana: number;
    byTipoUsuario: Record<string, number>;
    documentosMasSolicitados: Record<string, number>;
}
declare class SolicitudesDocumentosDAO {
    static create(data: CreateSolicitudInput): Promise<SolicitudDocumento>;
    static getAll({ status, tipo_usuario, nivel_urgencia, limit, offset }: SolicitudFilter): Promise<SolicitudListResult>;
    static getStats(): Promise<SolicitudStats>;
    static getById(id: number): Promise<SolicitudDocumento | null>;
    static update(id: number, data: Partial<SolicitudDocumento>): Promise<SolicitudDocumento | null>;
    static approve(id: number, notas_admin?: string): Promise<SolicitudDocumento | null>;
    static reject(id: number, motivo: string): Promise<SolicitudDocumento | null>;
}
export default SolicitudesDocumentosDAO;
//# sourceMappingURL=solicitudes-documentos.dao.d.ts.map
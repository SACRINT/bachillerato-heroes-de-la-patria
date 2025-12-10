/**
 * 📋 PENDIENTES APROBACION DAO - TypeScript
 * Capa de acceso a datos para aprobaciones pendientes
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface PendienteAprobacion {
    id: number;
    tipo_solicitud: string;
    estado: string;
    fecha_solicitud: Date;
    datos?: any;
    [key: string]: any;
}
export interface PendienteFilter {
    tipo?: string;
    estado?: string;
    limit?: number;
    offset?: number;
}
export interface PendienteListResult {
    data: PendienteAprobacion[];
    total: number;
}
export interface PendienteStats {
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    egresados: number;
    bolsa_trabajo: number;
    egresados_pendientes: number;
    bolsa_trabajo_pendientes: number;
    total: number;
}
export interface AprobacionResult {
    success: boolean;
}
declare class PendientesAprobacionDAO {
    static getAll({ tipo, estado, limit, offset }: PendienteFilter): Promise<PendienteListResult>;
    static getById(id: number | string): Promise<PendienteAprobacion | null>;
    static delete(id: number | string): Promise<{
        id: number | string;
    } | null>;
    static getStats(): Promise<PendienteStats>;
    static aprobar(id: number | string, solicitud: PendienteAprobacion, datos: any): Promise<AprobacionResult>;
    static rechazar(id: number | string): Promise<PendienteAprobacion | null>;
}
export default PendientesAprobacionDAO;
//# sourceMappingURL=pendientes-aprobacion.dao.d.ts.map
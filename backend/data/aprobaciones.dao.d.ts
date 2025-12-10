/**
 * ✅ APROBACIONES DAO (Diagnóstico y Fix) - TypeScript
 * Data Access Object para operaciones de aprobaciones pendientes
 * ✅ FASE 3 DAL
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface AprobacionStats {
    total: number;
    pendientes: number;
    confirmados: number;
    no_confirmados: number;
    aprobadas: number;
    rechazadas: number;
}
export interface PendienteAprobacion {
    id: number;
    tipo_solicitud: string;
    email_usuario: string;
    estado: string;
    email_confirmado: boolean;
    fecha_solicitud: Date;
    created_at?: Date;
}
export interface ResumenCompleto {
    total_registros: number;
    pendiente_count: number;
    aprobada_count: number;
    rechazada_count: number;
    confirmados_count: number;
    no_confirmados_count: number;
}
export interface DesgloseEstado {
    estado: string;
    cantidad: number;
}
declare class AprobacionesDAO {
    /**
     * Obtener estadísticas actuales de aprobaciones
     */
    static getEstadisticas(): Promise<AprobacionStats>;
    /**
     * Forzar email_confirmado=true para todos los pendientes
     * @returns {Array} IDs de registros actualizados
     */
    static sincronizarPendientes(): Promise<{
        id: number;
    }[]>;
    /**
     * Listar registros pendientes (limitado)
     */
    static listarPendientes(limit?: number): Promise<PendienteAprobacion[]>;
    /**
     * Obtener resumen completo con contadores
     */
    static getResumenCompleto(): Promise<ResumenCompleto>;
    /**
     * Desglose por estado
     */
    static getDesglosePorEstado(): Promise<DesgloseEstado[]>;
    /**
     * Listar todos los registros (para diagnóstico)
     */
    static listarTodos(): Promise<PendienteAprobacion[]>;
    /**
     * Contar pendientes totales
     */
    static contarPendientes(): Promise<number>;
    /**
     * Listar pendientes con límite (para comparación)
     */
    static listarPendientesParaEndpoint(limit?: number): Promise<any[]>;
}
export default AprobacionesDAO;
//# sourceMappingURL=aprobaciones.dao.d.ts.map
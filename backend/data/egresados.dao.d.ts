/**
 * 🎓 EGRESADOS DAO - TypeScript
 * Capa de acceso a datos para egresados.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface EgresadoRow {
    id: number;
    tipo_solicitud: string;
    email_usuario: string;
    datos_json: Record<string, any>;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    email_confirmado: boolean;
    fecha_solicitud: Date;
}
export interface EgresadoStats {
    total: number;
    aprobados: number;
    pendientes: number;
}
export interface PendingConfirmation {
    id: number;
    email_usuario: string;
    datos_json: Record<string, any>;
    confirmation_token: string;
    token_expires_at: Date;
}
export interface ConfirmEmailResult {
    success: boolean;
    error?: string;
    datos?: Record<string, any>;
}
declare class EgresadosDAO {
    static getAprobados(limit?: number, offset?: number): Promise<EgresadoRow[]>;
    static getStats(): Promise<EgresadoStats>;
    static createPendingConfirmation(email: string, datosJSON: Record<string, any>, confirmationToken: string): Promise<string>;
    static getPendingByToken(token: string): Promise<PendingConfirmation | null>;
    static confirmEmail(token: string): Promise<ConfirmEmailResult>;
}
export default EgresadosDAO;
//# sourceMappingURL=egresados.dao.d.ts.map
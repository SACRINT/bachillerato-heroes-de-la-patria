/**
 * 💼 BOLSA TRABAJO DAO - TypeScript
 * Data Access Object para bolsa de trabajo
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface BolsaTrabajoRow {
    id: number;
    uuid?: string;
    nombre: string;
    email: string;
    telefono?: string;
    anio_egreso?: number;
    generacion?: string;
    area_interes?: string;
    resumen_profesional?: string;
    habilidades?: string;
    experiencia?: string;
    status: string;
    estado?: string;
    verificado: boolean;
    fecha_registro: Date;
    fecha_creacion: Date;
    fecha_actualizacion?: Date;
}
export interface BolsaTrabajoStats {
    total: number;
    activos?: number;
    inactivos?: number;
    contratados?: number;
    nuevos?: number;
    revisados?: number;
    contactados?: number;
    hoy: number;
    esta_semana: number;
    verificados?: number;
    byYear: Record<string, number>;
    byArea?: Record<string, number>;
    byExperiencia?: Record<string, number>;
}
export interface PendingApprovalRow {
    id: number;
    uuid: string;
    tipo_solicitud: string;
    email_usuario: string;
    datos_json: Record<string, any>;
    estado: string;
    email_confirmado: boolean;
    fecha_solicitud: Date;
    admin_id?: number;
    admin_notas?: string;
}
declare class BolsaTrabajoDAO {
    static createPendingConfirmation(email: string, formData: Record<string, any>, token: string): Promise<{
        confirmation_token: string;
    }>;
    static getPendingByToken(token: string): Promise<{
        id: number;
        email_usuario: string;
        datos_json: Record<string, any>;
        token_expires_at: Date;
    } | null>;
    static deletePendingById(id: number): Promise<void>;
    static confirmEmail(pendingData: {
        id: number;
        email_usuario: string;
    }, formData: Record<string, any>): Promise<{
        id: number;
        uuid?: string;
        email_usuario: string;
        estado: string;
    }>;
    static getCvs(filters: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: BolsaTrabajoRow[];
        total: number;
    }>;
    static getCvStats(): Promise<BolsaTrabajoStats>;
    static getCvById(id: number): Promise<BolsaTrabajoRow | null>;
    static updateCv(id: number, data: Partial<BolsaTrabajoRow>): Promise<BolsaTrabajoRow | null>;
    static deleteCv(id: number): Promise<{
        id: number;
    } | null>;
    static getAll(filters: {
        estado?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: BolsaTrabajoRow[];
        total: number;
    }>;
    static getGeneralStats(): Promise<BolsaTrabajoStats>;
    static getPendingApprovals(filters: {
        status?: string;
        email_confirmado?: string | boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: PendingApprovalRow[];
        total: number;
    }>;
    static getSolicitudById(id: number): Promise<{
        id: number;
        uuid: string;
        email_usuario: string;
        datos_json: Record<string, any>;
        estado: string;
        tipo_solicitud: string;
    } | null>;
    static updateSolicitudStatus(id: number, estado: string, adminNotas: string | null, adminId: number | null): Promise<{
        id: number;
        uuid: string;
        estado: string;
        email_usuario: string;
    } | null>;
    static insertCvFromApproval(formData: Record<string, any>): Promise<{
        id: number;
        uuid?: string;
    }>;
}
export default BolsaTrabajoDAO;
//# sourceMappingURL=bolsa-trabajo.dao.d.ts.map
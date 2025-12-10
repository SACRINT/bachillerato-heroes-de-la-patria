/**
 * 📝 INSCRIPTIONS DAO - TypeScript
 * Gestión de inscripciones a actividades
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface InscriptionRow {
    id: number;
    activity_id: string;
    activity_name: string;
    student_id: string;
    student_name: string;
    student_email: string;
    student_group: string;
    emergency_contact: string;
    additional_info?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    ip_address?: string;
    user_agent?: string;
    fecha_solicitud: Date;
    fecha_procesado?: Date;
    processed_by?: number;
    admin_notes?: string;
}
export interface InscriptionCreateData {
    activityId: string;
    activityName: string;
    studentId?: string;
    studentName: string;
    studentEmail: string;
    studentGroup?: string;
    emergencyContact?: string;
    additionalInfo?: string;
    ip_address?: string;
    user_agent?: string;
}
export interface InscriptionFilters {
    status?: string;
    activity_id?: string;
    student_email?: string;
    limit?: number;
    offset?: number;
}
export interface InscriptionStats {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    canceladas: number;
    hoy: number;
    esta_semana: number;
    byActivity: Array<{
        activity_name: string;
        cantidad: number;
        status: string;
    }>;
}
declare class InscriptionsDAO {
    static checkExisting(email: string, activityId: string): Promise<{
        id: number;
        status: string;
    } | null>;
    static updateResubmit(id: number, data: InscriptionCreateData): Promise<InscriptionRow>;
    static create(data: InscriptionCreateData): Promise<InscriptionRow>;
    static getAll(filters: InscriptionFilters): Promise<{
        data: InscriptionRow[];
        total: number;
    }>;
    static list(): Promise<InscriptionRow[]>;
    static getStats(): Promise<InscriptionStats>;
    static getById(id: number): Promise<InscriptionRow | null>;
    static update(id: number, data: {
        status?: string;
        admin_notes?: string;
        processed_by?: number;
    }): Promise<InscriptionRow | null>;
    static cancel(id: number): Promise<{
        id: number;
        activity_name: string;
    } | null>;
}
export default InscriptionsDAO;
//# sourceMappingURL=inscriptions.dao.d.ts.map
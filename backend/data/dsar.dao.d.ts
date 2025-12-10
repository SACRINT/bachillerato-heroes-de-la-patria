/**
 * 📋 DSAR DAO - TypeScript
 * Data Access Object para solicitudes de acceso a datos GDPR
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface DsarRequest {
    id: string;
    user_id: string;
    request_type: string;
    email: string;
    status: string;
    verification_token: string;
    metadata: any;
    created_at: Date;
    due_date: Date;
    completed_at?: Date;
    verified_at?: Date;
    processing_started_at?: Date;
    export_path?: string;
    error_message?: string;
    nombre?: string;
    apellido_paterno?: string;
    user_email?: string;
}
export interface UserProfile {
    uuid: string;
    email: string;
    username: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    role: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date;
}
export interface AcademicData {
    grades: any[];
    attendance: any[];
    enrollments: any[];
}
export interface CommunicationData {
    notifications: any[];
}
export interface FinancialData {
    payments: any[];
}
export interface UserFile {
    id: number;
    filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_at: Date;
    category: string;
}
export interface UserConsent {
    id: number;
    user_id: string;
    consent_type: string;
    granted_at: Date;
    revoked_at?: Date;
}
declare class DsarDAO {
    static createRequest(requestId: string, userId: string, requestType: string, email: string, verificationToken: string, metadata: any): Promise<DsarRequest>;
    static verifyRequest(token: string): Promise<DsarRequest | null>;
    static getById(requestId: string): Promise<DsarRequest | null>;
    static updateStatus(requestId: string, status: string, extraFields?: {
        exportPath?: string;
        error?: string;
    }): Promise<void>;
    static getUserProfile(userId: string): Promise<UserProfile | null>;
    static getAcademicData(userId: string): Promise<AcademicData>;
    static getActivityLogs(userId: string): Promise<any[]>;
    static getUserConsents(userId: string): Promise<UserConsent[]>;
    static getCommunications(userId: string): Promise<CommunicationData>;
    static getFinancialData(userId: string): Promise<FinancialData>;
    static getUserFiles(userId: string): Promise<UserFile[]>;
    /**
     * Obtener solicitud por ID (campos públicos para status)
     */
    static getByIdPublic(requestId: string): Promise<DsarRequest | null>;
    /**
     * Obtener todas las solicitudes de un usuario
     */
    static getUserRequests(userId: string): Promise<DsarRequest[]>;
    /**
     * Obtener solicitud verificando ownership
     */
    static getByIdAndUser(requestId: string, userId: string): Promise<DsarRequest | null>;
    /**
     * Cancelar solicitud (soft delete)
     */
    static cancelRequest(requestId: string): Promise<void>;
    /**
     * Obtener solicitudes pendientes para admin
     */
    static getPendingAdmin(): Promise<DsarRequest[]>;
}
export default DsarDAO;
//# sourceMappingURL=dsar.dao.d.ts.map
/**
 * 📧 CONTACT DAO - TypeScript
 * Capa de acceso a datos para mensajes de contacto.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface ContactRow {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    tipo_consulta?: string;
    asunto: string;
    mensaje: string;
    form_type: string;
    ip_address?: string;
    user_agent?: string;
    email_sent: boolean;
    verificado: boolean;
    status: 'pendiente' | 'en_revision' | 'respondida';
    fecha_creacion: Date;
}
export interface ContactCreateData {
    nombre: string;
    email: string;
    telefono?: string;
    tipo_consulta?: string;
    asunto: string;
    mensaje: string;
    form_type: string;
    ip_address?: string;
    user_agent?: string;
    email_sent?: boolean;
    verificado?: boolean;
    status?: string;
}
export interface PendingSubmissionData {
    form_type: string;
    formData: Record<string, any>;
    token: string;
    email: string;
    ip_address?: string;
    user_agent?: string;
}
export interface ContactMessagesResult {
    messages: ContactRow[];
    total: number;
    page: number;
    totalPages: number;
}
export interface ContactStats {
    total: number;
    pendientes: number;
    en_revision: number;
    respondidas: number;
    hoy: number;
    esta_semana: number;
    este_mes: number;
    verificados: number;
    enviados: number;
}
declare class ContactDAO {
    static create(contactData: ContactCreateData): Promise<ContactRow>;
    static createPendingSubmission(submissionData: PendingSubmissionData): Promise<{
        id: number;
    }>;
    static getMessages({ limit, page, status }: {
        limit?: number;
        page?: number;
        status?: string | null;
    }): Promise<ContactMessagesResult>;
    static getStats(): Promise<ContactStats>;
    static getStatsByType(): Promise<Record<string, number>>;
}
export default ContactDAO;
//# sourceMappingURL=contact.dao.d.ts.map
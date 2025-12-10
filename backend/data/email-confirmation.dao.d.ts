/**
 * 📧 EMAIL CONFIRMATION DAO - TypeScript
 * Data Access Object para confirmación de email
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface PendingConfirmation {
    id: number;
    uuid: string;
    email: string;
    confirmation_token: string;
    token_expires_at: Date;
    form_data: any;
    ip_address: string;
    user_agent: string;
    email_sent_count: number;
    last_email_sent_at?: Date;
    confirmed_at?: Date;
    created_at: Date;
    status?: string;
}
export interface ConfirmationListData {
    data: PendingConfirmation[];
    total: number;
}
export interface ApprovalRecord {
    id: number;
    uuid: string;
}
declare class EmailConfirmationDAO {
    static savePendingConfirmation(email: string, token: string, expiresAt: Date, formData: any, ipAddress: string, userAgent: string): Promise<PendingConfirmation>;
    static findByToken(token: string): Promise<PendingConfirmation | null>;
    static markConfirmed(id: number): Promise<PendingConfirmation | null>;
    static insertApprovalRecord(email: string, formData: any): Promise<ApprovalRecord>;
    static getPendingConfirmations(limit: number, offset: number): Promise<ConfirmationListData>;
    static cleanExpiredTokens(): Promise<number>;
}
export default EmailConfirmationDAO;
//# sourceMappingURL=email-confirmation.dao.d.ts.map
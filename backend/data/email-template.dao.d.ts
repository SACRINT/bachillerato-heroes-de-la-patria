/**
 * 📧 EMAIL TEMPLATE DAO - TypeScript
 * Data Access Object para plantillas de email
 * Abstrae todas las queries SQL de EmailTemplateService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface EmailLogEntry {
    to: string;
    template: string;
    subject: string;
    status: string;
    messageId?: string;
    error?: string;
    recipient?: string;
    created_at?: Date;
    [key: string]: any;
}
export interface EmailStats {
    template: string;
    status: string;
    count: number;
}
declare class EmailTemplateDAO {
    static logEmail(data: EmailLogEntry): Promise<void>;
    static getHistory(whereClause: string, params: any[], limit: number, offset: number): Promise<EmailLogEntry[]>;
    static getStats(days: number): Promise<EmailStats[]>;
}
export default EmailTemplateDAO;
//# sourceMappingURL=email-template.dao.d.ts.map